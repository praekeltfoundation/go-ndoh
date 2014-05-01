var go = {};
go;


go.app = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;

    var GoNDOH = App.extend(function(self) {
        App.call(self, 'states:start');
        var $ = self.$;

        self.init = function() {
            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                   self.contact = user_contact;
                });
        };

        self.make_month_choices = function(start, limit) {
            // start should be 0 for Jan - array position
            var choices = [
                    new Choice('1', $('Jan')),
                    new Choice('2', $('Feb')),
                    new Choice('3', $('Mar')),
                    new Choice('4', $('Apr')),
                    new Choice('5', $('May')),
                    new Choice('6', $('Jun')),
                    new Choice('7', $('Jul')),
                    new Choice('8', $('Aug')),
                    new Choice('9', $('Sep')),
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

        };

        self.get_today = function() {
            var today;
            if (self.im.config.testing) {
                today = new Date(self.im.config.testing_today);
            } else {
                today = new Date();
            }
            return today;
        };

        self.check_valid_number = function(input){
            // an attempt to solve the insanity of JavaScript numbers
            var numbers_only = new RegExp('^\\d+$');
            if (input !== '' && numbers_only.test(input) && !Number.isNaN(Number(input))){
                return true;
            } else {
                return false;
            }
        };

        self.check_number_in_range = function(input, start, end){
            return self.check_valid_number(input) && (parseInt(input) >= start) && (parseInt(input) <= end);
        };

        self.validate_id_sa = function(id) {
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
                    return {
                        sa_id: 'states:sa_id',
                        passport: 'states:passport_origin',
                        none: 'states:birth_year'
                    } [choice.value];
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
                    if (!self.validate_id_sa(content)) {
                        return error;
                    }
                },

                next: function() {
                    return {
                        name: 'states:end_success',
                        creator_opts: {
                            retry: opts.retry
                        }
                    };
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

                next: 'states:passport_no'
            });
        });

        self.states.add('states:passport_no', function(name) {
            return new FreeText(name, {
                question: $('Please enter your Passport number:'),

                next: 'states:end_success'
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
                    if (!self.check_number_in_range(content, 1900, self.get_today().getFullYear())) {
                        return error;
                    }
                },

                next: function() {
                    return {
                        name: 'states:birth_month',
                        creator_opts: {
                            retry: opts.retry
                        }
                    };
                }
            });
        });

        self.states.add('states:birth_month', function(name) {
            return new ChoiceState(name, {
                question: $('Please enter the month that you were born.'),

                choices: self.make_month_choices(0, 12),

                next: 'states:birth_day'
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
                    if (!self.check_number_in_range(content, 1, 31)) {
                        return error;
                    }
                },

                next: function() {
                    return {
                        name: 'states:end_success',
                        creator_opts: {
                            retry: opts.retry
                        }
                    };
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
