var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');
var optoutstore = require('./optoutstore');
var DummyOptoutResource = optoutstore.DummyOptoutResource;


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
                    }
                })
                .setup(function(api) {
                    api.kv.store['test.smsinbound.unique_users'] = 0;
                })
                .setup(function(api) {
                    api.metrics.stores = {'test_metric_store': {}};
                })
                
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                });
        });



        describe("when a new unique user sends message in", function() {
            it("should increment the no. of unique users by 1", function() {
                return tester
                    .start()
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.deepEqual(metrics['test.smsinbound.sum.unique_users'].values, [1]);
                    }).run();
            });
        });

        describe("when the user sends a non standard keyword message", function() {
            it("should send them an error", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup.user.state('states_start')
                    .input('DONUTS')
                    .check.interaction({
                        state: 'states_start',
                        reply: 
                            'Sorry, your message was not understood. ' +
                            'Please try again.'
                    })
                    .run();
            });
        });

        describe("when the user sends a STOP message", function() {
            it("should set their opt out status", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup.user.state('states_start')
                    .input('STOP')
                    .check.interaction({
                        state: 'states_opt_out',
                        reply: 
                            'Thank you. You will no longer receive messages from us. ' +
                            'If you have any medical concerns please visit your nearest clinic'
                    })
                    .run();
            });
        });

        describe("when the user sends a START message", function() {
            it("should reverse their opt out status", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup.user.state('states_start')
                    .input('START')
                    .check.interaction({
                        state: 'states_opt_in',
                        reply: 
                            'Thank you. You will now receive messages from us again. ' +
                            'If you have any medical concerns please visit your nearest clinic'
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
                    .setup.user.addr('+27001')
                    .setup.user.state('states_start')
                    .input('BABY')
                    .check.interaction({
                        state: 'states_baby',
                        reply: 
                            'Thank you. You will now receive messages related to newborn babies. ' +
                            'If you have any medical concerns please visit your nearest clinic'
                    })
                    .run();
            });
        });
    });
});
