go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var Q = require('q');
    var moment = require('moment');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;

    var GoNDOH = App.extend(function(self) {
        App.call(self, 'st_route');
        var $ = self.$;
        var interrupt = true;

        self.init = function() {
            self.env = self.im.config.env;
            self.metric_prefix = [self.env, self.im.config.name].join('.');
            self.store_name = [self.env, self.im.config.name].join('.');

            go.utils.attach_session_length_helper(self.im);

            self.im.on('session:close', function(e) {
                return self.dial_back(e);
            });

            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                    if ((!_.isUndefined(user_contact.extra.working_on))
                        && (user_contact.extra.working_on !== "")) {
                        self.user = user_contact;
                        return self.im.contacts
                            .get(user_contact.extra.working_on, {create: true})
                            .then(function(working_on){
                                self.contact = working_on;
                            });
                    } else {
                        self.user = user_contact;
                        self.contact = user_contact;
                    }
                });
        };


    // DIALBACK SMS HANDLING

        self.should_send_dialback = function(e) {
            return e.user_terminated
                && !go.utils.is_true(self.contact.extra.redial_sms_sent);
        };

        self.send_dialback = function() {
            return self.im.outbound
                .send_to_user({
                    endpoint: 'sms',
                    content: self.get_finish_reg_sms()
                })
                .then(function() {
                    self.contact.extra.redial_sms_sent = 'true';
                    return self.im.contacts.save(self.contact);
                });
        };

        self.dial_back = function(e) {
            if (!self.should_send_dialback(e)) { return; }
            return self.send_dialback();
        };

        self.get_finish_reg_sms = function() {
            return $("Please dial back in to {{ USSD_number }} to " +
                     "complete the NurseConnect registration.")
                .context({
                    USSD_number: self.im.config.channel
                });
        };


    // REGISTRATION FINISHED SMS HANDLING

        self.send_registration_thanks = function() {
            return self.im.outbound.send({
                to: self.contact,
                endpoint: 'sms',
                lang: self.contact.extra.language_choice,
                content: $("Welcome to NurseConnect. For more options or to " +
                           "opt out, dial {{channel}}.")
                    .context({channel: self.im.config.channel})
            });
        };



    // TIMEOUT HANDLING

        // determine whether timed_out state should be used
        self.timed_out = function() {
            var no_redirects = [
                'st_route',
                'st_not_subscribed',
                'st_permission_self',
                'st_permission_other',
                'st_permission_denied',
                'st_msisdn',
            ];
            return self.im.msg.session_event === 'new'
                && self.im.user.state.name
                && no_redirects.indexOf(self.im.user.state.name) === -1;
        };

        // override normal state adding
        self.add = function(name, creator) {
            self.states.add(name, function(name, opts) {
                if (!interrupt || !self.timed_out(self.im))
                    return creator(name, opts);

                interrupt = false;
                var timeout_opts = opts || {};
                timeout_opts.name = name;
                return self.states.create('st_timed_out', timeout_opts);
            });
        };

        // timeout state
        self.states.add('st_timed_out', function(name, creator_opts) {
            var readable_no = go.utils.readable_sa_msisdn(self.contact.msisdn);

            return new ChoiceState(name, {
                question: $('Would you like to complete NurseConnect registration for ' +
                            '{{ num }}?')
                    .context({ num: readable_no }),

                choices: [
                    new Choice(creator_opts.name, $('Yes')),
                    new Choice('st_route', $('Start new registration'))
                ],

                next: function(choice) {
                    if (choice.value === 'st_route') {
                        self.user.extra.working_on = "";
                        return self.im.contacts
                            .save(self.user)
                            .then(function() {
                                return 'st_route';
                            });
                    } else {
                        return Q()
                            // self.fire_incomplete(creator_opts.name, -1)
                            .then(function() {
                                return {
                                    name: choice.value,
                                    creator_opts: creator_opts
                                };
                            });
                    }
                }
            });
        });



    // DELEGATOR START STATE

        self.add('st_route', function(name) {
            // reset working_on extra
            self.user.extra.working_on = "";
            return self.im.contacts
                .save(self.user)
                .then(function() {
                    return self.states.create('st_not_subscribed');
                });
        });


    // REGISTRATION STATES

        self.add('st_not_subscribed', function(name) {
            var readable_no = go.utils.readable_sa_msisdn(self.im.user.addr);

            return new ChoiceState(name, {
                question: $("Welcome to NurseConnect. Your number {{num}} is not subscribed:")
                    .context({ num: readable_no }),
                choices: [
                    new Choice('st_subscribe_self', $('Subscribe as a new user')),
                    new Choice('st_change_old_nr', $('Change your old number')),
                    new Choice('st_subscribe_other', $('Subscribe somebody else'))
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_subscribe_self', function(name) {
            return new ChoiceState(name, {
                question: $("st_subscribe_self text"),
                choices: [
                    new Choice('st_check_optout', $('Yes')),
                    new Choice('st_permission_denied', $('No')),
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_subscribe_other', function(name) {
            return new ChoiceState(name, {
                question: $("st_subscribe_other text"),
                choices: [
                    new Choice('st_msisdn', $('Yes')),
                    new Choice('st_permission_denied', $('No')),
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_permission_denied', function(name) {
            return new ChoiceState(name, {
                question: $("st_permission_denied text"),
                choices: [
                    new Choice('st_route', $('Main menu'))
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_msisdn', function(name) {
            var error = $('st_msisdn error_text');
            var question = $('st_msisdn text');
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.check_valid_phone_number(content)) {
                        return error;
                    }
                },
                next: function(content) {
                    msisdn = go.utils.normalize_msisdn(content, '27');
                    self.user.extra.working_on = msisdn;
                    return self.im.contacts
                        .save(self.user)
                        .then(function() {
                            return 'st_reload_contact';
                        });
                }
            });
        });

        self.add('st_reload_contact', function(name) {
            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                    return self.im.contacts
                        .get(user_contact.extra.working_on, {create: true})
                        .then(function(working_on){
                            self.contact = working_on;
                        });
                })
                .then(function() {
                    return self.states.create('st_check_optout');
                });
        });

        self.add('st_check_optout', function(name) {
            return go.utils
                .opted_out(self.im, self.contact)
                .then(function(opted_out) {
                    if (opted_out === true) {
                        return self.states.create('st_opt_in');
                    } else {
                        return self.states.create('st_faccode');
                    }
                });
        });

        self.add('st_opt_in', function(name) {
            return new ChoiceState(name, {
                question: $('This number has previously opted out of ' +
                            'NurseConnect SMSs. Please confirm that the mom ' +
                            'would like to opt in to receive messages again?'),
                choices: [
                    new Choice('yes', $('Yes')),
                    new Choice('no', $('No'))
                ],
                next: function(choice) {
                    if (choice.value === 'yes') {
                        return go.utils
                            .opt_in(self.im, self.contact)
                            .then(function() {
                                return 'st_faccode';
                            });
                    } else {
                        return 'st_stay_out';
                    }
                }
            });
        });

        self.add('st_stay_out', function(name) {
            return new ChoiceState(name, {
                question: $('You have chosen not to receive MomConnect SMSs ' +
                            'and so cannot complete registration.'),
                choices: [
                    new Choice('main_menu', $('Main menu'))
                ],
                next: function(choice) {
                    return 'st_route';
                }
            });
        });

        self.add('st_faccode', function(name) {
            var error = $('st_faccode error_text');
            var question = $('st_faccode text');
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    return go.utils
                        .validate_clinic_code(self.im, content.trim())
                        .then(function(facname) {
                            if (!facname) {
                                return error;
                            } else {
                                self.contact.extra.facname = facname;
                                return self.im.contacts
                                    .save(self.contact)
                                    .then(function() {
                                        return null;  // vumi expects null or undefined if check passes
                                    });
                            }
                        });
                },
                next: function(content) {
                    self.contact.extra.faccode = content.trim();
                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return 'st_facname';
                        });
                }
            });
        });

        self.add('st_facname', function(name) {
            return new ChoiceState(name, {
                question: $("st_facname text {{facname}}")
                    .context({facname: self.contact.extra.facname}),
                choices: [
                    new Choice('st_id_type', $('Confirm')),
                    new Choice('st_faccode', $('Not my facility')),
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_id_type', function(name) {
            return new ChoiceState(name, {
                question: $("st_id_type text"),
                choices: [
                    new Choice('st_sa_id', $('RSA ID')),
                    new Choice('st_passport_country', $('Passport')),
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_sa_id', function(name) {
            var error = $('st_sa_id error_text');
            var question = $('st_sa_id text');
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.validate_id_sa(content.trim())) {
                        return error;
                    }
                },
                next: 'st_save_nursereg'
            });
        });

        self.add('st_passport_country', function(name) {
            return new ChoiceState(name, {
                question: $("st_passport_country text"),
                choices: [
                    new Choice('na', $('Namibia')),
                    new Choice('bw', $('Botswana')),
                    new Choice('mz', $('Mozambique')),
                    new Choice('sz', $('Swaziland')),
                    new Choice('ls', $('Lesotho')),
                    new Choice('cu', $('Cuba')),
                    new Choice('other', $('Other')),
                ],
                next: function(choice) {
                    return 'st_passport_num';
                }
            });
        });

        self.add('st_passport_num', function(name) {
            var error = $('st_passport_num error_text');
            var question = $('st_passport_num text');
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.is_alpha_numeric_only(content)
                        || content.length <= 4) {
                        return error;
                    }
                },
                next: 'st_dob'
            });
        });

        self.add('st_dob', function(name) {
            var error = $('st_dob error_text');
            var question = $('st_dob text');
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.is_valid_date(content.trim(), 'YYYYMMDD')) {
                        return error;
                    }
                },
                next: 'st_save_nursereg'
            });
        });

        self.add('st_save_nursereg', function(name) {
            // Save useful contact extras
            self.contact.extra.is_registered = 'true';

            if (self.im.user.answers.st_id_type === 'st_sa_id') {  // rsa id
                self.contact.extra.id_type = 'sa_id';
                self.contact.extra.sa_id_no = self.im.user.answers.st_sa_id.trim();
                self.contact.extra.dob = go.utils.extract_id_dob(
                    self.im.user.answers.st_sa_id.trim());
            } else {  // passport
                self.contact.extra.id_type = 'passport';
                self.contact.extra.passport_country = self.im.user.answers.st_passport_country;
                self.contact.extra.passport_num = self.im.user.answers.st_passport_num.trim();
                self.contact.extra.dob = moment(self.im.user.answers.st_dob.trim(), 'YYYYMMDD'
                    ).format('YYYY-MM-DD');
            }

            if (self.user.extra.working_on !== "") {
                self.contact.extra.registered_by = self.user.msisdn;

                if (self.user.extra.registrees === undefined) {
                    self.user.extra.registrees = self.contact.msisdn;
                } else {
                    self.user.extra.registrees += ', ' + self.contact.msisdn;
                }
            }

            return Q
                .all([
                    self.im.contacts.save(self.user),
                    self.im.contacts.save(self.contact)
                ])
                .then(function() {
                    return self.states.create('st_end_reg');
                });
        });


        // save nursereg
        // return Q.all([
        //     go.utils.post_nursereg('arguments'),
        //     self.send_registration_thanks(),
        // ])
        // .then(function() {
        //     return self.states.create('st_end_reg');
        // });

        self.add('st_end_reg', function(name) {
            return new EndState(name, {
                text: $('st_end_reg text'),
                next: 'st_route',
            });
        });

    });

    return {
        GoNDOH: GoNDOH
    };
}();
