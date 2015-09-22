go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;

    var GoNDOH = App.extend(function(self) {
        App.call(self, 'states_start');
        var $ = self.$;


        self.init = function() {
            self.env = self.im.config.env;
            self.metric_prefix = [self.env, self.im.config.name].join('.');
            self.store_name = [self.env, self.im.config.name].join('.');

            go.utils.attach_session_length_helper(self.im);

            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                   self.contact = user_contact;
                });
        };


        self.states.add('states_start', function(name) {
            return go.utils.set_language(self.im.user, self.contact)
                .then(function() {
                    return go.utils.opted_out(self.im, self.contact)
                        .then(function(opted_out) {
                            if (opted_out === false) {
                                question = $('Please let us know why you do not want MomConnect messages');
                            } else {
                                question = $('Please tell us why you previously opted out of messages');
                            }

                            return new ChoiceState(name, {
                                question: question,

                                choices: [
                                    new Choice('miscarriage', $('Miscarriage')),
                                    new Choice('stillbirth', $('Baby was stillborn')),
                                    new Choice('babyloss', $('Baby died')),
                                    new Choice('not_useful', $('Messages not useful')),
                                    new Choice('other', $('Other'))
                                ],

                                next: function(choice) {
                                    if (_.contains(['not_useful', 'other'], choice.value)){
                                        return 'states_end_no_enter';
                                    } else {
                                        return 'states_subscribe_option';
                                    }
                                }

                            });
                        });
                });
        });

        self.states.add('states_subscribe_option', function(name) {
            return new ChoiceState(name, {
                question: $('We are sorry for your loss. Would you like ' +
                            'to receive a small set of free messages ' +
                            'to help you in this difficult time?'),

                choices: [
                    new Choice('states_end_yes', $('Yes')),
                    new Choice('states_end_no_enter', $('No'))
                ],

                next: function(choice) {
                    if (choice.value == "states_end_yes") {
                        var opts = go.utils.subscription_type_and_rate(self.contact, self.im);
                        // set new subscription user extras
                        self.contact.extra.subscription_type = opts.sub_type.toString();
                        self.contact.extra.subscription_rate = opts.sub_rate.toString();
                        self.contact.extra.subscription_seq_start = opts.sub_seq_start.toString();

                        return go.utils
                            // deactivate current subscriptions, save reason for opting out
                            .opt_out(self.im, self.contact, self.im.user.answers.states_start,
                                api_optout=false, unsub_all=true, jembi_optout=true,
                                self.metric_prefix, self.env)
                            .then(function() {
                                return go.utils.loss_message_opt_in(self.im, self.contact,
                                    self.metric_prefix, self.env, opts);
                            })
                            .then(function() {
                                return go.utils.adjust_percentage_optouts(self.im, self.env);
                            })
                            .then(function() {
                                return choice.value;
                            });
                    } else {
                        return choice.value;
                    }
                }
            });
        });

        self.states.add('states_end_no_enter', function(name) {
            return go.utils
                .opt_out(self.im, self.contact, self.im.user.answers.states_start, api_optout=true,
                    unsub_all=true, jembi_optout=true, self.metric_prefix, self.env)
                .then(function() {
                    return self.states.create('states_end_no');
                });
        });

        self.states.add('states_end_no', function(name) {
            return new EndState(name, {
                text: $('Thank you. You will no longer receive ' +
                        'messages from us. If you have any medical ' +
                        'concerns please visit your nearest clinic.'),

                next: 'states_start'

            });
        });

        self.states.add('states_end_yes', function(name) {
            return new EndState(name, {
                text: $('Thank you. You will receive support messages ' +
                            'from MomConnect in the coming weeks.'),

                next: 'states_start'
            });
        });

    });

    return {
        GoNDOH: GoNDOH
    };
}();

