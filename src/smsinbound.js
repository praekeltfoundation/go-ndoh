go.app = function() {
    var vumigo = require('vumigo_v02');
    // var _ = require('lodash');
    // var Q = require('q');
    var App = vumigo.App;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;

    var GoNDOH = App.extend(function(self) {
        App.call(self, 'states_start');
        var $ = self.$;

        self.init = function() {
            self.env = self.im.config.env;
            self.metric_prefix = [self.env, self.im.config.name].join('.');
            self.store_name = [self.env, self.im.config.name].join('.');

            self.im.user.on('user:new', function(e) {
                return go.utils.fire_users_metrics(self.im, self.store_name, self.env, self.metric_prefix);
            });

            self.im.on('state:enter', function(e) {
                self.contact.extra.last_stage = e.state.name;
                return self.im.contacts.save(self.contact);
            });
            
            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                   self.contact = user_contact;
                });
        };

        self.states.add('states_start', function(name, opts) {
            var error = $('Sorry, your message was not understood. ' +
                          'Please try again.');

            var question = $('Welcome to The Department of Health\'s ' +
                    'MomConnect programme. Respond BABY to get baby' +
                    'related messages or STOP to opt out of future messages');

            var valid_keywords = ["BABY", "STOP", "START"];

            return new FreeText(name, {
                question: question,

                check: function(content) {
                    var keyword = content.split(" ")[0];
                    if (valid_keywords.indexOf(keyword) === -1) {
                        return error;
                    }
                },

                next: function(content) {
                    switch (content.split(" ")[0]) {
                        case "STOP":
                            return "states_opt_out";
                        case "START":
                            return "states_opt_in";
                        default:
                            return "states_error";  
                    }
                }
            });
        });


        self.states.add('states_opt_out', function(name) {
            return new EndState(name, {
                text: $('Thank you. You will no longer receive messages from us. ' +
                        'If you have any medical concerns please visit your nearest clinic'),

                next: 'states_start',

                events: {
                    'state:enter': function() {
                        return self.im.api_request('optout.optout', {
                            address_type: "msisdn",
                            address_value: self.im.user.addr,
                            message_id: self.im.msg.message_id
                        });
                    }
                }
            });
        });

        self.states.add('states_opt_in', function(name) {
            return new EndState(name, {
                text: $('Thank you. You will now receive messages from us again. ' +
                        'If you have any medical concerns please visit your nearest clinic'),

                next: 'states_start',

                events: {
                    'state:enter': function() {
                        return self.im.api_request('optout.cancel_optout', {
                            address_type: "msisdn",
                            address_value: self.im.user.addr
                        });
                    }
                }
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
