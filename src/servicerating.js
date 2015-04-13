go.app = function() {
    var vumigo = require('vumigo_v02');
    var Q = require('q');
    var MetricsHelper = require('go-jsbox-metrics-helper');
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
            self.store_name = [self.im.config.metric_store, self.env, self.im.config.name].join('.');

            mh = new MetricsHelper(self.im);
            mh
                // Total unique users
                // This adds <env>.servicerating.sum.unique_users 'last' metric
                // As well as <env>.servicerating.sum.unique_users.transient 'sum' metric
                .add.total_unique_users([self.metric_prefix, 'sum', 'unique_users'].join('.'))

                // Total sessions
                // This adds <env>.servicerating.sum.sessions 'last' metric
                // As well as <env>.servicerating.sum.sessions.transient 'sum' metric
                .add.total_sessions([self.metric_prefix, 'sum', 'sessions'].join('.'))

                // Average sessions to complete service rating
                // Ideally would have used 'enter:question_1_friendliness' here, but double on-enter
                // bug is creating problems
                .add.tracker({
                    action: 'exit',
                    state: 'states_start'
                }, {
                    action: 'exit',
                    state: 'question_5_privacy'
                }, {
                    sessions_between_states: [self.metric_prefix, 'avg.sessions_rate_service'].join('.')
                })
            ;

            // Navigation tracking to measure drop-offs
            self.im.on('state:exit', function(e) {
                return self.im.metrics.fire.inc([self.metric_prefix, 'sum', e.state.name, 'exits'].join('.'), 1);
            });

            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                   self.contact = user_contact;
                });
        };

        self.states.add('states_start', function(name) {
            if (self.contact.extra.is_registered_by === 'clinic') {
                if (self.contact.extra.last_service_rating === 'never' ||
                    self.contact.extra.last_service_rating === undefined) { // undefined allows older registrations to rate service
                    return go.utils
                        .incr_kv(self.im, [self.store_name, 'sum', 'servicerating_start'].join('.'))
                        .then(function() {
                            return go.utils.adjust_percentage_serviceratings(self.im, self.metric_prefix);
                        })
                        .then(function() {
                            return self.states.create('question_1_friendliness');
                        });
                } else {
                    return self.states.create('end_thanks_revisit');
                }
            } else {
                return self.states.create('end_reg_clinic');
            }
        });

        self.states.add('question_1_friendliness', function(name) {
            return go.utils.set_language(self.im.user, self.contact)
                .then(function() {

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
        });

        self.states.add('question_2_waiting_times_feel', function(name) {
            return new ChoiceState(name, {
                question: $('How do you feel about the time you had to wait at the facility?'),

                choices: [
                    new Choice('very-satisfied', $('Very Satisfied')),
                    new Choice('satisfied', $('Satisfied')),
                    new Choice('not-satisfied', $('Not Satisfied')),
                    new Choice('very-unsatisfied', $('Very unsatisfied'))
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
                    new Choice('very-satisfied', $('Very Satisfied')),
                    new Choice('satisfied', $('Satisfied')),
                    new Choice('not-satisfied', $('Not Satisfied')),
                    new Choice('very-unsatisfied', $('Very unsatisfied'))
                ],

                next: 'question_5_privacy'
            });
        });

        self.states.add('question_5_privacy', function(name) {
            return new ChoiceState(name, {
                question: $('Did you feel that your privacy was respected by the staff?'),

                choices: [
                    new Choice('very-satisfied', $('Very Satisfied')),
                    new Choice('satisfied', $('Satisfied')),
                    new Choice('not-satisfied', $('Not Satisfied')),
                    new Choice('very-unsatisfied', $('Very unsatisfied'))
                ],

                next: 'log_servicerating_send_sms'
            });
        });

        self.states.add('log_servicerating_send_sms', function(name) {
            return Q.all([
                go.utils.servicerating_log(self.contact, self.im, self.metric_prefix),
                go.utils.jembi_send_servicerating(self.im, self.contact, self.metric_prefix,
                                                  "servicerating"),
                self.im.outbound.send_to_user({
                        endpoint: 'sms',
                        content: $("Thank you for rating our service.")
                })
            ])
            .then(function() {
                self.contact.extra.last_service_rating = go.utils.get_timestamp();
                return Q.all([
                    self.im.contacts.save(self.contact),
                    go.utils.adjust_percentage_serviceratings(self.im, self.metric_prefix)
                ]);
            })
            .then(function() {
                return self.states.create('end_thanks');
            });
        });

        self.states.add('end_thanks', function(name) {
            return new EndState(name, {
                text: $('Thank you for rating our service.'),
                next: 'end_thanks_revisit'
            });
        });

        self.states.add('end_reg_clinic', function(name) {
            return new EndState(name, {
                text: $('Please register at a clinic before using this line.'),
                next: 'states_start'
            });
        });

        self.states.add('end_thanks_revisit', function(name) {
            return new EndState(name, {
              text: $('Sorry, you\'ve already rated service. For baby and pregnancy ' +
                      'help or if you have compliments or complaints ' +
                      'dial {{public_channel}} or reply to any of the SMSs you receive')
                .context({
                    public_channel: self.im.config.public_channel
                }),
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
