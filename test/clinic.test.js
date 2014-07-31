var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');
var _ = require('lodash');
var messagestore = require('./messagestore');
var DummyMessageStoreResource = messagestore.DummyMessageStoreResource;

describe("utils", function() {
    describe("for clinic use", function() {
        it('should tell us whether a month is this year or not', function(done) {
            assert.equal(
                go.utils.is_month_this_year(new Date('2014-08-01'), 10),
                true);
            assert.equal(
                go.utils.is_month_this_year(new Date('2014-08-01'), 8),
                true);
            assert.equal(
                go.utils.is_month_this_year(new Date('2015-08-01'), 7),
                false);
            done();
        });
        it('should tell us what week of pregnancy date is using month', function(done) {
            // full term
            assert.equal(
                go.utils.calc_weeks(new Date('2014-07-13'), '07', '14'),
                40);
            // -1 week
            assert.equal(
                go.utils.calc_weeks(new Date('2014-07-06'), '07', '14'),
                39);
            // -2 weeks
            assert.equal(
                go.utils.calc_weeks(new Date('2014-06-29'), '07', '14'),
                38);
            // -37 weeks
            assert.equal(
                go.utils.calc_weeks(new Date('2014-01-01'), '09', '21'),
                3);
            // Can't be less than 2 weeks preg
            assert.equal(
                go.utils.calc_weeks(new Date('2014-01-01'), '10', '03'),
                false);
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
                    api.resources.attach(api);
                    api.groups.add( {
                        key: 'en_key',
                        name: 'en',
                    });
                })
                .setup.char_limit(160)
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
                    jembi: {
                        username: 'foo',
                        password: 'bar',
                        url: 'http://test/v2/',
                        url_json: 'http://test/v2/json/'
                    },
                    clinic_codes: ['12345', '234567'],
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
                    api.kv.store['test.clinic.unique_users'] = 0;
                    api.kv.store['test.chw.unique_users'] = 0;
                    api.kv.store['test.personal.unique_users'] = 0;
                    api.kv.store['test.clinic.no_complete_registrations'] = 2;
                    api.kv.store['test.clinic.no_incomplete_registrations'] = 2;
                })
                .setup(function(api) {
                    api.metrics.stores = {'test_metric_store': {}};
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                });
        });

        describe("when the user is missing extras", function() {
            it("will fail on extras missing", function() {
                return tester
                    .setup.user.addr('+270001')
                    .setup.user.lang('so')
                    .setup.user.answers({
                        "states_start": "yes",
                        "states_sa_id": "5101015009088",
                        "states_birth_year": "1991",
                        "states_birth_month": "10",
                        "states_due_date_month": "09",
                        "states_mobile_no": "0800000000",
                        "states_passport_origin": "mz",
                        "states_id_type": "none",
                        "states_clinic_code": "12345",
                        "states_birth_day": "3",
                        "states_language": "so",
                        "states_passport_no": "123456789"
                    })
                    .setup.user.state('states_end_success')
                    .input(null)
                    .check.interaction({
                        state: 'states_start',
                        reply: [
                            'Welcome to The Department of Health\'s ' +
                            'MomConnect. Tell us if this is the no. that ' +
                            'the mother would like to get SMSs on: 00001',
                            '1. Yes',
                            '2. No'
                        ].join('\n')
                    })
                    .run();
            });
        });

        // no_incomplete metric tests
        describe("when a session is terminated", function() {

            describe("when the last state is states_start", function() {
                it("should increase states_start.no_incomplete metric by 1", function() {
                    return tester
                        .setup.user.state('states_start')
                        .input.session_event('close')
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete'].values, [1]);
                        })
                        .run();
                });
            });

            describe("when the last state is states_birth_day", function() {
                it("should increase states_birth_day.no_incomplete metric by 1", function() {
                    return tester
                        .setup.user.state('states_birth_day')
                        .input.session_event('close')
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_birth_day.no_incomplete'].values, [1]);
                        })
                        .run();
                });
            });

        });

        describe("when a new session is started", function() {

            describe("when it is a new user logging on", function() {
                it("should set the last metric value in states_start.no_incomplete to 0", function() {
                    return tester
                        .setup.user.addr('+275678')
                        .start()
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete'].values, [1, 0]);
                        })
                        .run();
                });
            });

            describe("when it is an existing user logging on at states_start", function() {
                it("should decrease the metric states_start.no_incomplete by 1", function() {
                    return tester
                        .setup.user.lang('en')  // make sure user is not seen as new
                        .start()
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_start.no_incomplete'].values, [-1]);
                        })
                        .run();
                });
            });

            describe("when it is an existing starting a session at states_birth_day", function() {
                it("should decrease the metric states_birth_day.no_incomplete by 1", function() {
                    return tester
                        .setup.user.state('states_birth_day')
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_birth_day.no_incomplete'].values, [-1]);
                        })
                        .run();
                });
            });

            describe("when it is an existing user continuing a session at states_birth_day", function() {
                it("should not fire metric states_birth_day.no_incomplete", function() {
                    return tester
                        .setup.user.state('states_birth_day')
                        .input('2') // make sure session is not new
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.states_birth_day.no_incomplete'], undefined);
                        })
                        .run();
                });
            });
        });
        // end no_incomplete metrics tests

        describe("when the user starts a session", function() {
            it("should check if no. belongs to pregnant woman", function() {
                return tester
                    .setup.user.addr('+270001')
                    .start()
                    .check.interaction({
                        state: 'states_start',
                        reply: [
                            'Welcome to The Department of Health\'s ' +
                            'MomConnect. Tell us if this is the no. that ' +
                            'the mother would like to get SMSs on: 00001',
                            '1. Yes',
                            '2. No'
                        ].join('\n')
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+270001'
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

        describe("when a new unique user logs on", function() {
            it("should increment the no. of unique users by 1", function() {
                return tester
                    .start()
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.deepEqual(metrics['test.clinic.sum.unique_users'].values, [1]);
                        assert.deepEqual(metrics['test.clinic.percentage_users'].values, [100]);
                        assert.deepEqual(metrics['test.sum.unique_users'].values, [1]);
                    }).run();
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
                    .setup.user.addr('+270001')
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

        describe("when the no. is the pregnant woman's no.", function() {
            it("should ask for the clinic code", function() {
                return tester
                    .setup.user.state('states_start')
                    .input('1')
                    .check.interaction({
                        state: 'states_clinic_code',
                        reply: (
                            'Please enter the clinic code for the facility ' +
                            'where this pregnancy is being registered:')
                    })
                    .run();
            });
        });

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


        describe("after entering the pregnant woman's number", function() {
            it("should ask for the clinic code", function() {
                return tester
                    .setup.user.addr('+270001')
                    .setup.user.state('states_mobile_no')
                    .input('0821234567')
                    .check.interaction({
                        state: 'states_clinic_code',
                        reply: (
                            'Please enter the clinic code for the facility ' +
                            'where this pregnancy is being registered:')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.working_on, "+27821234567");
                        assert.equal(contact.extra.is_registered, undefined);
                        assert.equal(contact.extra.last_stage, 'states_clinic_code');
                    })
                    .run();
            });
        });

        describe("after entering the clinic code", function() {
            describe("if the clinic code is not valid", function() {
                it("should ask for the clinic_code again", function() {
                    return tester
                        .setup.user.addr('+270001')
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
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+270001',
                                extra : {
                                    working_on: '+27821234567'
                                }
                            });
                        })
                        .setup.user.addr('+270001')
                        .setup.user.state('states_clinic_code')
                        .input('12345')
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
                                '9. Dec'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821234567'
                            });
                            assert.equal(contact.extra.clinic_code, '12345');
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
                        .setup.user.addr('+270001')
                        .setup.user.state('states_clinic_code')
                        .input('234567')
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
                                '9. Dec'
                            ].join('\n')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+270001'
                            });
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
                        .setup.user.addr('+270001')
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
            it("should ask for the pregnant woman's id type", function() {
                return tester
                    .setup.user.addr('+270001')
                    .setup.user.state('states_due_date_day')
                    .input('10')
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

        describe("if the user selects SA ID (id type)", function() {
            it("should set id type, ask for their id number", function() {
                return tester
                    .setup.user.addr('+270001')
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
                    .setup.user.addr('+270001')
                    .setup.user.state('states_sa_id')
                    .input('5101015009088')
                    .check.interaction({
                        state: 'states_language',
                        reply: ['Please select the language that the ' +
                            'pregnant mother would like to get messages in:',
                            '1. English',
                            '2. Afrikaans',
                            '3. Zulu',
                            '4. Xhosa',
                            '5. Sotho',
                            '6. Setswana'
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
                    .setup.user.addr('+270001')
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
                    .setup.user.addr('+270001')
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
                    .setup.user.addr('+270001')
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

        describe("if the user selects Passport (id type)", function() {
            it("should set id type, ask for their country of origin", function() {
                return tester
                    .setup.user.addr('+270001')
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
                    .setup.user.addr('+270001')
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
                    .setup.user.addr('+270001')
                    .setup.user.state('states_passport_no')
                    .input('12345')
                    .check.interaction({
                        state: 'states_language',
                        reply: ['Please select the language that the ' +
                            'pregnant mother would like to get messages in:',
                            '1. English',
                            '2. Afrikaans',
                            '3. Zulu',
                            '4. Xhosa',
                            '5. Sotho',
                            '6. Setswana'
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
                    .setup.user.addr('+270001')
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
                    .setup.user.addr('+270001')
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
                    .setup.user.addr('+270001')
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
                    .setup.user.addr('+270001')
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
            it("should ask for their birth year again", function() {
                return tester
                    .setup.user.addr('+270001')
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
        });

        describe("after the user enters their birth year", function() {
            it("should save birth year, ask for their birth month", function() {
                return tester
                    .setup.user.addr('+270001')
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
                    .setup.user.addr('+270001')
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
                    .setup.user.addr('+270001')
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
            it("should save birth day and dob, ask for pregnant woman's msg language", function() {
                return tester
                    .setup.user.addr('+270001')
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
                            '1. English',
                            '2. Afrikaans',
                            '3. Zulu',
                            '4. Xhosa',
                            '5. Sotho',
                            '6. Setswana'
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

        describe("after the mom's msg language is selected", function() {
            describe("if the phone used is not the mom's", function() {
                it("should save msg language, thank them and exit", function() {
                    return tester
                        .setup.user.addr('+270001')
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
                                    clinic_code: '12345',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'sa_id',
                                    sa_id: '5101025009086',
                                    birth_year: '1951',
                                    birth_month: '01',
                                    birth_day: '02',
                                    dob: '1951-01-02'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.state('states_language')
                        .input('1')
                        .check.interaction({
                            state: 'states_end_success',
                            reply: ('Thank you. The pregnant woman will now ' +
                                'receive weekly messages about her pregnancy ' +
                                'from the Department of Health.')
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
                            assert.equal(metrics['test.clinic.states_end_success.no_incomplete'], undefined);
                            assert.deepEqual(metrics['test.clinic.sum.doc_to_jembi_success'].values, [1]);
                            assert.deepEqual(metrics['test.clinic.sum.json_to_jembi_success'].values, [1]);
                        })
                        .check.reply.ends_session()
                        .run();
                });
            });
            
            describe("if the phone used is the mom's", function() {
                it("should save msg language, thank them and exit", function() {
                    return tester
                        .setup.user.addr('+27821234567')
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '12345',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'sa_id',
                                    sa_id: '5101025009086',
                                    birth_year: '1951',
                                    birth_month: '01',
                                    birth_day: '02',
                                    dob: '1951-01-02',
                                    ussd_sessions: '5'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.state('states_language')
                        .input('1')
                        .check.interaction({
                            state: 'states_end_success',
                            reply: ('Thank you. The pregnant woman will now ' +
                                'receive weekly messages about her pregnancy ' +
                                'from the Department of Health.')
                        })
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821234567'
                            });
                            assert.equal(contact.extra.language_choice, 'en');
                            assert.equal(contact.extra.ussd_sessions, '0');
                            assert.equal(contact.extra.is_registered, 'true');
                            assert.equal(contact.extra.is_registered_by, 'clinic');
                            assert.equal(contact.extra.last_stage, 'states_end_success');
                            assert.equal(contact.extra.metric_sessions_to_register, '5');
                            assert.equal(contact.extra.no_registrations, undefined);
                            assert.equal(contact.extra.registered_by, undefined);                            
                            assert.equal(contact.extra.subscription_type, '1');
                            assert.equal(contact.extra.subscription_rate, '3');
                            assert.equal(contact.extra.is_registered, 'true');
                            assert.equal(contact.extra.is_registered_by, 'clinic');
                        })
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.avg.sessions_to_register'].values, [5]);
                            assert.deepEqual(metrics['test.clinic.percent_incomplete_registrations'].values, [25]);
                            assert.deepEqual(metrics['test.clinic.percent_complete_registrations'].values, [75]);
                            assert.deepEqual(metrics['test.clinic.states_end_success.no_incomplete'], undefined);
                            assert.deepEqual(metrics['test.clinic.sum.doc_to_jembi_success'].values, [1]);
                            assert.deepEqual(metrics['test.clinic.sum.json_to_jembi_success'].values, [1]);

                        })
                        .check.reply.ends_session()
                        .run();
                });

                it("should put them in language group", function() {
                    return tester
                        .setup.user.addr('+27821234567')
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '12345',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'sa_id',
                                    sa_id: '5101025009086',
                                    birth_year: '1951',
                                    birth_month: '01',
                                    birth_day: '02',
                                    dob: '1951-01-02',
                                    ussd_sessions: '5'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.state('states_language')
                        .input('1')
                        .check(function(api) {
                            var contact = api.contacts.store[0];
                            assert.equal(contact.extra.language_choice, 'en');
                            assert.deepEqual(contact.groups, ['en_key']);
                        })
                        .run();
                });
            });

            describe("if the phone used is the mom's", function() {
                it("should send her an SMS on complete registration", function() {
                    return tester
                        .setup.user.addr('+27821234567')
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '12345',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'sa_id',
                                    sa_id: '5101025009086',
                                    birth_year: '1951',
                                    birth_month: '01',
                                    birth_day: '02',
                                    dob: '1951-01-02',
                                    ussd_sessions: '5'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.state('states_language')
                        .input('1')
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
                            assert.equal(sms.to_addr,'+27821234567');
                        })
                        .run();
                });
            });

            describe("if the phone used is not the mom's", function() {
                it("should send her an SMS on complete registration", function() {
                    return tester
                        .setup.user.addr('+270001')
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
                                    clinic_code: '12345',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'sa_id',
                                    sa_id: '5101025009086',
                                    birth_year: '1951',
                                    birth_month: '01',
                                    birth_day: '02',
                                    dob: '1951-01-02'
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.state('states_language')
                        .input('1')
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
                            assert.equal(sms.to_addr,'+27821234567');
                        })
                        .run();
                });
            });

            describe("if user did not provide an sa_id number", function() {
                it("should not try to send jembi doc - send json only", function() {
                    return tester
                        .setup.user.addr('+27001')
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+27001',
                                extra : {
                                    clinic_code: '12345',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'none',
                                    ussd_sessions: '5',
                                    due_date_month: '05',
                                    due_date_day: ''
                                },
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4"
                            });
                        })
                        .setup.user.state('states_language')
                        .input('1')
                        .check.interaction({
                            state: 'states_end_success',
                            reply: ('Thank you. The pregnant woman will now ' +
                                'receive weekly messages about her pregnancy ' +
                                'from the Department of Health.')
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
                            assert.deepEqual(metrics['test.clinic.states_end_success.no_incomplete'], undefined);
                            assert.deepEqual(metrics['test.clinic.sum.doc_to_jembi_success'], undefined);
                            assert.deepEqual(metrics['test.clinic.sum.json_to_jembi_success'].values, [1]);
                        })
                        .check.reply.ends_session()
                        .run();
                });
            });
            
            describe("if jembi sends fail", function() {
                it.skip("should fire fail metrics", function() {
                    return tester
                        .setup.user.addr('+27821234567')
                        .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+27821234567',
                                extra : {
                                    clinic_code: '12345',
                                    suspect_pregnancy: 'yes',
                                    id_type: 'sa_id',
                                    sa_id: '5101025009086',
                                    birth_year: '1951',
                                    birth_month: '01',
                                    birth_day: '02',
                                    dob: '1951-01-02',
                                    ussd_sessions: '5'
                                }
                            });
                        })
                        .setup.user.state('states:language')
                        .input('1')
                        .check.interaction({
                            state: 'states:end_success',
                            reply: ('Thank you. The pregnant woman will now ' +
                                'receive weekly messages about her pregnancy ' +
                                'from the Department of Health.')
                        })
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.clinic.sum.doc_to_jembi_fail'].values, [1]);
                            assert.deepEqual(metrics['test.clinic.sum.json_to_jembi_fail'].values, [1]);
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
                            .setup.user.addr('+273444')
                            .setup.user.state('states_start')
                            .input('1')
                            .input.session_event('close')
                            .check(function(api) {
                                var smses = _.where(api.outbound.store, {
                                    endpoint: 'sms'
                                });
                                assert.equal(smses.length,0);
                            })
                            .check(function(api) {
                                var metrics = api.metrics.stores.test_metric_store;
                                assert.deepEqual(metrics['test.clinic.states_start.no_incomplete'].values, [1]);
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
                            .setup.user.addr('+273323')
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
                                assert.equal(sms.to_addr,'+273323');
                            }).run();
                    });
                });
            });
        });
    });
});
