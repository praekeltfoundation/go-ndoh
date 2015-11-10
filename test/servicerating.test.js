var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var _ = require('lodash');
var assert = require('assert');
var messagestore = require('./messagestore');
var DummyMessageStoreResource = messagestore.DummyMessageStoreResource;


describe("app", function() {
    describe("for service rating use", function() {
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
                .setup.char_limit(182)
                .setup.config.app({
                    name: 'servicerating',
                    testing: 'true',
                    env: 'test',
                    conversation_key: 'dummyconversationkey',
                    metric_store: 'test_metric_store',
                    endpoints: {
                        "sms": {"delivery_class": "sms"}
                    },
                    channel: "*120*550*4#",
                    public_channel: "*120*550#",
                    jembi: {
                        username: 'foo',
                        password: 'bar',
                        url_json: 'http://test/v2/json/'
                    },
                    control: {
                        username: 'test_user',
                        api_key: 'test_key',
                        url: 'http://ndoh-control/api/v1/'
                    }
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                });
        });

        describe("Testing Metrics...", function() {
            describe("when the user completes a servicerating", function() {
                it("should fire multiple metrics", function() {
                    return tester
                        .setup.user.addr('27001')
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                created_at: "2014-07-28 09:35:26.732",
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4",
                                extra: {
                                    is_registered_by: 'clinic',
                                    clinic_code: "123456",
                                    last_service_rating: 'never'
                                }
                            });
                        })
                        .inputs(
                            {session_event: "new"}, "1", "1", "1",
                            {session_event: "new"}, "1", "1")
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.servicerating.sum.unique_users'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.unique_users.transient'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.sessions'].values, [1, 2]);
                            assert.deepEqual(metrics['test.servicerating.sum.sessions.transient'].values, [1, 1]);
                            assert.deepEqual(metrics['test.servicerating.avg.sessions_rate_service'].values, [2]);
                            assert.deepEqual(metrics['test.servicerating.sum.question_1_friendliness.exits'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.question_2_waiting_times_feel.exits'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.question_3_waiting_times_length.exits'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.question_4_cleanliness.exits'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.question_5_privacy.exits'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.servicerating_success'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.servicerating_to_jembi_success'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.percent_incomplete_serviceratings'].values, [100, 0]);
                            assert.deepEqual(metrics['test.servicerating.percent_complete_serviceratings'].values, [0, 100]);

                            var kv_store = api.kv.store;
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.unique_users'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.servicerating_start'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.sessions'], 2);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.question_1_friendliness.exits'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.question_2_waiting_times_feel.exits'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.question_3_waiting_times_length.exits'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.question_4_cleanliness.exits'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.question_5_privacy.exits'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.servicerating_success'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.servicerating_to_jembi_success'], 1);
                        })
                        .run();
                });
            });

            describe("when the user drops off whilst completing a servicerating", function() {
                it("should fire multiple metrics", function() {
                    return tester
                        .setup.user.addr('27001')
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                created_at: "2014-07-28 09:35:26.732",
                                key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                                user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4",
                                extra: {
                                    is_registered_by: 'clinic',
                                    clinic_code: "123456",
                                    last_service_rating: 'never'
                                }
                            });
                        })
                        .inputs({session_event: "new"}, "1", "1", "1")
                        .check(function(api) {
                            var metrics = api.metrics.stores.test_metric_store;
                            assert.deepEqual(metrics['test.servicerating.sum.unique_users'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.unique_users.transient'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.sessions'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.sessions.transient'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.avg.sessions_rate_service'], undefined);
                            assert.deepEqual(metrics['test.servicerating.sum.question_1_friendliness.exits'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.question_2_waiting_times_feel.exits'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.question_3_waiting_times_length.exits'].values, [1]);
                            assert.deepEqual(metrics['test.servicerating.sum.question_4_cleanliness.exits'], undefined);
                            assert.deepEqual(metrics['test.servicerating.sum.question_5_privacy.exits'], undefined);
                            assert.deepEqual(metrics['test.servicerating.sum.servicerating_success'], undefined);
                            assert.deepEqual(metrics['test.servicerating.sum.servicerating_to_jembi_success'], undefined);
                            assert.deepEqual(metrics['test.servicerating.percent_incomplete_serviceratings'].values, [100]);
                            assert.deepEqual(metrics['test.servicerating.percent_complete_serviceratings'].values, [0]);

                            var kv_store = api.kv.store;
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.unique_users'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.servicerating_start'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.sessions'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.question_1_friendliness.exits'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.question_2_waiting_times_feel.exits'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.question_3_waiting_times_length.exits'], 1);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.question_4_cleanliness.exits'], undefined);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.question_5_privacy.exits'], undefined);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.servicerating_success'], undefined);
                            assert.equal(kv_store['test_metric_store.test.servicerating.sum.servicerating_to_jembi_success'], undefined);
                        })
                        .run();
                });
            });
        });

        describe("when the user starts a session", function() {
            describe("when the user has NOT registered at a clinic", function() {
                it("should tell them to register at a clinic first", function() {
                    return tester
                        .setup.char_limit(160)  // limit first state chars
                        .setup.user.addr('27001')
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                            });
                        })
                        .inputs({session_event: 'new'})
                        .check.interaction({
                            state: 'end_reg_clinic',
                            reply: 'Please register at a clinic before using this line.'
                        })
                        .run();
                });
            });

            describe("when the user HAS registered at a clinic", function() {
                it("should ask for their friendliness rating", function() {
                    return tester
                        .setup.char_limit(160)  // limit first state chars
                        .setup.user.addr('27001')
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'zu',
                                    is_registered_by: 'clinic',
                                    last_service_rating: 'never'
                                }
                            });
                        })
                        .inputs({session_event: 'new'})
                        .check.interaction({
                            state: 'question_1_friendliness',
                            reply: [
                                'Welcome. When you signed up, were staff at the facility friendly & helpful?',
                                '1. Very Satisfied',
                                '2. Satisfied',
                                '3. Not Satisfied',
                                '4. Very unsatisfied'
                            ].join('\n')
                        })
                        .check.user.properties({lang: 'zu'})
                        .run();
                });

                it("should ask for their friendliness rating if they have no " +
                    "last_service_rating extra", function() {
                    // test for older registrations where last_servicerating is undefined
                    return tester
                        .setup.user.addr('27001')
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'zu',
                                    is_registered_by: 'clinic'
                                }
                            });
                        })
                        .start()
                        .check.interaction({
                            state: 'question_1_friendliness',
                            reply: [
                                'Welcome. When you signed up, were staff at the facility friendly & helpful?',
                                '1. Very Satisfied',
                                '2. Satisfied',
                                '3. Not Satisfied',
                                '4. Very unsatisfied'
                            ].join('\n')
                        })
                        .check.user.properties({lang: 'zu'})
                        .run();
                });
            });

            describe("when the user has already logged a servicerating", function() {
                it("should tell them they can't do it again", function() {
                    return tester
                        .setup.char_limit(160)  // limit first state chars
                        .setup.user.addr('27001')
                        .setup(function(api) {
                            api.contacts.add({
                                msisdn: '+27001',
                                extra : {
                                    language_choice: 'zu',
                                    is_registered_by: 'clinic',
                                    last_service_rating: '20130819144811'
                                }
                            });
                        })
                        .inputs({session_event: 'new'})
                        .check.interaction({
                            state: 'end_thanks_revisit',
                            reply: [
                                'Sorry, you\'ve already rated service. For baby and pregnancy ' +
                                'help or if you have compliments or complaints ' +
                                'dial *120*550# or reply to any of the SMSs you receive'
                            ].join('\n')
                        })
                        .check.reply.ends_session()
                        .run();
                });
            });
        });

        describe("when the user answers their friendliness rating", function() {
            it("should ask for their waiting times feeling", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                is_registered_by: 'clinic',
                                last_service_rating: 'never'
                            }
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs({session_event: 'new'}, '1')
                    .check.interaction({
                        state: 'question_2_waiting_times_feel',
                        reply: [
                            'How do you feel about the time you had to wait at the facility?',
                            '1. Very Satisfied',
                            '2. Satisfied',
                            '3. Not Satisfied',
                            '4. Very unsatisfied'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("when the user answers their waiting times feeling", function() {
            it("should ask for their waiting times length feeling", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                is_registered_by: 'clinic',
                                last_service_rating: 'never'
                            }
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs({session_event: 'new'}, '1', '1')
                    .check.interaction({
                        state: 'question_3_waiting_times_length',
                        reply: [
                            'How long did you wait to be helped at the clinic?',
                            '1. Less than an hour',
                            '2. Between 1 and 3 hours',
                            '3. More than 4 hours',
                            '4. All day'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("when the user answers their waiting times length feeling", function() {
            it("should ask for their cleanliness rating", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                is_registered_by: 'clinic',
                                last_service_rating: 'never'
                            }
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs({session_event: 'new'}, '1', '1', '1')
                    .check.interaction({
                        state: 'question_4_cleanliness',
                        reply: [
                            'Was the facility clean?',
                            '1. Very Satisfied',
                            '2. Satisfied',
                            '3. Not Satisfied',
                            '4. Very unsatisfied'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("when the user answers their cleanliness rating", function() {
            it("should ask for their privacy rating", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                is_registered_by: 'clinic',
                                last_service_rating: 'never'
                            }
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs({session_event: 'new'}, '1', '1', '1', '1')
                    .check.interaction({
                        state: 'question_5_privacy',
                        reply: [
                            'Did you feel that your privacy was respected by the staff?',
                            '1. Very Satisfied',
                            '2. Satisfied',
                            '3. Not Satisfied',
                            '4. Very unsatisfied'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("when the user answers their privacy rating", function() {
            it("should thank and end", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            created_at: "2014-07-28 09:35:26.732",
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4",
                            extra : {
                                is_registered_by: 'clinic',
                                clinic_code: '123456',
                                last_service_rating: 'never'
                            }
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs({session_event: 'new'}, '1', '1', '1', '1', '1')
                    .check.interaction({
                        state: 'end_thanks',
                        reply: [
                            'Thank you for rating our service.'
                        ].join('\n')
                    })
                    .check.reply.ends_session()
                    .run();
            });

            it("save the servicerating date to their contact extras", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            created_at: "2014-07-28 09:35:26.732",
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4",
                            extra : {
                                is_registered_by: 'clinic',
                                clinic_code: '123456',
                                last_service_rating: 'never'
                            }
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs({session_event: 'new'}, '1', '1', '1', '1', '1')
                    .check(function(api) {
                        var contact = _.find(api.contacts.store, {
                          msisdn: '+27001'
                        });
                        assert.equal(contact.extra.last_service_rating, '20130819144811');
                    })
                    .run();
            });

            it("should send them an sms thanking them for their rating", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            created_at: "2014-07-28 09:35:26.732",
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4",
                            extra : {
                                is_registered_by: 'clinic',
                                clinic_code: '123456',
                                last_service_rating: 'never'
                            }
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs({session_event: 'new'}, '1', '1', '1', '1', '1')
                    .check(function(api) {
                        var smses = _.where(api.outbound.store, {
                            endpoint: 'sms'
                        });
                        var sms = smses[0];
                        assert.equal(smses.length,1);
                        assert.equal(sms.content,
                            "Thank you for rating our service."
                        );
                        assert.equal(sms.to_addr,'27001');
                    })
                    .run();
            });

            it("should use a delegator state to send sms", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            created_at: "2014-07-28 09:35:26.732",
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4",
                            extra: {
                                is_registered_by: "clinic",
                                clinic_code: "123456",
                                last_service_rating: 'never'
                            }
                        });
                    })
                    .setup.user.addr('27001')
                    .setup.user.answers({
                        'question_1_friendliness': 'very-satisfied',
                        'question_2_waiting_times_feel': 'very-satisfied',
                        'question_3_waiting_times_length': 'less-than-an-hour',
                        'question_4_cleanliness': 'very-satisfied',
                        'question_5_privacy': 'very-satisfied'
                    })
                    .setup.user.state('log_servicerating_send_sms')
                    .check(function(api) {
                        var smses = _.where(api.outbound.store, {
                            endpoint: 'sms'
                        });
                        var sms = smses[0];
                        assert.equal(smses.length, 1);
                        assert.equal(sms.content,
                            "Thank you for rating our service."
                        );
                    })
                    .run();
            });

        });

        describe("when the user revisits after rating service previously", function() {
            it("should not allow them to rate again", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            created_at: "2014-07-28 09:35:26.732",
                            key: "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                            user_account: "4a11907a-4cc4-415a-9011-58251e15e2b4",
                            extra : {
                                is_registered_by: 'clinic',
                                clinic_code: '123456',
                                last_service_rating: 'never'
                            }
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs({session_event: 'new'}, '1', '1', '1', '1', '1', {session_event: 'new'})
                    .check.interaction({
                        state: 'end_thanks_revisit',
                        reply: [
                            'Sorry, you\'ve already rated service. For baby and pregnancy ' +
                            'help or if you have compliments or complaints ' +
                            'dial *120*550# or reply to any of the SMSs you receive'
                        ].join('\n')
                    })
                    .check.reply.ends_session()
                    .run();
            });

            it("should not send another sms", function() {
                return tester
                    .setup(function(api) {
                        api.contacts.add({
                            msisdn: '+27001',
                            extra : {
                                is_registered_by: 'clinic',
                                clinic_code: '123456',
                                last_service_rating: 'any-string-except-"never"-or-undefined'
                            }
                        });
                    })
                    .setup.user.addr('27001')
                    .inputs({session_event: 'new'})
                    .check.interaction({
                        state: 'end_thanks_revisit',
                        reply: [
                            'Sorry, you\'ve already rated service. For baby and pregnancy ' +
                            'help or if you have compliments or complaints ' +
                            'dial *120*550# or reply to any of the SMSs you receive'
                        ].join('\n')
                    })
                    .check(function(api) {
                        var smses = _.where(api.outbound.store, {
                            endpoint: 'sms'
                        });
                        assert.equal(smses.length, 0);
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

    });
});
