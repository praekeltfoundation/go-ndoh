var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');

var messagestore = require('./optoutstore');
var DummyOptoutResource = messagestore.DummyOptoutResource;


describe("app", function() {
    describe("for opting out of messages", function() {
        var app;
        var tester;

        beforeEach(function() {
            app = new go.app.GoNDOH();
            tester = new AppTester(app);

            tester
                .setup.config.app({
                    name: 'optout',
                    testing: 'true',
                    channel: "*120*550#1"
                })
                .setup.char_limit(160)
                .setup(function(api) {
                    api.contacts.add( {
                        msisdn: '+27001'
                    });
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                })
                .setup(function(api) {
                    api.resources.add(new DummyOptoutResource());
                    api.resources.attach(api);
                });
        });

        describe("when the user starts a session", function() {
            it("should ask for the reason they are opting out", function() {
                return tester
                    .start()
                    .check.interaction({
                        state: 'states:start',
                        reply: [
                            'Welcome to MomConnect. Why do you want to ' +
                            'stop receiving our messages?',
                            '1. Miscarriage',
                            '2. Not pregnant',
                            '3. Messages not useful',
                            '4. Had my baby',
                            '5. Other'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("when the user selects a reason for opting out", function() {
            it("should thank them and exit", function() {
                return tester
                    .setup.user.addr('+27001')
                    .setup.user.state('states:start')
                    .input('1')
                    .check.interaction({
                        state: 'states:end',
                        reply: ('Thank you. You will no longer receive ' +
                            'messages from us. If you have any medical ' +
                            'concerns please visit your nearest clinic.')
                    })
                    .check(function(api) {
                        var contact = api.contacts.store[0];
                        assert.equal(contact.extra.opt_out_reason, 'miscarriage');
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

    });
});
