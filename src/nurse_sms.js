go.app = function() {
    var vumigo = require('vumigo_v02');
    var Q = require('q');
    var App = vumigo.App;
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


        self.states.add('states_start', function() {
            // fire inbound message count metric
            return Q.all([
                self.im.metrics.fire.sum(
                    ([self.metric_prefix, "inbound_sms", "sum"].join('.')), 1),
                self.im.metrics.fire.inc(
                    ([self.metric_prefix, "inbound_sms", "last"].join('.')), {amount: 1})
            ]).then(function() {
                // check if message contains a ussd code
                if (self.im.msg.content.indexOf('*120*') > -1 || self.im.msg.content.indexOf('*134*') > -1) {
                    return self.states.create("states_dial_not_sms");
                } else {
                    // get the first word, remove non-alphanumerics, capitalise
                    switch (self.im.msg.content.split(" ")[0].replace(/\W/g, '').toUpperCase()) {
                        case "STOP":
                            return self.states.create("states_opt_out_enter");
                        case "BLOCK":
                            return self.states.create("states_opt_out_enter");
                        case "START":
                            return self.states.create("states_opt_in_enter");
                        default:
                            return self.states.create("st_unrecognised");
                    }
                }
            });
        });

        self.states.add('states_dial_not_sms', function(name) {
            return new EndState(name, {
                text: $("Please use your handset's keypad to dial the number that you received, " +
                        "rather than sending it to us in an sms."),

                next: 'states_start',
            });
        });

        self.states.add('states_opt_out_enter', function(name) {
            return go.utils
                .nurse_optout(self.im, self.contact, optout_reason='unknown', api_optout=true,
                    unsub_all=true, jembi_optout=true, last_reg_patch=true, self.metric_prefix, self.env)
                .then(function() {
                    return self.states.create('states_opt_out');
                });
        });

        self.states.add('states_opt_out', function(name) {
            return new EndState(name, {
                text: $('Thank you. You will no longer receive messages from us.'),
                next: 'states_start'
            });
        });

        self.states.add('states_opt_in_enter', function(name) {
            return go.utils
                .nurse_opt_in(self.im, self.contact)
                .then(function() {
                    return self.states.create('states_opt_in');
                });
        });

        self.states.add('states_opt_in', function(name) {
            return new EndState(name, {
                text: $('Thank you. You will now receive messages from us again. ' +
                        'If you have any medical concerns please visit your nearest clinic'),

                next: 'states_start'
            });
        });

        self.states.add('st_unrecognised', function(name) {
            return new EndState(name, {
                text: $("We do not recognise the message you sent us. Reply STOP " +
                        "to unsubscribe or dial {{channel}} for more options.")
                    .context({channel: self.im.config.nurse_ussd_channel}),
                next: 'states_start'
            });
        });

    });

    return {
        GoNDOH: GoNDOH
    };
}();
