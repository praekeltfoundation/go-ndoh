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
                            working_on: '+27821232222'
                        },
                    });
                })
                .setup(function(api) {
                    // opted_out user
                    api.contacts.add({
                        msisdn: '+27821239999',
                        extra: {
                            opt_out_reason: 'job_change'
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
                        state: 'st_route',
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
                        .setup.char_limit(160)  // limit first state chars
                        .inputs(
                            {session_event: 'new'}  // dial in
                        )
                        .check.interaction({
                            state: 'st_not_subscribed',
                            reply: [
                                "Welcome to NurseConnect. Your number 0821234444 is not subscribed:",
                                '1. Subscribe as a new user',
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
                            assert.equal(contact.extra.working_on, "");
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
                            assert.equal(contact.extra.working_on, "");
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

                describe("if they were on a timeout state", function() {
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
                                    'Would you like to complete NurseConnect registration for 0821234444?',
                                    '1. Yes',
                                    '2. Start new registration'
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
                                'st_facname text WCL clinic',
                                '1. Confirm',
                                '2. Not my facility'
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
                        // assert.deepEqual(metrics['test.clinic.percentage_users'].values, [100]);
                        // assert.deepEqual(metrics['test.sum.unique_users'].values, [1]);
                    })
                    .run();
            });
        });

        // Self Registration Flow (SA ID)
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
                        , '1'  // st_id_type - sa_id
                        , '5101025009086'  // st_sa_id
                    )
                    .check.interaction({
                        state: 'st_end_reg',
                        reply: 'st_end_reg text'
                    })
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
                        , '1'  // st_id_type - sa_id
                        , '5101025009086 '  // st_sa_id
                    )
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821234444'
                        });
                        assert.equal(Object.keys(contact.extra).length, 7);
                        assert.equal(contact.extra.faccode, '123456');
                        assert.equal(contact.extra.facname, 'WCL clinic');
                        assert.equal(contact.extra.is_registered, 'true');
                        assert.equal(contact.extra.working_on, "");
                        assert.equal(contact.extra.id_type, "sa_id");
                        assert.equal(contact.extra.sa_id_no, "5101025009086");
                        assert.equal(contact.extra.dob, "1951-01-02");
                    })
                    .run();
            });
            it("should fire no metrics", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '1'  // st_not_subscribed - self registration
                        , '1'  // st_permission_self - consent
                        , '123456'  // st_faccode
                        , '1'  // st_facname - confirm
                        , '1'  // st_id_type - sa_id
                        , '5101025009086'  // st_sa_id
                    )
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.equal(Object.keys(metrics).length, 0);
                    })
                    .run();
            });
        });

        // Other Registration Flow (Passport)
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
                        , '2'  // st_id_type - passport
                        , '6'  // st_passport_country - cuba
                        , 'ZA1234'  // st_passport_num
                        , '19760307'  // st_dob - 7 March 1976
                    )
                    .check.interaction({
                        state: 'st_end_reg',
                        reply: 'st_end_reg text'
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
                        , '2'  // st_id_type - passport
                        , '6'  // st_passport_country - cuba
                        , 'Cub1234'  // st_passport_num
                        , '19760307'  // st_dob - 7 March 1976
                    )
                    .check(function(api) {
                        var user = _.find(api.contacts.store, {
                          msisdn: '+27821234444'
                        });
                        assert.equal(Object.keys(user.extra).length, 2);
                        assert.equal(user.extra.working_on, '+27821235555');
                        assert.equal(user.extra.registrees, '+27821235555');
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821235555'
                        });
                        assert.equal(Object.keys(contact.extra).length, 8);
                        assert.equal(contact.extra.faccode, '123456');
                        assert.equal(contact.extra.facname, 'WCL clinic');
                        assert.equal(contact.extra.is_registered, 'true');
                        assert.equal(contact.extra.registered_by, '+27821234444');
                        assert.equal(contact.extra.id_type, 'passport');
                        assert.equal(contact.extra.passport_country, 'cuba');
                        assert.equal(contact.extra.passport_num, 'Cub1234');
                        assert.equal(contact.extra.dob, '1976-03-07');
                    })
                    .run();
            });
            it("should fire no metrics", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '1'  // st_permission_other - consent
                        , '0821235555'  // st_msisdn
                        , '123456'  // st_faccode
                        , '1'  // st_facname - confirm
                        , '2'  // st_id_type - passport
                        , '6'  // st_passport_country - cuba
                        , 'ZA1234'  // st_passport_num
                        , '19760307'  // st_dob - 7 March 1976
                    )
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.equal(Object.keys(metrics).length, 0);
                    })
                    .run();
            });
        });

        // Opted Out User Opt-in (Self Registration)
        describe("opted out self reg", function() {
            it("should reach st_opt_in", function() {
                return tester
                    .setup.user.addr('27821239999')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '1'  // st_not_subscribed - self registration
                        , '1'  // st_permission_self - consent
                    )
                    .check.interaction({
                        state: 'st_opt_in',
                        reply: [
                            'This number has previously opted out of ' +
                            'NurseConnect SMSs. Please confirm that the mom ' +
                            'would like to opt in to receive messages again?',
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
                        assert.equal(contact.extra.working_on, "");
                        assert.equal(contact.extra.opt_out_reason, "job_change");
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
                        , '1'  // st_opt_in - confirm
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
                        , '1'  // st_opt_in - confirm
                    )
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821239999'
                        });
                        assert.equal(Object.keys(contact.extra).length, 2);
                        assert.equal(contact.extra.working_on, "");
                        assert.equal(contact.extra.opt_out_reason, "");
                    })
                    .run();
            });
        });

        // Opted Out User Opt-in (Other Registration)
        describe("opted out other reg", function() {
            it("should reach st_opt_in", function() {
                return tester
                    .setup.user.addr('27821234444')
                    .inputs(
                        {session_event: 'new'}  // dial in
                        , '3'  // st_not_subscribed - other registration
                        , '1'  // st_permission_other - consent
                        , '0821239999'  // st_msisdn
                    )
                    .check.interaction({
                        state: 'st_opt_in',
                        reply: [
                            'This number has previously opted out of ' +
                            'NurseConnect SMSs. Please confirm that the mom ' +
                            'would like to opt in to receive messages again?',
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
                        assert.equal(contact.extra.working_on, undefined);  // defined on user
                        assert.equal(contact.extra.opt_out_reason, "job_change");
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821234444'
                        });
                        assert.equal(Object.keys(contact.extra).length, 1);
                        assert.equal(contact.extra.working_on, "+27821239999");
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
                        , '1'  // st_opt_in - confirm
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
                        , '1'  // st_opt_in - confirm
                    )
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821239999'
                        });
                        assert.equal(Object.keys(contact.extra).length, 1);
                        assert.equal(contact.extra.working_on, undefined);  // defined on user
                        assert.equal(contact.extra.opt_out_reason, "");
                    })
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27821234444'
                        });
                        assert.equal(Object.keys(contact.extra).length, 1);
                        assert.equal(contact.extra.working_on, "+27821239999");
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
                        , '2'  // st_opt_in - deny
                    )
                    .check.interaction({
                        state: 'st_stay_out',
                        reply: [
                            'You have chosen not to receive MomConnect SMSs ' +
                            'and so cannot complete registration.',
                            '1. Main menu'
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
                        , '2'  // st_opt_in - deny
                        , '1'  // st_stay_out - main menu
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
                            'st_permission_denied text',
                            '1. Main menu'
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
                        reply: 'st_faccode text'
                    })
                    .run();
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
                            reply: 'st_faccode error_text'
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
                            reply: 'st_faccode error_text'
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
                            reply: 'st_faccode error_text'
                        })
                        .run();
                });
            });
        });

        // ID Validation
        describe("id number entry", function() {
            describe("invalid id", function() {
                it("should loop back", function() {
                    return tester
                        .setup.user.state('st_sa_id')
                        .input('12345A')
                        .check.interaction({
                            state: 'st_sa_id',
                            reply: 'st_sa_id error_text'
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
                        .setup.user.state('st_passport_num')
                        .input('AA-1234')
                        .check.interaction({
                            state: 'st_passport_num',
                            reply: 'st_passport_num error_text'
                        })
                        .run();
                });
            });
            describe("invalid passport number - too short", function() {
                it("should loop back", function() {
                    return tester
                        .setup.user.state('st_passport_num')
                        .input('1234')
                        .check.interaction({
                            state: 'st_passport_num',
                            reply: 'st_passport_num error_text'
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
                        .setup.user.state('st_dob')
                        .input('1980-01-01')
                        .check.interaction({
                            state: 'st_dob',
                            reply: 'st_dob error_text'
                        })
                        .run();
                });
            });
            describe("not real date", function() {
                it("should loop back", function() {
                    return tester
                        .setup.user.state('st_dob')
                        .input('1980-02-29')
                        .check.interaction({
                            state: 'st_dob',
                            reply: 'st_dob error_text'
                        })
                        .run();
                });
            });
            describe("inverted date", function() {
                it("should loop back", function() {
                    return tester
                        .setup.user.state('st_dob')
                        .input('01011980')
                        .check.interaction({
                            state: 'st_dob',
                            reply: 'st_dob error_text'
                        })
                        .run();
                });
            });
        });

    });
});
