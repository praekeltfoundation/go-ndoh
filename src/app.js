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

        self.states.add('states:id_type', function(name) {
            return new ChoiceState(name, {
                question: $('We need some info to message you. This ' +
                    'is private and will only be used to help you at a ' +
                    'clinic. What kind of ID do you have?'),

                choices: [
                    new Choice('states:sa_id', $('SA ID')),
                    new Choice('states:passport', $('Passport')),
                    new Choice('states:no_id_year', $('None')),
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
                // next: function(content) {
                    // self.contact.extra.idno = content;
                    // /* self.contact.extra.it_report_title = self.get_date_string(); */
                    // return self.im.contacts.save(self.contact)
                    //     .then(function() {
                    //         return 'states:end_success';
                        // });
                // }
            });
        });

        self.states.add('states:end_success', function(name) {
            return new EndState(name, {
                text: 'Thanks, cheers!',
                next: 'states:start'
            });
        });

    });

    return {
        GoNDOH: GoNDOH
    };
}();
