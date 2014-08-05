go.app = function() {
    var vumigo = require('vumigo_v02');
    var Q = require('q');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;

    var GoNDOH = App.extend(function(self) {
        App.call(self, 'question_1_friendliness');
        var $ = self.$;

        self.init = function() {
            self.env = self.im.config.env;
            self.metric_prefix = [self.env, self.im.config.name].join('.');
            self.store_name = [self.env, self.im.config.name].join('.');
         
            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                   self.contact = user_contact;
                });
        };

        self.states.add('question_1_friendliness', function(name) {
            go.utils.set_language(self.im.user, self.contact);
            
            return new ChoiceState(name, {
                question: $('Welcome. When you signed up, were staff at the facility friendly & helpful?'),

                choices: [
                    new Choice('very-satisfied', $('Very Satisfied')),
                    new Choice('satisfied', $('Satisfied')),
                    new Choice('not-satisfied', $('Not Satisfied')),
                    new Choice('very-unsatisfied', $('Very unsatisfied'))
                ],

                next: 'question_2_waiting_times_feel'
            });
        });

        self.states.add('question_2_waiting_times_feel', function(name) {
            return new ChoiceState(name, {
                question: $('How do you feel about the time you had to ' +
                            'wait at the facility?'),

                choices: [
                    new Choice('very-satisfied', $('Very Satisfied :D')),
                    new Choice('satisfied', $('Satisfied :)')),
                    new Choice('not-satisfied', $('Not Satisfied :(')),
                    new Choice('very-unsatisfied', $('Very unsatisfied :('))
                ],

                next: 'question_3_waiting_times_length'
            });
        });

        self.states.add('question_3_waiting_times_length', function(name) {
            return new ChoiceState(name, {
                question: $('How long did you wait to be helped at the clinic?'),

                choices: [
                    new Choice('less-than-an-hour', $('Less than an hour')),
                    new Choice('between-1-and-3-hours', $('Between 1 and 3 hours')),
                    new Choice('more-than-4-hours', $('More than 4 hours')),
                    new Choice('all-day', $('All day'))
                ],

                next: 'question_4_cleanliness'
            });
        });

        self.states.add('question_4_cleanliness', function(name) {
            return new ChoiceState(name, {
                question: $('Was the facility clean?'),

                choices: [
                    new Choice('very-satisfied', $('Very Satisfied :D')),
                    new Choice('satisfied', $('Satisfied :)')),
                    new Choice('not-satisfied', $('Not Satisfied :(')),
                    new Choice('very-unsatisfied', $('Very unsatisfied :('))
                ],

                next: 'question_5_privacy'
            });
        });

        self.states.add('question_5_privacy', function(name) {
            return new ChoiceState(name, {
                question: $('Did you feel that your privacy was respected by the staff?'),

                choices: [
                    new Choice('very-satisfied', $('Very Satisfied :D')),
                    new Choice('satisfied', $('Satisfied :)')),
                    new Choice('not-satisfied', $('Not Satisfied :(')),
                    new Choice('very-unsatisfied', $('Very unsatisfied :('))
                ],

                next: 'end_thanks'
            });
        });

        self.states.add('end_thanks', function(name) {
            return new EndState(name, {
                text: $('Thank you for rating our service. For baby and pregnancy ' +
                            'help or if you have compliments or complaints ' +
                            'dial *134*550# or reply to any of the SMSs you receive'),

                next: 'end_thanks_revisit',

                events: {
                    'state:enter': function() {
                        return Q.all([
                            go.utils.servicerating_log(self.contact, self.im, self.metric_prefix),
                            self.im.outbound.send_to_user({
                                    endpoint: 'sms',
                                    content: "Thank you for rating our service. If you have further queries " +
                                            "or complaints please dial *134*550# or reply to any of the SMSs you receive"
                                })
                        ]);
                    }
                }
            });
        });

        self.states.add('end_thanks_revisit', function(name) {
            return new EndState(name, {
              text: 'Sorry, you\'ve already rated service. For baby and pregnancy ' +
                    'help or if you have compliments or complaints ' +
                    'dial *134*550# or reply to any of the SMSs you receive',
              next: 'end_thanks_revisit'
            });
        });

        self.states.add('states_error', function(name) {
            return new EndState(name, {
              text: 'Sorry, something went wrong when saving the data. Please try again.',
              next: 'states_start'
            });
        });

    });

    return {
        GoNDOH: GoNDOH
    };
}();
