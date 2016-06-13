var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var _ = require('lodash');
var assert = require('assert');
var messagestore = require('./messagestore');
var optoutstore = require('./optoutstore');
var translation_af = require('../config/personal_af');
var DummyMessageStoreResource = messagestore.DummyMessageStoreResource;
var DummyOptoutResource = optoutstore.DummyOptoutResource;

describe("app", function() {
    describe("for personal use", function() {
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
                    api.resources.add(new DummyMessageStoreResource());
                    api.resources.add(new DummyOptoutResource());
                    api.resources.attach(api);
                    api.groups.add(
                        {
                            key: 'en_key',
                            name: 'en',
                        }
                    );
                    api.groups.add(
                        {
                            key: 'xh_key',
                            name: 'xh',
                        }
                    );
                })
                .setup.char_limit(182)
                .setup.config.app({
                    name: 'personal',
                    testing: 'true',
                    testing_today: 'April 4, 2014 07:07:07',
                    env: 'test',
                    metric_store: 'test_metric_store',
                    endpoints: {
                        "sms": {"delivery_class": "sms"}
                    },
                    channel: "*134*550#",
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
                    snappy: {
                        "endpoint": "https://app.besnappy.com/api/v1/",
                        "username": "980d2423-292b-4c34-be81-c74784b9e99a",
                        "account_id": "1",
                        "default_faq": "1"
                    },
                    faq_enabled: true,
                    detailed_data_collection: true
                })
                .setup(function(api) {
                    api.kv.store['test.clinic.unique_users'] = 0;
                    api.kv.store['test.chw.unique_users'] = 0;
                    api.kv.store['test.personal.unique_users'] = 0;
                    api.kv.store['test.personal.no_complete_registrations'] = 2;
                    api.kv.store['test.personal.no_incomplete_registrations'] = 2;
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

        // no_incomplete metric tests
        describe("when a session is terminated", function() {

            describe("when the last state is states_start", function() {
                it("should not fire no_incomplete", function() {
                    return tester
                        .inputs(
                            {session_event: 'new'}  // states_start
                            , {session_event: 'close'}  // states_start
                        )
                        // check metrics
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.equal(metrics['test.personal.states_start.no_incomplete'], undefined);
                        })
                        .run();
                });
            });

            describe("when not in the registration flow", function() {
                it("should not fire no_incomplete", function() {
                    return tester
                        .setup.user.state('states_faq_topics')
                        .inputs(
                            {session_event: 'close'}
                        )
                        // check metrics
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.equal(metrics['test.personal.states_faq_topics.no_incomplete'], undefined);
                        })
                        .run();
                });
            });

            describe("when the last state is states_language", function() {
                it("should increase states_language.no_incomplete metric by 1", function() {
                    return tester
                        .setup.user.state('states_language')
                        .inputs(
                            {session_event: 'close'}
                        )
                        // check metrics
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.personal.states_language.no_incomplete'].values, [1]);
                        })
                        .run();
                });
            });

            describe("when the last state is states_birth_day", function() {
                it("should increase states_birth_day.no_incomplete metric by 1", function() {
                    return tester
                        .setup.user.state('states_birth_day')
                        .inputs(
                            {session_event: 'close'}
                        )
                        // check metrics
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.personal.states_birth_day.no_incomplete'].values, [1]);
                        })
                        .run();
                });
            });

            describe("when the last state is states_end_success", function() {
                it("should not fire a metric", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.addr('27001')
                        .setup.user.state('states_end_success')
                        .inputs(
                            {session_event: 'close'}
                        )
                        // check metrics
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.personal.states_end_success.no_incomplete'], undefined);
                        })
                        .run();
                });
            });
        });

        describe("when a new session is started", function() {

            describe("when a new user hits states_start", function() {
                it("should not fire no_incomplete", function() {
                    return tester
                        .setup.user.addr('275678')
                        .inputs(
                            {session_event: 'new'}
                        )
                        // check metrics
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.equal(metrics['test.personal.states_start.no_incomplete'], undefined);
                        })
                        .run();
                });
            });

            describe("when an existing user hits states_start", function() {
                it("should not fire no_incomplete", function() {
                    return tester
                        .setup.user.lang('en')  // make sure user is not seen as new
                        .inputs(
                            {session_event: 'new'}
                        )
                        // check metrics
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.equal(metrics['test.personal.states_start.no_incomplete'], undefined);
                        })
                        .run();
                });
            });

            describe("when it is an existing starting a session at states_birth_day", function() {
                it("should decrease the metric states_birth_day.no_incomplete by 1", function() {
                    return tester
                        .setup.user.lang('en')  // make sure user is not seen as new
                        .setup.user.state('states_birth_day')
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.personal.states_birth_day.no_incomplete'].values, [-1]);
                        })
                        .run();
                });
            });

            describe("when it is an existing user continuing a session at states_birth_month", function() {
                it("should not fire metric states_birth_month.no_incomplete", function() {
                    return tester
                        .setup.user.state('states_birth_month')
                        .input('2') // make sure session is not new
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.equal(metrics['test.personal.states_birth_month.no_incomplete'], undefined);
                        })
                        .run();
                });
            });
        });
        // end no_incomplete metrics tests

        describe("when a new unique user logs on", function() {
            it("should increment the no. of unique users by 1", function() {
                return tester
                    .start()
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.deepEqual(metrics['test.personal.sum.unique_users'].values, [1]);
                        assert.deepEqual(metrics['test.personal.percentage_users'].values, [100]);
                        assert.deepEqual(metrics['test.sum.unique_users'].values, [1]);
                    }).run();
            });
        });

        describe("when a user timed out", function() {

            describe("when the user timed out but not during registration", function() {
                it("should take them back through states_start", function() {
                    return tester
                        .setup.char_limit(160)  // limit first state chars
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27821234444',
                                extra : {
                                    language_choice: 'en',
                                    is_registered: 'true',
                                    is_registered_by: 'clinic',
                                },
                            });
                        })
                        .setup.user.addr('27821234444')
                        .setup.user.state('states_faq_topics')
                        .inputs('1', null)
                        .check.interaction({
                            state: 'states_registered_full',
                            reply: [
                                'Welcome to the Department of Health\'s ' +
                                'MomConnect. Please choose an option:',
                                '1. Baby and pregnancy info',
                                '2. Send us a compliment',
                                '3. Send us a complaint'
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("when the user timed out during registration on public", function() {
                it("should ask it they want to continue registration", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27821234444',
                                extra : {
                                    language_choice: 'en',
                                    is_registered: 'false',
                                },
                            });
                        })
                        .setup.user.addr('27821234444')
                        .setup.user.answers({
                            'states_language': 'en',
                            'states_register_info': 'register'
                        })
                        .setup.user.state('states_suspect_pregnancy')
                        .input.session_event('new')
                        .check.interaction({
                            state: 'states_timed_out',
                            reply: [
                                'Welcome back. Please select an option:',
                                '1. Continue signing up for messages',
                                '2. Main menu'
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("when the user chooses to continue registration", function() {
                it("should take them back to state they were on at timeout", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27821234444',
                                extra : {
                                    language_choice: 'en',
                                    is_registered: 'false',
                                },
                            });
                        })
                        .setup.user.addr('27821234444')
                        .setup.user.answers({
                            'states_language': 'en',
                            'states_register_info': 'register'
                        })
                        .setup.user.state('states_suspect_pregnancy')
                        .inputs( {session_event: 'new'}, '1')
                        .check.interaction({
                            state: 'states_suspect_pregnancy',
                            reply: [
                                'MomConnect sends free support SMSs to ' +
                                'pregnant mothers. Are you or do you suspect ' +
                                'that you are pregnant?',
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("when the user chooses to abort registration", function() {
                it("should take them back to states_language", function() {
                    return tester
                        .setup.char_limit(160)  // limit first state chars
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27821234444',
                                extra : {
                                    language_choice: 'en',
                                    is_registered: 'false',
                                },
                            });
                        })
                        .setup.user.addr('27821234444')
                        .setup.user.answers({
                            'states_language': 'en',
                            'states_register_info': 'register'
                        })
                        .setup.user.state('states_suspect_pregnancy')
                        .inputs( {session_event: 'new'}, '2')
                        .check.interaction({
                            state: 'states_language',
                            reply: [
                                'Welcome to the Department of Health\'s MomConnect. Choose your language:',
                                '1. isiZulu',
                                '2. isiXhosa',
                                '3. Afrikaans',
                                '4. English',
                                '5. Sesotho sa Leboa',
                                '6. Setswana',
                                '7. More'
                            ].join('\n')
                        })
                        .run();
                });
            });
        });

        describe("when the user starts a session (no prior timeout)", function() {

            describe("when the user has not started registration", function() {
                it("should ask for their preferred language", function() {
                    return tester
                        .setup.user.addr('27001')
                        .start()
                        .check.interaction({
                            state: 'states_language',
                            reply: [
                                'Welcome to the Department of Health\'s MomConnect. Choose your language:',
                                '1. isiZulu',
                                '2. isiXhosa',
                                '3. Afrikaans',
                                '4. English',
                                '5. Sesotho sa Leboa',
                                '6. Setswana',
                                '7. More'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.ussd_sessions, '1');
                            assert.equal(contact.extra.metric_sum_sessions, '1');
                            assert.equal(contact.extra.last_stage, 'states_language');
                        })
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.sum.sessions'].values, [1]);
                        })
                        .run();
                });

                it("should ask for their preferred language from second page if choose more", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // states_start
                            , '7'  // states_language
                        )
                        .check.interaction({
                            state: 'states_language',
                            reply: [
                                'Welcome to the Department of Health\'s MomConnect. Choose your language:',
                                '1. Sesotho',
                                '2. Xitsonga',
                                '3. siSwati',
                                '4. Tshivenda',
                                '5. isiNdebele',
                                '6. Back'
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("when the user had partially registered on another line", function() {
                it("should ask for their preferred language", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'en',
                                    is_registered: 'false',
                                },
                            });
                        })
                        .setup.user.addr('27001')
                        .start()
                        .check.interaction({
                            state: 'states_language',
                            reply: [
                                'Welcome to the Department of Health\'s MomConnect. Choose your language:',
                                '1. isiZulu',
                                '2. isiXhosa',
                                '3. Afrikaans',
                                '4. English',
                                '5. Sesotho sa Leboa',
                                '6. Setswana',
                                '7. More'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.ussd_sessions, '1');
                            assert.equal(contact.extra.metric_sum_sessions, '1');
                            assert.equal(contact.extra.last_stage, 'states_language');
                        })
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.sum.sessions'].values, [1]);
                        })
                        .check.user.properties({lang: null})
                        .run();
                });
            });

            describe("when the user has registered on clinic", function() {
                describe("when the user has active subscriptions", function() {
                    it("should prompt for info / compliment / complaint", function() {
                        return tester
                            .setup(function(api) {
                                api.contacts.add({
                                    msisdn: '+27001',
                                    extra : {
                                        language_choice: 'xh',
                                        is_registered: 'true',
                                        is_registered_by: 'clinic'
                                    },
                                });
                            })
                            .setup.user.addr('27001')
                            .start()
                            .check.interaction({
                                state: 'states_registered_full',
                                reply: [
                                    'Welcome to the Department of Health\'s ' +
                                    'MomConnect. Please choose an option:',
                                    '1. Baby and pregnancy info',
                                    '2. Send us a compliment',
                                    '3. Send us a complaint'
                                ].join('\n')
                            })
                            .check.user.properties({lang: 'xh'})
                            .run();
                    });
                });

                describe("when the user has no active subscriptions", function() {
                    it("should ask if they want to register or get info", function() {
                        return tester
                            .setup(function(api) {
                                api.contacts.add({
                                    msisdn: '+27821235555',
                                    extra : {
                                        language_choice: 'xh',
                                        is_registered: 'true',
                                        is_registered_by: 'clinic'
                                    },
                                });
                            })
                            .setup.user.addr('27821235555')
                            .start()
                            .check.interaction({
                                state: 'states_register_info',
                                reply: [
                                    'Welcome to the Department of Health\'s ' +
                                    'MomConnect. Please select:',
                                    '1. Register for messages',
                                    '2. Baby and Pregnancy info (English only)'
                                ].join('\n')
                            })
                            .check.user.properties({lang: 'xh'})
                            .run();
                    });
                });
            });

            describe("when the user registered on chw/personal", function() {
                it("should prompt for info / full message set", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'tn',
                                    is_registered: 'true',
                                    is_registered_by: 'personal'
                                },
                            });
                        })
                        .setup.user.addr('27001')
                        .start()
                        .check.interaction({
                            state: 'states_registered_not_full',
                            reply: [
                                'Welcome to the Department of Health\'s ' +
                                'MomConnect. Choose an option:',
                                '1. Baby and pregnancy info (English only)',
                                '2. Get the full set of messages'
                            ].join('\n')
                        })
                        .check.user.properties({lang: 'tn'})
                        .run();
                });
            });

        });

        describe("when a user registered on the clinic line", function() {

            describe("tries to lodge a complaint", function() {
                it("should send them an sms with instructions, exit", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'en',
                                    is_registered: 'true',
                                    is_registered_by: 'clinic'
                                },
                            });
                        })
                        .setup.user.addr('27001')
                        .inputs(null, '3')
                        .check.interaction({
                            state: 'states_end_complaint',
                            reply: ('Thank you. We will send you a message ' +
                                'shortly with instructions on how to send ' +
                                'us your complaint.')
                        })
                        .check(function(api) {
                            var smses = _.where(api.outbound.store, {
                                endpoint: 'sms'
                            });
                            var sms = smses[0];
                            assert.equal(smses.length, 1);
                            assert.equal(sms.content,
                                "Please reply to this message with your complaint. If it " +
                                "relates to the service at the clinic, include the clinic or " +
                                "clinic worker name. Standard rates apply."
                            );
                        })
                        .check.reply.ends_session()
                        .run();
                });
            });

            describe("tries to send a compliment", function() {
                it("should send them an sms with instructions, exit", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'en',
                                    is_registered: 'true',
                                    is_registered_by: 'clinic'
                                },
                            });
                        })
                        .setup.user.addr('27001')
                        .inputs(null, '2')
                        .check.interaction({
                            state: 'states_end_compliment',
                            reply: ('Thank you. We will send you a message ' +
                                'shortly with instructions on how to send ' +
                                'us your compliment.')
                        })
                        .check(function(api) {
                            var smses = _.where(api.outbound.store, {
                                endpoint: 'sms'
                            });
                            var sms = smses[0];
                            assert.equal(smses.length, 1);
                            assert.equal(sms.content,
                                "Please reply to this message with your compliment. If it " +
                                "relates to the service at the clinic, include the clinic or " +
                                "clinic worker name. Standard rates apply."
                            );
                        })
                        .check.reply.ends_session()
                        .run();
                });
            });
        });

        describe("when the user selects english as language", function() {
            it("should ask if they want to register or get info", function() {
                return tester
                    .setup.user.addr('27001')
                    .inputs('start', '4')
                    .check.interaction({
                        state: 'states_register_info',
                        reply: [
                            'Welcome to the Department of Health\'s ' +
                            'MomConnect. Please select:',
                            '1. Register for messages',
                            '2. Baby and Pregnancy info (English only)'
                        ].join('\n')
                    })
                    .check.user.properties({lang: 'en'})
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.language_choice, 'en');
                        assert.equal(contact.extra.is_registered, 'false');
                    })
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.deepEqual(metrics['test.personal.percent_incomplete_registrations'].values, [60]);
                        assert.deepEqual(metrics['test.personal.percent_complete_registrations'].values, [40]);
                    })
                    .check(function(api) {
                        var kv_store = api.kv.store;
                        assert.equal(kv_store['test.personal.no_complete_registrations'], 2);
                        assert.equal(kv_store['test.personal.conversion_registrations'], undefined);
                    })
                    .run();
            });
        });

        // check other language since default is 'en'
        describe("when the user selects a different language", function() {
            it("should ask if they want to register or get info", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_language')
                    .input('2')
                    .check.interaction({
                        state: 'states_register_info',
                        reply: [
                            'Welcome to the Department of Health\'s ' +
                            'MomConnect. Please select:',
                            '1. Register for messages',
                            '2. Baby and Pregnancy info (English only)'
                        ].join('\n')
                    })
                    .check.user.properties({lang: 'xh'})
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.language_choice, 'xh');
                    })
                    .run();
            });
        });

        describe("when the user selects to register", function() {
            it("should ask for consent", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_register_info')
                    .inputs('1')
                    .check.interaction({
                        state: 'states_suspect_pregnancy',
                        reply: [
                            'MomConnect sends free support SMSs to ' +
                            'pregnant mothers. Are you or do you suspect ' +
                            'that you are pregnant?',
                            '1. Yes',
                            '2. No'
                        ].join('\n')
                    })
                    .run();
            });
            it("should ask if they suspect pregnancy", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_register_info')
                    .inputs('1','1')
                    .check.interaction({
                        state: 'states_consent',
                        reply: [
                            'To register we need to collect, store & use ' +
                            'your info. You may get messages on public ' +
                            'holidays & weekends. Do you consent?',
                            '1. Yes',
                            '2. No'
                        ].join('\n')
                    })
                    .run();
            });
            it("should tell them they cannot register", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_register_info')
                    .inputs('1','1','2')
                    .check.interaction({
                        state: 'states_consent_refused',
                        reply: 'Unfortunately without your consent, you ' +
                                'cannot register to MomConnect.'
                    })
                    .run();
            });
        });

        describe("when the user selects a language", function() {
            it("should put them in the language group", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_language')
                    .input('4')
                    .check.interaction({
                        state: 'states_register_info',
                        reply: [
                            'Welcome to the Department of Health\'s ' +
                            'MomConnect. Please select:',
                            '1. Register for messages',
                            '2. Baby and Pregnancy info (English only)'
                        ].join('\n')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.language_choice, 'en');
                    })
                    .run();
            });
        });

        describe("if the user does not suspect pregnancy", function() {
            it("should set pregnancy status, state service is for pregnant moms, exit", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_suspect_pregnancy')
                    .input('2')
                    .check.interaction({
                        state: 'states_end_not_pregnant',
                        reply: ('You have chosen not to receive MomConnect SMSs')
                    })
                    .check.reply.ends_session()
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.suspect_pregnancy, 'no');
                    })
                    .run();
            });
        });

        // start opt-in flow checks
        describe("if the user suspects pregnancy", function() {






            describe("if the user has not previously opted out", function() {
                it("should set pregnancy status, ask for their id type", function() {
                    return tester
                        .setup.user.addr('27001')
                        .setup.user.state('states_suspect_pregnancy')
                        .inputs('1','1')
                        .check.interaction({
                            state: 'states_id_type',
                            reply: [
                                'What kind of ID do you have?',
                                '1. SA ID',
                                '2. Passport',
                                '3. None'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.suspect_pregnancy, 'yes');
                            assert.equal(contact.extra.consent, 'true');
                        })
                        .run();
                });
            });

            describe("if the user previously opted out", function() {
                it("should ask to confirm opting back in", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27831112222',
                            });
                        })
                        .setup.user.addr('27831112222')
                        .setup.user.state('states_suspect_pregnancy')
                        .inputs('1','1')
                        .check.interaction({
                            state: 'states_opt_in',
                            reply: [(
                                'You have previously opted out of MomConnect ' +
                                'SMSs. Please confirm that you would like to ' +
                                'opt in to receive messages again?'),
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.suspect_pregnancy, 'yes');
                            assert.equal(contact.extra.consent, 'true');
                        })
                        .run();
                });
            });

            describe("if the user confirms opting back in", function() {
                it("should ask for the id type", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27831112222',
                            });
                        })
                        .setup.user.addr('27831112222')
                        .setup.user.state('states_opt_in')
                        .input('1')
                        .check.interaction({
                            state: 'states_id_type',
                            reply: [
                                'What kind of ID do you have?',
                                '1. SA ID',
                                '2. Passport',
                                '3. None'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var optouts = api.optout.optout_store;
                            assert.equal(optouts.length, 4);
                        })
                        .run();
                });
            });

            describe("if the user declines opting back in", function() {
                it("should tell them they cannot complete registration", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27831112222',
                            });
                        })
                        .setup.user.addr('27831112222')
                        .setup.user.state('states_opt_in')
                        .input('2')
                        .check.interaction({
                            state: 'states_stay_out',
                            reply: [(
                                'You have chosen not to receive MomConnect SMSs'),
                                '1. Main Menu'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.working_on, undefined);
                        })
                        .check(function(api) {
                            var optouts = api.optout.optout_store;
                            assert.equal(optouts.length, 5);
                        })
                        .run();
                });
            });

            describe("if the user selects Main Menu", function() {
                it("should take them back through states_start", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27831112222',
                            });
                        })
                        .setup.user.addr('27831112222')
                        .setup.user.state('states_stay_out')
                        .input('1')
                        .check.interaction({
                            state: 'states_language',
                            reply: [
                                'Welcome to the Department of Health\'s MomConnect. Choose your language:',
                                '1. isiZulu',
                                '2. isiXhosa',
                                '3. Afrikaans',
                                '4. English',
                                '5. Sesotho sa Leboa',
                                '6. Setswana',
                                '7. More'
                            ].join('\n')
                        })
                        .run();
                });
            });



        });

        describe("if the user selects SA ID (id type)", function() {
            it("should set their id type and ask for their id number", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_id_type')
                    .input('1')
                    .check.interaction({
                        state: 'states_sa_id',
                        reply: 'Please enter your SA ID number:'
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.id_type, 'sa_id');
                    })
                    .run();
            });
        });

        describe("after the user enters their ID number after '50", function() {
            it("should set their ID no, extract their DOB, thank them and exit", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                suspect_pregnancy: 'yes',
                                id_type: 'sa_id',
                                ussd_sessions: '1',
                                consent: 'true'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .setup.user.state('states_sa_id')
                    .input('5101015009088')
                    .check.interaction({
                        state: 'states_end_success',
                        reply: ('Congratulations on your pregnancy. You will now get free SMSs about MomConnect. You can register for the full set of FREE helpful messages at a clinic.')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.sa_id, '5101015009088');
                        assert.equal(contact.extra.birth_year, '1951');
                        assert.equal(contact.extra.birth_month, '01');
                        assert.equal(contact.extra.birth_day, '01');
                        assert.equal(contact.extra.dob, '1951-01-01');
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

        describe("after the user enters their ID number after '50 (test 2)", function() {
            it("should set their ID no, extract their DOB, thank them and exit", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                suspect_pregnancy: 'yes',
                                id_type: 'sa_id',
                                ussd_sessions: '1',
                                consent: 'true'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .setup.user.state('states_sa_id')
                    .input('5101025009086')
                    .check.interaction({
                        state: 'states_end_success',
                        reply: ('Congratulations on your pregnancy. You will now get free SMSs about MomConnect. You can register for the full set of FREE helpful messages at a clinic.')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.sa_id, '5101025009086');
                        assert.equal(contact.extra.birth_year, '1951');
                        assert.equal(contact.extra.birth_month, '01');
                        assert.equal(contact.extra.birth_day, '02');
                        assert.equal(contact.extra.dob, '1951-01-02');
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

        describe("after the user enters their ID number before '50", function() {
            it("should set their ID no, extract their DOB", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                suspect_pregnancy: 'yes',
                                id_type: 'sa_id',
                                ussd_sessions: '1',
                                consent: 'true'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .setup.user.state('states_sa_id')
                    .input('2012315678097')
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.sa_id, '2012315678097');
                        assert.equal(contact.extra.dob, '2020-12-31');
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

        describe("after the user enters their ID number on '50", function() {
            it("should set their ID no, extract their DOB", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                suspect_pregnancy: 'yes',
                                id_type: 'sa_id',
                                ussd_sessions: '1',
                                consent: 'true'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .setup.user.state('states_sa_id')
                    .input('5002285000007')
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.sa_id, '5002285000007');
                        assert.equal(contact.extra.dob, '1950-02-28');
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

        describe("after the user enters their ID number incorrectly", function() {
            it("should not save their id, ask them to try again", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_sa_id')
                    .input('1234015009087')
                    .check.interaction({
                        state: 'states_sa_id',
                        reply: 'Sorry, your ID number did not validate. ' +
                          'Please reenter your SA ID number:'
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.sa_id, undefined);
                    })
                    .run();
            });
        });


        describe("if the user selects Passport (id type)", function() {
            it("should save their id type & ask for their country of origin", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_id_type')
                    .input('2')
                    .check.interaction({
                        state: 'states_passport_origin',
                        reply: ['What is the country of origin of the ' +
                            'passport?',
                            '1. Zimbabwe',
                            '2. Mozambique',
                            '3. Malawi',
                            '4. Nigeria',
                            '5. DRC',
                            '6. Somalia',
                            '7. Other'
                        ].join('\n')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.id_type, 'passport');
                    })
                    .run();
            });
        });

        describe("after the user selects passport country", function() {
            it("should set their country & ask for their passport number", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_passport_origin')
                    .input('1')
                    .check.interaction({
                        state: 'states_passport_no',
                        reply: 'Please enter your Passport number:'
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.passport_origin, 'zw');
                    })
                    .run();
            });
        });

        describe("after the user enters their passport number", function() {
            it("should set their passport number, thank them and exit", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                suspect_pregnancy: 'yes',
                                id_type: 'passport',
                                passport_origin: 'zw',
                                ussd_sessions: '1',
                                consent: 'true'
                            },
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                        });
                    })
                    .setup.user.addr('27001')
                    .setup.user.state('states_passport_no')
                    .input('12345')
                    .check.interaction({
                        state: 'states_end_success',
                        reply: ('Congratulations on your pregnancy. You will now get free SMSs about MomConnect. You can register for the full set of FREE helpful messages at a clinic.')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.passport_no, '12345');
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

        describe("if the user enters their passport incorrectly (non alpha-numeric)", function() {
            it("should ask for their passport number again", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_passport_no')
                    .input('algeria 1234')
                    .check.interaction({
                        state: 'states_passport_no',
                        reply: ('There was an error in your entry. Please ' +
                        'carefully enter your passport number again.')
                    })
                    .run();
            });
        });

        describe("if the user enters their passport incorrectly (too short)", function() {
            it("should ask for their passport number again", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_passport_no')
                    .input('1234')
                    .check.interaction({
                        state: 'states_passport_no',
                        reply: ('There was an error in your entry. Please ' +
                        'carefully enter your passport number again.')
                    })
                    .run();
            });
        });

        describe("if the user selects None (id type)", function() {
            it("should set id type, ask for their birth year", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_id_type')
                    .input('3')
                    .check.interaction({
                        state: 'states_birth_year',
                        reply: ('Since you don\'t have an ID or passport, ' +
                            'please enter the year that you were born (for ' +
                            'example: 1981)')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.id_type, 'none');
                        assert.equal(contact.extra.last_stage, 'states_birth_year');
                    })
                    .run();
            });
        });

        describe("after the user enters their birth year", function() {
            it("should ask for their birth month", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_birth_year')
                    .input('1981')
                    .check.interaction({
                        state: 'states_birth_month',
                        reply: ['Please enter the month that you were born.',
                            '1. Jan',
                            '2. Feb',
                            '3. Mar',
                            '4. Apr',
                            '5. May',
                            '6. Jun',
                            '7. Jul',
                            '8. Aug',
                            '9. Sep',
                            '10. Oct',
                            '11. Nov',
                            '12. Dec'
                        ].join('\n')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.birth_year, '1981');
                    })
                    .run();
            });
        });

        describe("after the user enters their birth year incorrectly", function() {
            it("should not save birth year, ask for their birth year again", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_birth_year')
                    .input('Nineteen Eighty One')
                    .check.interaction({
                        state: 'states_birth_year',
                        reply: ('There was an error in your entry. Please ' +
                        'carefully enter your year of birth again (for ' +
                        'example: 2001)')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.birth_year, undefined);
                    })
                    .run();
            });

            it("too young - should ask for their birth year again", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_birth_year')
                    .input('2013')
                    .check.interaction({
                        state: 'states_birth_year',
                        reply: 'There was an error in your entry. Please ' +
                        'carefully enter your year of birth again (for ' +
                        'example: 2001)'
                    })
                    .run();
            });
        });

        describe("after the user enters their birth month", function() {
            it("should set their birth year, ask for their birth day", function() {
                return tester
                    .setup.user.addr('27001')
                    .setup.user.state('states_birth_month')
                    .input('1')
                    .check.interaction({
                        state: 'states_birth_day',
                        reply: ('Please enter the day that you were born ' +
                            '(for example: 14).')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.birth_month, '01');
                    })
                    .run();
            });
        });



        describe("after the user enters their birth day", function() {

            describe("if the date is not a real date", function() {
                it("should go to error state, ask them to continue", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.answers({
                            'states_birth_year': '1981',
                            'states_birth_month': '02'
                        })
                        .setup.user.state('states_birth_day')
                        .input('29')
                        .check.interaction({
                            state: 'states_invalid_dob',
                            reply: [
                                'The date you entered (1981-02-29) is not a ' +
                                'real date. Please try again.',
                                '1. Continue'
                            ].join('\n')
                        })
                        .run();
                });

                it("should take them back to birth year if they continue", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.answers({
                            'states_birth_year': '1981',
                            'states_birth_month': '02'
                        })
                        .setup.user.state('states_birth_day')
                        .inputs('29', '1')
                        .check.interaction({
                            state: 'states_birth_year',
                            reply: 'Since you don\'t have an ID or passport, ' +
                                    'please enter the year that you were born (for ' +
                                    'example: 1981)'
                        })
                        .run();
                });
            });

            describe("after the user enters their birth day incorrectly", function() {
                it("should not save birth day, ask them their birth day again", function() {
                    return tester
                        .setup.user.addr('27001')
                        .setup.user.state('states_birth_day')
                        .input('fourteen')
                        .check.interaction({
                            state: 'states_birth_day',
                            reply: ('There was an error in your entry. Please ' +
                            'carefully enter your day of birth again (for ' +
                            'example: 8)')
                        })
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.birth_day, undefined);
                        })
                        .run();
                });
            });

            describe("if the date validates", function() {
                it("should save birth day, thank them and exit", function() {
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
                                    ussd_sessions: '5',
                                    consent: 'true'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.addr('27001')
                        .setup.user.answers({
                            'states_birth_year': '1981',
                            'states_birth_month': '01'
                        })
                        .setup.user.state('states_birth_day')
                        .input('1')
                        .check.interaction({
                            state: 'states_end_success',
                            reply: ('Congratulations on your pregnancy. You will now get free SMSs about MomConnect. You can register for the full set of FREE helpful messages at a clinic.')
                        })
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.birth_day, '01');
                            assert.equal(contact.extra.dob, '1981-01-01');
                            assert.equal(contact.extra.ussd_sessions, '0');
                            assert.equal(contact.extra.last_stage, 'states_end_success');
                            assert.equal(contact.extra.metric_sessions_to_register, '5');
                            assert.equal(contact.extra.is_registered, 'true');
                            assert.equal(contact.extra.is_registered_by, 'personal');
                        })
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.personal.avg.sessions_to_register'].values, [5]);
                            assert.deepEqual(metrics['test.personal.percent_incomplete_registrations'].values, [25]);
                            assert.deepEqual(metrics['test.personal.percent_complete_registrations'].values, [75]);
                        })
                        .check(function(api) {
                            var kv_store = api.kv.store;
                            assert.equal(kv_store['test.personal.no_complete_registrations'], 3);
                            assert.equal(kv_store['test.personal.conversion_registrations'], 1);
                        })
                        .check(function(api) {
                            var smses = _.where(api.outbound.store, {
                                endpoint: 'sms'
                            });
                            var sms = smses[0];
                            assert.equal(smses.length,1);
                            assert.equal(sms.content,
                                "Congratulations on your pregnancy. You will now get free SMSs about MomConnect. " +
                                "You can register for the full set of FREE helpful messages at a clinic."
                            );
                            assert.equal(sms.to_addr,'27001');
                        })
                        .check.reply.ends_session()
                        .run();
                });
            });
        });

        describe("when a session is terminated", function() {
            describe("when they have not completed registration",function() {
                describe("when they have already been sent a registration sms",function() {
                    it("should not send them an sms",function() {
                        return tester
                            .setup(function(api) {
                                api.contacts.add( {
                                    msisdn: '+273444',
                                    extra : {
                                        redial_sms_sent: 'true'
                                    }
                                });
                            })
                            .setup.user.addr('273444')
                            .setup.user.state('states_language')
                            .input('1')
                            .input.session_event('close')
                            .check(function(api) {
                                var smses = _.where(api.outbound.store, {
                                    endpoint: 'sms'
                                });
                                assert.equal(smses.length,0);
                            }).run();
                    });
                });

                describe("when they have not been sent a registration sms",function() {
                    it("should send them an sms to dial back in",function() {
                        return tester
                            .setup(function(api) {
                                api.contacts.add( {
                                    msisdn: '+273323',
                                    extra : {}
                                });
                            })
                            .setup.user.addr('273323')
                            .setup.user.state('states_language')
                            .input(1)
                            .input.session_event('close')
                            .check(function(api) {
                                var smses = _.where(api.outbound.store, {
                                    endpoint: 'sms'
                                });
                                var sms = smses[0];
                                assert.equal(smses.length,1);
                                assert.equal(sms.content,
                                    "Your session timed out. Please dial back in to *134*550# to complete the pregnancy registration so that you can receive messages."
                                );
                                assert.equal(sms.to_addr,'273323');
                            }).run();
                    });
                });
            });

            describe("when they are browsing faq",function() {
                it("should not send them an sms",function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+273444',
                                extra : {
                                    redial_sms_sent: 'false'
                                }
                            });
                        })
                        .setup.user.addr('273444')
                        .setup.user.state('states_faq_topics')
                        .input('1')
                        .input.session_event('close')
                        .check(function(api) {
                            var smses = _.where(api.outbound.store, {
                                endpoint: 'sms'
                            });
                            assert.equal(smses.length,0);
                        }).run();
                });
            });
        });


        // Navigation to FAQ
        describe("When a clinic-registered user navigates to FAQ", function() {
            it("should ask to choose topic", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                is_registered: 'true',
                                is_registered_by: 'clinic'
                            },
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs(null, '1')
                    .check.interaction({
                        state: 'states_faq_topics',
                        reply: [
                            'We have gathered information in the areas below. Please select:',
                            '1. Pregnancy',
                            '2. Labour',
                            '3. Baby',
                            '4. HIV',
                            '5. Other Diseases',
                            '6. Support'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("When a chw-registered user navigates to FAQ", function() {
            it("should ask to choose topic", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'en',
                                is_registered: 'true',
                                is_registered_by: 'chw'
                            },
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs(null, '1')
                    .check.interaction({
                        state: 'states_faq_topics',
                        reply: [
                            'We have gathered information in the areas below. Please select:',
                            '1. Pregnancy',
                            '2. Labour',
                            '3. Baby',
                            '4. HIV',
                            '5. Other Diseases',
                            '6. Support'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("When an unregistered user navigates to FAQ", function() {
            it("should ask to choose topic", function() {
                return tester
                    .setup.user.addr('27001')
                    .inputs(null, '1', '2')
                    .check.interaction({
                        state: 'states_faq_topics',
                        reply: [
                            'We have gathered information in the areas below. Please select:',
                            '1. Pregnancy',
                            '2. Labour',
                            '3. Baby',
                            '4. HIV',
                            '5. Other Diseases',
                            '6. Support'
                        ].join('\n')
                    })
                    .run();
            });
        });


        // FAQ browser tests
        describe("When the user reaches faq topics state", function() {
            it("should welcome and ask to choose topic", function() {
                return tester
                    .setup.user.state('states_registered_full')
                    .input('1')
                    .check.interaction({
                        state: 'states_faq_topics',
                        reply: [
                            'We have gathered information in the areas below. Please select:',
                            '1. Pregnancy',
                            '2. Labour',
                            '3. Baby',
                            '4. HIV',
                            '5. Other Diseases',
                            '6. Support'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("When the user chooses topic 881", function() {
            it("should list first page of questions in topic 881", function() {
                return tester
                    .setup.user.state('states_faq_topics')
                    .input('1')
                    .check.interaction({
                        state: 'states_faq_questions',
                        reply: [
                            'Please select one:',
                            '1. Can I order more than one box at a time?',
                            '2. What happens if I fall in love with one particular coffee?',
                            '3. More'
                        ].join('\n')
                    })
                    .run();
            });

            it("should fire topics metric once", function() {
                return tester
                    .setup.user.state('states_faq_topics')
                    .input('1')
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.deepEqual(metrics['test.faq_view_topic.881'].values, [1]);
                    })
                    .run();
            });
        });

        describe("When the user chooses topic 881 and then 3. More", function() {
            it("should list second page of questions in topic 881", function() {
                return tester
                    .setup.user.state('states_faq_topics')
                    .inputs('1', '3')
                    .check.interaction({
                        state: 'states_faq_questions',
                        reply: [
                            'Please select one:',
                            '1. What happens if the FAQ answer is really long? (too long)',
                            '2. More',
                            '3. Back'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("When the user chooses topic 881, then 3. More, then 2. More", function() {
            it("should list third page of questions in topic 881", function() {
                return tester
                    .setup.user.state('states_faq_topics')
                    .inputs('1', '3', '2')
                    .check.interaction({
                        state: 'states_faq_questions',
                        reply: [
                            'Please select one:',
                            '1. What happens if I realise the amount of coffee I\'ve ordered doesn\'t suit?',
                            '2. Back'
                        ].join('\n')
                    })
                    .run();
            });

            it("should fire topics metric once, should not fire questions metric", function() {
                return tester
                    .setup.user.state('states_faq_topics')
                    .inputs('1', '3', '2')
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.deepEqual(metrics['test.faq_view_topic.881'].values, [1]);
                        assert.equal(metrics['test.faq_view_question'], undefined);
                    })
                    .run();
            });
        });

        describe("When the user chooses question 635", function() {
            it("should show answer to question 635", function() {
                return tester
                    .setup.user.state('states_faq_questions')
                    .setup.user.answers({'states_faq_topics': '881'})
                    .input('1')
                    .check.interaction({
                        state: 'states_faq_answers',
                        reply: [
                            'If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the',
                            '1. More',
                            '2. Send to me by SMS'
                        ].join('\n')
                    })
                    .run();
            });
        });

        // test long faq answer splitting
        describe("When the user chooses question 999", function() {
            it("should show the first part of the answer of 999", function() {
                return tester
                    .setup.user.state('states_faq_questions')
                    .setup.user.answers({'states_faq_topics': '881'})
                    .inputs('3', '1')
                    .check.interaction({
                        state: 'states_faq_answers',
                        reply: [
                            'It will be split into multiple pages on a bookletstate, showing content on different screens as the text gets too long. To',
                            '1. More',
                            '2. Send to me by SMS'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("When the user chooses a question", function() {
            it("should fire view question metric once", function() {
                return tester
                    .setup.user.state('states_faq_questions')
                    .setup.user.answers({'states_faq_topics': '881'})
                    .inputs('3', '1')
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.deepEqual(metrics['test.faq_view_question'].values, [1]);
                    })
                    .run();
            });
        });

        describe("When the user times out and logs back in", function() {
            it("should not fire a faq metric", function() {
                return tester
                    .setup.user.state('states_faq_questions')
                    .setup.user.answers({'states_faq_topics': '881'})
                    .input.session_event('new')
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.equal(metrics['test.faq_view_question'], undefined);
                    })
                    .run();
            });
        });

        describe("When the user chooses question 999 and then 2. Next", function() {
            it("should show the second part of the answer to 999", function() {
                return tester
                    .setup.user.state('states_faq_questions')
                    .setup.user.answers({'states_faq_topics': '881'})
                    .inputs('3', '1', '1')
                    .check.interaction({
                        state: 'states_faq_answers',
                        reply: [
                            'illustrate this, this super long response has been faked. This should be split over at least 2 screens just because we want',
                            '1. More',
                            '2. Back',
                            '3. Send to me by SMS'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("When the user chooses question 999 and then 2. Next twice", function() {
            it("should show the third part of the answer to 999", function() {
                return tester
                    .setup.user.state('states_faq_questions')
                    .setup.user.answers({'states_faq_topics': '881'})
                    .inputs('3', '1', '1', '1')
                    .check.interaction({
                        state: 'states_faq_answers',
                        reply: ['to test properly. Let\'s see.',
                            '1. Back',
                            '2. Send to me by SMS'
                        ].join('\n')
                    })
                    .run();
            });

            it("should fire view questions metric once", function() {
                return tester
                    .setup.user.state('states_faq_questions')
                    .setup.user.answers({'states_faq_topics': '881'})
                    .inputs('3', '1', '1', '1')
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.deepEqual(metrics['test.faq_view_question'].values, [1]);
                    })
                    .run();
            });
        });

        describe("When the user chooses to Send by SMS", function() {
            it("should thank the user, send sms, and exit", function() {
                return tester
                    .setup.user.state('states_faq_questions')
                    .setup.user.answers({'states_faq_topics': '881'})
                    .inputs('3', '1', '2')
                    .check.interaction({
                        state: 'states_faq_end',
                        reply: ('Thank you. Your SMS will be delivered shortly.')
                    })
                    .check(function(api) {
                        var smses = _.where(api.outbound.store, {
                            endpoint: 'sms'
                        });
                        var sms = smses[0];
                        assert.equal(smses.length, 1);
                        assert.equal(sms.content,
                            "It will be split into multiple pages on a bookletstate, showing " +
                            "content on different screens as the text gets too long. To " +
                            "illustrate this, this super long response has been faked. This " +
                            "should be split over at least 2 screens just because we want to " +
                            "test properly. Let\'s see."
                        );
                    })
                    .check.reply.ends_session()
                    .run();
            });

            it("should fire faq sent via sms metric", function() {
                return tester
                    .setup.user.state('states_faq_questions')
                    .setup.user.answers({'states_faq_topics': '881'})
                    .inputs('3', '1', '2')
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.deepEqual(metrics['test.faq_sent_via_sms'].values, [1]);
                    })
                    .run();
            });

            it('should use a delegator state for sending the SMS', function () {
                return tester
                    .setup.user.state('states_faq_sms_send', {
                        creator_opts: {
                            answer: 'foo'
                        }
                    })
                    .input('hi')
                    .check.interaction({
                        state: 'states_faq_end',
                        reply: ('Thank you. Your SMS will be delivered shortly.')
                    })
                    .check(function(api) {
                        var smses = _.where(api.outbound.store, {
                            endpoint: 'sms'
                        });
                        var sms = smses[0];
                        assert.equal(smses.length, 1);
                        assert.equal(sms.content, 'foo');
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

        describe("When the user returns after completing a session", function () {
            it("should *not* send them the previous SMS again", function () {
                return tester
                    .setup.user.state('states_faq_end')
                    .check.interaction({
                        state: 'states_language',
                        reply: [
                                'Welcome to the Department of Health\'s MomConnect. Choose your language:',
                                '1. isiZulu',
                                '2. isiXhosa',
                                '3. Afrikaans',
                                '4. English',
                                '5. Sesotho sa Leboa',
                                '6. Setswana',
                                '7. More'
                            ].join('\n')
                    })
                    .check(function(api) {
                        var smses = _.where(api.outbound.store, {
                            endpoint: 'sms'
                        });
                        assert.equal(smses.length, 0, 'It should not send the SMS!');
                    })
                    .run();
            });

            it("should *not* fire sent by sms metric again", function () {
                return tester
                    .setup.user.state('states_faq_end')
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.deepEqual(metrics['test.faq_sent_via_sms'], undefined);
                    })
                    .run();
            });
        });

        describe('Test translations', function() {
            describe('Afrikaans', function() {
                it('states_suspect_pregnancy', function() {
                    return tester
                        .setup.user.addr('27001')
                        .setup.config({'translation.af': translation_af})
                        .setup.user.lang('af')
                        .setup.user.state('states_suspect_pregnancy')
                        .input('invalid input')
                        .check.interaction({
                            state: 'states_suspect_pregnancy',
                            reply: [
                                "MomConnect stuur gratis SMSe uit om swanger " +
                                "moeders te ondersteun. Is jy of vermoed jy " +
                                "dat jy swanger is?",
                                '1. Ja',
                                '2. Nee'
                            ].join('\n')
                        })
                        .run();
                });

                // intentionallly skipped;
                // errors in Afrikaans heading and options text
                it.skip('states_id_type', function() {
                    return tester
                        .setup.user.addr('27001')
                        .setup.config({'translation.af': translation_af})
                        .setup.user.lang('af')
                        .setup.user.state('states_id_type')
                        .input('invalid input')
                        .check.interaction({
                            state: 'states_id_type',
                            reply: [
                                "Ons benodig jou inligting. Dit is privaat & " +
                                "sal slegs gebruik word om jou te help as jy " +
                                "na 'n kliniek  gaan.",
                                '1. SA ID',
                                '2. Passport',
                                '3. Geen'
                            ].join('\n')
                        })
                        .run();
                });
            });
        });


    });
});


describe("app", function() {
    describe("for personal use when the detailed data collection and FAQ browsing is turned off", function() {
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
                    api.resources.add(new DummyMessageStoreResource());
                    api.resources.add(new DummyOptoutResource());
                    api.resources.attach(api);
                    api.groups.add(
                        {
                            key: 'en_key',
                            name: 'en',
                        }
                    );
                    api.groups.add(
                        {
                            key: 'xh_key',
                            name: 'xh',
                        }
                    );
                })
                .setup.char_limit(182)
                .setup.config.app({
                    name: 'personal',
                    testing: 'true',
                    env: 'test',
                    metric_store: 'test_metric_store',
                    endpoints: {
                        "sms": {"delivery_class": "sms"}
                    },
                    channel: "*134*550#",
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
                    snappy: {
                        "endpoint": "https://app.besnappy.com/api/v1/",
                        "username": "980d2423-292b-4c34-be81-c74784b9e99a",
                        "account_id": "1",
                        "default_faq": "1"
                    },
                    faq_enabled: false,
                    detailed_data_collection: false
                })
                .setup(function(api) {
                    api.kv.store['test.clinic.unique_users'] = 0;
                    api.kv.store['test.chw.unique_users'] = 0;
                    api.kv.store['test.personal.unique_users'] = 0;
                    api.kv.store['test.personal.no_complete_registrations'] = 2;
                    api.kv.store['test.personal.no_incomplete_registrations'] = 2;
                })
                .setup(function(api) {
                    api.metrics.stores = {'test_metric_store': {}};
                })

                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                });
        });

        describe("when the user has no previous registration", function() {

            describe("when they start a new session", function() {
                it("should ask for their preferred language", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // states_start
                        )
                        // check navigation
                        .check.interaction({
                            state: 'states_language',
                            reply: [
                                'Welcome to the Department of Health\'s MomConnect. Choose your language:',
                                '1. isiZulu',
                                '2. isiXhosa',
                                '3. Afrikaans',
                                '4. English',
                                '5. Sesotho sa Leboa',
                                '6. Setswana',
                                '7. More'
                            ].join('\n')
                        })
                        // check extras
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.ussd_sessions, '1');
                            assert.equal(contact.extra.metric_sum_sessions, '1');
                            assert.equal(contact.extra.last_stage, 'states_language');
                        })
                        // check metrics
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.sum.sessions'].values, [1]);
                        })
                        .run();
                });
            });

            describe("when the user selects english as language", function() {
                it("should ask for consent", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // states_start
                            , '4'  // states_language
                        )
                        // check navigation
                        .check.interaction({
                            state: 'states_suspect_pregnancy',
                            reply: [
                                'MomConnect sends free support SMSs to ' +
                                'pregnant mothers. Are you or do you suspect ' +
                                'that you are pregnant?',
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        .run();
                });
                it("should ask if they suspect pregnancy", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // states_start
                            , '4'  // states_language
                            , '1'  // states_suspect_pregnancy - yes
                        )
                        // check navigation
                        .check.interaction({
                            state: 'states_consent',
                            reply: [
                                'To register we need to collect, store & use ' +
                                'your info. You may get messages on public ' +
                                'holidays & weekends. Do you consent?',
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        .run();
                });
                it("should tell them they cannot register", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // states_start
                            , '4'  // states_language
                            , '1'  // states_suspect_pregnancy
                            , '2'  // states_consent - no
                        )
                        .check.interaction({
                            state: 'states_consent_refused',
                            reply: 'Unfortunately without your consent, you ' +
                                    'cannot register to MomConnect.'
                        })
                        .run();
                });
            });

            describe("if the user does not suspect pregnancy", function() {
                it("should set pregnancy status, state service is for pregnant moms, exit", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // states_start
                            , '4'  // states_language
                            , '2'  // states_suspect_pregnancy
                        )
                        // check navigation
                        .check.interaction({
                            state: 'states_end_not_pregnant',
                            reply: ('You have chosen not to receive MomConnect SMSs')
                        })
                        // check extras
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.suspect_pregnancy, 'no');
                        })
                        // check session ends
                        .check.reply.ends_session()
                        .run();
                });
            });

            describe("after the confirms pregnancy", function() {
                it("should save their data, thank them and exit", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // states_start
                            , '4'  // states_language
                            , '1'  // states_consent - yes
                            , '1'  // states_suspect_pregnancy
                        )
                        // check navigation
                        .check.interaction({
                            state: 'states_end_success',
                            reply: ('Congratulations on your pregnancy. You will now get free SMSs about MomConnect. You can register for the full set of FREE helpful messages at a clinic.')
                        })
                        // check extras
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.language_choice, 'en');
                            assert.equal(contact.extra.consent, 'true');
                        })
                        // check session ends
                        .check.reply.ends_session()
                        .run();
                });
            });

            describe("if the user redials after timeout", function() {
                it("should ask if they want to continue", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001'
                            });
                        })
                        .setup.user.addr("27001")
                        .inputs(
                            {session_event: 'new'}  // states_start
                            , {session_event: 'new'}  // simulate timeout and redial
                        )
                        // check navigation
                        .check.interaction({
                            state: 'states_timed_out',
                            reply: [
                                'Welcome back. Please select an option:',
                                '1. Continue signing up for messages',
                                '2. Main menu'
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("if the user redials after timing out on timeout state", function() {
                it("should ask if they want to continue", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001'
                            });
                        })
                        .setup.user.addr("27001")
                        .inputs(
                            {session_event: 'new'}  // states_start
                            , '4'  // states_language
                            , {session_event: 'new'}  // simulate timeout and redial
                        )
                        // check navigation
                        .check.interaction({
                            state: 'states_timed_out',
                            reply: [
                                'Welcome back. Please select an option:',
                                '1. Continue signing up for messages',
                                '2. Main menu'
                            ].join('\n')
                        })
                        .run();
                });
            });
        });

        describe("when the user has previously registered on clinic", function() {
            describe("when the user has active subscriptions", function() {
                it("should prompt for compliment / complaint in their language", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27821234444',
                                extra : {
                                    language_choice: 'xh',
                                    is_registered: 'true',
                                    is_registered_by: 'clinic'
                                },
                            });
                        })
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // states_start
                        )
                        // check navigation
                        .check.interaction({
                            state: 'states_registered_full',
                            reply: [
                                'Welcome to the Department of Health\'s ' +
                                'MomConnect. Please choose an option:',
                                '1. Send us a compliment',
                                '2. Send us a complaint'
                            ].join('\n')
                        })
                        // check language gets set
                        .check.user.properties({lang: 'xh'})
                        .run();
                });

                it("should send help them with complaint submission if they so choose", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27821234444',
                                extra : {
                                    language_choice: 'xh',
                                    is_registered: 'true',
                                    is_registered_by: 'clinic'
                                },
                            });
                        })
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // states_start
                            , '2'  // states_registered_full
                        )
                        // check navigation
                        .check.interaction({
                            state: 'states_end_complaint',
                            reply: [
                                'Thank you. We will send you a message ' +
                                'shortly with instructions on how to send us ' +
                                'your complaint.'
                            ].join('\n')
                        })
                        // check sms is sent
                        .check(function(api) {
                            var smses = _.where(api.outbound.store, {
                                endpoint: 'sms'
                            });
                            var sms = smses[0];
                            assert.equal(smses.length, 1);
                            assert.equal(sms.content,
                                "Please reply to this message with your complaint. If it " +
                                "relates to the service at the clinic, include the clinic or " +
                                "clinic worker name. Standard rates apply."
                            );
                        })
                        // check session ends
                        .check.reply.ends_session()
                        .run();
                });
            });

            describe("when the user has no active subscriptions", function() {
                it("should ask for consent", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27821235555',
                                extra : {
                                    language_choice: 'xh',
                                    is_registered: 'true',
                                    is_registered_by: 'clinic'
                                },
                            });
                        })
                        .setup.user.addr('27821235555')
                        .inputs(
                            {session_event: 'new'}  // states_start
                        )
                        // check navigation
                        .check.interaction({
                            state: 'states_suspect_pregnancy',
                            reply: [
                                'MomConnect sends free support SMSs to ' +
                                'pregnant mothers. Are you or do you suspect ' +
                                'that you are pregnant?',
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        // check language gets set
                        .check.user.properties({lang: 'xh'})
                        .run();
                });
                it("should ask in their language if they want to register or get info", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27821235555',
                                extra : {
                                    language_choice: 'xh',
                                    is_registered: 'true',
                                    is_registered_by: 'clinic'
                                },
                            });
                        })
                        .setup.user.addr('27821235555')
                        .inputs(
                            {session_event: 'new'}  // states_start
                            , '1'  // states_suspect_pregnancy - yes
                        )
                        // check navigation
                        .check.interaction({
                            state: 'states_consent',
                            reply: [
                                'To register we need to collect, store & use ' +
                                'your info. You may get messages on public ' +
                                'holidays & weekends. Do you consent?',
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        // check language gets set
                        .check.user.properties({lang: 'xh'})
                        .run();
                });
                it("should tell them they cannot register", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27821235555',
                                extra : {
                                    language_choice: 'xh',
                                    is_registered: 'true',
                                    is_registered_by: 'clinic'
                                },
                            });
                        })
                        .setup.user.addr('27821235555')
                        .inputs(
                            {session_event: 'new'}  // states_start
                            , '1'  // states_suspect_pregnancy
                            , '2'  // states_consent - no
                        )
                        .check.interaction({
                            state: 'states_consent_refused',
                            reply: 'Unfortunately without your consent, you ' +
                                    'cannot register to MomConnect.'
                        })
                        .run();
                });
            });
        });

        describe("when the user has previously registered on chw", function() {
            it("should provide choice for getting full messages in their language", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'xh',
                                is_registered: 'true',
                                is_registered_by: 'chw'
                            },
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs(
                        {session_event: 'new'}  // states_start
                    )
                    // check navigation
                    .check.interaction({
                        state: 'states_registered_not_full',
                        reply: [
                            'Welcome to the Department of Health\'s ' +
                            'MomConnect. Choose an option:',
                            '1. Get the full set of messages'
                        ].join('\n')
                    })
                    // check language gets set
                    .check.user.properties({lang: 'xh'})
                    .run();
            });

            it("should tell them to go to the clinic if they want full msgs", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                is_registered: 'true',
                                is_registered_by: 'chw'
                            },
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs(
                        {session_event: 'new'}  // states_start
                        , '1'  // states_registerd_not_full
                    )
                    .check.interaction({
                        state: 'states_end_go_clinic',
                        reply: [
                            'To register for the full set of MomConnect ' +
                            'messages, please visit your nearest clinic.'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("when the user has previously registered on public", function() {
            it("should provide choice for getting full messages in their language", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                language_choice: 'xh',
                                is_registered: 'true',
                                is_registered_by: 'personal'
                            },
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs(
                        {session_event: 'new'}  // states_start
                    )
                    // check navigation
                    .check.interaction({
                        state: 'states_registered_not_full',
                        reply: [
                            'Welcome to the Department of Health\'s ' +
                            'MomConnect. Choose an option:',
                            '1. Get the full set of messages'
                        ].join('\n')
                    })
                    // check language gets set
                    .check.user.properties({lang: 'xh'})
                    .run();
            });

            it("should tell them to go to the clinic if they want full msgs", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                is_registered: 'true',
                                is_registered_by: 'personal'
                            },
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs(
                        {session_event: 'new'}  // states_start
                        , '1'  // states_registerd_not_full
                    )
                    .check.interaction({
                        state: 'states_end_go_clinic',
                        reply: [
                            'To register for the full set of MomConnect ' +
                            'messages, please visit your nearest clinic.'
                        ].join('\n')
                    })
                    .run();
            });
        });
    });
});
