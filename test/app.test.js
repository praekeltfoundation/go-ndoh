var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;


describe("app", function() {
    describe("GoNDOH", function() {
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
                    fixtures().forEach(api.http.fixtures.add);
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
            it("should ask them if they suspect pregnancy", function() {
                return tester
                    .setup.user.state('states:start')
                    .input('1') /* change language state functionality */
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
                    .run();
            });
        });

        describe("if the user does not suspect pregnancy", function() {
            it("state service is for pregnant mothers and exit", function() {
                return tester
                    .setup.user.state('states:suspect_pregnancy')
                    .input('2')
                    .check.interaction({
                        state: 'states:end_not_pregnant',
                        reply: ('We are sorry but this service is only for ' +
                            'pregnant mothers. If you have other health ' +
                            'concerns please visit your nearest clinic.')
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

        describe("if the user suspects pregnancy", function() {
            it("should ask for their id type", function() {
                return tester
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
                    .run();
            });
        });

        describe("if the user selects SA ID", function() {
            it("should ask for their id number", function() {
                return tester
                    .setup.user.state('states:id_type')
                    .input('1')
                    .check.interaction({
                        state: 'states:sa_id',
                        reply: 'Please enter your SA ID number:'
                    })
                    .run();
            });
        });

        
    });
});
