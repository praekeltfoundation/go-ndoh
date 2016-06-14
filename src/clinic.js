go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var moment = require('moment');
    var Q = require('q');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var PaginatedChoiceState = vumigo.states.PaginatedChoiceState;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;

    var GoNDOH = App.extend(function(self) {
        App.call(self, 'states_start');
        var $ = self.$;
        var interrupt = true;

        self.init = function() {
            self.env = self.im.config.env;
            self.metric_prefix = [self.env, self.im.config.name].join('.');
            self.store_name = [self.env, self.im.config.name].join('.');

            go.utils.attach_session_length_helper(self.im);

            self.im.on('session:new', function(e) {
                self.user.extra.ussd_sessions = go.utils.incr_user_extra(self.user.extra.ussd_sessions, 1);
                self.user.extra.metric_sum_sessions = go.utils.incr_user_extra(self.user.extra.metric_sum_sessions, 1);

                return Q.all([
                    self.im.contacts.save(self.user),
                    self.im.metrics.fire.inc([self.env, 'sum.sessions'].join('.'), {amount: 1})
                ]);
            });

            self.im.on('session:close', function(e) {
                return self.dial_back(e);
            });

            self.im.user.on('user:new', function(e) {
                return go.utils.fire_users_metrics(self.im, self.store_name, self.env, self.metric_prefix);
            });

            self.im.on('state:enter', function(e) {
                self.contact.extra.last_stage = e.state.name;
                return Q.all([
                    self.im.contacts.save(self.contact),
                    self.fire_incomplete(e.state.name, 1)
                ]);
            });

            self.im.on('state:exit', function(e) {
                return self.fire_incomplete(e.state.name, -1);
            });

            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                    if ((!_.isUndefined(user_contact.extra.working_on)) && (user_contact.extra.working_on !== "")){
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
            return $("Please dial back in to {{ USSD_number }} to complete the pregnancy registration.")
                .context({
                    USSD_number: self.im.config.channel
                });
        };

        self.fire_incomplete = function(name, val) {
            var ignore_states = [];
            if (!_.contains(ignore_states, name)) {
                return Q.all([
                    self.im.metrics.fire.inc(
                        ([self.metric_prefix, name, "no_incomplete_rev1"].join('.')), {amount: val}),
                    self.im.metrics.fire.sum(
                        ([self.metric_prefix, name, "no_incomplete_rev1.transient"].join('.')), val)
                ]);
            } else {
                return Q();
            }
        };

        self.send_registration_thanks = function() {
            return self.im.outbound.send({
                to: self.contact,
                endpoint: 'sms',
                lang: self.contact.extra.language_choice,
                content: $("Welcome. To stop getting SMSs dial {{optout_channel}} or for more " +
                           "services dial {{public_channel}} (No Cost). Standard rates apply " +
                           "when replying to any SMS from MomConnect.")
                    .context({
                        public_channel: self.im.config.public_channel,
                        optout_channel: self.im.config.optout_channel
                    })
            });
        };

        self.add = function(name, creator) {
            self.states.add(name, function(name, opts) {
                if (!interrupt || !go.utils.timed_out(self.im))
                    return creator(name, opts);

                interrupt = false;
                var timeout_opts = opts || {};
                timeout_opts.name = name;
                return self.states.create('states_timed_out', timeout_opts);
            });
        };

        self.states.add('states_timed_out', function(name, creator_opts) {
            var readable_no = go.utils.readable_sa_msisdn(self.contact.msisdn);

            return new ChoiceState(name, {
                question: $('Would you like to complete pregnancy registration for ' +
                            '{{ num }}?')
                    .context({ num: readable_no }),

                choices: [
                    new Choice(creator_opts.name, $('Yes')),
                    new Choice('states_start', $('Start new registration'))
                ],

                next: function(choice) {
                    if (choice.value === 'states_start') {
                        self.user.extra.working_on = "";
                        return self.im.contacts
                            .save(self.user)
                            .then(function() {
                                return 'states_start';
                            });
                    } else {
                        return self
                            .fire_incomplete(creator_opts.name, -1)
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


        self.add('states_start', function(name) {
            var readable_no = go.utils.readable_sa_msisdn(self.im.user.addr);

            return new ChoiceState(name, {
                question: $('Welcome to The Department of Health\'s ' +
                            'MomConnect. Tell us if this is the no. that ' +
                            'the mother would like to get SMSs on: {{ num }}')
                    .context({ num: readable_no }),

                choices: [
                    new Choice('yes', $('Yes')),
                    new Choice('no', $('No'))
                ],

                next: function(choice) {
                    if (choice.value === 'yes') {

                        return go.utils
                            .opted_out(self.im, self.contact)
                            .then(function(opted_out) {
                                return {
                                    true: 'states_opt_in',
                                    false: 'states_consent',
                                } [opted_out];
                            });
                    } else {
                        return 'states_mobile_no';
                    }
                }
            });
        });

        self.add('states_opt_in', function(name) {
            return new ChoiceState(name, {
                question: $('This number has previously opted out of MomConnect ' +
                            'SMSs. Please confirm that the mom would like to ' +
                            'opt in to receive messages again?'),

                choices: [
                    new Choice('yes', $('Yes')),
                    new Choice('no', $('No'))
                ],

                next: function(choice) {
                    if (choice.value === 'yes') {
                        return go.utils
                            .opt_in(self.im, self.contact)
                            .then(function() {
                                return 'states_consent';
                            });
                    } else {
                        if (!_.isUndefined(self.user.extra.working_on)) {
                            self.user.extra.working_on = "";
                            return self.im.contacts
                                .save(self.user)
                                .then(function() {
                                    return 'states_stay_out';
                                });
                        } else {
                            return 'states_stay_out';
                        }
                    }
                }
            });
        });

        self.add('states_stay_out', function(name) {
            return new ChoiceState(name, {
                question: $('You have chosen not to receive MomConnect SMSs'),

                choices: [
                    new Choice('main_menu', $('Main Menu'))
                ],

                next: function(choice) {
                    return 'states_start';
                }
            });
        });

        self.add('states_consent', function(name) {
            return new ChoiceState(name, {
                question: $('We need to collect, store & use her info. She ' +
                            'may get messages on public holidays & weekends. ' +
                            'Does she consent?'),
                choices: [
                    new Choice('yes', $('Yes')),
                    new Choice('no', $('No')),
                ],

                next: function(choice) {
                    if (choice.value === 'yes') {
                        self.contact.extra.consent = 'true';

                        return self.im.contacts
                            .save(self.contact)
                            .then(function() {
                                return 'states_clinic_code';
                            });
                    } else {
                        return 'states_consent_refused';
                    }
                }
            });
        });

        self.add('states_consent_refused', function(name) {
            return new EndState(name, {
                text: 'Unfortunately without her consent, she cannot register' +
                        ' to MomConnect.',
                next: 'states_start'
            });
        });

        self.add('states_clinic_code', function(name) {
            var error = $('Sorry, the clinic number did not validate. ' +
                          'Please reenter the clinic number:');
            var question = $('Please enter the clinic code for the facility ' +
                            'where this pregnancy is being registered:');


            return new FreeText(name, {
                question: question,

                check: function(content) {
                    return go.utils
                        .validate_clinic_code(self.im, content.trim())
                        .then(function(valid_clinic_code) {
                            if (!valid_clinic_code) {
                                return error;
                            } else {
                                return null;  // vumi expects null or undefined if check passes
                            }
                        });
                },

                next: function(content) {
                    self.contact.extra.clinic_code = content;
                    self.contact.extra.is_registered = 'false';

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                name: 'states_due_date_month'
                            };
                        });
                },

                events: {
                    'state:enter': function(content) {
                        return go.utils
                            .incr_kv(self.im, [self.store_name, 'no_incomplete_registrations'].join('.'))
                            .then(function() {
                                return go.utils.adjust_percentage_registrations(self.im, self.metric_prefix);
                            });
                    }
                }

            });
        });

        self.add('states_mobile_no', function(name, opts) {
            var error = $('Sorry, the mobile number did not validate. ' +
                          'Please reenter the mobile number:');

            var question = $('Please input the mobile number of the ' +
                            'pregnant woman to be registered:');

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
                            return go.utils
                                .opted_out_by_msisdn(self.im, msisdn)
                                .then(function(opted_out) {
                                    return {
                                        true: 'states_opt_in',
                                        false: 'states_consent',
                                    } [opted_out];
                                });
                        });
                }
            });
        });

        self.add('states_due_date_month', function(name) {

            var today = go.utils.get_today(self.im.config);
            var month = today.getMonth();   // 0-bound

            return new ChoiceState(name, {

                question: $('Please select the month when the baby is due:'),

                choices: go.utils.make_month_choices($, month, 10),

                next: function(choice) {
                    self.contact.extra.due_date_month = choice.value;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                name: 'states_due_date_day'
                            };
                        });
                }
            });
        });

        self.add('states_due_date_day', function(name, opts) {
            var error = $('Sorry, the number did not validate. ' +
                          'Please enter the estimated day that the baby ' +
                          'is due (For example 12):');

            var question = $('Please enter the estimated day that the baby ' +
                             'is due (For example 12):');

            return new FreeText(name, {
                question: question,

                check: function(content) {
                    if (!go.utils.check_number_in_range(content, 1, 31)) {
                        return error;
                    }
                },

                next: function(content) {
                    var edd = go.utils.get_entered_due_date(self.contact.extra.due_date_month,
                                                            content, self.im.config);

                    if (go.utils.is_valid_date(edd, 'YYYY-MM-DD')) {
                        self.contact.extra.due_date_day = go.utils.double_digit_day(content);

                        return self.im.contacts
                            .save(self.contact)
                            .then(function() {
                                return {
                                    name: 'states_id_type'
                                };
                            });
                    } else {
                        return {
                            name: 'states_invalid_edd',
                            creator_opts: {edd: edd}
                        };
                    }
                }
            });
        });

        self.add('states_invalid_edd', function(name, opts) {
            return new ChoiceState(name, {
                question:
                    $('The date you entered ({{ edd }}) is not a ' +
                        'real date. Please try again.'
                     ).context({ edd: opts.edd }),

                choices: [
                    new Choice('continue', $('Continue'))
                ],

                next: 'states_due_date_month'
            });
        });

        self.add('states_id_type', function(name) {
            return new ChoiceState(name, {
                question: $('What kind of identification does the pregnant ' +
                            'mother have?'),

                choices: [
                    new Choice('sa_id', $('SA ID')),
                    new Choice('passport', $('Passport')),
                    new Choice('none', $('None'))
                ],

                next: function(choice) {
                    self.contact.extra.id_type = choice.value;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                sa_id: 'states_sa_id',
                                passport: 'states_passport_origin',
                                none: 'states_birth_year'
                            } [choice.value];
                        });
                }
            });
        });

        self.add('states_sa_id', function(name, opts) {
            var error = $('Sorry, the mother\'s ID number did not validate. ' +
                          'Please reenter the SA ID number:');

            var question = $('Please enter the pregnant mother\'s SA ID ' +
                            'number:');

            return new FreeText(name, {
                question: question,

                check: function(content) {
                    if (!go.utils.validate_id_sa(content)) {
                        return error;
                    }
                },

                next: function(content) {
                    self.contact.extra.sa_id = content;

                    var id_date_of_birth = go.utils.extract_id_dob(content);
                    self.contact.extra.birth_year = moment(id_date_of_birth, 'YYYY-MM-DD').format('YYYY');
                    self.contact.extra.birth_month = moment(id_date_of_birth, 'YYYY-MM-DD').format('MM');
                    self.contact.extra.birth_day = moment(id_date_of_birth, 'YYYY-MM-DD').format('DD');
                    self.contact.extra.dob = id_date_of_birth;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                name: 'states_language'
                            };
                        });
                }
            });
        });

        self.add('states_passport_origin', function(name) {
            return new ChoiceState(name, {
                question: $('What is the country of origin of the passport?'),

                choices: [
                    new Choice('zw', $('Zimbabwe')),
                    new Choice('mz', $('Mozambique')),
                    new Choice('mw', $('Malawi')),
                    new Choice('ng', $('Nigeria')),
                    new Choice('cd', $('DRC')),
                    new Choice('so', $('Somalia')),
                    new Choice('other', $('Other'))
                ],

                next: function(choice) {
                    self.contact.extra.passport_origin = choice.value;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                name: 'states_passport_no'
                            };
                        });
                }
            });
        });

        self.add('states_passport_no', function(name) {
            var error = $('There was an error in your entry. Please ' +
                        'carefully enter the passport number again.');
            var question = $('Please enter the pregnant mother\'s Passport number:');

            return new FreeText(name, {
                question: question,

                check: function(content) {
                    if (!go.utils.is_alpha_numeric_only(content) || content.length <= 4) {
                        return error;
                    }
                },

                next: function(content) {
                    self.contact.extra.passport_no = content;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                name: 'states_language'
                            };
                        });
                }
            });
        });

        self.add('states_birth_year', function(name, opts) {
            var error = $('There was an error in your entry. Please ' +
                        'carefully enter the mother\'s year of birth again ' +
                        '(for example: 2001)');

            var question = $('Please enter the year that the pregnant ' +
                    'mother was born (for example: 1981)');

            return new FreeText(name, {
                question: question,

                check: function(content) {
                    if (!go.utils.check_number_in_range(content, 1900,
                      go.utils.get_today(self.im.config).getFullYear() - 5)) {
                        // assumes youngest possible birth age is 5 years old
                        return error;
                    }
                },

                next: function(content) {
                    self.contact.extra.birth_year = content;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                name: 'states_birth_month'
                            };
                        });
                }
            });
        });

        self.add('states_birth_month', function(name) {
            return new ChoiceState(name, {
                question: $('Please enter the month that the mom was born.'),

                choices: go.utils.make_month_choices($, 0, 12),

                next: function(choice) {
                    self.contact.extra.birth_month = choice.value;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                name: 'states_birth_day'
                            };
                        });
                }
            });
        });


        self.add('states_birth_day', function(name, opts) {
            var error = $('There was an error in your entry. Please ' +
                        'carefully enter the mother\'s day of birth again ' +
                        '(for example: 8)');

            var question = $('Please enter the day that the mother was born ' +
                    '(for example: 14).');

            return new FreeText(name, {
                question: question,

                check: function(content) {
                    if (!go.utils.check_number_in_range(content, 1, 31)) {
                        return error;
                    }
                },

                next: function(content) {
                    var dob = go.utils.get_entered_birth_date(self.im.user.answers.states_birth_year,
                        self.im.user.answers.states_birth_month, content);

                    if (go.utils.is_valid_date(dob, 'YYYY-MM-DD')) {
                        self.contact.extra.birth_day = go.utils.double_digit_day(content);
                        self.contact.extra.dob = dob;

                        return self.im.contacts
                            .save(self.contact)
                            .then(function() {
                                return {
                                    name: 'states_language'
                                };
                            });
                    } else {
                        return {
                            name: 'states_invalid_dob',
                            creator_opts: {dob: dob}
                        };
                    }
                }
            });
        });

        self.add('states_invalid_dob', function(name, opts) {
            return new ChoiceState(name, {
                question:
                    $('The date you entered ({{ dob }}) is not a ' +
                        'real date. Please try again.'
                     ).context({ dob: opts.dob }),

                choices: [
                    new Choice('continue', $('Continue'))
                ],

                next: 'states_birth_year'
            });
        });

        self.add('states_language', function(name) {
            return new PaginatedChoiceState(name, {
                question: $('Please select the language that the ' +
                            'pregnant mother would like to get messages in:'),
                options_per_page: null,
                choices: [
                    new Choice('zu', 'isiZulu'),
                    new Choice('xh', 'isiXhosa'),
                    new Choice('af', 'Afrikaans'),
                    new Choice('en', 'English'),
                    new Choice('nso', 'Sesotho sa Leboa'),
                    new Choice('tn', 'Setswana'),
                    new Choice('st', 'Sesotho'),
                    new Choice('ts', 'Xitsonga'),
                    new Choice('ss', 'siSwati'),
                    new Choice('ve', 'Tshivenda'),
                    new Choice('nr', 'isiNdebele'),
                ],
                next: function(choice) {
                    self.contact.extra.language_choice = choice.value;
                    self.contact.extra.is_registered = 'true';
                    self.contact.extra.metric_sessions_to_register = self.user.extra.ussd_sessions;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return Q.all([
                                self.im.metrics.fire.avg((self.metric_prefix + ".avg.sessions_to_register"),
                                    parseInt(self.user.extra.ussd_sessions, 10)),
                                go.utils.incr_kv(self.im, [self.store_name, 'no_complete_registrations'].join('.')),
                                go.utils.decr_kv(self.im, [self.store_name, 'no_incomplete_registrations'].join('.')),
                                go.utils.incr_kv_conversions(self.im, self.contact, self.env)
                            ]);
                        })
                        .then(function() {
                            if (!_.isUndefined(self.user.extra.working_on) && (self.user.extra.working_on !== "")) {
                                self.user.extra.working_on = "";
                                self.user.extra.no_registrations = go.utils.incr_user_extra(self.user.extra.no_registrations, 1);
                                self.contact.extra.registered_by = self.user.msisdn;
                            }
                            self.user.extra.ussd_sessions = '0';
                            self.contact.extra.is_registered_by = 'clinic';
                            return Q.all([
                                self.im.contacts.save(self.user),
                                self.im.contacts.save(self.contact),
                                go.utils.adjust_percentage_registrations(self.im, self.metric_prefix),
                                go.utils.adjust_conversion_rates(self.im, self.env)
                            ]);
                        })
                        .then(function() {
                            return 'states_save_subscription';
                        });
                }
            });
        });

        self.add('states_save_subscription', function(name) {
            if (self.contact.extra.id_type !== undefined) {
                return Q.all([
                    go.utils.post_registration(self.user.msisdn, self.contact, self.im, 'clinic'),
                    self.send_registration_thanks(),
                ])
                .then(function() {
                    return self.states.create('states_end_success');
                });
            }
        });

        self.add('states_end_success', function(name) {
            // If none passport then only json push
            return new EndState(name, {
                text: $('Thank you. The pregnant woman will now ' +
                        'receive weekly messages about her pregnancy ' +
                        'from MomConnect.'),

                next: 'states_start',
            });
        });

    });

    return {
        GoNDOH: GoNDOH
    };
}();
