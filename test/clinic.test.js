var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;


describe("app", function() {
    describe("GoNDOHclinic", function() {
        var app;
        var tester;

        beforeEach(function() {
            app = new go.clinic.GoNDOHclinic();

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
            it("should check if no. belongs to pregnant woman", function() {
                return tester
                    .start()
                    .check.interaction({
                        state: 'states:start',
                        reply: [
                            'Welcome to The Department of Health\'s ' +
                            'MomConnect programme. Is this no. (MSISDN) ' +
                            'the mobile no. of the pregnant woman to be ' +
                            'registered?',
                            '1. Yes',
                            '2. No'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("when the no. is the pregnant woman's no.", function() {
            it("should ask for the clinic code", function() {
                return tester
                    .setup.user.state('states:start')
                    .input('1')
                    .check.interaction({
                        state: 'states:clinic_code',
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
                    .setup.user.state('states:start')
                    .input('2')
                    .check.interaction({
                        state: 'states:mobile_no',
                        reply: (
                            'Please input the mobile number of the ' +
                            'pregnant woman to be registered:')
                    })
                    .run();
            });
        });

        describe("after entering the pregnant woman's number", function() {
            it("should ask for the clinic code", function() {
                return tester
                    .setup.user.state('states:mobile_no')
                    .input('0821234567')
                    .check.interaction({
                        state: 'states:clinic_code',
                        reply: (
                            'Please enter the clinic code for the facility ' +
                            'where this pregnancy is being registered:')
                    })
                    .run();
            });
        });

        describe("after entering the clinic code", function() {
            it("should ask for the month the baby is due", function() {
                return tester
                    .setup.user.state('states:clinic_code')
                    .input('12345')
                    .check.interaction({
                        state: 'states:due_date_month',
                        reply: [
                            'Please select the month when the baby is due:',
                            '1. Apr',
                            '2. May',
                            '3. Jun',
                            '4. Jul',
                            '5. Aug',
                            '6. Sept',
                            '7. Oct',
                            '8. Nov',
                            '9. Dec'
                        ].join('\n')
                    })
                    .run();
            });
        });

    });
});
