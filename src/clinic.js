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

        self.states.add('states:start', function(name) {
            return new ChoiceState(name, {
                question: $('Welcome to The Department of Health\'s ' +
                    'MomConnect programme. Please select your preferred ' +
                    'language:'),

                choices: [
                    new Choice('states:suspect_pregnancy', 'English'),
                    new Choice('states:suspect_pregnancy', 'Afrikaans'),
                    new Choice('states:suspect_pregnancy', 'Zulu'),
                    new Choice('states:suspect_pregnancy', 'Xhosa'),
                    new Choice('states:suspect_pregnancy', 'Sotho'),
                ],

                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.states.add('states:suspect_pregnancy', function(name) {
            return new ChoiceState(name, {
                question: $('MomConnect sends free support SMSs to ' +
                    'pregnant mothers. Are you or do you suspect that you ' +
                    'are pregnant?'),

                choices: [
                    new Choice('states:id_type', $('Yes')),
                    new Choice('states:end_not_pregnant', $('No')),
                ],

                next: function(choice) {
                    return choice.value;
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

        // text shortened - too many characters
        self.states.add('states:id_type', function(name) {
            return new ChoiceState(name, {
                question: $('We need some info to message you. This ' +
                    'is private and will only be used to help you at a ' +
                    'clinic. What kind of ID do you have?'),

                choices: [
                    new Choice('states:sa_id', $('SA ID')),
                    new Choice('states:passport_origin', $('Passport')),
                    new Choice('states:birth_year', $('None')),
                ],

                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.states.add('states:sa_id', function(name) {
            return new FreeText(name, {
                question: $('Please enter your SA ID number:'),

                next: function() {
                    return 'states:end_success';
                }
            });
        });

        self.states.add('states:passport_origin', function(name) {
            return new ChoiceState(name, {
                question: $('What is the country of origin of the passport?'),

                choices: [
                    new Choice('states:passport_no', $('Zimbabwe')),
                    new Choice('states:passport_no', $('Mozambique')),
                    new Choice('states:passport_no', $('Malawi')),
                    new Choice('states:passport_no', $('Nigeria')),
                    new Choice('states:passport_no', $('DRC')),
                    new Choice('states:passport_no', $('Somalia')),
                    new Choice('states:passport_no', $('Other')),
                ],

                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.states.add('states:passport_no', function(name) {
            return new FreeText(name, {
                question: $('Please enter your Passport number:'),

                next: function() {
                    return 'states:end_success';
                }
            });
        });

        self.states.add('states:birth_year', function(name) {
            return new FreeText(name, {
                question: $('Since you don\'t have an ID or passport, ' +
                    'please enter the year that you were born (eg ' +
                    '1981)'),

                next: function() {
                    return 'states:birth_month';
                }
            });
        });

        self.states.add('states:birth_month', function(name) {
            return new ChoiceState(name, {
                question: $('Please enter the month that you were born.'),

                choices: [
                    new Choice('states:birth_day', $('Jan')),
                    new Choice('states:birth_day', $('Feb')),
                    new Choice('states:birth_day', $('March')),
                    new Choice('states:birth_day', $('April')),
                    new Choice('states:birth_day', $('May')),
                    new Choice('states:birth_day', $('June')),
                    new Choice('states:birth_day', $('July')),
                    new Choice('states:birth_day', $('August')),
                    new Choice('states:birth_day', $('Sept')),
                    new Choice('states:birth_day', $('Oct')),
                    new Choice('states:birth_day', $('Nov')),
                    new Choice('states:birth_day', $('Dec')),
                ],

                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.states.add('states:birth_day', function(name) {
            return new FreeText(name, {
                question: $('Please enter the day that you were born ' +
                    '(eg 14).'),

                next: function() {
                    return 'states:end_success';
                }
            });
        });

        // text shortened - too many characters
        self.states.add('states:end_success', function(name) {
            return new EndState(name, {
                text: $('Thank you for subscribing to MomConnect. ' +
                    'You will now start receiving free messages ' +
                    'about MomConnect. Remember to visit your ' +
                    'nearest clinic!'),
                next: 'states:start'
            });
        });

    });

    return {
        GoNDOHclinic: GoNDOHclinic
    };
}();
