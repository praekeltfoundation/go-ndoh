go.clinic = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    // var EndState = vumigo.states.EndState;
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
                    new Choice('states:clinic_code', 'Yes'),
                    new Choice('states:mom_number', 'No'),
                ],

                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.states.add('states:clinic_code', function(name) {
            return new FreeText(name, {
                question: $('Please input the mobile number of the ' +
                            'pregnant woman to be registered:'),

                next: function() {
                    return 'states:id_type';
                }
            });
        });

        


        
    });

    return {
        GoNDOHclinic: GoNDOHclinic
    };
}();
