var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var _ = require('lodash');
var assert = require('assert');
var messagestore = require('./messagestore');
var DummyMessageStoreResource = messagestore.DummyMessageStoreResource;


describe("app", function() {
    describe("for personal use", function() {
        var app;
        var tester;

        beforeEach(function() {
            app = new go.app.GoNDOH();

            tester = new AppTester(app);

            tester
                .setup(function(api) {
                    api.resources.add(new DummyMessageStoreResource());
                    api.resources.attach(api);
                })
                .setup.char_limit(160)
                .setup.config.app({
                    name: 'personal',
                    metric_store: 'test_metric_store',
                    endpoints: {
                        "sms": {"delivery_class": "sms"}
                    },
                    channel: "*120*550#"
                })
                .setup(function(api) {
                    api.contacts.add( {
                        msisdn: '+27001'
                    });
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                });
        });

        describe("when a new unique user logs on", function() {
            it("should increment the no. of unique users by 1", function() {
                return tester
                    .setup(function(api) {
                        api.messagestore.inbound_uniques = 22;
                    })
                    .start()
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.deepEqual(metrics['sum.unique_users'].values, [22]);
                        assert.deepEqual(metrics['personal.sum.unique_users'].values, [1]);
                    }).run();
            });
        });

        describe("when the user starts a session", function() {
            it("should ask for their preferred language", function() {
                return tester
                    .setup.user.addr('+27001')
                    .start()
                    .check.interaction({
                        state: 'states:start',
                        reply: [
                            'Welcome to The Department of Health\'s ' +
                            'MomConnect programme. Please select your ' +
                            'preferred language:',
                            '1. English',
                            '2. Afrikaans',
                            '3. Zulu',
                            '4. Xhosa',
                            '5. Sotho'
                        ].join('\n')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.ussd_sessions, '1');
                    })
                    .run();
            });
        });

        describe("when the user selects a language", function() {
            it("should set language and ask if they suspect pregnancy", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup.user.state('states:start')
                    .input('1')
                    .check.interaction({
                        state: 'states:suspect_pregnancy',
                        reply: [
                            'MomConnect sends free support SMSs to ' +
                            'pregnant mothers. Are you or do you suspect ' +
                            'that you are pregnant?',
                            '1. Yes',
                            '2. No'
                        ].join('\n')
                    })
                    .check.user.properties({lang: 'en'})
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
                    .setup.user.addr('+27001')
                    .setup.user.state('states:suspect_pregnancy')
                    .input('2')
                    .check.interaction({
                        state: 'states:end_not_pregnant',
                        reply: ('We are sorry but this service is only for ' +
                            'pregnant mothers. If you have other health ' +
                            'concerns please visit your nearest clinic.')
                    })
                    .check.reply.ends_session()
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.suspect_pregnancy, 'no');
                    })
                    .run();
            });
        });

        describe("if the user suspects pregnancy", function() {
            it("should set pregnancy status, ask for their id type", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup.user.state('states:suspect_pregnancy')
                    .input('1')
                    .check.interaction({
                        state: 'states:id_type',
                        reply: [
                            'We need some info to message you. This is ' +
                            'private and will only be used to help you at ' +
                            'a clinic. What kind of ID do you have?',
                            '1. SA ID',
                            '2. Passport',
                            '3. None'
                        ].join('\n')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.suspect_pregnancy, 'yes');
                    })
                    .run();
            });
        });

        describe("if the user selects SA ID (id type)", function() {
            it("should set their id type and ask for their id number", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup.user.state('states:id_type')
                    .input('1')
                    .check.interaction({
                        state: 'states:sa_id',
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
                    .setup.user.addr('+27001')
                    .setup.user.state('states:sa_id')
                    .input('5101015009088')
                    .check.interaction({
                        state: 'states:end_success',
                        reply: ('Thank you for subscribing to MomConnect. ' +
                            'You will now receive free messages about ' +
                            'MomConnect. Visit your nearest clinic to get ' + 
                            'the full set of messages.')
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

        describe("after the user enters their ID number before '50", function() {
            it("should set their ID no, extract their DOB", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup.user.state('states:sa_id')
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
                    .setup.user.addr('+27001')
                    .setup.user.state('states:sa_id')
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
                    .setup.user.addr('+27001')
                    .setup.user.state('states:sa_id')
                    .input('1234015009087')
                    .check.interaction({
                        state: 'states:sa_id',
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
                    .setup.user.addr('+27001')
                    .setup.user.state('states:id_type')
                    .input('2')
                    .check.interaction({
                        state: 'states:passport_origin',
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
                    .setup.user.addr('+27001')
                    .setup.user.state('states:passport_origin')
                    .input('1')
                    .check.interaction({
                        state: 'states:passport_no',
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
                    .setup.user.addr('+27001')
                    .setup.user.state('states:passport_no')
                    .input('12345')
                    .check.interaction({
                        state: 'states:end_success',
                        reply: ('Thank you for subscribing to MomConnect. ' +
                            'You will now receive free messages about ' +
                            'MomConnect. Visit your nearest clinic to get ' + 
                            'the full set of messages.')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.passport_no, '12345');
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

        describe("if the user selects None (id type)", function() {
            it("should set id type, ask for their birth year", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup.user.state('states:id_type')
                    .input('3')
                    .check.interaction({
                        state: 'states:birth_year',
                        reply: ('Since you don\'t have an ID or passport, ' +
                            'please enter the year that you were born (eg ' +
                            '1981)')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.id_type, 'none');
                    })
                    .run();
            });
        });

        describe("after the user enters their birth year", function() {
            it("should ask for their birth month", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup.user.state('states:birth_year')
                    .input('1981')
                    .check.interaction({
                        state: 'states:birth_month',
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
                    .setup.user.addr('+27001')
                    .setup.user.state('states:birth_year')
                    .input('Nineteen Eighty One')
                    .check.interaction({
                        state: 'states:birth_year',
                        reply: ('There was an error in your entry. Please ' +
                        'carefully enter your year of birth again (eg ' +
                        '2001)')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.birth_year, undefined);
                    })
                    .run();
            });
        });

        describe("after the user enters their birth month", function() {
            it("should set their birth year, ask for their birth day", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup.user.state('states:birth_month')
                    .input('1')
                    .check.interaction({
                        state: 'states:birth_day',
                        reply: ('Please enter the day that you were born ' +
                            '(eg 14).')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.birth_month, '01');
                    })
                    .run();
            });
        });

        describe("after the user enters their birth day incorrectly", function() {
            it("should not save birth day, ask them their birth day again", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup.user.state('states:birth_day')
                    .input('fourteen')
                    .check.interaction({
                        state: 'states:birth_day',
                        reply: ('There was an error in your entry. Please ' +
                        'carefully enter your day of birth again (eg ' +
                        '8)')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.birth_day, undefined);
                    })
                    .run();
            });
        });

        describe("after the user enters their birth day", function() {
            it("should save birth day, thank them and exit", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup(function(api) {
                            api.contacts.add( {
                                msisdn: '+270001',
                                extra : {
                                    ussd_sessions: '4'
                                }
                            });
                        })
                    .setup.user.answers({
                        'states:birth_year': '1981',
                        'states:birth_month': '01'
                    })
                    .setup.user.state('states:birth_day')
                    .input('1')
                    .check.interaction({
                        state: 'states:end_success',
                        reply: ('Thank you for subscribing to MomConnect. ' +
                            'You will now receive free messages about ' +
                            'MomConnect. Visit your nearest clinic to get ' + 
                            'the full set of messages.')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.birth_day, '01');
                        assert.equal(contact.extra.dob, '1981-01-01');
                        assert.equal(contact.extra.ussd_sessions, '0');
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

        describe("when a session is terminated", function() {
            describe("when they are not completed registration",function() {
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
                            .setup.user.state('states:start')
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
                    it("should send them an sms thanking them for their registration",function() {
                        return tester
                            .setup(function(api) {
                                api.contacts.add( {
                                    msisdn: '+273323',
                                    extra : {}
                                });
                            })
                            .setup.user.addr('+273323')
                            .setup.user.state('states:start')
                            .input(1)
                            .input.session_event('close')
                            .check(function(api) {
                                var smses = _.where(api.outbound.store, {
                                    endpoint: 'sms'
                                });
                                var sms = smses[0];
                                assert.equal(smses.length,1);
                                assert.equal(sms.content, 
                                    "Please dial back in to *120*550# to complete the pregnancy registration."
                                );
                                assert.equal(sms.to_addr,'+273323');
                            }).run();
                    });
                });
            });
        });
    });
});
