var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');


describe("app", function() {
    describe("for personal use", function() {
        var app;
        var tester;

        beforeEach(function() {
            app = new go.app.GoNDOH();

            tester = new AppTester(app);

            tester
                .setup.config.app({
                    name: 'test_app'
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

        describe("when make_month_choices is called with (6,9)", function() {
            it("should return Jul - Mar", function() {
                assert.equal(tester.im.app.make_month_choices(6,9).length, 9);
                assert.equal(tester.im.app.make_month_choices(6,9)[0].label
                    .args, 'Jul');
                assert.equal(tester.im.app.make_month_choices(6,9)[8].label
                    .args, 'Mar');
            });
        });

        describe("when the user starts a session", function() {
            it("should ask for their preferred language", function() {
                return tester
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
                        var contact = api.contacts.store[0]; //askmike
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

        describe("after the user enters their ID number", function() {
            it("should set their ID no, thank them and exit", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup.user.state('states:sa_id')
                    .input('8001015009087')
                    .check.interaction({
                        state: 'states:end_success',
                        reply: ('Thank you for subscribing to MomConnect. ' +
                            'You will now receive free messages about ' +
                            'MomConnect. Visit your nearest clinic to get ' + 
                            'the full set of messages.')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.sa_id, '8001015009087');
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
            it("should ask for their birth year", function() {
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
                    .run();
            });
        });

        describe("after the user enters their birth year incorrectly", function() {
            it("should ask for their birth year again", function() {
                return tester
                    .setup.user.state('states:birth_year')
                    .input('Nineteen Eighty One')
                    .check.interaction({
                        state: 'states:birth_year',
                        reply: ('There was an error in your entry. Please ' +
                        'carefully enter your year of birth again (eg ' +
                        '2001)')
                    })
                    .run();
            });
        });

        describe("after the user enters their birth month", function() {
            it("should ask for their birth day", function() {
                return tester
                    .setup.user.state('states:birth_month')
                    .input('1')
                    .check.interaction({
                        state: 'states:birth_day',
                        reply: ('Please enter the day that you were born ' +
                            '(eg 14).')
                    })
                    .run();
            });
        });

        describe("after the user enters their birth day incorrectly", function() {
            it("should ask them their birth day again", function() {
                return tester
                    .setup.user.state('states:birth_day')
                    .input('fourteen')
                    .check.interaction({
                        state: 'states:birth_day',
                        reply: ('There was an error in your entry. Please ' +
                        'carefully enter your day of birth again (eg ' +
                        '8)')
                    })
                    .run();
            });
        });

        describe("after the user enters their birth day", function() {
            it("should thank them and exit", function() {
                return tester
                    .setup.user.state('states:birth_day')
                    .input('14')
                    .check.interaction({
                        state: 'states:end_success',
                        reply: ('Thank you for subscribing to MomConnect. ' +
                            'You will now receive free messages about ' +
                            'MomConnect. Visit your nearest clinic to get ' + 
                            'the full set of messages.')
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

    });
});
