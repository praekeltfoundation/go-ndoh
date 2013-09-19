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

  it('should capture the dob and ask for the NID', function(done) {
    tester.check_state({
      user: {
        current_state: 'dob'
      },
      next_state: 'nid_1',
      response: 'Please enter the first 4 digits of your National ID:',
      content: '1980-7-30',
    }).then(done, done);
  });

  it('should capture the first 4 digits of the NID', function(done) {
    tester.check_state({
      user: {
        current_state: 'nid_1'
      },
      next_state: 'nid_2',
      response: 'Please enter the next 4 digits of your National ID:',
      content: '1234'
    }).then(done, done);
  });

  it('should capture the second 4 digits of the NID', function(done) {
    tester.check_state({
      user: {
        current_state: 'nid_2'
      },
      next_state: 'nid_3',
      response: 'Please enter the next 4 digits of your National ID:',
      content: '1234'
    }).then(done, done);
  });

  it('should capture the third 4 digits of the NID', function(done) {
    tester.check_state({
      user: {
        current_state: 'nid_3'
      },
      next_state: 'nid_4',
      response: 'Please enter the last 4 digits of your National ID:',
      content: '1234'
    }).then(done, done);
  });

  it('should capture the last 4 digits of the NID', function(done) {
    tester.check_state({
      user: {
        current_state: 'nid_4',
        answers: {
          nid_1: '1234',
          nid_2: '5678',
          nid_3: '1234',
        }
      },
      next_state: 'nid_confirm',
      response: (
        'Please confirm your National ID:[^]' +
        '1234567812345678[^]' +
        '[^]' +
        '1. This is correct.[^]' +
        '2. This is incorrect.$'),
      content: '5678'
    }).then(done, done);
  });

  it('show allow for correcting of the NID', function(done) {
    tester.check_state({
      user: {
        current_state: 'nid_confirm',
      },
      next_state: 'nid_1',
      response: 'Please enter the first 4 digits of your National ID:',
      content: '2'
    }).then(done, done);
  });

  it('show allow for correcting of the NID', function(done) {
    tester.check_state({
      user: {
        current_state: 'nid_confirm',
      },
      next_state: 'nid_1',
      response: 'Please enter the first 4 digits of your National ID:',
      content: '2'
    }).then(done, done);
  });

  it('show ask for the date of the last menstruation', function(done) {
    tester.check_state({
      user: {
        current_state: 'nid_confirm',
      },
      next_state: 'last_menstruation',
      response: 'When was your last menstruation\\? \\(YYYY-MM-DD\\)',
      content: '1'
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

  it('should end the menu and store the contact', function(done) {
    tester.check_state({
      user: {
        current_state: 'pregnancy_status',
        answers: {
          name: 'Simon',
          surname: 'de Haan',
          dob: '1980-07-30',
          last_menstruation: '2013-09-19',
          pregnancy_status: 'suspected'
        }
      },
      content: '1',
      next_state: 'end',
      response: 'Thank you! Your details have been captured.',
      continue_session: false,
      from_addr: '+27761234567',
    }).then(function() {
      var contact = app.api.find_contact('ussd', '+27761234567');
      assert.equal(contact.name, 'Simon');
      assert.equal(contact.surname, 'de Haan');
      assert.equal(
        contact.dob,
        '1980-07-30T00:00:00.000Z');
      assert.equal(
        contact['extras-last-menstruation'],
        '2013-09-19T00:00:00.000Z');
      assert.equal(contact['extras-pregnancy-status'], 'suspected');
    }).then(done, done);
  });
});