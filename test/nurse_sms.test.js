var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');
var optoutstore = require('./optoutstore');
var DummyOptoutResource = optoutstore.DummyOptoutResource;
var _ = require('lodash');

describe("app", function() {
    describe("for nurse sms use", function() {
        var app;
        var tester;

        beforeEach(function() {
            app = new go.app.GoNDOH();

            go.utils.get_timestamp = function() {
                return '20130819144811';
            };

            tester = new AppTester(app);

            tester
                .setup(function(api) {
                    api.resources.add(new DummyOptoutResource());
                    api.resources.attach(api);
                })
                .setup.char_limit(160)
                .setup.config.app({
                    name: 'nurse_sms',
                    testing: 'true',
                    testing_today: 'April 4, 2014 07:07:07',
                    env: 'test',
                    metric_store: 'test_nurse_sms_ms',
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
                    snappybouncer: {
                        conversation: 'dummyconversation'
                    }
                })
                .setup(function(api) {
                    api.kv.store['test.nurse_sms.unique_users'] = 0;
                })
                .setup(function(api) {
                    api.metrics.stores = {'test_nurse_sms_ms': {}};
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

                        var m_store = api.metrics.stores.test_nurse_sms_ms;
                        assert.equal(
                          m_store['session_length_helper.' + im.config.name + '.foodacom'].agg, 'max');
                        assert.equal(
                          m_store['session_length_helper.' + im.config.name + '.foodacom'].values[0], 60);
                    }).run();
            });
        });

        describe("test Metrics and KVs", function() {

            describe("when a new unique user sends message in", function() {
                it("should fire no metrics", function() {
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
                            var metrics = api.metrics.stores.test_nurse_sms_ms;
                            assert.equal(Object.keys(metrics).length, 0);
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
                            var metrics = api.metrics.stores.test_nurse_sms_ms;
                            assert.equal(Object.keys(metrics).length, 4);
                            // should inc all opt-outs metric
                            assert.deepEqual(metrics['test.sum.optouts'].values, [1]);
                            // should NOT inc loss optouts metric
                            assert.deepEqual(metrics['test.sum.optout_cause.non_loss'].values, [1]);
                            // should inc cause optouts metric
                            assert.deepEqual(metrics['test.sum.optout_cause.unknown'].values, [1]);

                            var kv_store = api.kv.store;
                            // should inc kv store for all optouts
                            assert.equal(kv_store['test_nurse_sms_ms.test.sum.optouts'], 1);
                            // should inc kv store for non-loss optouts
                            assert.equal(kv_store['test_nurse_sms_ms.test.sum.optout_cause.non_loss'], 1);
                            // should inc kv store cause optouts
                            assert.equal(kv_store['test_nurse_sms_ms.test.sum.optout_cause.unknown'], 1);
                        })
                        .run();
                });
            });

        });

        describe("when the user sends a STOP message", function() {
            it("should set their opt out status", function() {
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
                            'Thank you. You will no longer receive messages from us.'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, { msisdn: '+27001' });
                        assert.equal(contact.extra.nc_opt_out_reason, 'unknown');
                    })
                    .run();
            });
        });

        describe("when the user sends a BLOCK message", function() {
            it("should set their opt out status", function() {
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
                            'Thank you. You will no longer receive messages from us.'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, { msisdn: '+27001' });
                        assert.equal(contact.extra.nc_opt_out_reason, 'unknown');
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
                                nc_opt_out_reason: 'unknown'
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
                        assert.equal(contact.extra.nc_opt_out_reason, '');
                    })
                    .run();
            });
        });

    });
});
