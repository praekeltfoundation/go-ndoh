go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var EndState = vumigo.states.EndState;
    var BookletState = vumigo.states.BookletState;
    var PaginatedChoiceState = vumigo.states.PaginatedChoiceState;

    var GoNDOH = App.extend(function(self) {
        App.call(self, 'states_start');
        var $ = self.$;

        self.init = function() {
            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                   self.contact = user_contact;
                });
        };

        // Start - select topic
        self.states.add('states_start', function(name) {
            return go.utils.get_snappy_topics(self.im, self.im.config.snappy.default_faq)
                .then(function(response) {
                    if (typeof response.data.error  !== 'undefined') {
                        // TODO Throw proper error
                        return error;
                    } else {
                        return response.data.map(function(d) {
                            return new Choice(d.id, d.topic);
                        });
                    }
                })
                .then(function(choices) {
                    return new PaginatedChoiceState(name, {
                        question: $('We have gathered the most important information in the areas below. Please select one:'),
                        choices: choices,
                        options_per_page: 8,
                        next: 'states_questions'
                    });
                });
        });

        // Show questions in selected topic
        self.states.add('states_questions', function(name, opts) {
            return go.utils.get_snappy_topic_content(self.im, 
                        self.im.config.snappy.default_faq, self.im.user.answers.states_start)
                .then(function(response) {
                    if (typeof response.data.error  !== 'undefined') {
                        // TODO Throw proper error
                        return error;
                    } else {
                        var choices = response.data.map(function(d) {
                            return new Choice(d.id, d.question);
                        });

                        return new PaginatedChoiceState(name, {
                            question: $('Please choose a question:'),
                            choices: choices,
                            // TODO calculate options_per_page once content length is known
                            options_per_page: 2,
                            next: function() {
                                return {
                                    name: 'states_answers',
                                    creator_opts: {
                                        response: response
                                    }
                                };
                            }
                        });
                    }
                });
        });

        // Show answer to selected question
        self.states.add('states_answers', function(name, opts) {
            var id = self.im.user.answers.states_questions;
            var index = _.findIndex(opts.response.data, { 'id': id });
            var footer_text = [
                    "1. Prev",
                    "2. Next",
                    "0. Send to me by SMS"
                ].join("\n");
            var num_chars = 160 - footer_text.length;
            // TODO update footer_text length calc for translations
            var answer = opts.response.data[index].answer.trim();
            var sms_content = answer;
            var answer_split = [];

            while (answer.length > 0 && answer.length > num_chars) {
                answer_max_str = answer.substr(0,num_chars);
                space_index = answer_max_str.lastIndexOf(' ');
                answer_sub = answer.substr(0, space_index);
                answer_split.push(answer_sub);
                answer = answer.slice(space_index+1);
            }
            answer_split.push(answer);

            return new BookletState(name, {
                pages: answer_split.length,
                page_text: function(n) {return answer_split[n];},
                buttons: {"1": -1, "2": +1, "0": "exit"},
                footer_text:$(footer_text),
                next: function() {
                    return {
                        name: 'states_end',
                        creator_opts: {
                            sms_content: sms_content
                        }
                    };
                }
            });
        });

        // End
        self.states.add('states_end', function(name, opts) {
            return new EndState(name, {
                text: $('Thank you. Your SMS will be delivered shortly.'),

                next: 'states_start',

                events: {
                    'state:enter': function() {
                        return self.im.outbound.send_to_user({
                            endpoint: 'sms',
                            content: opts.sms_content
                        });
                    }
                }
            });
        });

    });

    return {
        GoNDOH: GoNDOH
    };
}();

