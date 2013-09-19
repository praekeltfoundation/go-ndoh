var fs = require("fs");
var assert = require("assert");
var vumigo = require("vumigo_v01");
// CHANGE THIS to your-app-name
var app = require("../lib/go-ndoh");

// This just checks that you hooked you InteractionMachine
// up to the api correctly and called im.attach();
describe("test_api", function () {
  it("should exist", function () {
    assert.ok(app.api);
  });
  it("should have an on_inbound_message method", function () {
    assert.ok(app.api.on_inbound_message);
  });
  it("should have an on_inbound_event method", function () {
    assert.ok(app.api.on_inbound_event);
  });
});

describe('NDOH', function () {

  var tester;
  var fixtures = [
  ];

  beforeEach(function () {
    tester = new vumigo.test_utils.ImTester(app.api, {
      custom_setup: function (api) {
        api.config_store.config = JSON.stringify({
        });
        fixtures.forEach(function (f) {
          api.load_http_fixture(f);
        });

        // mock methods for testing
        var state_creator = tester.api.im.state_creator;
      },
      async: true
    });
  });

  it('should ask for the patients name', function(done) {
    tester.check_state({
      user: null,
      content: null,
      next_state: 'name',
      response: (
        'Welcome to Pregnancy Registration Vumi Demo.[^]' +
        'What is your name\\?')
    }).then(done, done);
  });

  it('should ask for the patients surname', function(done) {
    tester.check_state({
      user: {
        current_state: 'name'
      },
      content: 'Simon',
      next_state: 'surname',
      response: 'What is your surname\\?'
    }).then(done, done);
  });

  it('should ask for the patients dob', function(done) {
    tester.check_state({
      user: {
        current_state: 'surname'
      },
      content: 'de Haan',
      next_state: 'dob',
      response: 'What is your date of birth\\? \\(YYYY-MM-DD\\)'
    }).then(done, done);
  });

  it('should check the submitted dob format for correctness', function(done) {
    tester.check_state({
      user: {
        current_state: 'dob'
      },
      content: 'foo',
      next_state: 'dob',
      response: 'Please provide the date in the YYYY-MM-DD format:'
    }).then(done, done);
  });

  it('should capture the last menstruation date', function(done) {
    tester.check_state({
      user: {
        current_state: 'dob'
      },
      content: '1980-7-30',
      next_state: 'last_menstruation',
      response: 'When was your last menstruation\\? \\(YYYY-MM-DD\\)'
    }).then(done, done);
  });

  it('should check the last menstruation date for correctness', function(done) {
    tester.check_state({
      user: {
        current_state: 'last_menstruation'
      },
      content: 'foo',
      next_state: 'last_menstruation',
      response: 'Please provide the date in the YYYY-MM-DD format:'
    }).then(done, done);
  });

  it('should check the pregnancy status', function(done) {
    tester.check_state({
      user: {
        current_state: 'last_menstruation',
      },
      content: '2013-09-19',
      next_state: 'pregnancy_status',
      response: (
        'Do you think you are pregnant or has it been confirmed\\?[^]' +
        '1. I suspect I am pregnant.[^]' +
        '2. It has been confirmed, I am pregnant.$')
    }).then(done, done);
  });

  it('should end the menu', function(done) {
    tester.check_state({
      user: {
        current_state: 'pregnancy_status'
      },
      content: '1',
      next_state: 'end',
      response: 'Thank you! Your details have been captured.',
      continue_session: false
    }).then(done, done);
  });
});