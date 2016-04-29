var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');
var _ = require('lodash');
var messagestore = require('./messagestore');
var optoutstore = require('./optoutstore');
var DummyMessageStoreResource = messagestore.DummyMessageStoreResource;
var DummyOptoutResource = optoutstore.DummyOptoutResource;


describe("app", function() {
    describe("for nurse ussd use", function() {
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
                    name: 'nurse_ussd',
                    env: 'test',
                    metric_store: 'test_metric_store',
                    testing_today: 'April 4, 2014 07:07:07',
                    endpoints: {
                        "sms": {"delivery_class": "sms"}
                    },
                    channel: "*120*550*5#",
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
                    }
                })
                .setup(function(api) {
                    api.metrics.stores = {'test_metric_store': {}};
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                })
                .setup(function(api) {
                    // user with working_on extra
                    api.contacts.add({
                        msisdn: '+27821231111',
                        extra: {
                            nc_working_on: '+27821232222'
                        },
                    });
                })
                .setup(function(api) {
                    // registered user
                    api.contacts.add({
                        msisdn: '+27821237777',
                        extra: {
                            nc_last_reg_id: "7",
                            nc_is_registered: 'true',
                            nc_faccode: '123456',
                            nc_facname: 'WCL clinic',
                            nc_working_on: "",
                            nc_id_type: "sa_id",
                            nc_sa_id_no: "5101025009086",
                            nc_dob: "1951-01-02"
                        },
                    });
                })
                .setup(function(api) {
                    // opted_out user 1
                    api.contacts.add({
                        msisdn: '+27821239999',
                        extra: {
                            nc_opt_out_reason: 'job_change'
                        },
                    });
                })
                .setup(function(api) {
                    // opted_out user 2
                    api.contacts.add({
                        msisdn: '+27821233333',
                        extra: {
                            nc_last_reg_id: '3',
                            nc_opt_out_reason: 'other',
                            nc_is_registered: 'true',
                            nc_faccode: '123456',
                            nc_facname: 'WCL clinic',
                            nc_id_type: 'passport',
                            nc_passport_country: 'bw',
                            nc_passport_num: '33333',
                            nc_dob: '1976-03-04'
                        },
                    });
                })
                .setup(function(api) {
                    // opted_out user 3
                    api.contacts.add({
                        msisdn: '+27821230000',
                        extra: {
                            nc_last_reg_id: '0',
                            nc_opt_out_reason: 'not_useful',
                            nc_is_registered: 'true'
                        },
                    });
                })
                .setup(function(api) {
                    // opted_out user 4
                    api.contacts.add({
                        msisdn: '+27821240000',
                        extra: {
                            nc_last_reg_id: '4',
                            nc_opt_out_reason: 'unknown',
                            nc_is_registered: 'true',
                            nc_faccode: '123456',
                            nc_facname: 'WCL clinic',
                            nc_id_type: 'passport',
                            nc_passport_country: 'bw',
                            nc_passport_num: '44444',
                            nc_dob: '1976-03-04'
                        },
                    });
                })
                ;
        });

        // Session Length Helper
        describe('using the session length helper', function () {
            it('should publish metrics', function () {
                return tester
                    .setup(function(api, im) {
                        api.kv.store['session_length_helper.' + api.config.app.name + '.foodacom.sentinel'] = '2000-12-12';
                        api.kv.store['session_length_helper.' + api.config.app.name + '.foodacom'] = 42;
                    })
                    .setup.user({
                        state: 'isl_route',
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

        // Session Start Delegation
        describe("session start", function() {
            describe("new user", function() {
                it("should give 3 options", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .setup.char_limit(140)  // limit first state chars
                        .inputs(
                            {session_event: 'new'}  // dial in
                        )
                        .check.interaction({
                            state: 'st_not_subscribed',
                            reply: [
                                "Welcome to NurseConnect. Do you want to:",
                                '1. Subscribe for the first time',
                                '2. Change your old number',
                                '3. Subscribe somebody else'
                            ].join('\n')
                        })
                        .run();
                });
                it("should reset working_on extra", function() {
                    return tester
                        .setup.user.addr('27821231111')
                        .inputs(
                            {session_event: 'new'}  // dial in
                        )
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821231111'
                            });
                            assert.equal(Object.keys(contact.extra).length, 1);
                            assert.equal(contact.extra.nc_working_on, "");
                        })
                        .run();
                });
                it("should save extras", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // dial in
                        )
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821234444'
                            });
                            assert.equal(Object.keys(contact.extra).length, 1);
                            assert.equal(contact.extra.nc_working_on, "");
                        })
                        .run();
                });
                it("should record metrics", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // dial in
                        )
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.equal(Object.keys(metrics).length, 0);
                            assert.deepEqual(metrics['test.sum.sessions'], undefined);
                        })
                        .run();
                });
            });
            describe("registered user", function() {
                it("should give 5 options", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .setup.char_limit(140)  // limit first state chars
                        .inputs(
                            {session_event: 'new'}  // dial in
                        )
                        .check.interaction({
                            state: 'st_subscribed',
                            reply: [
                                "Welcome to NurseConnect",
                                '1. Subscribe a friend',
                                '2. Change your no.',
                                '3. Change facility code',
                                '4. Change ID no.',
                                '5. Change SANC no.',
                                '6. More'
                            ].join('\n')
                        })
                        .run();
                });
                it("should give 2 options when user selects more", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .setup.char_limit(140)  // limit first state chars
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '6'  // st_subscribed - more options
                        )
                        .check.interaction({
                            state: 'st_subscribed',
                            reply: [
                                "Welcome to NurseConnect",
                                "1. Change Persal no.",
                                "2. Stop SMS",
                                "3. Back"
                            ].join('\n')
                        })
                        .run();
                });
                it("should give the first 5 options when user selects back", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .setup.char_limit(140)  // limit first state chars
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '6'  // st_subscribed - more options
                            , '3'  // st_subscribed - back to first set of options
                        )
                        .check.interaction({
                            state: 'st_subscribed',
                            reply: [
                                "Welcome to NurseConnect",
                                '1. Subscribe a friend',
                                '2. Change your no.',
                                '3. Change facility code',
                                '4. Change ID no.',
                                '5. Change SANC no.',
                                '6. More'
                            ].join('\n')
                        })
                        .run();
                });
            });
        });

        // Timeout Testing
        describe("when a user timed out", function() {
            describe("very first timeout", function() {
                it("should send redial sms", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '1'  // st_not_subscribed
                            , '1'  // st_permission_self
                            , '123456'  // st_faccode
                            , {session_event: 'close'}  // timeout
                            , {session_event: 'new'}  // redial
                        )
                        .check(function(api) {
                            var smses = _.where(api.outbound.store, {
                                endpoint: 'sms'
                            });
                            var sms = smses[0];
                            assert.equal(smses.length,1);
                            assert.equal(sms.content,
                                "Please dial back in to *120*550*5# to complete the NurseConnect registration."
                            );
                            assert.equal(sms.to_addr,'27821234444');
                        })
                        .run();
                });
            });
            describe("second timeout", function() {
                it("should not send another redial sms", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '1'  // st_not_subscribed
                            , '1'  // st_permission_self
                            , '123456'  // st_faccode
                            , {session_event: 'close'}  // timeout
                            , {session_event: 'new'}  // redial
                            , {session_event: 'close'}  // timeout
                            , {session_event: 'new'}  // redial
                        )
                        .check(function(api) {
                            var smses = _.where(api.outbound.store, {
                                endpoint: 'sms'
                            });
                            var sms = smses[0];
                            assert.equal(smses.length,1);
                            assert.equal(sms.to_addr,'27821234444');
                        })
                        .run();
                });
            });
            describe("timeout during registration", function() {
                describe("if they were on a non-timeout state", function() {
                    it("should directly go back to their previous state", function() {
                        return tester
                            .setup.user.addr('27821234444')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , {session_event: 'close'}  // timeout
                                , {session_event: 'new'}  // redial
                            )
                            .check.interaction({
                                state: 'st_not_subscribed'
                            })
                            .run();
                    });
                });
                describe("if they were on a timeout state - self reg", function() {
                    it("should ask if they want to continue registration", function() {
                        return tester
                            .setup.user.addr('27821234444')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '1'  // st_not_subscribed
                                , '1'  // st_permission_self
                                , '123456'  // st_faccode
                                , {session_event: 'close'}  // timeout
                                , {session_event: 'new'}  // redial
                            )
                            .check.interaction({
                                state: 'st_timed_out',
                                reply: [
                                    "Welcome to NurseConnect. Would you like to continue your previous session for 0821234444?",
                                    '1. Yes',
                                    '2. Start Over'
                                ].join('\n')
                            })
                            .run();
                    });
                });
                describe("if they were on a timeout state - other reg", function() {
                    it("should ask if they want to continue registration", function() {
                        return tester
                            .setup.user.addr('27821234444')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '3'  // st_not_subscribed
                                , '1'  // st_permission_other
                                , '0821235555'  // st_msisdn
                                , '123456'  // st_faccode
                                , {session_event: 'close'}  // timeout
                                , {session_event: 'new'}  // redial
                            )
                            .check.interaction({
                                state: 'st_timed_out',
                                reply: [
                                    "Welcome to NurseConnect. Would you like to continue your previous session for 0821235555?",
                                    '1. Yes',
                                    '2. Start Over'
                                ].join('\n')
                            })
                            .run();
                    });
                });
            });
            describe("if the user chooses to continue registration", function() {
                it("should return to dropoff state", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '1'  // st_not_subscribed
                            , '1'  // st_permission_self
                            , '123456'  // st_faccode
                            , {session_event: 'close'}  // timeout
                            , {session_event: 'new'}  // redial
                            , '1'  // st_timed_out - continue registration
                        )
                        .check.interaction({
                            state: 'st_facname',
                            reply: [
                                'Please confirm your facility: WCL clinic',
                                '1. Confirm',
                                '2. Not the right facility'
                            ].join('\n')
                        })
                        .run();
                });
            });
            describe("if the user chooses to abort registration", function() {
                it("should restart", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '1'  // st_not_subscribed
                            , '1'  // st_permission_self
                            , '123456'  // st_faccode
                            , {session_event: 'close'}  // timeout
                            , {session_event: 'new'}  // redial
                            , '2'  // st_timed_out - abort registration
                        )
                        .check.interaction({
                            state: 'st_not_subscribed'
                        })
                        .run();
                });
            });
        });

        // Unique User Metrics
        describe("when a new unique user logs on", function() {
            it("should increment the no. of unique users metric by 1", function() {
                return tester
                    .inputs(
                            {session_event: 'new'}  // dial in
                    )
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.equal(Object.keys(metrics).length, 0);
                        // assert.deepEqual(metrics['test.nurse_ussd.sum.unique_users'].values, [1]);
                        // assert.deepEqual(metrics['test.sum.unique_users'].values, [1]);
                    })
                    .run();
            });
        });

        // Self Registration Flow
        describe("self registration completion", function() {
            it("should reach end state", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '1'  // st_not_subscribed - self registration
                        , '1'  // st_permission_self - consent
                        , '123456'  // st_faccode
                        , '1'  // st_facname - confirm
                    )
                    .check.interaction({
                        state: 'st_end_reg',
                        reply: "Thank you. Weekly NurseConnect messages will now be sent to this number."
                    })
                    .check.reply.ends_session()
                    .run();
            });
            it("should save extras", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '1'  // st_not_subscribed - self registration
                        , '1'  // st_permission_self - consent
                        , '123456'  // st_faccode
                        , '1'  // st_facname - confirm
                    )
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821234444'
                        });
                        assert.equal(Object.keys(contact.extra).length, 4);
                        assert.equal(contact.extra.nc_faccode, '123456');
                        assert.equal(contact.extra.nc_facname, 'WCL clinic');
                        assert.equal(contact.extra.nc_is_registered, 'true');
                        assert.equal(contact.extra.nc_working_on, "");
                    })
                    .run();
            });
            it("should fire metrics", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '1'  // st_not_subscribed - self registration
                        , '1'  // st_permission_self - consent
                        , '123456'  // st_faccode
                        , '1'  // st_facname - confirm
                    )
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.equal(Object.keys(metrics).length, 2);
                        assert.deepEqual(metrics['test.nurse_ussd.registrations.sum'].values, [1]);
                        assert.deepEqual(metrics['test.nurse_ussd.registrations.last'].values, [1]);
                    })
                    .run();
            });
            it("should send welcome sms", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '1'  // st_not_subscribed - self registration
                        , '1'  // st_permission_self - consent
                        , '123456'  // st_faccode
                        , '1'  // st_facname - confirm
                    )
                    .check(function(api) {
                        var smses = _.where(api.outbound.store, {
                            endpoint: 'sms'
                        });
                        var sms = smses[0];
                        assert.equal(smses.length, 1);
                        assert.equal(sms.content,
                            "Welcome to NurseConnect. For more options or to " +
                            "opt out, dial *120*550*5#."
                        );
                        assert.equal(sms.to_addr, '+27821234444');
                    })
                    .run();
                });
        });

        // Other Registration Flow
        describe("other registration completion", function() {
            it("should reach end state", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '1'  // st_permission_other - consent
                        , '0821235555'  // st_msisdn
                        , '123456'  // st_faccode
                        , '1'  // st_facname - confirm
                    )
                    .check.interaction({
                        state: 'st_end_reg',
                        reply: "Thank you. Weekly NurseConnect messages will now be sent to this number."
                    })
                    .run();
            });
            it("should save extras", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '1'  // st_permission_other - consent
                        , '0821235555'  // st_msisdn
                        , '123456'  // st_faccode
                        , '1'  // st_facname - confirm
                    )
                    .check(function(api) {
                        var user = _.find(api.contacts.store, {
                          msisdn: '+27821234444'
                        });
                        assert.equal(Object.keys(user.extra).length, 2);
                        assert.equal(user.extra.nc_working_on, '+27821235555');
                        assert.equal(user.extra.nc_registrees, '+27821235555');
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821235555'
                        });
                        assert.equal(Object.keys(contact.extra).length, 4);
                        assert.equal(contact.extra.nc_faccode, '123456');
                        assert.equal(contact.extra.nc_facname, 'WCL clinic');
                        assert.equal(contact.extra.nc_is_registered, 'true');
                        assert.equal(contact.extra.nc_registered_by, '+27821234444');
                    })
                    .run();
            });
            it("should fire metrics", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '1'  // st_permission_other - consent
                        , '0821235555'  // st_msisdn
                        , '123456'  // st_faccode
                        , '1'  // st_facname - confirm
                    )
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.equal(Object.keys(metrics).length, 2);
                        assert.deepEqual(metrics['test.nurse_ussd.registrations.sum'].values, [1]);
                        assert.deepEqual(metrics['test.nurse_ussd.registrations.last'].values, [1]);
                    })
                    .run();
            });
            it("should send welcome sms", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '1'  // st_permission_other - consent
                        , '0821235555'  // st_msisdn
                        , '123456'  // st_faccode
                        , '1'  // st_facname - confirm
                    )
                    .check(function(api) {
                        var smses = _.where(api.outbound.store, {
                            endpoint: 'sms'
                        });
                        var sms = smses[0];
                        assert.equal(smses.length, 1);
                        assert.equal(sms.content,
                            "Welcome to NurseConnect. For more options or to " +
                            "opt out, dial *120*550*5#."
                        );
                        assert.equal(sms.to_addr, '+27821235555');
                    })
                    .run();
            });
        });

        // Opted Out User Opt-in (Self Registration)
        describe("opted out self reg", function() {
            it("should reach st_opt_in_reg", function() {
                return tester
                    .setup.user.addr('27821239999')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '1'  // st_not_subscribed - self registration
                        , '1'  // st_permission_self - consent
                    )
                    .check.interaction({
                        state: 'st_opt_in_reg',
                        reply: [
                            "This number previously opted out of NurseConnect messages. Please confirm that you would like to register this number again?",
                            '1. Yes',
                            '2. No'
                        ].join('\n')
                    })
                    .run();
            });
            it("should have extras", function() {
                return tester
                    .setup.user.addr('27821239999')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '1'  // st_not_subscribed - self registration
                        , '1'  // st_permission_self - consent
                    )
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821239999'
                        });
                        assert.equal(Object.keys(contact.extra).length, 2);
                        assert.equal(contact.extra.nc_working_on, "");
                        assert.equal(contact.extra.nc_opt_out_reason, "job_change");
                    })
                    .run();
            });
            it("should go to st_faccode if confirmed opt in", function() {
                return tester
                    .setup.user.addr('27821239999')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '1'  // st_not_subscribed - self registration
                        , '1'  // st_permission_self - consent
                        , '1'  // st_opt_in_reg - confirm
                    )
                    .check.interaction({
                        state: 'st_faccode'
                    })
                    .run();
            });
            it("should save extras", function() {
                return tester
                    .setup.user.addr('27821239999')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '1'  // st_not_subscribed - self registration
                        , '1'  // st_permission_self - consent
                        , '1'  // st_opt_in_reg - confirm
                    )
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821239999'
                        });
                        assert.equal(Object.keys(contact.extra).length, 2);
                        assert.equal(contact.extra.nc_working_on, "");
                        assert.equal(contact.extra.nc_opt_out_reason, "");
                    })
                    .run();
            });
        });

        // Opted Out User Opt-in (Other Registration)
        describe("opted out other reg", function() {
            it("should reach st_opt_in_reg", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '1'  // st_permission_other - consent
                        , '0821239999'  // st_msisdn
                    )
                    .check.interaction({
                        state: 'st_opt_in_reg',
                        reply: [
                            "This number previously opted out of NurseConnect messages. Please confirm that you would like to register this number again?",
                            '1. Yes',
                            '2. No'
                        ].join('\n')
                    })
                    .run();
            });
            it("should have extras", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '1'  // st_permission_other - consent
                        , '0821239999'  // st_msisdn
                    )
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821239999'
                        });
                        assert.equal(Object.keys(contact.extra).length, 1);
                        assert.equal(contact.extra.nc_working_on, undefined);  // defined on user
                        assert.equal(contact.extra.nc_opt_out_reason, "job_change");
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821234444'
                        });
                        assert.equal(Object.keys(contact.extra).length, 1);
                        assert.equal(contact.extra.nc_working_on, "+27821239999");
                    })
                    .run();
            });
            it("should go to st_faccode if confirmed opt in", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '1'  // st_permission_other - consent
                        , '0821239999'  // st_msisdn
                        , '1'  // st_opt_in_reg - confirm
                    )
                    .check.interaction({
                        state: 'st_faccode'
                    })
                    .run();
            });
            it("should save extras", function() {
                return tester
                    .setup.user.addr('27821239999')
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '1'  // st_permission_other - consent
                        , '0821239999'  // st_msisdn
                        , '1'  // st_opt_in_reg - confirm
                    )
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821239999'
                        });
                        assert.equal(Object.keys(contact.extra).length, 1);
                        assert.equal(contact.extra.nc_working_on, undefined);  // defined on user
                        assert.equal(contact.extra.nc_opt_out_reason, "");
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821234444'
                        });
                        assert.equal(Object.keys(contact.extra).length, 1);
                        assert.equal(contact.extra.nc_working_on, "+27821239999");
                    })
                    .run();
            });
        });

        // Deny Opt-in Permission
        describe("denying opt-in consent", function() {
            it("should present main menu option", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '1'  // st_permission_other - consent
                        , '0821239999'  // st_msisdn
                        , '2'  // st_opt_in_reg - deny
                    )
                    .check.interaction({
                        state: 'st_permission_denied',
                        reply: [
                            "You have chosen not to receive NurseConnect SMSs on this number and so cannot complete registration.",
                            '1. Main Menu'
                        ].join('\n')
                    })
                    .run();
            });
            it("should present main menu option", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '1'  // st_permission_other - consent
                        , '0821239999'  // st_msisdn
                        , '2'  // st_opt_in_reg - deny
                        , '1'  // st_permission_denied - main menu
                    )
                    .check.interaction({
                        state: 'st_not_subscribed',
                    })
                    .run();
            });
        });

        // Deny Registration Permission
        describe("denying registration consent", function() {
            it("should present main menu option", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '2'  // st_permissionotherf - denied
                    )
                    .check.interaction({
                        state: 'st_permission_denied',
                        reply: [
                            "You have chosen not to receive NurseConnect SMSs on this number and so cannot complete registration.",
                            '1. Main Menu'
                        ].join('\n')
                    })
                    .run();
            });
            it("should start over if main menu is selected", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '2'  // st_permissionotherf - denied
                        , '1'  // st_permission_denied - main menu
                    )
                    .check.interaction({
                        state: 'st_not_subscribed',
                    })
                    .run();
            });
        });

        // Incorrect Facility Name
        describe("user indicates wrong facility", function() {
            it("should return to faccode state", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '1'  // st_permission_other - consent
                        , '0821235555'  // st_msisdn
                        , '123456'  // st_faccode
                        , '2'  // st_facname - facility wrong
                    )
                    .check.interaction({
                        state: 'st_faccode',
                        reply: "Please enter their 6-digit facility code:"
                    })
                    .run();
            });
        });

        // Msisdn Validation
        describe("msisdn entry", function() {
            describe("poor input", function() {
                it("should loop back", function() {
                    return tester
                        .setup.user.state('st_msisdn')
                        .input('07262520201')
                        .check.interaction({
                            state: 'st_msisdn',
                            reply: "Sorry, the format of the mobile number is not correct. Please enter the mobile number again, e.g. 0726252020"
                        })
                        .run();
                });
            });
        });

        // Faccode Validation
        describe("faccode entry", function() {
            describe("contains letter", function() {
                it("should loop back without api call", function() {
                    return tester
                        .setup.user.state('st_faccode')
                        .input('12345A')
                        .check.interaction({
                            state: 'st_faccode',
                            reply: "Sorry, that code is not recognized. Please enter the 6-digit facility code again, e. 535970:"
                        })
                        .run();
                });
            });
            describe("is not 6-char number", function() {
                it("should loop back without api call", function() {
                    return tester
                        .setup.user.state('st_faccode')
                        .input('12345')
                        .check.interaction({
                            state: 'st_faccode',
                            reply: "Sorry, that code is not recognized. Please enter the 6-digit facility code again, e. 535970:"
                        })
                        .run();
                });
            });
            describe("is not on jembi system", function() {
                it("should loop back", function() {
                    return tester
                        .setup.user.state('st_faccode')
                        .input('888888')
                        .check.interaction({
                            state: 'st_faccode',
                            reply: "Sorry, that code is not recognized. Please enter the 6-digit facility code again, e. 535970:"
                        })
                        .run();
                });
            });
        });

        // Change Old Number
        describe("old number changing", function() {
            describe("choosing to change old number", function() {
                it("should go to st_change_old_nr", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_not_subscribed
                        )
                        .check.interaction({
                            state: 'st_change_old_nr',
                            reply: "Please enter the old number on which you used to receive messages, e.g. 0736436265:"
                        })
                        .run();
                });
            });
            describe("entering poor phone number", function() {
                it("should loop back", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_not_subscribed
                            , '12345'  // st_change_old_nr
                        )
                        .check.interaction({
                            state: 'st_change_old_nr',
                            reply: "Sorry, the format of the mobile number is not correct. Please enter your old mobile number again, e.g. 0726252020"
                        })
                        .run();
                });
            });
            describe("entering proper phone number - non-existent contact", function() {
                it("should ask to try again", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_not_subscribed
                            , '0821236666'  // st_change_old_nr
                        )
                        .check.interaction({
                            state: 'st_change_old_not_found',
                            reply: [
                                "The number 0821236666 is not currently subscribed to receive NurseConnect messages. Try again?",
                                "1. Yes",
                                "2. No"
                            ].join('\n')
                        })
                        .run();
                });
                it("should try again if chosen", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_not_subscribed
                            , '0821236666'  // st_change_old_nr
                            , '1'  // st_change_old_not_found - yes
                        )
                        .check.interaction({
                            state: 'st_change_old_nr',
                        })
                        .run();
                });
                it("should abort if chosen", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_not_subscribed
                            , '0821236666'  // st_change_old_nr
                            , '2'  // st_change_old_not_found
                        )
                        .check.interaction({
                            state: 'st_permission_denied',
                        })
                        .run();
                });
            });
            describe("entering proper phone number - existing contact", function() {
                it("should reach details changed end state", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_not_subscribed
                            , '0821237777'  // st_change_old_nr
                        )
                        .check.interaction({
                            state: 'st_end_detail_changed',
                            reply: "Thank you. Your NurseConnect details have been changed. To change any other details, please dial *120*550*5# again."
                        })
                        .run();
                });
                it("should transfer extras", function() {
                    return tester
                        .setup.user.addr('27821234444')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_not_subscribed
                            , '0821237777'  // st_change_old_nr
                        )
                        .check(function(api) {
                            var new_contact = _.find(api.contacts.store, {
                              msisdn: '+27821234444'
                            });
                            assert.equal(Object.keys(new_contact.extra).length, 8);
                            assert.equal(new_contact.extra.nc_faccode, '123456');
                            assert.equal(new_contact.extra.nc_last_reg_id, '7');
                            assert.equal(new_contact.extra.nc_facname, 'WCL clinic');
                            assert.equal(new_contact.extra.nc_is_registered, 'true');
                            assert.equal(new_contact.extra.nc_working_on, "");
                            assert.equal(new_contact.extra.nc_id_type, "sa_id");
                            assert.equal(new_contact.extra.nc_sa_id_no, "5101025009086");
                            assert.equal(new_contact.extra.nc_dob, "1951-01-02");
                        })
                        .check(function(api) {
                            var old_contact = _.find(api.contacts.store, {
                              msisdn: '+27821237777'
                            });
                            assert.equal(Object.keys(old_contact.extra).length, 0);
                        })
                        .run();
                });
            });
        });

        // Change to New Number
        describe("switch to new number", function() {
            describe("choosing to switch to new number", function() {
                it("should go to st_change_num", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_subscribed - change num
                        )
                        .check.interaction({
                            state: 'st_change_num',
                            reply: "Please enter the new number on which you want to receive messages, e.g. 0736252020:"
                        })
                        .run();
                });
                it("should have extras", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_subscribed - change num
                        )
                        .check(function(api) {
                            var old_contact = _.find(api.contacts.store, {
                              msisdn: '+27821237777'
                            });
                            assert.equal(Object.keys(old_contact.extra).length, 8);
                            assert.equal(old_contact.extra.nc_last_reg_id, '7');
                            assert.equal(old_contact.extra.nc_faccode, '123456');
                            assert.equal(old_contact.extra.nc_facname, 'WCL clinic');
                            assert.equal(old_contact.extra.nc_is_registered, 'true');
                            assert.equal(old_contact.extra.nc_working_on, "");
                            assert.equal(old_contact.extra.nc_id_type, "sa_id");
                            assert.equal(old_contact.extra.nc_sa_id_no, "5101025009086");
                            assert.equal(old_contact.extra.nc_dob, "1951-01-02");
                        })
                        .check(function(api) {
                            var opted_out_contact = _.find(api.contacts.store, {
                              msisdn: '+27821239999'
                            });
                            assert.equal(Object.keys(opted_out_contact.extra).length, 1);
                            assert.equal(opted_out_contact.extra.nc_opt_out_reason, "job_change");
                        })
                        .run();
                });
            });
            describe("entering new unused number", function() {
                it("should go to st_end_detail_changed", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_subscribed - change num
                            , '0821238888'  // st_change_num
                        )
                        .check.interaction({
                            state: 'st_end_detail_changed',
                        })
                        .run();
                });
                it("should transfer extras", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_subscribed - change num
                            , '0821238888'  // st_change_num
                        )
                        .check(function(api) {
                            var new_contact = _.find(api.contacts.store, {
                              msisdn: '+27821238888'
                            });
                            assert.equal(Object.keys(new_contact.extra).length, 8);
                            assert.equal(new_contact.extra.nc_last_reg_id, '7');
                            assert.equal(new_contact.extra.nc_faccode, '123456');
                            assert.equal(new_contact.extra.nc_facname, 'WCL clinic');
                            assert.equal(new_contact.extra.nc_is_registered, 'true');
                            assert.equal(new_contact.extra.nc_working_on, "");
                            assert.equal(new_contact.extra.nc_id_type, "sa_id");
                            assert.equal(new_contact.extra.nc_sa_id_no, "5101025009086");
                            assert.equal(new_contact.extra.nc_dob, "1951-01-02");
                        })
                        .check(function(api) {
                            var old_contact = _.find(api.contacts.store, {
                              msisdn: '+27821237777'
                            });
                            assert.equal(Object.keys(old_contact.extra).length, 0);
                        })
                        .run();
                });
            });
            describe("entering opted out number", function() {
                it("should go to st_opt_in_change", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_subscribed - change num
                            , '0821239999'  // st_change_num
                        )
                        .check.interaction({
                            state: 'st_opt_in_change',
                            reply: [
                                "This number opted out of NurseConnect messages before. Please confirm that you want to receive messages again on this number?",
                                "1. Yes",
                                "2. No"
                            ].join('\n')
                        })
                        .run();
                });
                it("should transfer extras on opt-in", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_subscribed - change num
                            , '0821239999'  // st_change_num
                            , '1'  // st_opt_in_change - yes
                        )
                        .check(function(api) {
                            var new_contact = _.find(api.contacts.store, {
                              msisdn: '+27821239999'
                            });
                            assert.equal(Object.keys(new_contact.extra).length, 8);
                            assert.equal(new_contact.extra.nc_last_reg_id, '7');
                            assert.equal(new_contact.extra.nc_faccode, '123456');
                            assert.equal(new_contact.extra.nc_facname, 'WCL clinic');
                            assert.equal(new_contact.extra.nc_is_registered, 'true');
                            assert.equal(new_contact.extra.nc_working_on, "");
                            assert.equal(new_contact.extra.nc_id_type, "sa_id");
                            assert.equal(new_contact.extra.nc_sa_id_no, "5101025009086");
                            assert.equal(new_contact.extra.nc_dob, "1951-01-02");
                        })
                        .check(function(api) {
                            var old_contact = _.find(api.contacts.store, {
                              msisdn: '+27821237777'
                            });
                            assert.equal(Object.keys(old_contact.extra).length, 0);
                        })
                        .run();
                });
            });
            describe("entering non-opted-out number with active subs", function() {
                it("should block progress", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '2'  // st_subscribed - change num
                            , '0821238889'  // st_change_num
                        )
                        .check.interaction({
                            state: 'st_block_active_subs',
                            reply: "Sorry, the number you are trying to move to already has an active registration. To manage that registration, please redial from that number."
                        })
                        .check.reply.ends_session()
                        .run();
                });
            });
        });

        // ID Validation
        describe("id number entry", function() {
            describe("invalid id", function() {
                it("should loop back", function() {
                    return tester
                        .setup.user.state('st_id_no')
                        .input('12345A')
                        .check.interaction({
                            state: 'st_id_no',
                            reply: "Sorry, the format of the ID number is not correct. Please enter their RSA ID number again, e.g. 7602095060082"
                        })
                        .run();
                });
            });
        });

        // Passport Validation
        describe("passport number entry", function() {
            describe("invalid passport number - non alphanumeric", function() {
                it("should loop back", function() {
                    return tester
                        .setup.user.state('st_passport_no')
                        .input('AA-1234')
                        .check.interaction({
                            state: 'st_passport_no',
                            reply: "Sorry, the format of the passport number is not correct. Please enter the passport number again."
                        })
                        .run();
                });
            });
            describe("invalid passport number - too short", function() {
                it("should loop back", function() {
                    return tester
                        .setup.user.state('st_passport_no')
                        .input('1234')
                        .check.interaction({
                            state: 'st_passport_no',
                            reply: "Sorry, the format of the passport number is not correct. Please enter the passport number again."
                        })
                        .run();
                });
            });
        });

        // DOB Validation
        describe("dob entry", function() {
            describe("invalid dob chars", function() {
                it("should loop back", function() {
                    return tester
                        .setup.user.state('st_passport_dob')
                        .input('01-01-1980')
                        .check.interaction({
                            state: 'st_passport_dob',
                            reply: "Sorry, the format of the date of birth is not correct. Please enter it again, e.g. 27 May 1975 as 27051975:"
                        })
                        .run();
                });
            });
            describe("not real date", function() {
                it("should loop back", function() {
                    return tester
                        .setup.user.state('st_passport_dob')
                        .input('29021981    ')
                        .check.interaction({
                            state: 'st_passport_dob',
                            reply: "Sorry, the format of the date of birth is not correct. Please enter it again, e.g. 27 May 1975 as 27051975:"
                        })
                        .run();
                });
            });
            describe("inverted date", function() {
                it("should loop back", function() {
                    return tester
                        .setup.user.state('st_passport_dob')
                        .input('19800101')
                        .check.interaction({
                            state: 'st_passport_dob',
                            reply: "Sorry, the format of the date of birth is not correct. Please enter it again, e.g. 27 May 1975 as 27051975:"
                        })
                        .run();
                });
            });
        });

        // Change Details
        describe("changing details", function() {
            describe("change faccode", function() {
                it("should ask for new faccode", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '3'  // st_subscribed - change faccode
                        )
                        .check.interaction({
                            state: 'st_change_faccode',
                            reply: "Please enter the 6-digit facility code for your new facility, e.g. 456789:"
                        })
                        .run();
                });
                it("should have extras", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '3'  // st_subscribed - change faccode
                        )
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821237777'
                            });
                            assert.equal(Object.keys(contact.extra).length, 8);
                            assert.equal(contact.extra.nc_faccode, "123456");
                            assert.equal(contact.extra.nc_facname, "WCL clinic");
                        })
                        .run();
                });
                it("should reach details changed end state", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '3'  // st_subscribed - change faccode
                            , '234567'  // st_change_faccode - olt clinic
                        )
                        .check.interaction({
                            state: 'st_end_detail_changed',
                            reply: "Thank you. Your NurseConnect details have been changed. To change any other details, please dial *120*550*5# again."
                        })
                        .check.reply.ends_session()
                        .run();
                });
                it("should save extras", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '3'  // st_subscribed - change faccode
                            , '234567'  // st_change_faccode - olt clinic
                        )
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821237777'
                            });
                            assert.equal(Object.keys(contact.extra).length, 8);
                            assert.equal(contact.extra.nc_faccode, "234567");
                            assert.equal(contact.extra.nc_facname, "OLT clinic");
                        })
                        .run();
                });
            });

            describe("change sanc", function() {
                it("should ask for sanc", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '5' // st_subscribed - change sanc
                        )
                        .check.interaction({
                            state: 'st_change_sanc',
                            reply: "Please enter your 8-digit SANC registration number, e.g. 34567899:"
                        })
                        .run();
                });
                it("should have extras", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '5' // st_subscribed - change sanc
                        )
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821237777'
                            });
                            assert.equal(Object.keys(contact.extra).length, 8);
                            assert.equal(contact.extra.nc_sanc, undefined);
                        })
                        .run();
                });
                it("should loop back if non-numeric char", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '5' // st_subscribed - change sanc
                            , '3456789A'  // st_change_sanc
                        )
                        .check.interaction({
                            state: 'st_change_sanc',
                            reply: "Sorry, the format of the SANC registration number is not correct. Please enter it again, e.g. 34567899:"
                        })
                        .run();
                });
                it("should loop back if not 8 chars", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '5' // st_subscribed - change sanc
                            , '3456789'  // st_change_sanc
                        )
                        .check.interaction({
                            state: 'st_change_sanc',
                            reply: "Sorry, the format of the SANC registration number is not correct. Please enter it again, e.g. 34567899:"
                        })
                        .run();
                });
                it("should reach details changed end state", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '5' // st_subscribed - change sanc
                            , '34567890'  // st_change_sanc
                        )
                        .check.interaction({
                            state: 'st_end_detail_changed',
                            reply: "Thank you. Your NurseConnect details have been changed. To change any other details, please dial *120*550*5# again."
                        })
                        .run();
                });
                it("should save extras", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '5' // st_subscribed - change sanc
                            , '34567890'  // st_change_sanc
                        )
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821237777'
                            });
                            assert.equal(Object.keys(contact.extra).length, 9);
                            assert.equal(contact.extra.nc_sanc, "34567890");
                        })
                        .run();
                });
            });

            describe("change persal", function() {
                it("should ask for persal", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '6'  // st_subscribed - more options
                            , '1'  // st_subscribed - change persal
                        )
                        .check.interaction({
                            state: 'st_change_persal',
                            reply: "Please enter your 8-digit Persal employee number, e.g. 11118888:"
                        })
                        .run();
                });
                it("should have extras", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '6'  // st_subscribed - more options
                            , '1'  // st_subscribed - change persal
                        )
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821237777'
                            });
                            assert.equal(Object.keys(contact.extra).length, 8);
                            assert.equal(contact.extra.nc_persal, undefined);
                        })
                        .run();
                });
                it("should loop back if non-numeric char", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '6'  // st_subscribed - more options
                            , '1'  // st_subscribed - change persal
                            , '3456789A'  // st_change_persal
                        )
                        .check.interaction({
                            state: 'st_change_persal',
                            reply: "Sorry, the format of the Persal employee number is not correct. Please enter it again, e.g. 11118888:"
                        })
                        .run();
                });
                it("should loop back if not 8 chars", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '6'  // st_subscribed - more options
                            , '1' // st_subscribed - change persal
                            , '3456789'  // st_change_persal
                        )
                        .check.interaction({
                            state: 'st_change_persal',
                            reply: "Sorry, the format of the Persal employee number is not correct. Please enter it again, e.g. 11118888:"
                        })
                        .run();
                });
                it("should reach details changed end state", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '6'  // st_subscribed - more options
                            , '1'  // st_subscribed - change persal
                            , '11114444'  // st_change_persal
                        )
                        .check.interaction({
                            state: 'st_end_detail_changed',
                            reply: "Thank you. Your NurseConnect details have been changed. To change any other details, please dial *120*550*5# again."
                        })
                        .run();
                });
                it("should save extras", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '6'  // st_subscribed - more options
                            , '1'  // st_subscribed - change persal
                            , '11114444'  // st_change_persal
                        )
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821237777'
                            });
                            assert.equal(Object.keys(contact.extra).length, 9);
                            assert.equal(contact.extra.nc_persal, "11114444");
                        })
                        .run();
                });
            });

            describe("change identification", function() {
                it("should display 2 options", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '4'  // st_subscribed - change id
                        )
                        .check.interaction({
                            state: 'st_change_id_no',
                            reply: [
                                'Please select your type of identification:',
                                '1. RSA ID',
                                '2. Passport'
                            ].join('\n')
                        })
                        .run();
                });
                it("should have extras", function() {
                    return tester
                        .setup.user.addr('27821237777')
                        .inputs(
                            {session_event: 'new'}  // dial in
                            , '4'  // st_subscribed - change id
                        )
                        .check(function(api) {
                            var contact = _.find(api.contacts.store, {
                              msisdn: '+27821237777'
                            });
                            assert.equal(Object.keys(contact.extra).length, 8);
                        })
                        .run();
                });
                describe("change ID no", function() {
                    it("should ask for their ID no", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '4'  // st_subscribed - change id
                                , '1'  // st_change_id_no - RSA ID
                            )
                            .check.interaction({
                                state: 'st_id_no',
                                reply: 'Please enter your 13-digit RSA ID number:'
                            })
                            .run();
                    });
                    it("should tell them their details have been changed", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '4'  // st_subscribed - change id
                                , '1'  // st_change_id_no - RSA ID
                                , '9001016265166 '  // st_id_no
                            )
                            .check.interaction({
                                state: 'st_end_detail_changed',
                                reply: 'Thank you. Your NurseConnect details have been changed. To change any other details, please dial *120*550*5# again.'
                            })
                            .run();
                    });
                    it("should save extras", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '4'  // st_subscribed - change id
                                , '1'  // st_change_id_no - RSA ID
                                , '9001016265166 '  // st_id_no
                            )
                            .check(function(api) {
                                var contact = _.find(api.contacts.store, {
                                  msisdn: '+27821237777'
                                });
                                assert.equal(Object.keys(contact.extra).length, 8);
                                assert.equal(contact.extra.nc_id_type, 'sa_id');
                                assert.equal(contact.extra.nc_sa_id_no, '9001016265166');
                                assert.equal(contact.extra.nc_dob, '1990-01-01');
                            })
                            .run();
                    });
                });
                describe("when a user wants to change their passport no", function() {
                    it("should ask for the origin of their passport", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '4'  // st_subscribed - change id
                                , '2'  // st_change_id_no - passport
                            )
                            .check.interaction({
                                state: 'st_passport',
                                reply: [
                                    'What is the country of origin of the passport?',
                                    '1. Namibia',
                                    '2. Botswana',
                                    '3. Mozambique',
                                    '4. Swaziland',
                                    '5. Lesotho',
                                    '6. Cuba',
                                    '7. Other'
                                ].join('\n')
                            })
                            .run();
                    });
                    it("should ask for their passport no", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}
                                , '4'  // st_subscribed - change id
                                , '2'  // st_change_id_no - passport
                                , '1'  // st_passport - namibia
                            )
                            .check.interaction({
                                state: 'st_passport_no',
                                reply: 'Please enter the passport number:'
                            })
                            .run();
                    });
                    it("should ask for their date of birth", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}
                                , '4'  // st_subscribed - change id
                                , '2'  // st_change_id_no - passport
                                , '1'  // st_passport - namibia
                                , 'Nam1234'  // st_passport_no
                            )
                            .check.interaction({
                                state: 'st_passport_dob',
                                reply: 'Please enter the date of birth, e.g. 27 May 1975 as 27051975:'
                            })
                            .run();
                    });
                    it("should tell them their details have been changed", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}
                                , '4'  // st_subscribed - change id
                                , '2'  // st_change_id_no - passport
                                , '1'  // st_passport - namibia
                                , 'Nam1234'  // st_passport_no
                                , '07031976'  // st_dob - 7 March 1976
                            )
                            .check.interaction({
                                state: 'st_end_detail_changed',
                                reply: 'Thank you. Your NurseConnect details have been changed. To change any other details, please dial *120*550*5# again.'
                            })
                            .run();
                    });
                    it("should save extras", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}
                                , '4'  // st_subscribed - change id
                                , '2'  // st_change_id_no - passport
                                , '1'  // st_passport - namibia
                                , 'Nam1234'  // st_passport_no
                                , '07031976'  // st_dob - 7 March 1976
                            )
                            .check(function(api) {
                                var contact = _.find(api.contacts.store, {
                                  msisdn: '+27821237777'
                                });
                                assert.equal(Object.keys(contact.extra).length, 10);
                                assert.equal(contact.extra.nc_id_type, 'passport');
                                assert.equal(contact.extra.nc_passport_country, 'na');
                                assert.equal(contact.extra.nc_passport_num, 'Nam1234');
                                assert.equal(contact.extra.nc_dob, '1976-03-07');
                            })
                            .run();
                    });
                });
            });
        });

        // Optout
        describe("opting out", function() {
            describe("registered user - not opted out", function() {
                describe("should reach st_optout", function() {
                    it("should ask optout reason", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                            )
                            .check.interaction({
                                state: 'st_optout',
                                reply: [
                                    "Please tell us why you no longer want messages:",
                                    "1. Not a nurse or midwife",
                                    "2. New user of number",
                                    "3. Messages not useful",
                                    "4. Other",
                                    "5. Main menu"
                                ].join("\n")
                            })
                            .run();
                    });
                    it("should have extras", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                            )
                            .check(function(api) {
                                var contact = _.find(api.contacts.store, {
                                  msisdn: '+27821237777'
                                });
                                assert.equal(Object.keys(contact.extra).length, 8);
                                assert.equal(contact.extra.nc_opt_out_reason, undefined);
                            })
                            .run();
                    });
                });

                describe("should reach st_end_detail_changed", function() {
                    it("should thank them", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                                , '1'  // st_optout - not a nurse
                            )
                            .check.interaction({
                                state: 'st_end_detail_changed',
                            })
                            .run();
                    });
                    it("should save extras", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                                , '1'  // st_optout - not a nurse
                            )
                            .check(function(api) {
                                var contact = _.find(api.contacts.store, {
                                  msisdn: '+27821237777'
                                });
                                assert.equal(Object.keys(contact.extra).length, 9);
                                assert.equal(contact.extra.nc_opt_out_reason, 'job_change');
                            })
                            .run();
                    });
                    it("should fire metrics", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                                , '1'  // st_optout - not a nurse
                            )
                            .check(function(api) {
                                var metrics = api.metrics.stores.test_metric_store;
                                assert.equal(Object.keys(metrics).length, 6);
                                assert.deepEqual(metrics['test.nurse_ussd.optouts.last'].values, [1]);
                                assert.deepEqual(metrics['test.nurse_ussd.optouts.sum'].values, [1]);
                                assert.deepEqual(metrics['test.nurseconnect.optouts.last'].values, [1]);
                                assert.deepEqual(metrics['test.nurseconnect.optouts.sum'].values, [1]);
                                assert.deepEqual(metrics['test.nurseconnect.optouts.job_change.last'].values, [1]);
                                assert.deepEqual(metrics['test.nurseconnect.optouts.job_change.sum'].values, [1]);
                            })
                            .run();
                    });
                });

                describe("choosing main menu", function() {
                    it("should bail", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                                , '5'  // st_optout - main menu
                            )
                            .check.interaction({
                                state: 'st_subscribed',
                            })
                            .run();
                    });
                });
            });

            describe("registered user - opted out, reason other", function() {
                describe("should reach st_optout", function() {
                    it("should ask prior optout reason", function() {
                        return tester
                            .setup.user.addr('27821233333')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                            )
                            .check.interaction({
                                state: 'st_optout',
                                reply: [
                                    "You have opted out before. Please tell us why:",
                                    "1. Not a nurse or midwife",
                                    "2. New user of number",
                                    "3. Messages not useful",
                                    "4. Other",
                                    "5. Main menu"
                                ].join("\n")
                            })
                            .run();
                    });
                    it("should have extras", function() {
                        return tester
                            .setup.user.addr('27821233333')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                            )
                            .check(function(api) {
                                var contact = _.find(api.contacts.store, {
                                  msisdn: '+27821233333'
                                });
                                assert.equal(Object.keys(contact.extra).length, 10);
                                assert.equal(contact.extra.nc_opt_out_reason, 'other');
                                assert.equal(contact.extra.nc_is_registered, 'true');
                            })
                            .run();
                    });
                });

                describe("should reach st_end_detail_changed", function() {
                    it("should thank them", function() {
                        return tester
                            .setup.user.addr('27821233333')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                                , '4'  // st_optout - other
                            )
                            .check.interaction({
                                state: 'st_end_detail_changed'
                            })
                            .run();
                    });
                    it("should save extras", function() {
                        return tester
                            .setup.user.addr('27821233333')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                                , '4'  // st_optout - other
                            )
                            .check(function(api) {
                                var contact = _.find(api.contacts.store, {
                                  msisdn: '+27821233333'
                                });
                                assert.equal(Object.keys(contact.extra).length, 10);
                                assert.equal(contact.extra.nc_opt_out_reason, 'other');
                                assert.equal(contact.extra.nc_is_registered, 'true');
                            })
                            .run();
                    });
                    it("should fire no metrics", function() {
                        return tester
                            .setup.user.addr('27821233333')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                                , '4'  // st_optout - other
                            )
                            .check(function(api) {
                                var metrics = api.metrics.stores.test_metric_store;
                                assert.equal(Object.keys(metrics).length, 0);
                            })
                            .run();
                    });
                });

                describe("choosing main menu", function() {
                    it("should bail", function() {
                        return tester
                            .setup.user.addr('27821233333')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                                , '5'  // st_optout - main menu
                            )
                            .check.interaction({
                                state: 'st_subscribed',
                            })
                            .run();
                    });
                });
            });

            describe("registered user - opted out, reason not_useful", function() {
                describe("should reach st_optout", function() {
                    it("should ask prior optout reason", function() {
                        return tester
                            .setup.user.addr('27821230000')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                            )
                            .check.interaction({
                                state: 'st_optout',
                                reply: [
                                    "You have opted out before. Please tell us why:",
                                    "1. Not a nurse or midwife",
                                    "2. New user of number",
                                    "3. Messages not useful",
                                    "4. Other",
                                    "5. Main menu"
                                ].join("\n")
                            })
                            .run();
                    });
                    it("should have extras", function() {
                        return tester
                            .setup.user.addr('27821230000')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                            )
                            .check(function(api) {
                                var contact = _.find(api.contacts.store, {
                                  msisdn: '+27821230000'
                                });
                                assert.equal(Object.keys(contact.extra).length, 4);
                                assert.equal(contact.extra.nc_opt_out_reason, 'not_useful');
                                assert.equal(contact.extra.nc_is_registered, 'true');
                            })
                            .run();
                    });
                });

                describe("should reach st_end_detail_changed", function() {
                // should happen without fixtures - only updates extra
                    it("should thank them", function() {
                        return tester
                            .setup.user.addr('27821230000')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                                , '4'  // st_optout - other
                            )
                            .check.interaction({
                                state: 'st_end_detail_changed'
                            })
                            .run();
                    });
                    it("should save extras", function() {
                        return tester
                            .setup.user.addr('27821230000')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                                , '4'  // st_optout - other
                            )
                            .check(function(api) {
                                var contact = _.find(api.contacts.store, {
                                  msisdn: '+27821230000'
                                });
                                assert.equal(Object.keys(contact.extra).length, 4);
                                assert.equal(contact.extra.nc_opt_out_reason, 'other');
                                assert.equal(contact.extra.nc_is_registered, 'true');
                            })
                            .run();
                    });
                });
            });

            describe("registered user - opted out, reason unknown", function() {
                describe("should reach st_optout", function() {
                    it("should ask prior optout reason", function() {
                        return tester
                            .setup.user.addr('27821240000')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                            )
                            .check.interaction({
                                state: 'st_optout',
                                reply: [
                                    "You have opted out before. Please tell us why:",
                                    "1. Not a nurse or midwife",
                                    "2. New user of number",
                                    "3. Messages not useful",
                                    "4. Other",
                                    "5. Main menu"
                                ].join("\n")
                            })
                            .run();
                    });
                    it("should have extras", function() {
                        return tester
                            .setup.user.addr('27821240000')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                            )
                            .check(function(api) {
                                var contact = _.find(api.contacts.store, {
                                  msisdn: '+27821240000'
                                });
                                assert.equal(Object.keys(contact.extra).length, 10);
                                assert.equal(contact.extra.nc_opt_out_reason, 'unknown');
                                assert.equal(contact.extra.nc_is_registered, 'true');
                            })
                            .run();
                    });
                });

                describe("should reach st_end_detail_changed", function() {
                // should happen without fixtures - only updates extra
                    it("should thank them", function() {
                        return tester
                            .setup.user.addr('27821240000')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                                , '4'  // st_optout - other
                            )
                            .check.interaction({
                                state: 'st_end_detail_changed'
                            })
                            .run();
                    });
                    it("should fire metrics", function() {
                        return tester
                            .setup.user.addr('27821237777')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                                , '1'  // st_optout - not a nurse
                            )
                            .check(function(api) {
                                var metrics = api.metrics.stores.test_metric_store;
                                assert.equal(Object.keys(metrics).length, 6);
                                assert.deepEqual(metrics['test.nurse_ussd.optouts.last'].values, [1]);
                                assert.deepEqual(metrics['test.nurse_ussd.optouts.sum'].values, [1]);
                                assert.deepEqual(metrics['test.nurseconnect.optouts.last'].values, [1]);
                                assert.deepEqual(metrics['test.nurseconnect.optouts.sum'].values, [1]);
                                assert.deepEqual(metrics['test.nurseconnect.optouts.job_change.last'].values, [1]);
                                assert.deepEqual(metrics['test.nurseconnect.optouts.job_change.sum'].values, [1]);
                            })
                            .run();
                    });
                    it("should save extras", function() {
                        return tester
                            .setup.user.addr('27821240000')
                            .inputs(
                                {session_event: 'new'}  // dial in
                                , '6'  // st_subscribed - more options
                                , '2'  // st_subscribed - opt out
                                , '4'  // st_optout - other
                            )
                            .check(function(api) {
                                var contact = _.find(api.contacts.store, {
                                  msisdn: '+27821240000'
                                });
                                assert.equal(Object.keys(contact.extra).length, 10);
                                assert.equal(contact.extra.nc_opt_out_reason, 'other');
                                assert.equal(contact.extra.nc_is_registered, 'true');
                            })
                            .run();
                    });
                });
            });

        });

    });
});
