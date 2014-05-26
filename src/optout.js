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
                question: $('Welcome to MomConnect. Why do you want to ' +
                            'stop receiving our messages?'),

                choices: [
                    new Choice('miscarriage', $('Miscarriage')),
                    new Choice('not_pregnant', $('Not pregnant')),
                    new Choice('not_useful', $('Messages not useful')),
                    new Choice('had_baby', $('Had my baby')),
                    new Choice('other', $('Other'))
                ],

                next: function(choice) {
                    return self.im.api_request('optout.status', {
                        address_type: "msisdn",
                        address_value: self.im.user_addr
                        })
                        .then(function(result){
                            console.log(result.opted_out);
                        })
                        .then(function() {
                            return 'states:end';
                        });
                }
            });
        });

        self.states.add('states:end', function(name) {
            return new EndState(name, {
                text: $('Thank you. You will no longer receive ' +
                        'messages from us. If you have any medical ' +
                        'concerns please visit your nearest clinic.'),

                next: 'states:start'
            });
        });

    });

    return {
        GoNDOH: GoNDOH
    };
}();


// self.add_creator('optstatus', function (state_name, im) {
//     var p = im.api_request('optout.status', {
//         address_type: "msisdn",
//         address_value: im.user_addr
//     });
//     p.add_callback(function (result) {
 
//         if(result.opted_out) {
//             return new ChoiceState(
//                 state_name,
//                 function(choice) {
//                     return (choice.value == 'yes' ?
//                             'opt_back_in' : 'remain_opted_out');
//                 },
//                 ('You have previously opted-out of this service. ' +
//                  'Do you want to opt-back in again?'),
//                 [
//                     new Choice('yes', 'Yes please.'),
//                     new Choice('no', 'No thank you.')
//                 ]);
//         }
 
//         return new LanguageChoice(
//             'language_selection',
//             'user_status',
//             ('To get MAMA messages, we need to ask you 4 questions. '+
//              'What language would you like?'),
//             [
//                 new Choice('english', 'English'),
//                 new Choice('zulu', 'Zulu'),
//                 new Choice('xhosa', 'Xhosa'),
//                 new Choice('afrikaans', 'Afrikaans'),
//                 new Choice('sotho', 'Sotho'),
//                 new Choice('setswana', 'Setswana')
//             ]
//         );
//     });
//     return p;
// });
 
// self.add_creator('opt_back_in', function (state_name, im) {
//     var p = im.api_request('optout.cancel_optout', {
//         address_type: 'msisdn',
//         address_value: im.user_addr
//     });
//     p.add_callback(function (result) {
//         return new ChoiceState(
//             state_name,
//             'optstatus',
//             'You have opted-back in to MAMA. Press 1 to continue.',
//             [
//                 new Choice('1', 'Continue')
//             ]);
//     });
//     return p;
// });
