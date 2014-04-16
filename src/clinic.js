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
                    new Choice('states:mobile_no', 'No'),
                ],

                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.states.add('states:clinic_code', function(name) {
            return new FreeText(name, {
                question: $('Please enter the clinic code for the facility ' +
                            'where this pregnancy is being registered:'),

                next: function() {
                    return 'states:due_date_month';
                }
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
                    new Choice('states:id_type', 'Apr'),
                    new Choice('states:id_type', 'May'),
                    new Choice('states:id_type', 'Jun'),
                    new Choice('states:id_type', 'Jul'),
                    new Choice('states:id_type', 'Aug'),
                    new Choice('states:id_type', 'Sept'),
                    new Choice('states:id_type', 'Oct'),
                    new Choice('states:id_type', 'Nov'),
                    new Choice('states:id_type', 'Dec')
                ],

                next: function(choice) {
                    return choice.value;
                }
            });
        });


    });

    return {
        GoNDOHclinic: GoNDOHclinic
    };
}();
