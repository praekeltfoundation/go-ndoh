go.app = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var EndState = vumigo.states.EndState;
    var Q = require('q');

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


        self.states.add('states_start', function() {
            switch (self.im.msg.content.split(" ")[0].toUpperCase()) {
                case "STOP":
                    return self.states.create("states_opt_out");
                case "START":
                    return self.states.create("states_opt_in");
                case "BABY":
                    return self.states.create("states_baby");
                default: // Logs a support ticket
                    return self.states.create("states_default");  
            }
        });


        self.states.add('states_opt_out', function(name) {
            return new EndState(name, {
                text: $('Thank you. You will no longer receive messages from us. ' +
                        'If you have any medical concerns please visit your nearest clinic'),

                next: 'states_start',

                events: {
                    'state:enter': function() {
                        // george: run unsubscribe_all here?
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

        self.states.add('states_baby', function(name) {
            return new EndState(name, {
                text: $('Thank you. You will now receive messages related to newborn babies. ' +
                        'If you have any medical concerns please visit your nearest clinic'),

                next: 'states_start',

                events: {
                    'state:enter': function() {
                        go.utils.subscription_type_and_rate(self.contact, self.im);
                        self.contact.extra.subscription_type = opts.sub_type.toString();
                        self.contact.extra.subscription_rate = opts.sub_rate.toString();

                        return go.utils
                            .subscription_unsubscribe_all(self.contact, self.im, opts)
                            .then(function() {
                                return Q.all([
                                    // george: should we be notifying jembi of birth?
                                    go.utils.subscription_send_doc(self.contact, self.im, self.metric_prefix, opts),
                                    self.im.contacts.save(self.contact)
                                ]);
                            });
                    }
                }
            });
        });

        self.states.add('states_default', function(name) {
            return new EndState(name, {
                text: $('Thank you for your message, it has been captured and you will receive a ' +
                        'response soon. Kind regards. MomConnect.'),
                next: 'states_start',

                events: {
                    'state:enter': function() {
                        return go.utils.support_log_ticket(self.im.msg.content, self.contact, self.im, self.metric_prefix);
                    }
                }
            });
        });

    });

    return {
        GoNDOH: GoNDOH
    };
}();
