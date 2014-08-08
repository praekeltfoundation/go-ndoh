go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var Q = require('q');
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
            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                   self.contact = user_contact;
                });
        };


        self.states.add('states_start', function(name) {
            return go.utils.set_language(self.im.user, self.contact)
                .then(function() {
            
                    return new ChoiceState(name, {
                        question: $('Please let us know why you do not want MomConnect messages'),

                        choices: [
                            new Choice('miscarriage', $('Miscarriage')),
                            new Choice('stillbirth', $('Baby was stillborn')),
                            new Choice('babyloss', $('Baby died')),
                            new Choice('not_useful', $('Messages not useful')),
                            new Choice('other', $('Other'))
                        ],

                        events: {
                            'state:enter': function() {
                                return self.im.api_request('optout.optout', {
                                    address_type: "msisdn",
                                    address_value: self.im.user.addr,
                                    message_id: self.im.msg.message_id
                                });
                            }
                        },

                        next: function(choice) {
                            self.contact.extra.opt_out_reason = choice.value;

                            return self.im.contacts
                                .save(self.contact)
                                .then(function() {
                                    //TODO: run unsub
                                    if (_.contains(['not_useful', 'other'], choice.value)){
                                        return 'states_end_no';
                                    } else {
                                        return 'states_subscribe_option';
                                    }
                                    
                                });
                        }

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
                    new Choice('states_end_no', $('No'))
                ],

                next: function(choice) {
                    if (choice.value == "states_end_yes"){
                        opts = go.utils.subscription_type_and_rate(self.contact, self.im);
                        self.contact.extra.subscription_type = opts.sub_type.toString();
                        self.contact.extra.subscription_rate = opts.sub_rate.toString();
                        return Q.all([
                            go.utils.subscription_send_doc(self.contact, self.im, self.metric_prefix, opts),
                            self.im.contacts.save(self.contact)
                        ]).then(function() {
                            return choice.value;
                        });
                    } else {
                        return choice.value;
                    }
                    
                    
                }

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

