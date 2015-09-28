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
                        url_json: 'http://test/v2/json/'
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
                .setup.char_limit(182)
                .setup(function(api) {
                    api.contacts.add( {
                        msisdn: '+27001',
                        extra : {
                            language_choice: 'en',
                            suspect_pregnancy: 'yes',
                            id_type: 'passport',
                            passport_origin: 'zw',
                            passport_no: '12345',
                            ussd_sessions: '5',
                            is_registered_by: 'clinic'
                        },
                        key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                        user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                    });
                    api.contacts.add( {
                        msisdn: '+27831112222',
                        extra : {
                            language_choice: 'en',
                            suspect_pregnancy: 'yes',
                            id_type: 'passport',
                            passport_origin: 'zw',
                            passport_no: '12345',
                            ussd_sessions: '5',
                            is_registered_by: 'personal',
                            opt_out_reason: 'babyloss'
                        },
                        key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                        user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                    });
                    api.contacts.add( {
                        msisdn: '+27831113333',
                        extra : {
                            language_choice: 'en',
                            suspect_pregnancy: 'yes',
                            id_type: 'passport',
                            passport_origin: 'zw',
                            passport_no: '12345',
                            ussd_sessions: '5',
                            is_registered_by: 'chw',
                            opt_out_reason: 'unknown'
                        },
                        key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                        user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                    });
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                })
                .setup(function(api) {
                    api.kv.store['test_metric_store.test.sum.subscriptions'] = 4;
                    api.kv.store['test_metric_store.test.sum.optout_cause.loss'] = 2;
                })
                .setup(function(api) {
                    api.resources.add(new DummyOptoutResource());
                    api.resources.attach(api);
                });
        });

        describe('using the session length helper', function () {
            it('should publish metrics', function () {
                return tester
                    .setup(function(api) {
                        api.kv.store['session_length_helper.' + api.config.app.name + '.foodacom.sentinel'] = '2000-12-12';
                        api.kv.store['session_length_helper.' + api.config.app.name + '.foodacom'] = 42;
                    })
                    .setup.user({
                        state: 'states_start',
                        metadata: {
                          session_length_helper: {
                            // one minute before the mocked timestamp
                            start: Number(new Date('April 4, 2014 07:06:07'))
                          }
                        }
                    })
                    .input({
                        content: '1',
                        transport_metadata: {
                            aat_ussd: {
                                provider: 'foodacom'
                            }
                        }
                    })
                    .input.session_event('close')
                    .check(function(api, im) {

                        var kv_store = api.kv.store;
                        assert.equal(kv_store['session_length_helper.' + im.config.name + '.foodacom'], 60000);
                        assert.equal(
                          kv_store['session_length_helper.' + im.config.name + '.foodacom.sentinel'], '2014-04-04');

                        var m_store = api.metrics.stores.test_metric_store;
                        assert.equal(
                          m_store['session_length_helper.' + im.config.name + '.foodacom'].agg, 'max');
                        assert.equal(
                          m_store['session_length_helper.' + im.config.name + '.foodacom'].values[0], 60);
                    }).run();
            });
        });

        describe("test Metrics and KVs", function() {

            describe("when the user was NOT previously opted out", function() {

                describe("when the user signs up for messages", function() {
                    it("should fire multiple metrics", function() {
                        return tester
                            .setup.user.addr('27001')
                            .inputs({session_event: "new"}, '1', '1')
                            .check(function(api) {
                                var metrics = api.metrics.stores.test_metric_store;
                                // should inc total subscriptions metric
                                assert.deepEqual(metrics['test.sum.subscriptions'].values, [5]);
                                // should inc optouts on registration source
                                assert.deepEqual(metrics['test.sum.optout_on.clinic'].values, [1]);
                                // should inc all opt-outs metric
                                assert.deepEqual(metrics['test.sum.optouts'].values, [1]);
                                // should inc loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.loss'].values, [3]);
                                // should NOT inc non-loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.non_loss'], undefined);
                                // should inc cause optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.miscarriage'].values, [1]);
                                // should adjust percentage all optouts metric
                                assert.deepEqual(metrics['test.percent.optout.all'].values, [25, 20]);
                                // should NOT adjust percentage non-loss metric
                                assert.deepEqual(metrics['test.percent.optout.non_loss'].values, [0, 0]);
                                // should record subscription to optout protocol success
                                assert.deepEqual(metrics['test.optout.sum.subscription_to_protocol_success'].values, [1]);
                                // should adjust percentage optouts that signed up for loss messages
                                assert.deepEqual(metrics['test.percent.optout.loss.msgs'].values, [0, 33.33]);

                                var kv_store = api.kv.store;
                                // should inc kv store for total subscriptions
                                assert.equal(kv_store['test_metric_store.test.sum.subscriptions'], 5);
                                // should inc kv store for all optouts
                                assert.equal(kv_store['test_metric_store.test.sum.optouts'], 1);
                                // should inc kv store for loss optouts
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.loss'], 3);
                                // should NOT inc kv store for non-loss optouts
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.non_loss'], undefined);
                                // should inc kv store cause optouts
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.miscarriage'], 1);
                                // should NOT inc kv store for other causes
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.babyloss'], undefined);
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.stillbirth'], undefined);
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.not_useful'], undefined);
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.other'], undefined);
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.unknown'], undefined);
                            })
                            .run();
                    });
                });

                describe("when the user gives reason for optout 1-3, but does not sign up for " +
                         "messages", function() {
                    it("should fire multiple metrics", function() {
                        return tester
                            .setup.user.addr('27001')
                            .inputs({session_event: "new"}, '1', '2')
                            .check(function(api) {
                                var metrics = api.metrics.stores.test_metric_store;
                                // should NOT inc total subscriptions metric
                                assert.equal(metrics['test.sum.subscriptions'], undefined);
                                // should inc optouts on registration source
                                assert.deepEqual(metrics['test.sum.optout_on.clinic'].values, [1]);
                                // should inc all opt-outs metric
                                assert.deepEqual(metrics['test.sum.optouts'].values, [1]);
                                // should inc loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.loss'].values, [3]);
                                // should NOT inc non-loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.non_loss'], undefined);
                                // should inc cause optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.miscarriage'].values, [1]);
                                // should adjust percentage all optouts metric
                                assert.deepEqual(metrics['test.percent.optout.all'].values, [25]);
                                // should NOT adjust percentage non-loss metric
                                assert.deepEqual(metrics['test.percent.optout.non_loss'].values, [0]);
                                // should NOT record subscription to optout protocol success
                                assert.deepEqual(metrics['test.optout.sum.subscription_to_protocol_success'], undefined);
                                // should NOT adjust percentage optouts that signed up for loss messages
                                assert.deepEqual(metrics['test.percent.optout.loss.msgs'].values, [0]);

                                var kv_store = api.kv.store;
                                // should NOT inc kv store for total subscriptions
                                assert.equal(kv_store['test_metric_store.test.sum.subscriptions'], 4);
                            })
                            .run();
                    });
                });

                describe("when the user gives reason for optout 4-5", function() {
                    it("should fire multiple metrics", function() {
                        return tester
                            .setup.user.addr('27001')
                            .inputs({session_event: "new"}, '4')
                            .check(function(api) {
                                var metrics = api.metrics.stores.test_metric_store;
                                // should NOT inc total subscriptions metric
                                assert.equal(metrics['test.sum.subscriptions'], undefined);
                                // should inc optouts on registration source
                                assert.deepEqual(metrics['test.sum.optout_on.clinic'].values, [1]);
                                // should inc all opt-outs metric
                                assert.deepEqual(metrics['test.sum.optouts'].values, [1]);
                                // should NOT inc loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.loss'], undefined);
                                // should inc non-loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.non_loss'].values, [1]);
                                // should inc cause optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.not_useful'].values, [1]);
                                // should adjust percentage all optouts metric
                                assert.deepEqual(metrics['test.percent.optout.all'].values, [25]);
                                // should adjust percentage non-loss metric
                                assert.deepEqual(metrics['test.percent.optout.non_loss'].values, [25]);
                                // should NOT adjust percentage optouts that signed up for loss messages
                                assert.deepEqual(metrics['test.percent.optout.loss.msgs'].values, [0]);

                                var kv_store = api.kv.store;
                                // should NOT inc kv store for total subscriptions
                                assert.equal(kv_store['test_metric_store.test.sum.subscriptions'], 4);
                            })
                            .run();
                    });
                });

            });

            describe("when the user WAS previously opted out, reason NOT 'unknown'", function() {

                describe("when the user signs up for messages", function() {
                    it("should increase total subscriptions metric", function() {
                        return tester
                            .setup.user.addr('27831112222')
                            .inputs('start', '1', '1')
                            .check(function(api) {
                                var metrics = api.metrics.stores.test_metric_store;
                                // inc total subscriptions metric
                                assert.deepEqual(metrics['test.sum.subscriptions'].values, [5]);
                                // should not inc optouts on registration source
                                assert.equal(metrics['test.sum.optout_on'], undefined);
                                // should NOT inc all opt-outs metric
                                assert.deepEqual(metrics['test.sum.optouts'], undefined);
                                // should NOT inc loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.loss'], undefined);
                                // should NOT inc non-loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.non_loss'], undefined);
                                // should NOT inc cause optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.not_useful'], undefined);
                                // should NOT adjust percentage all optouts metric
                                assert.deepEqual(metrics['test.percent.optout.all'].values, [0]);
                                // should NOT adjust percentage non-loss metric
                                assert.deepEqual(metrics['test.percent.optout.non_loss'].values, [0]);
                                // should adjust percentage optouts that signed up for loss messages
                                assert.deepEqual(metrics['test.percent.optout.loss.msgs'].values, [50]);

                                var kv_store = api.kv.store;
                                // should inc kv store for total subscriptions
                                assert.equal(kv_store['test_metric_store.test.sum.subscriptions'], 5);
                            })
                            .run();
                    });
                });

                describe("when the user gives reason for optout 1-3, but does not sign up for " +
                         "messages", function() {
                    it("should not fire any metrics", function() {
                        return tester
                            .setup.user.addr('27831112222')
                            .inputs({session_event: "new"}, '1', '2')
                            .check(function(api) {
                                var metrics = api.metrics.stores.test_metric_store;
                                // should NOT inc any metrics
                                assert.equal(metrics, undefined);

                                var kv_store = api.kv.store;
                                // should NOT inc kv store for total subscriptions
                                assert.equal(kv_store['test_metric_store.test.sum.subscriptions'], 4);
                            })
                            .run();
                    });
                });

                describe("when the user gives reason for optout 4-5", function() {
                    it("should not fire any metrics", function() {
                        return tester
                            .setup.user.addr('27831112222')
                            .inputs({session_event: "new"}, '4')
                            .check(function(api) {
                                var metrics = api.metrics.stores.test_metric_store;
                                // should NOT inc any metrics
                                assert.equal(metrics, undefined);

                                var kv_store = api.kv.store;
                                // should NOT inc kv store for total subscriptions
                                assert.equal(kv_store['test_metric_store.test.sum.subscriptions'], 4);
                            })
                            .run();
                    });
                });

            });

            describe("when the user WAS previously opted out, reason 'unknown'", function() {

                describe("when the user signs up for messages", function() {
                    it("should fire multiple metrics", function() {
                        return tester
                            .setup.user.addr('27831113333')
                            .inputs({session_event: "new"}, '1', '1')
                            .check(function(api) {
                                var metrics = api.metrics.stores.test_metric_store;
                                // should inc total subscriptions metric
                                assert.deepEqual(metrics['test.sum.subscriptions'].values, [5]);
                                // should inc optouts on registration source
                                assert.deepEqual(metrics['test.sum.optout_on.chw'].values, [1]);
                                // should inc all opt-outs metric
                                assert.deepEqual(metrics['test.sum.optouts'].values, [1]);
                                // should inc loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.loss'].values, [3]);
                                // should NOT inc non-loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.non_loss'], undefined);
                                // should inc cause optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.miscarriage'].values, [1]);
                                // should adjust percentage all optouts metric
                                assert.deepEqual(metrics['test.percent.optout.all'].values, [25, 20]);
                                // should NOT adjust percentage non-loss metric
                                assert.deepEqual(metrics['test.percent.optout.non_loss'].values, [0, 0]);
                                // should record subscription to optout protocol success
                                assert.deepEqual(metrics['test.optout.sum.subscription_to_protocol_success'].values, [1]);
                                // should adjust percentage optouts that signed up for loss messages
                                assert.deepEqual(metrics['test.percent.optout.loss.msgs'].values, [0, 33.33]);

                                var kv_store = api.kv.store;
                                // should inc kv store for total subscriptions
                                assert.equal(kv_store['test_metric_store.test.sum.subscriptions'], 5);
                                // should inc kv store for all optouts
                                assert.equal(kv_store['test_metric_store.test.sum.optouts'], 1);
                                // should inc kv store for loss optouts
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.loss'], 3);
                                // should NOT inc kv store for non-loss optouts
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.non_loss'], undefined);
                                // should inc kv store cause optouts
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.miscarriage'], 1);
                                // should NOT inc kv store for other causes
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.babyloss'], undefined);
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.stillbirth'], undefined);
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.not_useful'], undefined);
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.other'], undefined);
                                assert.equal(kv_store['test_metric_store.test.sum.optout_cause.unknown'], undefined);
                            })
                            .run();
                    });
                });

                describe("when the user gives reason for optout 1-3, but does not sign up for " +
                         "messages", function() {
                    it("should fire multiple metrics", function() {
                        return tester
                            .setup.user.addr('27831113333')
                            .inputs({session_event: "new"}, '1', '2')
                            .check(function(api) {
                                var metrics = api.metrics.stores.test_metric_store;
                                // should NOT inc total subscriptions metric
                                assert.equal(metrics['test.sum.subscriptions'], undefined);
                                // should inc optouts on registration source
                                assert.deepEqual(metrics['test.sum.optout_on.chw'].values, [1]);
                                // should inc all opt-outs metric
                                assert.deepEqual(metrics['test.sum.optouts'].values, [1]);
                                // should inc loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.loss'].values, [3]);
                                // should NOT inc non-loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.non_loss'], undefined);
                                // should inc cause optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.miscarriage'].values, [1]);
                                // should adjust percentage all optouts metric
                                assert.deepEqual(metrics['test.percent.optout.all'].values, [25]);
                                // should NOT adjust percentage non-loss metric
                                assert.deepEqual(metrics['test.percent.optout.non_loss'].values, [0]);
                                // should NOT record subscription to optout protocol success
                                assert.deepEqual(metrics['test.optout.sum.subscription_to_protocol_success'], undefined);
                                // should NOT adjust percentage optouts that signed up for loss messages
                                assert.deepEqual(metrics['test.percent.optout.loss.msgs'].values, [0]);

                                var kv_store = api.kv.store;
                                // should NOT inc kv store for total subscriptions
                                assert.equal(kv_store['test_metric_store.test.sum.subscriptions'], 4);
                            })
                            .run();
                    });
                });

                describe("when the user gives reason for optout 4-5", function() {
                    it("should fire multiple metrics", function() {
                        return tester
                            .setup.user.addr('27831113333')
                            .inputs({session_event: "new"}, '4')
                            .check(function(api) {
                                var metrics = api.metrics.stores.test_metric_store;
                                // should NOT inc total subscriptions metric
                                assert.equal(metrics['test.sum.subscriptions'], undefined);
                                // should inc optouts on registration source
                                assert.deepEqual(metrics['test.sum.optout_on.chw'].values, [1]);
                                // should inc all opt-outs metric
                                assert.deepEqual(metrics['test.sum.optouts'].values, [1]);
                                // should NOT inc loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.loss'], undefined);
                                // should inc non-loss optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.non_loss'].values, [1]);
                                // should inc cause optouts metric
                                assert.deepEqual(metrics['test.sum.optout_cause.not_useful'].values, [1]);
                                // should adjust percentage all optouts metric
                                assert.deepEqual(metrics['test.percent.optout.all'].values, [25]);
                                // should adjust percentage non-loss metric
                                assert.deepEqual(metrics['test.percent.optout.non_loss'].values, [25]);
                                // should NOT adjust percentage optouts that signed up for loss messages
                                assert.deepEqual(metrics['test.percent.optout.loss.msgs'].values, [0]);

                                var kv_store = api.kv.store;
                                // should NOT inc kv store for total subscriptions
                                assert.equal(kv_store['test_metric_store.test.sum.subscriptions'], 4);
                            })
                            .run();
                    });
                });

            });

        });

        describe("when the user starts a session", function() {

            describe("when the user has not previously opted out", function() {
                it("should ask for the reason they are opting out", function() {
                    return tester
                        .setup.char_limit(160)  // limit first state chars
                        .setup.user.addr('27001')
                        .inputs({session_event: "new"})
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
                        .setup.user.addr('27831112222')
                        .inputs({session_event: "new"})
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
                    .setup.char_limit(160)  // limit first state chars
                    .setup.user.addr('27001')
                    .inputs({session_event: "new"}, '1')
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
                    .run();
            });
        });

        describe("when the user selects a reason for opting out 4 or 5", function() {
            it("should thank them and exit", function() {
                return tester
                    .setup.char_limit(160)  // limit first state chars
                    .setup.user.addr('27001')
                    .inputs({session_event: "new"}, '4')
                    .check.interaction({
                        state: 'states_end_no',
                        reply: ('Thank you. You will no longer receive ' +
                            'messages from us. If you have any medical ' +
                            'concerns please visit your nearest clinic.')
                    })
                    .check.reply.ends_session()
                    .run();
            });

            it("should save their optout reason against their contact", function() {
                return tester
                    .setup.user.addr('27001')
                    .inputs({session_event: "new"}, '4')
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
                    .setup.user.addr('27001')
                    .inputs({session_event: "new"}, '1', '2')
                    .check.interaction({
                        state: 'states_end_no',
                        reply: ('Thank you. You will no longer receive ' +
                            'messages from us. If you have any medical ' +
                            'concerns please visit your nearest clinic.')
                    })
                    .check.reply.ends_session()
                    .run();
            });

            it("should save their optout reason on their contact", function() {
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
                    .setup.user.addr('27001')
                    .inputs({session_event: "new"}, '1', '2')
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.opt_out_reason, 'miscarriage');
                    })
                    .run();
            });
        });

        describe("when the user selects yes to futher help", function() {

            describe("when the user has existing subscriptions", function() {
                it("should unsubscribe from other lines, subscribe them and exit", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs({session_event: "new"}, '1', '1')
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

                it("should set their optout reason as '' since they opted in to babyloss " +
                   "messages", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs({session_event: "new"}, '1', '1')
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27001'
                            });
                            assert.equal(contact.extra.opt_out_reason, "");
                        })
                        .run();
                });
            });

            describe("when the user has no existing subscriptions", function() {
                it("should subscribe them and exit", function() {
                    return tester
                        .setup.user.addr('27831112222')
                        .inputs({session_event: "new"}, '1', '1')
                        .check.interaction({
                            state: 'states_end_yes',
                            reply: ('Thank you. You will receive support messages ' +
                                'from MomConnect in the coming weeks.')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27831112222'
                            });
                            assert.equal(contact.extra.subscription_type, '6');
                            assert.equal(contact.extra.subscription_rate, '3');
                        })
                        .check.reply.ends_session()
                        .run();
                });

                it("should set their optout reason as '' since they opted in to babyloss " +
                   "messages", function() {
                    return tester
                        .setup.user.addr('27831112222')
                        .inputs({session_event: "new"}, '1', '1')
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, { msisdn: '+27831112222' });
                            assert.equal(contact.extra.opt_out_reason, '');
                        })
                        .run();
                });
            });

        });
    });
});
