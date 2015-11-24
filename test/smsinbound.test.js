var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');
var optoutstore = require('./optoutstore');
var DummyOptoutResource = optoutstore.DummyOptoutResource;
var _ = require('lodash');

describe("app", function() {
    describe("for sms inbound use", function() {
        var app;
        var tester;

        beforeEach(function() {
            app = new go.app.GoNDOH();
            go.utils.get_timestamp = function() {
                return '20130819144811';
            };
            go.utils.get_uuid = function() {
                return 'b18c62b4-828e-4b52-25c9-725a1f43fb37';
            };

            go.utils.get_oid = function(){
                return '2.25.169380846032024';
            };

            tester = new AppTester(app);

            tester
                .setup(function(api) {
                    api.resources.add(new DummyOptoutResource());
                    api.resources.attach(api);
                })
                .setup.char_limit(160)
                .setup.config.app({
                    name: 'smsinbound',
                    testing: 'true',
                    testing_today: 'April 4, 2014 07:07:07',
                    env: 'test',
                    metric_store: 'test_metric_store',
                    endpoints: {
                        "sms": {"delivery_class": "sms"}
                    },
                    channel: "longcode",
                    jembi: {
                        username: 'foo',
                        password: 'bar',
                        url: 'http://test/v2/',
                        url_json: 'http://test/v2/json/'
                    },
                    control: {
                        username: 'test_user',
                        api_key: 'test_key',
                        url: 'http://ndoh-control/api/v1/'
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
                    },
                    public_holidays: [
                        "2015-01-01",  // new year's day
                        "2015-03-21",  // human rights day
                        "2015-04-03",  // good friday - VARIES
                        "2015-04-06",  // family day - VARIES
                        "2015-04-27",  // freedom day
                        "2015-05-01",  // worker's day
                        "2015-06-16",  // youth day
                        "2015-08-09",  // women's day
                        "2015-08-10",  // women's day OBSERVED (Sunday -> Monday)
                        "2015-09-24",  // heritage day
                        "2015-12-16",  // day of reconciliation
                        "2015-12-25",  // christmas day
                        "2015-12-26",  // day of goodwill
                    ],
                    helpdesk_hours: [8, 16],
                    snappybouncer: {
                        conversation: 'dummyconversation'
                    }
                })
                .setup(function(api) {
                    api.kv.store['test.smsinbound.unique_users'] = 0;
                    api.kv.store['test_metric_store.test.sum.subscriptions'] = 4;
                    api.kv.store['test_metric_store.test.sum.optout_cause.loss'] = 2;
                })
                .setup(function(api) {
                    api.metrics.stores = {'test_metric_store': {}};
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                });
        });

        describe('using the session length helper', function () {
            it('should publish metrics', function () {

                return tester
                    .setup(function(api) {
                        api.kv.store['session_length_helper.' + api.config.app.name + '.foodacom.sentinel'] = '2000-12-12';
                        api.kv.store['session_length_helper.' + api.config.app.name + '.foodacom'] = 42;
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
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
                        content: 'start',
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

            describe("when a new unique user sends message in", function() {
                it("should increment the no. of unique users metric by 1", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'en'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .inputs('start')
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.smsinbound.sum.unique_users'].values, [1]);
                        }).run();
                });
            });

            describe("when user SMSs baby", function() {
                it("should fire multiple metrics", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'en'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.addr('27001')
                        .inputs('baby')
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            // should increment the number of baby SMSs metric
                            assert.deepEqual(metrics['test.sum.baby_sms'].values, [1]);
                            // should add to the total subscriptions metric
                            assert.deepEqual(metrics['test.sum.subscriptions'].values, [5]);

                            var kv_store = api.kv.store;
                            // should inc kv store for total subscriptions
                            assert.equal(kv_store['test_metric_store.test.sum.subscriptions'], 5);
                        }).run();
                });
            });

            describe("when the user sends a STOP message", function() {
                it("should fire multiple metrics", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'en',
                                    id_type: 'none',
                                    is_registered_by: 'chw'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.addr('27001')
                        .inputs('STOP')
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            // should NOT inc total subscriptions metric
                            assert.equal(metrics['test.sum.subscriptions'], undefined);
                            // should inc optouts on registration source
                            assert.deepEqual(metrics['test.sum.optout_on.chw'].values, [1]);
                            // should inc all opt-outs metric
                            assert.deepEqual(metrics['test.sum.optouts'].values, [1]);
                            // should NOT inc loss optouts metric
                            assert.equal(metrics['test.sum.optout_cause.loss'], undefined);
                            // should inc non-loss optouts metric
                            assert.deepEqual(metrics['test.sum.optout_cause.non_loss'].values, [1]);
                            // should inc cause optouts metric
                            assert.deepEqual(metrics['test.sum.optout_cause.unknown'].values, [1]);
                            // should adjust percentage all optouts metric
                            assert.deepEqual(metrics['test.percent.optout.all'].values, [25]);
                            // should adjust percentage non-loss metric
                            assert.deepEqual(metrics['test.percent.optout.non_loss'].values, [25]);
                            // should NOT adjust percentage optouts that signed up for loss messages
                            assert.deepEqual(metrics['test.percent.optout.loss.msgs'].values, [0]);

                            var kv_store = api.kv.store;
                            // should NOT inc kv store for total subscriptions
                            assert.equal(kv_store['test_metric_store.test.sum.subscriptions'], 4);
                            // should inc kv store for all optouts
                            assert.equal(kv_store['test_metric_store.test.sum.optouts'], 1);
                            // should NOT inc kv store for loss optouts
                            assert.equal(kv_store['test_metric_store.test.sum.optout_cause.loss'], 2);
                            // should inc kv store for non-loss optouts
                            assert.equal(kv_store['test_metric_store.test.sum.optout_cause.non_loss'], 1);
                            // should inc kv store cause optouts
                            assert.equal(kv_store['test_metric_store.test.sum.optout_cause.unknown'], 1);
                        })
                        .run();
                });
            });

        });

        describe("when the user sends a non standard keyword message", function() {

            describe("when the message is received between 08:00 and 16:00", function() {
                it("should log a support ticket", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'en',
                                    clinic_code: '123456'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.config.app({
                            // friday during working hours
                            testing_today: 'April 4, 2014 09:07:07 GMT+0200 (SAST)'
                        })
                        .setup.user.addr('27001')
                        .inputs('DONUTS')
                        .check.interaction({
                            state: 'states_default',
                            reply:
                                'Thank you for your message, it has been captured and you will ' +
                                'receive a response soon. Kind regards. MomConnect.'
                        })
                        .run();
                });
            });

            describe("when the message is received out of hours", function() {
                it("should give out of hours warning", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'en'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.config.app({
                            // friday out of hours
                            testing_today: 'April 4, 2014 07:07:07  GMT+0200 (SAST)'
                        })
                        .setup.user.addr('27001')
                        .inputs('DONUTS')
                        .check.interaction({
                            state: 'states_default',
                            reply:
                                "The helpdesk operates from 8am to 4pm Mon to Fri. " +
                                "Responses will be delayed outside of these hrs. In an " +
                                "emergency please go to your health provider immediately."
                        })
                        .run();
                });
            });

            describe("when the message is received on a weekend", function() {
                it("should give weekend warning", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'en'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.config.app({
                            // saturday during working hours
                            testing_today: 'April 5, 2014 09:07:07  GMT+0200 (SAST)'
                        })
                        .setup.user.addr('27001')
                        .inputs('DONUTS')
                        .check.interaction({
                            state: 'states_default',
                            reply:
                                "The helpdesk is not currently available during weekends " +
                                "and public holidays. In an emergency please go to your " +
                                "health provider immediately."
                        })
                        .run();
                });
            });

            describe("when the message is received on a public holiday", function() {
                it("should give public holiday warning", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'en'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.config.app({
                            // women's day 2015 during working hours
                            testing_today: 'August 10, 2015 09:07:07  GMT+0200 (SAST)'
                        })
                        .setup.user.addr('27001')
                        .inputs('DONUTS')
                        .check.interaction({
                            state: 'states_default',
                            reply:
                                "The helpdesk is not currently available during weekends " +
                                "and public holidays. In an emergency please go to your " +
                                "health provider immediately."
                        })
                        .run();
                });
            });

        });

        describe("when the user sends a message containing a USSD code", function() {
            it("should tell them to dial the number, not sms it", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs('*134*12345# rate')
                    .check.interaction({
                        state: 'states_dial_not_sms',
                        reply:
                            "Please use your handset's keypad to dial the number that you " +
                            "received, rather than sending it to us in an sms."
                    })
                    .run();
            });
        });

        describe("when the user sends an optout message", function() {
            it("STOP - should set their opt out status", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                id_type: 'none'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs('"stop" in the name of love')
                    .check.interaction({
                        state: 'states_opt_out',
                        reply:
                            'Thank you. You will no longer receive messages from us. ' +
                            'If you have any medical concerns please visit your nearest clinic'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, { msisdn: '+27001' });
                        assert.equal(contact.extra.opt_out_reason, 'unknown');
                    })
                    .run();
            });
            it("END - should set their opt out status", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                id_type: 'none'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs('END')
                    .check.interaction({
                        state: 'states_opt_out',
                        reply:
                            'Thank you. You will no longer receive messages from us. ' +
                            'If you have any medical concerns please visit your nearest clinic'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, { msisdn: '+27001' });
                        assert.equal(contact.extra.opt_out_reason, 'unknown');
                    })
                    .run();
            });
            it("CANCEL - should set their opt out status", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                id_type: 'none'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs('CANCEL')
                    .check.interaction({
                        state: 'states_opt_out',
                        reply:
                            'Thank you. You will no longer receive messages from us. ' +
                            'If you have any medical concerns please visit your nearest clinic'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, { msisdn: '+27001' });
                        assert.equal(contact.extra.opt_out_reason, 'unknown');
                    })
                    .run();
            });
            it("UNSUBSCRIBE - should set their opt out status", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                id_type: 'none'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs('UNSUBSCRIBE')
                    .check.interaction({
                        state: 'states_opt_out',
                        reply:
                            'Thank you. You will no longer receive messages from us. ' +
                            'If you have any medical concerns please visit your nearest clinic'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, { msisdn: '+27001' });
                        assert.equal(contact.extra.opt_out_reason, 'unknown');
                    })
                    .run();
            });
            it("QUIT - should set their opt out status", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                id_type: 'none'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs('QUIT')
                    .check.interaction({
                        state: 'states_opt_out',
                        reply:
                            'Thank you. You will no longer receive messages from us. ' +
                            'If you have any medical concerns please visit your nearest clinic'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, { msisdn: '+27001' });
                        assert.equal(contact.extra.opt_out_reason, 'unknown');
                    })
                    .run();
            });
            it("BLOCK - should set their opt out status", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                id_type: 'none'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs('BLOCK')
                    .check.interaction({
                        state: 'states_opt_out',
                        reply:
                            'Thank you. You will no longer receive messages from us. ' +
                            'If you have any medical concerns please visit your nearest clinic'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, { msisdn: '+27001' });
                        assert.equal(contact.extra.opt_out_reason, 'unknown');
                    })
                    .run();
            });
        });

        describe("when the user sends a START message", function() {
            it("should reverse their opt out status", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                opt_out_reason: 'unknown'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs('"START"')
                    .check.interaction({
                        state: 'states_opt_in',
                        reply:
                            'Thank you. You will now receive messages from us again. ' +
                            'If you have any medical concerns please visit your nearest clinic'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, { msisdn: '+27001' });
                        assert.equal(contact.extra.opt_out_reason, '');
                    })
                    .run();
            });
        });

        describe("when the user sends a BABY message", function() {
            it("should switch their subscription to baby protocol", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs('baBy has been born, bub')
                    .check.interaction({
                        state: 'states_baby',
                        reply:
                            'Thank you. You will now receive messages related to newborn babies. ' +
                            'If you have any medical concerns please visit your nearest clinic'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27001'
                        });
                        assert.equal(contact.extra.subscription_type, '4');
                        assert.equal(contact.extra.subscription_rate, '3');
                        // check baby switch is not counted as an optout
                        assert.equal(contact.extra.opt_out_reason, undefined);
                    })
                    .run();
            });
        });
    });
});
