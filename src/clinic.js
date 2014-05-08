go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var moment = require('moment');
    var Q = require('q');
    var App = vumigo.App;   
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;

    var GoNDOH = App.extend(function(self) {
        App.call(self, 'states:start');
        var $ = self.$;

        self.init = function() {
            self.metric_prefix = self.im.config.name;

            self.get_and_fire_unique_users();

            self.im.on('session:new', function() {
                self.user.extra.ussd_sessions = go.utils.incr_user_extra(
                    self.user.extra.ussd_sessions, 1);
                
                return Q.all([
                    self.im.contacts.save(self.user)
                ]);

            });

            self.im.on('session:close', function(e) {
                if (!self.should_send_dialback(e)) { return; }
                return self.send_dialback();
            });

            // can't get this event-handler to fire in the tests - no tests!
            self.im.on('new:user', function(e) {
                self.im.metrics.fire.inc((self.metric_prefix + ".sum.unique_users"), 1);
            });

            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                    if ((!_.isUndefined(user_contact.extra.working_on)) && (user_contact.extra.working_on !== "")){
                        self.user = user_contact;
                        return self.im.contacts.get(user_contact.extra.working_on, {create: true})
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

        self.get_finish_reg_sms = function() {
            return $("Please dial back in to {{ USSD_number }} to complete the pregnancy registration.")
                .context({
                    USSD_number: self.im.config.channel
                });
        };

        // unique users for the account (across conversations)
        self.get_and_fire_unique_users = function() {
            return self.im
                .api_request('messagestore.count_inbound_uniques',{})
                .then(function(result) {
                    return self.im.metrics.fire.last('sum.unique_users', result.count);
                });
        };

        self.states.add('states:start', function(name) {
            var readable_no = go.utils.readable_sa_msisdn(self.im.user.addr);

            return new ChoiceState(name, {
                question: $('Welcome to The Department of Health\'s ' +
                            'MomConnect. Tell us if this is the no. that ' +
                            'the mother would like to get SMSs on: {{ num }}')
                    .context({ num: readable_no }),

                choices: [
                    new Choice('yes', $('Yes')),
                    new Choice('no', $('No')),
                ],

                next: function(choice) {
                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                yes: 'states:clinic_code',
                                no: 'states:mobile_no'
                            } [choice.value];
                        });
                }
            });
        });

        self.states.add('states:clinic_code', function(name) {
            return new FreeText(name, {
                question: $('Please enter the clinic code for the facility ' +
                            'where this pregnancy is being registered:'),

                next: function(content) {
                    self.contact.extra.clinic_code = content;

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                name: 'states:due_date_month'
                            };
                        });
                }
            });        
        });

        self.states.add('states:mobile_no', function(name, opts) {
            var error = $('Sorry, the mobile number did not validate. ' +
                          'Please reenter the mobile number:');

            var question;
            if (!opts.retry) {
                question = $('Please input the mobile number of the ' +
                            'pregnant woman to be registered:');
            } else {
                question = error;
            }

            return new FreeText(name, {
                question: question,

                check: function(content) {
                    if (!go.utils.check_valid_number(content)) {
                        return error;
                    }
                },

                next: function(content) {
                    msisdn = go.utils.normalise_sa_msisdn(content);
                    self.contact.extra.working_on = msisdn;

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                name: 'states:clinic_code',
                            };
                        });
                }
            });
        });

        self.states.add('states:due_date_month', function(name) {
            
            var today = go.utils.get_today(self.im.config);
            var month = today.getMonth();   // 0-bound

            return new ChoiceState(name, {
                
                question: $('Please select the month when the baby is due:'),

                choices: go.utils.make_month_choices($, month, 9),

                next: function(choice) {
                    self.contact.extra.due_date_month = choice.value;

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                name: 'states:id_type',
                            };
                        });
                }
            });
        });

        self.states.add('states:id_type', function(name) {
            return new ChoiceState(name, {
                question: $('What kind of identification does the pregnant ' +
                            'mother have?'),

                choices: [
                    new Choice('sa_id', $('SA ID')),
                    new Choice('passport', $('Passport')),
                    new Choice('none', $('None')),
                ],

                next: function(choice) {
                    self.contact.extra.id_type = choice.value;

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                sa_id: 'states:sa_id',
                                passport: 'states:passport_origin',
                                none: 'states:birth_year'
                            } [choice.value];
                        });
                }
            });
        });

        self.states.add('states:sa_id', function(name, opts) {
            var error = $('Sorry, the mother\'s ID number did not validate. ' +
                          'Please reenter the SA ID number:');

            var question;
            if (!opts.retry) {
                question = $('Please enter the pregnant mother\'s SA ID ' +
                            'number:');
            } else {
                question = error;
            }

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

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                name: 'states:language',
                            };
                        });
                }
            });
        });

        self.states.add('states:passport_origin', function(name) {
            return new ChoiceState(name, {
                question: $('What is the country of origin of the passport?'),

                choices: [
                    new Choice('zw', $('Zimbabwe')),
                    new Choice('mz', $('Mozambique')),
                    new Choice('mw', $('Malawi')),
                    new Choice('ng', $('Nigeria')),
                    new Choice('cd', $('DRC')),
                    new Choice('so', $('Somalia')),
                    new Choice('other', $('Other')),
                ],

                next: function(choice) {
                    self.contact.extra.passport_origin = choice.value;

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                name: 'states:passport_no'
                            };
                        });
                }
            });
        });

        self.states.add('states:passport_no', function(name) {
            return new FreeText(name, {
                question: $('Please enter your Passport number:'),

                next: function(content) {
                    self.contact.extra.passport_no = content;

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                name: 'states:language'
                            };
                        });
                }
            });
        });


        self.states.add('states:birth_year', function(name, opts) {
            var error = $('There was an error in your entry. Please ' +
                        'carefully enter the mother\'s year of birth again (eg ' +
                        '2001)');

            var question;
            if (!opts.retry) {
                question = $('Please enter the year that the pregnant mother was born (eg ' +
                    '1981)');
            } else {
                question = error;
            }

            return new FreeText(name, {
                question: question,

                check: function(content) {
                    if (!go.utils.check_number_in_range(content, 1900, go.utils.get_today(self.im.config).getFullYear())) {
                        return error;
                    }
                },

                next: function(content) {
                    self.contact.extra.birth_year = content;

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                name: 'states:birth_month'
                            };
                        });
                }
            });
        });

        self.states.add('states:birth_month', function(name) {
            return new ChoiceState(name, {
                question: $('Please enter the month that you were born.'),

                choices: go.utils.make_month_choices($, 0, 12),

                next: function(choice) {
                    self.contact.extra.birth_month = choice.value;

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                name: 'states:birth_day'
                            };
                        });
                }
            });
        });


        self.states.add('states:birth_day', function(name, opts) {
            var error = $('There was an error in your entry. Please ' +
                        'carefully enter the mother\'s day of birth again (eg ' +
                        '8)');

            var question;
            if (!opts.retry) {
                question = $('Please enter the day that the mother was born ' +
                    '(eg 14).');
            } else {
                question = error;
            }

            return new FreeText(name, {
                question: question,

                check: function(content) {
                    if (!go.utils.check_number_in_range(content, 1, 31)) {
                        return error;
                    }
                },

                next: function(content) {
                    if (content.length === 1) {
                        content = '0' + content;
                    }
                    self.contact.extra.birth_day = content;
                    self.contact.extra.dob = moment({year: self.im.user.answers['states:birth_year'], month: (self.im.user.answers['states:birth_month'] - 1), day: content}).format('YYYY-MM-DD');
                    // -1 for 0-bound month

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                name: 'states:language'
                            };
                        });
                }
            });
        });

        self.states.add('states:language', function(name) {
            return new ChoiceState(name, {
                question: $('Please select the language that the ' +
                            'pregnant mother would like to get messages in:'),

                choices: [
                    new Choice('en', $('English')),
                    new Choice('af', $('Afrikaans')),
                    new Choice('zu', $('Zulu')),
                    new Choice('xh', $('Xhosa')),
                    new Choice('so', $('Sotho')),
                ],

                next: function(choice) {
                    self.contact.extra.language_choice = choice.value;
                    

                    return self.im.user.set_lang(choice.value)
                    // we may not have to run this for this flow
                        .then(function() {
                            return self.im.contacts.save(self.contact);
                        })
                        .then(function() {
                            return Q.all([
                                self.im.metrics.fire.avg((self.metric_prefix + ".avg.sessions_to_register"),
                                    parseInt(self.user.extra.ussd_sessions))
                            ]);
                        })
                        .then(function() {
                            if (!_.isUndefined(self.user.extra.working_on)) {
                                self.user.extra.working_on = "";
                            }
                            self.user.extra.ussd_sessions = '0';
                            return self.im.contacts.save(self.user);
                        })
                        .then(function() {
                            return 'states:end_success';
                        });
                }
            });
        });

        self.states.add('states:end_success', function(name) {
            return new EndState(name, {
                text: $('Thank you. The pregnant woman will now ' +
                        'receive weekly messages about her pregnancy ' +
                        'from the Department of Health.'),

                next: 'states:start'
            });
        });

    });

    return {
        GoNDOH: GoNDOH
    };
}();
