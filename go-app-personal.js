var go = {};
go;

var _ = require('lodash');
var moment = require('moment');
var vumigo = require('vumigo_v02');
var Choice = vumigo.states.Choice;

// override moment default century switch at '68 with '49
moment.parseTwoDigitYear = function (input) {
    return +input + (+input > 49 ? 1900 : 2000);
};

go.utils = {
    // Shared utils lib

    // make choices options with options
    make_month_choices: function($, start, limit) {
            // start should be 0 for Jan - array position
            var choices = [
                    new Choice('01', $('Jan')),
                    new Choice('02', $('Feb')),
                    new Choice('03', $('Mar')),
                    new Choice('04', $('Apr')),
                    new Choice('05', $('May')),
                    new Choice('06', $('Jun')),
                    new Choice('07', $('Jul')),
                    new Choice('08', $('Aug')),
                    new Choice('09', $('Sep')),
                    new Choice('10', $('Oct')),
                    new Choice('11', $('Nov')),
                    new Choice('12', $('Dec')),
                ];

            var choices_show = [];
            var choices_show_count = 0;
            var end = start + limit;
            
            for (var i=start; i<end; i++) {
                var val = (i >= 12 ? (i-12) : i);
                choices_show[choices_show_count] = choices[val];
                choices_show_count++;
            }

            return choices_show;

    },  

    get_today: function(config) {
        var today;
        if (config.testing_today) {
            today = new Date(config.testing_today);
        } else {
            today = new Date();
        }
        return today;
    },

    check_valid_number: function(input){
        // an attempt to solve the insanity of JavaScript numbers
        var numbers_only = new RegExp('^\\d+$');
        if (input !== '' && numbers_only.test(input) && !Number.isNaN(Number(input))){
            return true;
        } else {
            return false;
        }
    },

    check_number_in_range: function(input, start, end){
        return go.utils.check_valid_number(input) && (parseInt(input) >= start) && (parseInt(input) <= end);
    },

    validate_id_sa: function(id) {
        var i, c,
            even = '',
            sum = 0,
            check = id.slice(-1);

        if (id.length != 13 || id.match(/\D/)) {
            return false;
        }
        id = id.substr(0, id.length - 1);
        for (i = 0; id.charAt(i); i += 2) {
            c = id.charAt(i);
            sum += +c;
            even += id.charAt(i + 1);
        }
        even = '' + even * 2;
        for (i = 0; even.charAt(i); i++) {
            c = even.charAt(i);
            sum += +c;
        }
        sum = 10 - ('' + sum).charAt(1);
        return ('' + sum).slice(-1) == check;
    },

    extract_id_dob: function(id) {
        return moment(id.slice(0,6), 'YYMMDD').format('YYYY-MM-DD');
    },

    is_true: function(boolean) {
        //If is is not undefined and boolean is true
        return (!_.isUndefined(boolean) && (boolean==='true' || boolean===true));
    },

    readable_sa_msisdn: function(msisdn) {
        readable_no = '0' + msisdn.slice(3,12);
        return readable_no;
    },

    normalise_sa_msisdn: function(msisdn) {
        denormalised_no = '+27' + msisdn.slice(1,10);
        return denormalised_no;
    },

    incr_user_extra: function(data_to_increment, amount_to_increment) {
        if (_.isUndefined(data_to_increment)) {
            new_data_amount = 1;
        } else {
            new_data_amount = parseInt(data_to_increment) + amount_to_increment;
        }
        return new_data_amount.toString();
    },

};
go.app = function() {
    var vumigo = require('vumigo_v02');
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

            self.im.on('session:new', function() {
                self.contact.extra.ussd_sessions = go.utils.incr_user_extra(
                    self.contact.extra.ussd_sessions, 1);
                
                return Q.all([
                    self.im.contacts.save(self.contact)
                ]);

            });

            self.im.on('session:close', function(e) {
                if (!self.should_send_dialback(e)) { return; }
                return self.send_dialback();
            });

            self.im.user.on('user:new', function(e) {
                return Q.all([
                    self.im.metrics.fire.inc((self.metric_prefix + ".sum.unique_users"), 1),
                    self.im.metrics.fire.inc(("sum.unique_users"))
                        // probably double counts users if they are in different conversations
                ]);
            });

            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                   self.contact = user_contact;
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

        self.states.add('states:start', function(name) {
            return new ChoiceState(name, {
                question: $('Welcome to The Department of Health\'s ' +
                    'MomConnect programme. Please select your preferred ' +
                    'language:'),

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
                        .then(function() {
                            return self.im.contacts.save(self.contact);
                        })
                        .then(function() {
                            return 'states:suspect_pregnancy';
                        });
                }
            });
        });

        self.states.add('states:suspect_pregnancy', function(name) {
            return new ChoiceState(name, {
                question: $('MomConnect sends free support SMSs to ' +
                    'pregnant mothers. Are you or do you suspect that you ' +
                    'are pregnant?'),

                choices: [
                    new Choice('yes', $('Yes')),
                    new Choice('no', $('No')),
                ],

                next: function(choice) {
                    self.contact.extra.suspect_pregnancy = choice.value;

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                yes: 'states:id_type',
                                no: 'states:end_not_pregnant'
                            } [choice.value];
                        });
                }
            });
        });

        self.states.add('states:end_not_pregnant', function(name) {
            return new EndState(name, {
                text: $('We are sorry but this service is only for ' +
                    'pregnant mothers. If you have other health concerns ' +
                    'please visit your nearest clinic.'),
                next: 'states:start'
            });
        });

        self.states.add('states:id_type', function(name) {
            return new ChoiceState(name, {
                question: $('We need some info to message you. This ' +
                    'is private and will only be used to help you at a ' +
                    'clinic. What kind of ID do you have?'),

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
            var error = $('Sorry, your ID number did not validate. ' +
                          'Please reenter your SA ID number:');

            var question;
            if (!opts.retry) {
                question = $('Please enter your SA ID number:');
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
                    self.contact.extra.birth_year = id_date_of_birth.slice(0,4);
                    self.contact.extra.birth_month = id_date_of_birth.slice(5,7);
                    self.contact.extra.birth_day = id_date_of_birth.slice(8,10);
                    self.contact.extra.dob = id_date_of_birth;

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                name: 'states:end_success'
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
                                name: 'states:end_success'
                            };
                        });
                }
            });
        });

        self.states.add('states:birth_year', function(name, opts) {
            var error = $('There was an error in your entry. Please ' +
                        'carefully enter your year of birth again (eg ' +
                        '2001)');

            var question;
            if (!opts.retry) {
                question = $('Since you don\'t have an ID or passport, ' +
                            'please enter the year that you were born (eg ' +
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
                        'carefully enter your day of birth again (eg ' +
                        '8)');

            var question;
            if (!opts.retry) {
                question = $('Please enter the day that you were born ' +
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
                    self.contact.extra.dob = (self.im.user.answers['states:birth_year'] + 
                        '-' + self.im.user.answers['states:birth_month'] +
                        '-' + content);

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return Q.all([
                                self.im.metrics.fire.avg((self.metric_prefix + ".avg.sessions_to_register"),
                                    parseInt(self.contact.extra.ussd_sessions))
                            ]);
                        })
                        .then(function() {
                            self.contact.extra.ussd_sessions = '0';
                            return self.im.contacts.save(self.contact);
                        })
                        .then(function() {
                            return {
                                name: 'states:end_success'
                            };
                        });
                }
            });
        });

        self.states.add('states:end_success', function(name) {
            return new EndState(name, {
                text: $('Thank you for subscribing to MomConnect. ' +
                        'You will now receive free messages about ' +
                        'MomConnect. Visit your nearest clinic to get ' + 
                        'the full set of messages.'),

                next: 'states:start'
            });
        });

    });

    return {
        GoNDOH: GoNDOH
    };
}();

go.init = function() {
    var vumigo = require('vumigo_v02');
    var InteractionMachine = vumigo.InteractionMachine;
    var GoNDOH = go.app.GoNDOH;


    return {
        im: new InteractionMachine(api, new GoNDOH())
    };
}();
