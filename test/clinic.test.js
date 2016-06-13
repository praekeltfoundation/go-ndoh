var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');
var _ = require('lodash');
var messagestore = require('./messagestore');
var optoutstore = require('./optoutstore');
var DummyMessageStoreResource = messagestore.DummyMessageStoreResource;
var DummyOptoutResource = optoutstore.DummyOptoutResource;


describe("utils", function() {
    describe("for clinic use", function() {
        it('should parse single digit days correctly', function(done) {
            assert.equal(go.utils.double_digit_day('1'), '01');
            assert.equal(go.utils.double_digit_day('01'), '01');
            assert.equal(go.utils.double_digit_day('21'), '21');
            assert.equal(go.utils.double_digit_day('00027'), '27');
            done();
        });
        it('should normalise msisdn numbers logically', function(done) {
            assert.equal(go.utils.normalize_msisdn('0821112222', '27'), '+27821112222');
            assert.equal(go.utils.normalize_msisdn('+27821112222', '27'), '+27821112222');
            assert.equal(go.utils.normalize_msisdn('0027821112222', '27'), '+27821112222');
            assert.equal(go.utils.normalize_msisdn('27821112222', '27'), '+27821112222');
            done();
        });
        it('should reject invalid numbers', function(done) {
            assert.equal(go.utils.check_valid_phone_number('0821112222'), true);
            assert.equal(go.utils.check_valid_phone_number('821112222'), false);
            assert.equal(go.utils.check_valid_phone_number('082 111 2222'), false);
            assert.equal(go.utils.check_valid_phone_number('27 82 111 2222'), false);
            assert.equal(go.utils.check_valid_phone_number('082111222'), false);
            assert.equal(go.utils.check_valid_phone_number('21112222'), false);
            assert.equal(go.utils.check_valid_phone_number('27821112222'), false);
            assert.equal(go.utils.check_valid_phone_number('2721112222'), false);
            done();
        });
    });
});

describe("app", function() {
    describe("for clinic use", function() {
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
                    api.groups.add( {
                        key: 'en_key',
                        name: 'en',
                    });
                })
                .setup.char_limit(182)
                .setup.config.app({
                    name: 'clinic',
                    env: 'test',
                    metric_store: 'test_metric_store',
                    testing: 'true',
                    testing_today: 'April 4, 2014 07:07:07',
                    endpoints: {
                        "sms": {"delivery_class": "sms"}
                    },
                    channel: "*120*550*2#",
                    public_channel: "*120*550#",
                    optout_channel: "*120*550*1#",
                    jembi: {
                        username: 'foo',
                        password: 'bar',
                        url: 'http://test/v2/',
                        url_json: 'http://test/v2/json/'
                    },
                    clinic_codes: ['123456', '234567'],
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
                    }
                })
                .setup(function(api) {
                    api.kv.store['test.clinic.unique_users'] = 0;
                    api.kv.store['test.chw.unique_users'] = 0;
                    api.kv.store['test.personal.unique_users'] = 0;
                    api.kv.store['test.clinic.no_complete_registrations'] = 2;
                    api.kv.store['test.clinic.no_incomplete_registrations'] = 2;
                    api.kv.store['test.chw.conversion_registrations'] = 3;
                    api.kv.store['test.personal.conversion_registrations'] = 3;
                    api.kv.store['test.chw.conversions_to_clinic'] = 1;
                    api.kv.store['test.personal.conversions_to_clinic'] = 2;
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
                    .setup(function(api, im) {
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

        describe("after the user runs through the whole flow - mom's phone", function() {
            it("should have all their extras saved", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27821234567',
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4",
                        });
                    })
                    .setup.user.addr('27821234567')
                    .inputs(
                        {session_event: 'start'},
                        '1',        // states_start - yes
                        '1',        // state_consent - yes
                        '123456',    // states_clinic_code - 123456
                        '2',        // states_due_date_month - 05
                        '30',       // states_due_date_day - 30
                                    // user is registering in week 33
                        '1',        // states_id_type - sa_id
                        {session_event: 'new'},
                        '1',        // states_timed_out - yes
                        '5101025009086', // states_sa_id
                        '4'         // states_language - en
                        )
                    .check.interaction({
                        state: 'states_end_success'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821234567'
                        });
                        assert.equal(contact.extra.consent, 'true');
                        assert.equal(contact.extra.clinic_code, '123456');
                        assert.equal(contact.extra.due_date_month, '05');
                        assert.equal(contact.extra.due_date_day, '30');
                        assert.equal(contact.extra.id_type, 'sa_id');
                        assert.equal(contact.extra.sa_id, '5101025009086');
                        assert.equal(contact.extra.language_choice, 'en');
                    })
                    .run();
            });
        });

        describe("when the user runs through the whole flow - clinic worker's phone", function() {
            it("should have all their extras saved", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27821234567',
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4",
                        });
                        api.contacts.add({
                            msisdn: '+270001',
                        });
                    })
                    .setup.user.addr('270001')
                    .inputs(
                        {session_event: 'start'},
                        '2',        // states_start - no
                        '0821234567', // states_mobile_no - +27821234567
                        '1',        // states_consent - yes
                        '123456',    // states_clinic_code - 123456
                        '2',        // states_due_date_month - 05
                        '30',       // states_due_date_day - 30
                        '1',        // states_id_type - sa_id
                        {session_event: 'new'},
                        '1',        // states_timed_out - yes
                        '5101025009086', // states_sa_id
                        '4'         // states_language - en
                        )
                    .check.interaction({
                        state: 'states_end_success'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821234567'
                        });
                        // complete
                        assert.equal(contact.extra.consent, 'true');
                        assert.equal(contact.extra.clinic_code, '123456');
                        assert.equal(contact.extra.due_date_month, '05');
                        assert.equal(contact.extra.due_date_day, '30');
                        assert.equal(contact.extra.id_type, 'sa_id');
                        assert.equal(contact.extra.sa_id, '5101025009086');
                        assert.equal(contact.extra.language_choice, 'en');
                    })
                    .run();
            });
        });

        // no_incomplete metric tests
        describe("test dropoff metrics", function() {

            describe("states_start", function() {
                it("entering once", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // dial in
                        )
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1'].values, [1]);
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1.transient'].values, [1]);
                        })
                        .run();
                });

                it("entering once, timing out", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , {session_event: 'close'}  // states_start
                        )
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1'].values, [1]);
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1.transient'].values, [1]);
                        })
                        .run();
                });

                it("entering once, timing out, redialing (session:close detected)", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , {session_event: 'close'}  // states_start
                            , {session_event: 'new'}  // redial
                        )
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1'].values, [1]);
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1.transient'].values, [1]);
                        })
                        .run();
                });

                it("entering once, timing out, redialing (session:close not detected)", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , {session_event: 'new'}  // redial
                        )
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1'].values, [1]);
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1.transient'].values, [1]);
                        })
                        .run();
                });

                it("entering once, timing out, redialing, exiting", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , {session_event: 'close'}  // states_start
                            , {session_event: 'new'}  // redial
                            , '1'  // states_start
                        )
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1.transient'].values, [1, -1]);
                        })
                        .run();
                });
            });

            describe("states_due_date_month", function() {
                // This idea applies to all states except states_start and end states, for which measuring
                // dropoffs is not a real thing
                it("entering once", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '1'  // states_start
                            , '1'  // states_consent
                            , '123456'  // states_clinic_code
                        )
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1.transient'].values, [1, -1]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1.transient'].values, [1, -1]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1'].values, [1]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1.transient'].values, [1]);
                        })
                        .run();
                });

                it("entering once, timing out", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '1'  // states_start
                            , '1'  // states_consent
                            , '123456'  // states_clinic_code
                            , {session_event: 'close'}  // states_due_date_month
                        )
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1.transient'].values, [1, -1]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1.transient'].values, [1, -1]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1'].values, [1]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1.transient'].values, [1]);
                        })
                        .run();
                });

                it("entering once, timing out, redialing (session:close detected)", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '1'  // states_start
                            , '1'  // states_consent
                            , '123456'  // states_clinic_code
                            , {session_event: 'close'}  // states_due_date_month
                            , {session_event: 'new'}  // redial
                        )
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1.transient'].values, [1, -1]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1.transient'].values, [1, -1]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1'].values, [1]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1.transient'].values, [1]);
                        })
                        .run();
                });

                it("entering once, timing out, redialing (session:close not detected)", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '1'  // states_start
                            , '1'  // states_consent
                            , '123456'  // states_clinic_code
                            , {session_event: 'new'}  // redial
                        )
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1.transient'].values, [1, -1]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1.transient'].values, [1, -1]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1'].values, [1]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1.transient'].values, [1]);
                        })
                        .run();
                });

                it("entering once, timing out, redialing, abandoning registration", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '1'  // states_start
                            , '1'  // states_consent
                            , '123456'  // states_clinic_code
                            , {session_event: 'close'}  // states_due_date_month
                            , {session_event: 'new'}  // redial
                            , '2'  // states_timed_out
                        )
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1'].values, [1, 0, 1]);
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1.transient'].values, [1, -1, 1]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1.transient'].values, [1, -1]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1'].values, [1]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1.transient'].values, [1]);
                        })
                        .run();
                });

                it("entering once, timing out, redialing, continuing registration", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '1'  // states_start
                            , '1'  // states_consent
                            , '123456'  // states_clinic_code
                            , {session_event: 'close'}  // states_due_date_month
                            , {session_event: 'new'}  // redial
                            , '1'  // states_timed_out
                        )
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1.transient'].values, [1, -1]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1.transient'].values, [1, -1]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1'].values, [1, 0, 1]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1.transient'].values, [1, -1, 1]);
                        })
                        .run();
                });

                it("entering once, timing out, redialing, continuing registration, exiting", function() {
                    return tester
                        .setup.user.addr('27001')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '1'  // states_start
                            , '1'  // states_consent
                            , '123456'  // states_clinic_code
                            , {session_event: 'close'}  // states_due_date_month
                            , {session_event: 'new'}  // redial
                            , '1'  // states_timed_out
                            , '5'  // states_due_date_month
                        )
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete_rev1.transient'].values, [1, -1]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1'].values, [1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_clinic_code.no_incomplete_rev1.transient'].values, [1, -1]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1'].values, [1, 0, 1, 0]);
                            assert.deepEqual(metrics['test.clinic.states_due_date_month.no_incomplete_rev1.transient'].values, [1, -1, 1, -1]);
                        })
                        .run();
                });
            });
        });

        describe("when the user starts a session", function() {
            it("should check if no. belongs to pregnant woman", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .setup.char_limit(160)  // limit first state chars
                    .start()
                    .check.interaction({
                        state: 'states_start',
                        reply: [
                            'Welcome to The Department of Health\'s ' +
                            'MomConnect. Tell us if this is the no. that ' +
                            'the mother would like to get SMSs on: 0821234444',
                            '1. Yes',
                            '2. No'
                        ].join('\n')
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821234444'
                        });
                        assert.equal(contact.extra.ussd_sessions, '1');
                        assert.equal(contact.extra.metric_sum_sessions, '1');
                        assert.equal(contact.extra.last_stage, 'states_start');
                    })
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.deepEqual(metrics['test.sum.sessions'].values, [1]);
                    })
                    .run();
            });
        });

        // re-dial flow tests
        describe("when a user timed out", function() {

            // clinic worker's phone
            describe("when the user timed out during registration", function() {
                it("should ask it they want to continue registration", function() {
                    return tester
                        .setup.char_limit(160)  // limit first state chars
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27821234444',
                                extra : {
                                    working_on: '+27821234567',
                                }
                            });
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '123456',
                                },
                            });
                        })
                        .setup.user.addr('27821234444')
                        .setup.user.state('states_id_type')
                        .input.session_event('new')
                        .check.interaction({
                            state: 'states_timed_out',
                            reply: [
                                'Would you like to complete pregnancy registration for 0821234567?',
                                '1. Yes',
                                '2. Start new registration'
                            ].join('\n')
                        })
                        .run();
                });
            });

            // pregnant woman's phone
            describe("when the user timed out during registration", function() {
                it("should ask it they want to continue registration", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27821234444',
                            });
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '123456',
                                },
                            });
                        })
                        .setup.user.addr('27821234567')
                        .setup.user.state('states_id_type')
                        .input.session_event('new')
                        .check.interaction({
                            state: 'states_timed_out',
                            reply: [
                                'Would you like to complete pregnancy registration for 0821234567?',
                                '1. Yes',
                                '2. Start new registration'
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
                                    working_on: '+27821234567',
                                }
                            });
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '123456',
                                },
                            });
                        })
                        .setup.user.addr('27821234444')
                        .setup.user.state('states_id_type')
                        .inputs({session_event: 'new'}, '1')
                        .check.interaction({
                            state: 'states_id_type',
                            reply: [
                                'What kind of identification does the pregnant ' +
                                'mother have?',
                                '1. SA ID',
                                '2. Passport',
                                '3. None'
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("when the user chooses to abort registration", function() {
                it("should take them back to states_start", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27821234444',
                                extra : {
                                    working_on: '+27821234567',
                                }
                            });
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '123456',
                                },
                            });
                        })
                        .setup.user.addr('27821234444')
                        .setup.user.state('states_id_type')
                        .inputs({session_event: 'new'}, '2')
                        .check.interaction({
                            state: 'states_start',
                            reply: [
                                'Welcome to The Department of Health\'s ' +
                                'MomConnect. Tell us if this is the no. that ' +
                                'the mother would like to get SMSs on: 0821234444',
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821234444'
                            });
                            assert.equal(contact.extra.working_on, '');
                        })
                        .run();
                });
            });
        });
        // end re-dial flow tests

        describe("when a new unique user logs on", function() {
            it("should increment the no. of unique users by 1", function() {
                return tester
                    .start()
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.deepEqual(metrics['test.clinic.sum.unique_users'].values, [1]);
                        assert.deepEqual(metrics['test.clinic.percentage_users'].values, [100]);
                        assert.deepEqual(metrics['test.sum.unique_users'].values, [1]);
                    })
                    .run();
            });
        });

        describe("when the user has previously logged on", function() {
            it("should increase their number of ussd_sessions by 1", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add( {
                            msisdn: '+270001',
                            extra : {
                                ussd_sessions: '3',
                                working_on: '+2712345'
                            }
                        });
                    })
                    .setup.user.addr('270001')
                    .start()
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.ussd_sessions, '4');
                    })
                    .run();
            });
        });

        // opt-in flow for contact phone usage
        describe("when the no. is the pregnant woman's no.", function() {

            describe("if not previously opted out", function() {
                it("should ask for consent", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                            });
                        })
                        .setup.user.addr('27001')
                        .setup.user.state('states_start')
                        .input('1')
                        .check.interaction({
                            state: 'states_consent',
                            reply: [(
                                'We need to collect, store & use her info. ' +
                                'She may get messages on public holidays & ' +
                                'weekends. Does she consent?'),
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        .run();
                });
                it("should ask for the clinic code if consented", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                            });
                        })
                        .setup.user.addr('27001')
                        .setup.user.state('states_start')
                        .inputs('1', '1')
                        .check.interaction({
                            state: 'states_clinic_code',
                            reply: (
                                'Please enter the clinic code for the facility ' +
                                'where this pregnancy is being registered:')
                        })
                        .run();
                });
                it("should tell them they cannot register", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                            });
                        })
                        .setup.user.addr('27001')
                        .setup.user.state('states_start')
                        .inputs('1', '2')
                        .check.interaction({
                            state: 'states_consent_refused',
                            reply: 'Unfortunately without her consent, she ' +
                                    'cannot register to MomConnect.'
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
                        .setup.user.state('states_start')
                        .input('1')
                        .check.interaction({
                            state: 'states_opt_in',
                            reply: [(
                                'This number has previously opted out of MomConnect ' +
                                'SMSs. Please confirm that the mom would like to ' +
                                'opt in to receive messages again?'),
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("if the user confirms opting back in", function() {
                it("should ask for consent", function() {
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
                            state: 'states_consent',
                            reply: [(
                                'We need to collect, store & use her info. ' +
                                'She may get messages on public holidays & ' +
                                'weekends. Does she consent?'),
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        .run();
                });
                it("should ask for the clinic code", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27831112222',
                            });
                        })
                        .setup.user.addr('27831112222')
                        .setup.user.state('states_opt_in')
                        .inputs('1', '1')
                        .check.interaction({
                            state: 'states_clinic_code',
                            reply: (
                                'Please enter the clinic code for the facility ' +
                                'where this pregnancy is being registered:')
                        })
                        .check(function(api) {
                            var optouts = api.optout.optout_store;
                            assert.equal(optouts.length, 4);
                        })
                        .run();
                });
                it("should tell them they cannot register", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27831112222',
                            });
                        })
                        .setup.user.addr('27831112222')
                        .setup.user.state('states_opt_in')
                        .inputs('1', '2')
                        .check.interaction({
                            state: 'states_consent_refused',
                            reply: 'Unfortunately without her consent, she ' +
                                    'cannot register to MomConnect.'
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
                it("should take them back to states_start", function() {
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
                            state: 'states_start',
                            reply: [
                                'Welcome to The Department of Health\'s ' +
                                'MomConnect. Tell us if this is the no. that ' +
                                'the mother would like to get SMSs on: 0831112222',
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        .run();
                });
            });

        });
        // end opt-in flow for contact phone usage

        describe("when the no. is not the pregnant woman's no.", function() {
            it("should ask for the pregnant woman's no.", function() {
                return tester
                    .setup.user.state('states_start')
                    .input('2')
                    .check.interaction({
                        state: 'states_mobile_no',
                        reply: (
                            'Please input the mobile number of the ' +
                            'pregnant woman to be registered:')
                    })
                    .run();
            });
        });

        describe("after entering the pregnant woman's number incorrectly", function() {
            it("should ask for the mobile number again", function() {
                return tester
                    .setup.user.state('states_mobile_no')
                    .input('08212345AB')
                    .check.interaction({
                        state: 'states_mobile_no',
                        reply: (
                            'Sorry, the mobile number did not validate. ' +
                            'Please reenter the mobile number:')
                    })
                    .run();
            });
        });

        // opt-in flow for clinic worker's phone usage
        describe("after entering the pregnant woman's number", function() {

            describe("if the number has not opted out before", function() {
                it("should ask for consent", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.state('states_mobile_no')
                        .input('0821234567')
                        .check.interaction({
                            state: 'states_consent',
                            reply: [(
                                'We need to collect, store & use her info. ' +
                                'She may get messages on public holidays & ' +
                                'weekends. Does she consent?'),
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.working_on, "+27821234567");
                            assert.equal(contact.extra.is_registered, undefined);
                            assert.equal(contact.extra.last_stage, 'states_consent');
                        })
                        .run();
                });
                it("should ask for the clinic code", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.state('states_mobile_no')
                        .inputs('0821234567', '1')
                        .check.interaction({
                            state: 'states_clinic_code',
                            reply: (
                                'Please enter the clinic code for the facility ' +
                                'where this pregnancy is being registered:')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+270001'
                            });
                            assert.equal(contact.extra.working_on, "+27821234567");
                            assert.equal(contact.extra.is_registered, undefined);
                            assert.equal(contact.extra.last_stage, 'states_consent');
                            contact = _.find(api.contacts.store, {
                              msisdn: '+27821234567'
                            });
                            assert.equal(contact.extra.consent, 'true');
                        })
                        .run();
                });
                it("should tell them they cannot register", function() {
                    return tester
                        .setup.user.addr('27001')
                        .setup.user.state('states_mobile_no')
                        .inputs('0821234567', '2')
                        .check.interaction({
                            state: 'states_consent_refused',
                            reply: 'Unfortunately without her consent, she ' +
                                    'cannot register to MomConnect.'
                        })
                        .run();
                });
            });

            describe("if the user previously opted out", function() {
                it("should ask to confirm opting back in", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                            });
                        })
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27831112222',
                            });
                        })
                        .setup.user.addr('27001')
                        .setup.user.state('states_mobile_no')
                        .input('0831112222')
                        .check.interaction({
                            state: 'states_opt_in',
                            reply: [(
                                'This number has previously opted out of MomConnect ' +
                                'SMSs. Please confirm that the mom would like to ' +
                                'opt in to receive messages again?'),
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.working_on, "+27831112222");
                        })
                        .run();
                });
            });

            describe("if the user confirms opting back in", function() {
                it("should ask for consent", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    working_on: '+27831112222'
                                }
                            });
                        })
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27831112222',
                            });
                        })
                        .setup.user.addr('27001')
                        .setup.user.state('states_opt_in')
                        .input('1')
                        .check.interaction({
                            state: 'states_consent',
                            reply: [(
                                'We need to collect, store & use her info. ' +
                                'She may get messages on public holidays & ' +
                                'weekends. Does she consent?'),
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var optouts = api.optout.optout_store;
                            assert.equal(optouts.length, 4);
                        })
                        .run();
                });
                it("should ask for the clinic code", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    working_on: '+27831112222'
                                }
                            });
                        })
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27831112222',
                            });
                        })
                        .setup.user.addr('27001')
                        .setup.user.state('states_opt_in')
                        .inputs('1', '1')
                        .check.interaction({
                            state: 'states_clinic_code',
                            reply: (
                                'Please enter the clinic code for the facility ' +
                                'where this pregnancy is being registered:')
                        })
                        .check(function(api) {
                            var optouts = api.optout.optout_store;
                            assert.equal(optouts.length, 4);
                        })
                        .run();
                });
            });

            describe("if the user does not choose to opt back in", function() {
                it("should tell them they cannot complete registration", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    working_on: '+27831112222'
                                }
                            });
                        })
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27831112222',
                            });
                        })
                        .setup.user.addr('27001')
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
                            assert.equal(contact.extra.working_on, "");
                        })
                        .run();
                });
            });

            describe("if the user selects 1. Main Menu", function() {
                it("should return to states_start", function() {
                    return tester
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    working_on: ''
                                }
                            });
                        })
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27831112222',
                            });
                        })
                        .setup.user.addr('27001')
                        .setup.user.state('states_stay_out')
                        .input('1')
                        .check.interaction({
                            state: 'states_start',
                            reply: [
                                'Welcome to The Department of Health\'s ' +
                                'MomConnect. Tell us if this is the no. that ' +
                                'the mother would like to get SMSs on: 07001',
                                '1. Yes',
                                '2. No'
                            ].join('\n')
                        })
                        .run();
                });
            });

        });
        // end opt-in flow for clinic worker's phone usage


        describe("after entering the clinic code", function() {
            describe("if the clinic code is not valid", function() {
                it("should ask for the clinic_code again", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.state('states_clinic_code')
                        .input('888888')
                        .check.interaction({
                        state: 'states_clinic_code',
                        reply: (
                            'Sorry, the clinic number did not validate. ' +
                            'Please reenter the clinic number:')
                        })
                        .run();
                });
            });

            describe("if the number used is not the mom's", function() {
                it("should save clinic code, ask for the month the baby is due", function() {
                    return tester
                        .setup.user.addr('270001')
                        .inputs('start', '2', '0821234567', '1', '123456')
                        .check.interaction({
                            state: 'states_due_date_month',
                            reply: [
                                'Please select the month when the baby is due:',
                                '1. Apr',
                                '2. May',
                                '3. Jun',
                                '4. Jul',
                                '5. Aug',
                                '6. Sep',
                                '7. Oct',
                                '8. Nov',
                                '9. Dec',
                                '10. Jan'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821234567'
                            });
                            assert.equal(contact.extra.clinic_code, '123456');
                            assert.equal(contact.extra.is_registered, 'false');
                            assert.equal(contact.extra.last_stage, 'states_due_date_month');
                        })
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.percent_incomplete_registrations'].values, [60]);
                            assert.deepEqual(metrics['test.clinic.percent_complete_registrations'].values, [40]);
                        })
                        .run();
                });
            });

            describe("if the number used is the mom's", function() {
                it("should save the clinic code, ask for the month the baby is due", function() {
                    return tester
                        .setup.user.addr('270001')
                        .inputs('start', '1', '1', '234567')
                        .check.interaction({
                            state: 'states_due_date_month',
                            reply: [
                                'Please select the month when the baby is due:',
                                '1. Apr',
                                '2. May',
                                '3. Jun',
                                '4. Jul',
                                '5. Aug',
                                '6. Sep',
                                '7. Oct',
                                '8. Nov',
                                '9. Dec',
                                '10. Jan'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+270001'
                            });
                            assert.equal(contact.extra.consent, 'true');
                            assert.equal(contact.extra.clinic_code, '234567');
                            assert.equal(contact.extra.last_stage, 'states_due_date_month');
                        })
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.percent_incomplete_registrations'].values, [60]);
                            assert.deepEqual(metrics['test.clinic.percent_complete_registrations'].values, [40]);
                        })
                        .run();
                });

                it("should save the due month, ask for the day the baby is due", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.state('states_due_date_month')
                        .input('2')
                        .check.interaction({
                            state: 'states_due_date_day',
                            reply: 'Please enter the estimated day that the baby is due (For example 12):'
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+270001'
                            });
                            assert.equal(contact.extra.due_date_month, '05');
                            assert.equal(contact.extra.last_stage, 'states_due_date_day');
                        })
                        .run();
                });
            });
        });

        describe("after the birth day is selected", function() {

            describe("if the day choice is not a valid number 1-31", function() {
                it("should ask for the day again", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.state('states_due_date_day')
                        .input('32')
                        .check.interaction({
                            state: 'states_due_date_day',
                            reply: [
                                'Sorry, the number did not validate. ' +
                                'Please enter the estimated day that the baby ' +
                                'is due (For example 12):'
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("if the day choice is valid but the date is not", function() {
                it("should display an error message, ask to continue", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.state('states_due_date_month')
                        .inputs('8', '31')
                        .check.interaction({
                            state: 'states_invalid_edd',
                            reply: [
                                'The date you entered (2014-11-31) is not a ' +
                                'real date. Please try again.',
                                '1. Continue'
                            ].join('\n')
                        })
                        .run();
                });

                it("should go back to due date month if user hits continue", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.state('states_due_date_month')
                        .inputs('8', '31', '1')
                        .check.interaction({
                            state: 'states_due_date_month',
                            reply: [
                                'Please select the month when the baby is due:',
                                '1. Apr',
                                '2. May',
                                '3. Jun',
                                '4. Jul',
                                '5. Aug',
                                '6. Sep',
                                '7. Oct',
                                '8. Nov',
                                '9. Dec',
                                '10. Jan'
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("if the day choice is valid", function() {
                it("should ask for the pregnant woman's id type", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.state('states_due_date_month')
                        .inputs('8', '10')
                        .check.interaction({
                            state: 'states_id_type',
                            reply: [
                                'What kind of identification does the pregnant ' +
                                'mother have?',
                                '1. SA ID',
                                '2. Passport',
                                '3. None'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+270001'
                            });
                            assert.equal(contact.extra.due_date_day, '10');
                        })
                        .run();
                });
            });
        });

        describe("if the user selects SA ID (id type)", function() {
            it("should set id type, ask for their id number", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_id_type')
                    .input('1')
                    .check.interaction({
                        state: 'states_sa_id',
                        reply: (
                            'Please enter the pregnant mother\'s SA ID ' +
                            'number:')
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.id_type, 'sa_id');
                    })
                    .run();
            });
        });

        describe("after the user enters the ID number after '50", function() {
            it("should save ID, extract DOB, ask for pregnant woman's msg language", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_sa_id')
                    .input('5101015009088')
                    .check.interaction({
                        state: 'states_language',
                        reply: ['Please select the language that the ' +
                            'pregnant mother would like to get messages in:',
                            '1. isiZulu',
                            '2. isiXhosa',
                            '3. Afrikaans',
                            '4. English',
                            '5. Sesotho sa Leboa',
                            '6. More'
                            ].join('\n')
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.sa_id, '5101015009088');
                        assert.equal(contact.extra.birth_year, '1951');
                        assert.equal(contact.extra.birth_month, '01');
                        assert.equal(contact.extra.birth_day, '01');
                        assert.equal(contact.extra.dob, '1951-01-01');
                    })
                    .run();
            });
        });

        describe("after the user enters the ID number before '50", function() {
            it("should save ID, extract DOB", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_sa_id')
                    .input('2012315678097')
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.sa_id, '2012315678097');
                        assert.equal(contact.extra.dob, '2020-12-31');
                    })
                    .run();
            });
        });

        describe("after the user enters the ID number on '50", function() {
            it("should save ID, extract DOB", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_sa_id')
                    .input('5002285000007')
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.sa_id, '5002285000007');
                        assert.equal(contact.extra.dob, '1950-02-28');
                    })
                    .run();
            });
        });

        describe("after the user enters their ID number incorrectly", function() {
            it("should not save ID, ask them to try again", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_sa_id')
                    .input('1234015009087')
                    .check.interaction({
                        state: 'states_sa_id',
                        reply: 'Sorry, the mother\'s ID number did not validate. ' +
                          'Please reenter the SA ID number:'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.sa_id, undefined);
                    })
                    .run();
            });
        });

        describe("after the user enters an invalid ID", function() {
            it("should not save ID, ask them to try again", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_sa_id')
                    .input('9926040547082')
                    .check.interaction({
                        state: 'states_sa_id',
                        reply: 'Sorry, the mother\'s ID number did not validate. ' +
                          'Please reenter the SA ID number:'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.sa_id, undefined);
                    })
                    .run();
            });
        });

        describe("if the user selects Passport (id type)", function() {
            it("should set id type, ask for their country of origin", function() {
                return tester
                    .setup.user.addr('270001')
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
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.id_type, 'passport');
                    })
                    .run();
            });
        });

        describe("after the user selects passport country", function() {
            it("should save passport country, ask for their passport number", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_passport_origin')
                    .input('1')
                    .check.interaction({
                        state: 'states_passport_no',
                        reply: 'Please enter the pregnant mother\'s Passport number:'
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.passport_origin, 'zw');
                    })
                    .run();
            });
        });

        describe("after the user enters the passport number", function() {
            it("should save passport no, ask for pregnant woman's msg language", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_passport_no')
                    .input('12345')
                    .check.interaction({
                        state: 'states_language',
                        reply: ['Please select the language that the ' +
                            'pregnant mother would like to get messages in:',
                            '1. isiZulu',
                            '2. isiXhosa',
                            '3. Afrikaans',
                            '4. English',
                            '5. Sesotho sa Leboa',
                            '6. More'
                            ].join('\n')
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.passport_no, '12345');
                    })
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
                        'carefully enter the passport number again.')
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
                        'carefully enter the passport number again.')
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
                        'carefully enter the passport number again.')
                    })
                    .run();
            });
        });

        describe("if the user selects None (id type)", function() {
            it("should set id type, ask for their birth year", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_id_type')
                    .input('3')
                    .check.interaction({
                        state: 'states_birth_year',
                        reply: ('Please enter the year that the pregnant ' +
                                'mother was born (for example: 1981)')
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.id_type, 'none');
                    })
                    .run();
            });
        });

        describe("after the user enters their birth year incorrectly", function() {
            it("text error - should ask for their birth year again", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_birth_year')
                    .input('Nineteen Eighty One')
                    .check.interaction({
                        state: 'states_birth_year',
                        reply: ('There was an error in your entry. Please ' +
                        'carefully enter the mother\'s year of birth again ' +
                        '(for example: 2001)')
                    })
                    .run();
            });

            it("too young - should ask for their birth year again", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_birth_year')
                    .input('2013')
                    .check.interaction({
                        state: 'states_birth_year',
                        reply: ('There was an error in your entry. Please ' +
                        'carefully enter the mother\'s year of birth again ' +
                        '(for example: 2001)')
                    })
                    .run();
            });
        });

        describe("after the user enters their birth year", function() {
            it("should save birth year, ask for their birth month", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_birth_year')
                    .input('1981')
                    .check.interaction({
                        state: 'states_birth_month',
                        reply: ['Please enter the month that the mom was born.',
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
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.birth_year, '1981');
                    })
                    .run();
            });
        });

        describe("after the user enters their birth month", function() {
            it("should save birth month, ask for their birth day", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_birth_month')
                    .input('1')
                    .check.interaction({
                        state: 'states_birth_day',
                        reply: ('Please enter the day that the mother was ' +
                            'born (for example: 14).')
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.birth_month, '01');
                    })
                    .run();
            });
        });

        describe("after the user enters their birth day incorrectly", function() {
            it("should not save birth day, ask them their birth day again", function() {
                return tester
                    .setup.user.addr('270001')
                    .setup.user.state('states_birth_day')
                    .input('fourteen')
                    .check.interaction({
                        state: 'states_birth_day',
                        reply: ('There was an error in your entry. Please ' +
                        'carefully enter the mother\'s day of birth again ' +
                        '(for example: 8)')
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
                        });
                        assert.equal(contact.extra.birth_day, undefined);
                        assert.equal(contact.extra.dob, undefined);
                    })
                    .run();
            });
        });

        describe("after the user enters the birth day", function() {

            describe("if the day entry is obviously wrong", function() {
                it("should reprompt for the day", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.answers({
                            'states_birth_year': '1981',
                            'states_birth_month': '02'
                        })
                        .setup.user.state('states_birth_day')
                        .input('32')
                        .check.interaction({
                            state: 'states_birth_day',
                            reply: 'There was an error in your entry. Please ' +
                                'carefully enter the mother\'s day of birth again ' +
                                '(for example: 8)'
                        })
                        .run();
                });
            });

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
                            reply: 'Please enter the year that the pregnant ' +
                                    'mother was born (for example: 1981)'
                        })
                        .run();
                });
            });

            describe("if the date validates", function() {
                it("should save birth day and dob, ask for pregnant woman's msg language", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.answers({
                            'states_birth_year': '1981',
                            'states_birth_month': '01'
                        })
                        .setup.user.state('states_birth_day')
                        .input('14')
                        .check.interaction({
                            state: 'states_language',
                            reply: ['Please select the language that the ' +
                                'pregnant mother would like to get messages in:',
                                '1. isiZulu',
                                '2. isiXhosa',
                                '3. Afrikaans',
                                '4. English',
                                '5. Sesotho sa Leboa',
                                '6. More'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+270001'
                            });
                            assert.equal(contact.extra.birth_day, '14');
                            assert.equal(contact.extra.dob, '1981-01-14');
                        })
                        .run();
                });
            });
        });

        describe("after the mom's msg language is selected", function() {
            describe("if they select to see language page 2", function() {
                it("should display more language options", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.state('states_language')
                        .input('6')
                        .check.interaction({
                            state: 'states_language',
                            reply: ['Please select the language that the ' +
                                'pregnant mother would like to get messages in:',
                                '1. Setswana',
                                '2. Sesotho',
                                '3. Xitsonga',
                                '4. siSwati',
                                '5. Tshivenda',
                                '6. More',
                                '7. Back'
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("if they select to see language page 3", function() {
                it("should display more language options", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup.user.state('states_language')
                        .inputs('6', '6')
                        .check.interaction({
                            state: 'states_language',
                            reply: ['Please select the language that the ' +
                                'pregnant mother would like to get messages in:',
                                '1. isiNdebele',
                                '2. Back'
                            ].join('\n')
                        })
                        .run();
                });
            });

            describe("if the phone used is not the mom's", function() {
                it("should save msg language, thank them and exit", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+270001',
                                extra : {
                                    working_on: '+27821234567',
                                    ussd_sessions: '5'
                                }
                            });
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '123456',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'sa_id',
                                    sa_id: '5101025009086',
                                    birth_year: '1951',
                                    birth_month: '01',
                                    birth_day: '02',
                                    dob: '1951-01-02',
                                    due_date_month: '05',
                                    due_date_day: '30',
                                    consent: 'true'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.state('states_language')
                        .input('4')
                        .check.interaction({
                            state: 'states_end_success',
                            reply: ('Thank you. The pregnant woman will now ' +
                                'receive weekly messages about her pregnancy ' +
                                'from MomConnect.')
                        })
                        .check(function(api) {
                            var contact_mom = _.find(api.contacts.store, {
                                msisdn: '+27821234567'
                            });
                            var contact_user = _.find(api.contacts.store, {
                                msisdn: '+270001'
                            });
                            assert.equal(contact_mom.extra.language_choice, 'en');
                            assert.equal(contact_user.extra.ussd_sessions, '0');
                            assert.equal(contact_user.extra.working_on, '');
                            assert.equal(contact_mom.extra.metric_sessions_to_register, '5');
                            assert.equal(contact_user.extra.no_registrations, '1');
                            assert.equal(contact_mom.extra.no_registrations, undefined);
                            assert.equal(contact_mom.extra.registered_by, '+270001');
                            assert.equal(contact_mom.extra.is_registered, 'true');
                            assert.equal(contact_mom.extra.is_registered_by, 'clinic');
                            assert.equal(contact_user.extra.is_registered, undefined);
                            assert.equal(contact_user.extra.is_registered_by, undefined);
                        })
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.avg.sessions_to_register'].values, [5]);
                        })
                        .check.reply.ends_session()
                        .run();
                });
            });

            describe("if the phone used is the mom's", function() {
                it("should save msg language, thank them and exit", function() {
                    return tester
                        .setup.user.addr('27821234567')
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '123456',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'sa_id',
                                    sa_id: '5101025009086',
                                    birth_year: '1951',
                                    birth_month: '01',
                                    birth_day: '02',
                                    dob: '1951-01-02',
                                    ussd_sessions: '5',
                                    due_date_month: '05',
                                    due_date_day: '30',
                                    is_registered_by: 'personal',
                                    consent: 'true'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.state('states_language')
                        .input('4')
                        .check.interaction({
                            state: 'states_end_success',
                            reply: ('Thank you. The pregnant woman will now ' +
                                'receive weekly messages about her pregnancy ' +
                                'from MomConnect.')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821234567'
                            });
                            assert.equal(contact.extra.language_choice, 'en');
                            assert.equal(contact.extra.ussd_sessions, '0');
                            assert.equal(contact.extra.last_stage, 'states_end_success');
                            assert.equal(contact.extra.metric_sessions_to_register, '5');
                            assert.equal(contact.extra.no_registrations, undefined);
                            assert.equal(contact.extra.registered_by, undefined);
                            assert.equal(contact.extra.is_registered, 'true');
                            assert.equal(contact.extra.is_registered_by, 'clinic');
                        })
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.avg.sessions_to_register'].values, [5]);
                            assert.deepEqual(metrics['test.clinic.percent_incomplete_registrations'].values, [25]);
                            assert.deepEqual(metrics['test.clinic.percent_complete_registrations'].values, [75]);
                            assert.deepEqual(metrics['test.personal.conversion_rate'].values, [100]);
                            assert.deepEqual(metrics['test.chw.conversion_rate'].values, [33.33]);
                        })
                        .check(function(api) {
                            var kv_store = api.kv.store;
                            assert.equal(kv_store['test.chw.conversions_to_clinic'], 1);
                            assert.equal(kv_store['test.personal.conversions_to_clinic'], 3);
                        })
                        .check.reply.ends_session()
                        .run();
                });

                it("should not fire conversion metrics if starting on 0", function() {
                    return tester
                        .setup.user.addr('27821234567')
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '123456',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'sa_id',
                                    sa_id: '5101025009086',
                                    birth_year: '1951',
                                    birth_month: '01',
                                    birth_day: '02',
                                    dob: '1951-01-02',
                                    ussd_sessions: '5',
                                    due_date_month: '05',
                                    due_date_day: '30',
                                    is_registered_by: 'personal',
                                    consent: 'true'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.state('states_language')
                        .setup(function(api) {
                            api.kv.store['test.chw.conversion_registrations'] = 0;
                            api.kv.store['test.personal.conversion_registrations'] = 0;
                            api.kv.store['test.chw.conversions_to_clinic'] = 0;
                            api.kv.store['test.personal.conversions_to_clinic'] = 0;
                        })
                        .input('4')
                        .check.interaction({
                            state: 'states_end_success',
                            reply: ('Thank you. The pregnant woman will now ' +
                                'receive weekly messages about her pregnancy ' +
                                'from MomConnect.')
                        })
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.avg.sessions_to_register'].values, [5]);
                            assert.deepEqual(metrics['test.clinic.percent_incomplete_registrations'].values, [25]);
                            assert.deepEqual(metrics['test.clinic.percent_complete_registrations'].values, [75]);
                            assert.deepEqual(metrics['test.personal.conversion_rate'], undefined);
                            assert.deepEqual(metrics['test.chw.conversion_rate'], undefined);
                        })
                        .check(function(api) {
                            var kv_store = api.kv.store;
                            assert.equal(kv_store['test.chw.conversions_to_clinic'], 0);
                            assert.equal(kv_store['test.personal.conversions_to_clinic'], 1);
                        })
                        .check.reply.ends_session()
                        .run();
                });

                it("should put them in language group", function() {
                    return tester
                        .setup.user.addr('27821234567')
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '123456',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'sa_id',
                                    sa_id: '5101025009086',
                                    birth_year: '1951',
                                    birth_month: '01',
                                    birth_day: '02',
                                    dob: '1951-01-02',
                                    ussd_sessions: '5',
                                    due_date_month: '05',
                                    due_date_day: '30',
                                    consent: 'true'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.state('states_language')
                        .input('4')
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.language_choice, 'en');
                        })
                        .run();
                });
            });

            describe("if the phone used is the mom's", function() {
                it("should send her an SMS on complete registration", function() {
                    return tester
                        .setup.user.addr('27821234567')
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '123456',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'sa_id',
                                    sa_id: '5101025009086',
                                    birth_year: '1951',
                                    birth_month: '01',
                                    birth_day: '02',
                                    dob: '1951-01-02',
                                    ussd_sessions: '5',
                                    due_date_month: '05',
                                    due_date_day: '30',
                                    consent: 'true'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.state('states_language')
                        .input('4')  // english
                        .check(function(api) {
                            var smses = _.where(api.outbound.store, {
                                endpoint: 'sms'
                            });
                            var sms = smses[0];
                            assert.equal(smses.length,1);
                            assert.equal(sms.content,
                                "Welcome. To stop getting SMSs dial *120*550*1# or for more services dial " +
                                "*120*550# (No Cost). Standard rates apply when replying to any SMS from MomConnect."
                            );
                            assert.equal(sms.to_addr,'+27821234567');
                        })
                        .run();
                });
            });

            describe("if the phone used is not the mom's", function() {
                it("should send her an SMS on complete registration", function() {
                    return tester
                        .setup.user.addr('270001')
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+270001',
                                extra : {
                                    working_on: '+27821234567',
                                    ussd_sessions: '5'
                                }
                            });
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '123456',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'sa_id',
                                    sa_id: '5101025009086',
                                    birth_year: '1951',
                                    birth_month: '01',
                                    birth_day: '02',
                                    dob: '1951-01-02',
                                    due_date_month: '05',
                                    due_date_day: '30',
                                    consent: 'true'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.state('states_language')
                        .input('4')
                        .check(function(api) {
                            var smses = _.where(api.outbound.store, {
                                endpoint: 'sms'
                            });
                            var sms = smses[0];
                            assert.equal(smses.length,1);
                            assert.equal(sms.content,
                                "Welcome. To stop getting SMSs dial *120*550*1# or for more services dial " +
                                "*120*550# (No Cost). Standard rates apply when replying to any SMS from MomConnect."
                            );
                            assert.equal(sms.to_addr,'+27821234567');
                        })
                        .run();
                });
            });

            describe("if user did not provide an sa_id number", function() {
                it("should send jembi doc and json", function() {
                    return tester
                        .setup.user.addr('27001')
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+27001',
                                extra : {
                                    clinic_code: '123456',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'none',
                                    ussd_sessions: '5',
                                    due_date_month: '05',
                                    due_date_day: '30',
                                    birth_year: '1951',
                                    birth_month: '01',
                                    birth_day: '02',
                                    dob: '1951-01-02',
                                    consent: 'true'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.state('states_language')
                        .input('4')
                        .check.interaction({
                            state: 'states_end_success',
                            reply: ('Thank you. The pregnant woman will now ' +
                                'receive weekly messages about her pregnancy ' +
                                'from MomConnect.')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27001'
                            });
                            assert.equal(contact.extra.language_choice, 'en');
                            assert.equal(contact.extra.ussd_sessions, '0');
                            assert.equal(contact.extra.is_registered, 'true');
                            assert.equal(contact.extra.last_stage, 'states_end_success');
                            assert.equal(contact.extra.metric_sessions_to_register, '5');
                            assert.equal(contact.extra.no_registrations, undefined);
                            assert.equal(contact.extra.registered_by, undefined);
                        })
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.avg.sessions_to_register'].values, [5]);
                            assert.deepEqual(metrics['test.clinic.percent_incomplete_registrations'].values, [25]);
                            assert.deepEqual(metrics['test.clinic.percent_complete_registrations'].values, [75]);
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
                            .setup.user.state('states_start')
                            .input('1')
                            .input.session_event('close')
                            .check(function(api) {
                                var smses = _.where(api.outbound.store, {
                                    endpoint: 'sms'
                                });
                                assert.equal(smses.length,0);
                            })
                            .run();
                    });
                });

                describe("when they have not been sent a registration sms",function() {
                    it("should send them an sms thanking them for their registration",function() {
                        return tester
                            .setup(function(api) {
                                api.contacts.add( {
                                    msisdn: '+273323',
                                    extra : {}
                                });
                            })
                            .setup.user.addr('273323')
                            .setup.user.state('states_start')
                            .input(1)
                            .input.session_event('close')
                            .check(function(api) {
                                var smses = _.where(api.outbound.store, {
                                    endpoint: 'sms'
                                });
                                var sms = smses[0];
                                assert.equal(smses.length,1);
                                assert.equal(sms.content,
                                    "Please dial back in to *120*550*2# to complete the pregnancy registration."
                                );
                                assert.equal(sms.to_addr,'273323');
                            }).run();
                    });
                });
            });
        });
    });
});
