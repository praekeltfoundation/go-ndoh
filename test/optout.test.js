var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');
var _ = require('lodash');

var messagestore = require('./optoutstore');
var DummyOptoutResource = messagestore.DummyOptoutResource;


describe("app", function() {
    describe("for opting out of messages", function() {
        var app;
        var tester;

        beforeEach(function() {
            app = new go.app.GoNDOH();
            go.utils.get_timestamp = function() {
                return '20130819144811';
            };
            tester = new AppTester(app);

            tester
                .setup.config.app({
                    name: 'optout',
                    testing: 'true',
                    testing_today: 'April 4, 2014 07:07:07',
                    channel: "*120*550#1",
                    env: 'test',
                    metric_store: 'test_metric_store',
                    endpoints: {
                        "sms": {"delivery_class": "sms"}
                    },
                    control: {
                        username: 'test_user',
                        api_key: 'test_key',
                        url: 'http://ndoh-control/api/v1/'
                    },
                    jembi: {
                        username: 'foo',
                        password: 'bar',
                        url: 'http://test/v2/',
                        url_json: 'http://test/v2/json/optout'
                    },
                    subscription: {
                        standard: 1,
                        later: 2,
                        accelerated: 3,
                        baby1: 4,
                        baby2: 5,
                        miscarriage: 6,
                        stillbirth: 7,
                        babyloss: 8,
                        subscription: 9,
                        chw: 10
                    },
                    rate: {
                        daily: 1,
                        one_per_week: 2,
                        two_per_week: 3,
                        three_per_week: 4,
                        four_per_week: 5,
                        five_per_week: 6
                    }
                })
                .setup.char_limit(140)
                .setup(function(api) {
                    api.contacts.add( {
                        msisdn: '+27001',
                        extra : {
                            language_choice: 'en',
                            suspect_pregnancy: 'yes',
                            id_type: 'passport',
                            passport_origin: 'zw',
                            passport_no: '12345',
                            ussd_sessions: '5'
                        },
                        key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                        user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                    });
                    api.contacts.add( {
                        msisdn: '+27002',
                        extra : {
                            language_choice: 'en',
                            suspect_pregnancy: 'yes',
                            id_type: 'passport',
                            passport_origin: 'zw',
                            passport_no: '12345',
                            ussd_sessions: '5'
                        },
                        key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                        user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                    });
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                })
                .setup(function(api) {
                    api.resources.add(new DummyOptoutResource());
                    api.resources.attach(api);
                });
        });

        describe("when the user starts a session", function() {

            describe("when the user has not previously opted out", function() {
                it("should ask for the reason they are opting out", function() {
                    return tester
                        .setup.user.addr('27001')
                        .start()
                        .check.interaction({
                            state: 'states_start',
                            reply: [
                                'Please let us know why you do not want MomConnect messages',
                                '1. Miscarriage',
                                '2. Baby was stillborn',
                                '3. Baby died',
                                '4. Messages not useful',
                                '5. Other'
                            ].join('\n')
                        })
                        .check.user.properties({lang: 'en'})
                        .run();
                });
            });

            describe("when the user has previously opted out", function() {
                it("should ask for the reason they are opting out", function() {
                    return tester
                        .setup.user.addr('27002')
                        .start()
                        .check.interaction({
                            state: 'states_start',
                            reply: [
                                'Please tell us why you previously opted out of messages',
                                '1. Miscarriage',
                                '2. Baby was stillborn',
                                '3. Baby died',
                                '4. Messages not useful',
                                '5. Other'
                            ].join('\n')
                        })
                        .check.user.properties({lang: 'en'})
                        .run();
                });
            });

        });

        describe("when the user selects a reason for opting out", function() {
            it("should ask if they want further help", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_start')
                    .input('1')
                    .check.interaction({
                        state: 'states_subscribe_option',
                        reply: [
                            'We are sorry for your loss. Would you like ' +
                            'to receive a small set of free messages ' +
                            'to help you in this difficult time?',
                            '1. Yes',
                            '2. No'
                        ].join('\n')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.opt_out_reason, 'miscarriage');
                    })
                    .run();
            });
        });

        describe("when the user selects a reason for opting out 4 or 5", function() {
            it("should thank them and exit", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_start')
                    .input('4')
                    .check.interaction({
                        state: 'states_end_no',
                        reply: ('Thank you. You will no longer receive ' +
                            'messages from us. If you have any medical ' +
                            'concerns please visit your nearest clinic.')
                    })
                    .check.reply.ends_session()
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.opt_out_reason, 'not_useful');
                    })
                    .run();
            });
        });

        describe("when the user selects no to futher help", function() {
            it("should thank them and exit", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                suspect_pregnancy: 'yes',
                                id_type: 'passport',
                                passport_origin: 'zw',
                                passport_no: '12345',
                                ussd_sessions: '5'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.answers({
                        'states_start': 'miscarriage'
                    })
                    .setup.user.addr('27001')
                    .setup.user.state('states_subscribe_option')
                    .input('2')
                    .check.interaction({
                        state: 'states_end_no',
                        reply: ('Thank you. You will no longer receive ' +
                            'messages from us. If you have any medical ' +
                            'concerns please visit your nearest clinic.')
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

        describe("when the user selects yes to futher help", function() {
            
            describe("when the user has existing subscriptions", function() {
                it("should unsubscribe from other lines, subscribe them and exit", function() {
                    return tester
                        .setup.user.answers({
                            'states_start': 'miscarriage'
                        })
                        .setup.user.state('states_subscribe_option')
                        .setup.user.addr('27001')
                        .input('1')
                        .check.interaction({
                            state: 'states_end_yes',
                            reply: ('Thank you. You will receive support messages ' +
                                'from MomConnect in the coming weeks.')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27001'
                            });                      
                            assert.equal(contact.extra.subscription_type, '6');
                            assert.equal(contact.extra.subscription_rate, '3');
                        })
                        .check.reply.ends_session()
                        .run();
                });
            });

            describe("when the user has no existing subscriptions", function() {
                it("should subscribe them and exit", function() {
                    return tester
                        .setup.user.answers({
                            'states_start': 'miscarriage'
                        })
                        .setup.user.state('states_subscribe_option')
                        .setup.user.addr('27002')
                        .input('1')
                        .check.interaction({
                            state: 'states_end_yes',
                            reply: ('Thank you. You will receive support messages ' +
                                'from MomConnect in the coming weeks.')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27002'
                            });                      
                            assert.equal(contact.extra.subscription_type, '6');
                            assert.equal(contact.extra.subscription_rate, '3');
                        })
                        .check.reply.ends_session()
                        .run();
                });
            });

        });
    });
});
