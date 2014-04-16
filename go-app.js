var go = {};
go;

go.clinic = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    // var LanguageChoice = vumigo.states.LanguageChoice;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;

    var GoNDOHclinic = App.extend(function(self) {
        App.call(self, 'states:start');
        var $ = self.$;

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
            return new ChoiceState(name, {
                question: $('Please select the month when the baby is due:'),

                choices: [
                    new Choice('04', 'Apr'),
                    new Choice('05', 'May'),
                    new Choice('06', 'Jun'),
                    new Choice('07', 'Jul'),
                    new Choice('08', 'Aug'),
                    new Choice('09', 'Sept'),
                    new Choice('10', 'Oct'),
                    new Choice('11', 'Nov'),
                    new Choice('12', 'Dec')
                ],

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
                    new Choice('zimbabwe', $('Zimbabwe')),
                    new Choice('mozambique', $('Mozambique')),
                    new Choice('malawi', $('Malawi')),
                    new Choice('nigeria', $('Nigeria')),
                    new Choice('drc', $('DRC')),
                    new Choice('somalia', $('Somalia')),
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

                choices: [
                    new Choice('01', $('Jan')),
                    new Choice('02', $('Feb')),
                    new Choice('03', $('March')),
                    new Choice('04', $('April')),
                    new Choice('05', $('May')),
                    new Choice('06', $('June')),
                    new Choice('07', $('July')),
                    new Choice('08', $('August')),
                    new Choice('09', $('Sept')),
                    new Choice('10', $('Oct')),
                    new Choice('11', $('Nov')),
                    new Choice('12', $('Dec')),
                ],

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

        // text shortened - too many characters
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

go.app = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    // var LanguageChoice = vumigo.states.LanguageChoice;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;

    var GoNDOH = App.extend(function(self) {
        App.call(self, 'states:start');
        var $ = self.$;

        self.states.add('states:start', function(name) {
            return new ChoiceState(name, {
                question: $('Welcome to The Department of Health\'s ' +
                    'MomConnect programme. Please select your preferred ' +
                    'language:'),

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
                    return {
                        yes: 'states:id_type',
                        no: 'states:end_not_pregnant'
                    } [choice.value];
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
                question: $('Please enter your SA ID number:'),

                next: 'states:end_success'
            });
        });

        self.states.add('states:passport_origin', function(name) {
            return new ChoiceState(name, {
                question: $('What is the country of origin of the passport?'),

                choices: [
                    new Choice('zimbabwe', $('Zimbabwe')),
                    new Choice('mozambique', $('Mozambique')),
                    new Choice('malawi', $('Malawi')),
                    new Choice('nigeria', $('Nigeria')),
                    new Choice('drc', $('DRC')),
                    new Choice('somalia', $('Somalia')),
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

                choices: [
                    new Choice('01', $('Jan')),
                    new Choice('02', $('Feb')),
                    new Choice('03', $('March')),
                    new Choice('04', $('April')),
                    new Choice('05', $('May')),
                    new Choice('06', $('June')),
                    new Choice('07', $('July')),
                    new Choice('08', $('August')),
                    new Choice('09', $('Sept')),
                    new Choice('10', $('Oct')),
                    new Choice('11', $('Nov')),
                    new Choice('12', $('Dec')),
                ],

                next: 'states:birth_day'
            });
        });

        self.states.add('states:birth_day', function(name) {
            return new FreeText(name, {
                question: $('Please enter the day that you were born ' +
                    '(eg 14).'),

                next: 'states:end_success'
            });
        });

        // text shortened - too many characters
        self.states.add('states:end_success', function(name) {
            return new EndState(name, {
                text: $('Thank you for subscribing to MomConnect. ' +
                    'You will now start receiving free messages ' +
                    'about MomConnect. Remember to visit your ' +
                    'nearest clinic.'),

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
