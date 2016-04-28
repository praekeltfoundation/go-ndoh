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
                    nurse_ussd_channel: "nurse_ussd_channel",
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
                    control_v2: {
                        url: 'http://ndoh-control/api/v2/',
                        api_token: 'test_token'
                    },
                    snappybouncer: {
                        conversation: 'dummyconversation'
                    }
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
                            extra : {},
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
                it("should fire metrics", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {},
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .inputs('start')
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_nurse_sms_ms;
                            assert.equal(Object.keys(metrics).length, 2);
                            assert.deepEqual(metrics['test.nurse_sms.inbound_sms.last'].values, [1]);
                            assert.deepEqual(metrics['test.nurse_sms.inbound_sms.sum'].values, [1]);
                        }).run();
                });
            });

            describe("when the user sends a STOP message", function() {
                it("should fire no metrics", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    nc_id_type: 'sa_id',
                                    nc_sa_id_no: '7103035001001',
                                    nc_last_reg_id: '99',
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.addr('27001')
                        .inputs('STOP')
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_nurse_sms_ms;
                            assert.equal(Object.keys(metrics).length, 8);
                            assert.deepEqual(metrics['test.nurse_sms.optouts.last'].values, [1]);
                            assert.deepEqual(metrics['test.nurse_sms.optouts.sum'].values, [1]);
                            assert.deepEqual(metrics['test.nurseconnect.optouts.last'].values, [1]);
                            assert.deepEqual(metrics['test.nurseconnect.optouts.sum'].values, [1]);
                            assert.deepEqual(metrics['test.nurseconnect.optouts.unknown.last'].values, [1]);
                            assert.deepEqual(metrics['test.nurseconnect.optouts.unknown.sum'].values, [1]);
                            assert.deepEqual(metrics['test.nurse_sms.inbound_sms.last'].values, [1]);
                            assert.deepEqual(metrics['test.nurse_sms.inbound_sms.sum'].values, [1]);
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
                            extra : {},
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

        describe("when the user sends a STOP message", function() {
            it("should set their opt out status", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                nc_id_type: 'sa_id',
                                nc_sa_id_no: '7103035001001',
                                nc_last_reg_id: '99',
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
                                nc_id_type: 'sa_id',
                                nc_sa_id_no: '7103035001001',
                                nc_last_reg_id: '99',
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

        describe("when the user sends a different message", function() {
            it("should tell them how to opt out", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {},
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs('help')
                    .check.interaction({
                        state: 'st_unrecognised',
                        reply:
                            'We do not recognise the message you sent us. Reply STOP ' +
                            'to unsubscribe or dial nurse_ussd_channel for more options.'
                    })
                    .run();
            });
        });

    });
});
