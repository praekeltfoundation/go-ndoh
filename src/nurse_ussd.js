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
        App.call(self, 'isl_route');
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
                    if ((!_.isUndefined(user_contact.extra.nc_working_on))
                        && (user_contact.extra.nc_working_on !== "")) {
                        self.user = user_contact;
                        return self.im.contacts
                            .get(user_contact.extra.nc_working_on, {create: true})
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
                && !go.utils.is_true(self.contact.extra.nc_redial_sms_sent);
        };

        self.send_dialback = function() {
            return self.im.outbound
                .send_to_user({
                    endpoint: 'sms',
                    content: self.get_finish_reg_sms()
                })
                .then(function() {
                    self.contact.extra.nc_redial_sms_sent = 'true';
                    return self.im.contacts.save(self.contact);
                });
        };

        self.dial_back = function(e) {
            if (!self.should_send_dialback(e)) { return; }
            return self.send_dialback();
        };

        self.get_finish_reg_sms = function() {
            return $("Please dial back in to {{channel}} to complete the NurseConnect registration.")
                .context({
                    channel: self.im.config.channel
                });
        };


    // REGISTRATION FINISHED SMS HANDLING

        self.send_registration_thanks = function() {
            return self.im.outbound.send({
                to: self.contact,
                endpoint: 'sms',
                lang: self.contact.extra.nc_language_choice,
                content: $("Welcome to NurseConnect. For more options or to " +
                           "opt out, dial {{channel}}.")
                    .context({channel: self.im.config.channel})
            });
        };


    // TIMEOUT HANDLING

        // determine whether timed_out state should be used
        self.timed_out = function() {
            var no_redirects = [
                'st_subscribed',
                'st_not_subscribed',
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
                question: $("Welcome to NurseConnect. Would you like to continue your previous session for {{num}}?")
                    .context({ num: readable_no }),

                choices: [
                    new Choice(creator_opts.name, $('Yes')),
                    new Choice('isl_route', $('Start Over'))
                ],

                next: function(choice) {
                    if (choice.value === 'isl_route') {
                        self.user.extra.nc_working_on = "";
                        return self.im.contacts
                            .save(self.user)
                            .then(function() {
                                return 'isl_route';
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

        self.add('isl_route', function(name) {
            // reset working_on extra
            self.user.extra.nc_working_on = "";
            return self.im.contacts
                .save(self.user)
                .then(function() {
                    if (self.contact.extra.nc_is_registered === 'true') {
                        return self.states.create('st_subscribed');
                    } else {
                        return self.states.create('st_not_subscribed');
                    }
                });
        });


    // INITIAL STATES

        self.add('st_subscribed', function(name) {
            return new ChoiceState(name, {
                question: $("Welcome to NurseConnect"),
                choices: [
                    new Choice('st_subscribe_other', $('Subscribe a friend')),
                    new Choice('st_change_num', $('Change your no.')),
                    new Choice('st_change_faccode', $('Change facility code')),
                    new Choice('st_change_sanc', $('Change SANC no.')),
                    new Choice('st_change_persal', $('Change Persal no.')),
                    new Choice('st_optout', $('Stop SMS')),
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_not_subscribed', function(name) {
            return new ChoiceState(name, {
                question: $("Welcome to NurseConnect. Do you want to:"),
                choices: [
                    new Choice('st_subscribe_self', $("Subscribe for the first time")),
                    new Choice('st_change_old_nr', $('Change your old number')),
                    new Choice('st_subscribe_other', $('Subscribe somebody else'))
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });


    // REGISTRATION STATES

        self.add('st_subscribe_self', function(name) {
            return new ChoiceState(name, {
                question: $("To register we need to collect, store & use your info. You may also get messages on public holidays & weekends. Do you consent?"),
                choices: [
                    new Choice('isl_check_optout', $('Yes')),
                    new Choice('st_permission_denied', $('No')),
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_subscribe_other', function(name) {
            return new ChoiceState(name, {
                question: $("We need to collect, store & use your friend's info. She may get messages on public holidays & weekends. Does she consent?"),
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
                question: $("You have chosen not to receive NurseConnect SMSs on this number and so cannot complete registration."),
                choices: [
                    new Choice('isl_route', $('Main Menu'))
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_msisdn', function(name) {
            var error = $("Sorry, the format of the mobile number is not correct. Please enter the mobile number again, e.g. 0726252020");
            var question = $("Please enter the number you would like to register, e.g. 0726252020:");
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.check_valid_phone_number(content)) {
                        return error;
                    }
                },
                next: function(content) {
                    msisdn = go.utils.normalize_msisdn(content, '27');
                    self.user.extra.nc_working_on = msisdn;
                    return self.im.contacts
                        .save(self.user)
                        .then(function() {
                            return 'isl_reload_contact';
                        });
                }
            });
        });

        self.add('isl_reload_contact', function(name) {
            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                    return self.im.contacts
                        .get(user_contact.extra.nc_working_on, {create: true})
                        .then(function(working_on){
                            self.contact = working_on;
                        });
                })
                .then(function() {
                    return self.states.create('isl_check_optout');
                });
        });

        self.add('isl_check_optout', function(name) {
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
                question: $("This number previously opted out of NurseConnect messages. Please confirm that you would like to register this number again?"),
                choices: [
                    new Choice('yes', $('Yes')),
                    new Choice('no', $('No'))
                ],
                next: function(choice) {
                    if (choice.value === 'yes') {
                        return go.utils
                            .nurse_opt_in(self.im, self.contact)
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
                question: $("You have chosen not to receive NurseConnect SMSs on this number and so cannot complete registration."),
                choices: [
                    new Choice('isl_route', $('Main Menu'))
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_faccode', function(name) {
            var owner = self.user.extra.nc_working_on === "" ? 'your' : 'their';
            var error = $("Sorry, that code is not recognized. Please enter the 6-digit facility code again, e. 535970:");
            var question = $("Please enter {{owner}} 6-digit facility code:")
                .context({owner: owner});
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    return go.utils
                        .validate_clinic_code(self.im, content.trim())
                        .then(function(facname) {
                            if (!facname) {
                                return error;
                            } else {
                                self.contact.extra.nc_facname = facname;
                                return self.im.contacts
                                    .save(self.contact)
                                    .then(function() {
                                        return null;  // vumi expects null or undefined if check passes
                                    });
                            }
                        });
                },
                next: function(content) {
                    self.contact.extra.nc_faccode = content.trim();
                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return 'st_facname';
                        });
                }
            });
        });

        self.add('st_facname', function(name) {
            var owner = self.user.extra.nc_working_on === "" ? 'your' : 'their';
            return new ChoiceState(name, {
                question: $("Please confirm {{owner}} facility: {{facname}}")
                    .context({
                        owner: owner,
                        facname: self.contact.extra.nc_facname
                    }),
                choices: [
                    new Choice('st_id_type', $('Confirm')),
                    new Choice('st_faccode', $('Not the right facility')),
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_id_type', function(name) {
            var owner = self.user.extra.nc_working_on === "" ? 'your' : 'their';
            return new ChoiceState(name, {
                question: $("Please select {{owner}} type of identification:")
                    .context({owner: owner}),
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
            var owner = self.user.extra.nc_working_on === "" ? 'your' : 'their';
            var error = $("Sorry, the format of the ID number is not correct. Please enter {{owner}} RSA ID number again, e.g. 7602095060082")
                .context({owner: owner});
            var question = $("Please enter {{owner}} 13-digit RSA ID number:")
                .context({owner: owner});
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.validate_id_sa(content.trim())) {
                        return error;
                    }
                },
                next: 'isl_save_nursereg'
            });
        });

        self.add('st_passport_country', function(name) {
            return new ChoiceState(name, {
                question: $("What is the country of origin of the passport?"),
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
            var error = $("Sorry, the format of the passport number is not correct. Please enter the passport number again.");
            var question = $("Please enter the passport number:");
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
            var error = $("Sorry, the format of the date of birth is not correct. Please enter it again, e.g. 27 May 1975 as 27051975:");
            var question = $("Please enter the date of birth, e.g. 27 May 1975 as 27051975:");
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.is_valid_date(content.trim(), 'DDMMYYYY')) {
                        return error;
                    }
                },
                next: 'isl_save_nursereg'
            });
        });

        self.add('isl_save_nursereg', function(name) {
            // Save useful contact extras
            self.contact.extra.nc_is_registered = 'true';

            if (self.im.user.answers.st_id_type === 'st_sa_id') {  // rsa id
                self.contact.extra.nc_id_type = 'sa_id';
                self.contact.extra.nc_sa_id_no = self.im.user.answers.st_sa_id.trim();
                self.contact.extra.nc_dob = go.utils.extract_id_dob(
                    self.im.user.answers.st_sa_id.trim());
            } else {  // passport
                self.contact.extra.nc_id_type = 'passport';
                self.contact.extra.nc_passport_country = self.im.user.answers.st_passport_country;
                self.contact.extra.nc_passport_num = self.im.user.answers.st_passport_num.trim();
                self.contact.extra.nc_dob = moment(self.im.user.answers.st_dob.trim(), 'DDMMYYYY'
                    ).format('YYYY-MM-DD');
            }

            if (self.user.extra.nc_working_on !== "") {
                self.contact.extra.nc_registered_by = self.user.msisdn;

                if (self.user.extra.nc_registrees === undefined) {
                    self.user.extra.nc_registrees = self.contact.msisdn;
                } else {
                    self.user.extra.nc_registrees += ', ' + self.contact.msisdn;
                }
            }

            return Q
                .all([
                    self.im.contacts.save(self.user),
                    self.im.contacts.save(self.contact),
                    self.send_registration_thanks(),
                    // TODO #207 go.utils.post_nursereg(args),
                ])
                .then(function() {
                    return self.states.create('st_end_reg');
                });
        });

        self.add('st_end_reg', function(name) {
            return new EndState(name, {
                text: $("Thank you. Weekly NurseConnect messages will now be sent to this number."),
                next: 'isl_route',
            });
        });

    });

    return {
        GoNDOH: GoNDOH
    };
}();
