go.clinic = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;

    var GoNDOHclinic = App.extend(function(self) {
        App.call(self, 'states:start');
        var $ = self.$;

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
            
            for (var i=start; i<limit; i++) {
                var val = (i >= 12 ? (i-12) : i);
                choices_show[choices_show_count] = choices[val];
                choices_show_count++;
            }
            return choices_show;
        };

        self.get_today = function() {
            var today = null;
            if (self.im.config.testing) {
                today = new Date(self.im.config.testing_today);
            } else {
                today = new Date();
            }
            return today;
        };

        self.states.add('states:start', function(name) {
            return new ChoiceState(name, {
                question: $('Welcome to The Department of Health\'s ' +
                            'MomConnect programme. Is this no. (MSISDN) ' +
                            'the mobile no. of the pregnant woman to be ' +
                            'registered?'),

                choices: [
                    new Choice('yes', 'Yes'),
                    new Choice('no', 'No'),
                ],

                next: function(choice) {
                    return {
                        yes: 'states:clinic_code',
                        no: 'states:mobile_no'
                    } [choice.value];
                }
            });
        });

        self.states.add('states:clinic_code', function(name) {
            return new FreeText(name, {
                question: $('Please enter the clinic code for the facility ' +
                            'where this pregnancy is being registered:'),

                next: 'states:due_date_month'
            });
        });

        self.states.add('states:mobile_no', function(name) {
            return new FreeText(name, {
                question: $('Please input the mobile number of the ' +
                            'pregnant woman to be registered:'),

                next: function() {
                    return 'states:clinic_code';
                }
            });
        });

        self.states.add('states:due_date_month', function(name) {
            
            var today = self.get_today();   // askmike: var
            var month = today.getMonth();   // 0-bound

            return new ChoiceState(name, {
                
                question: $('Please select the month when the baby is due:'),

                choices: self.make_month_choices(month, month+9),

                next: 'states:id_type'
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
                    return {
                        sa_id: 'states:sa_id',
                        passport: 'states:passport_origin',
                        none: 'states:birth_year'
                    } [choice.value];
                }
            });
        });

        self.states.add('states:sa_id', function(name) {
            return new FreeText(name, {
                question: $('Please enter the pregnant mother\'s SA ID ' +
                            'number:'),

                next: 'states:language'
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

                next: 'states:language'
            });
        });

        self.states.add('states:birth_year', function(name) {
            return new FreeText(name, {
                question: $('Since you don\'t have an ID or passport, ' +
                    'please enter the year that you were born (eg ' +
                    '1981)'),

                next: 'states:birth_month'
            });
        });

        self.states.add('states:birth_month', function(name) {
            return new ChoiceState(name, {
                question: $('Please enter the month that you were born.'),

                choices: self.make_month_choices(0, 12),

                next: 'states:birth_day'
            });
        });

        self.states.add('states:birth_day', function(name) {
            return new FreeText(name, {
                question: $('Please enter the day that you were born ' +
                    '(eg 14).'),

                next: 'states:language'
            });
        });

        self.states.add('states:language', function(name) {
            return new ChoiceState(name, {
                question: $('Please select the language that the ' +
                            'pregnant mother would like to get messages in:'),

                choices: [
                    new Choice('en', 'English'),
                    new Choice('af', 'Afrikaans'),
                    new Choice('zu', 'Zulu'),
                    new Choice('xh', 'Xhosa'),
                    new Choice('so', 'Sotho'),
                ],

                next: function(choice) {
                    return self.im.user.set_lang(choice.value)
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
        GoNDOHclinic: GoNDOHclinic
    };
}();
