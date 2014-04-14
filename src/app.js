go.app = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;

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
                    new Choice('states:end', $('No')),
                    ],

                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.states.add('states:id_type', function(name) {
            return new ChoiceState(name, {
                question: $(''),

                choices: [
                    new Choice('states:id_type', $('Yes')),
                    new Choice('states:end', $('No')),
                    ],

                next: function(choice) {
                    return choice.value;
                }
            });
        });


        self.states.add('states:end', function(name) {
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
