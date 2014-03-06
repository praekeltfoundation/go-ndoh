require('mocha-as-promised')();

var vumigo = require("vumigo_v02");
var app = require("../lib/go-ndoh");
var assert = require('assert');

var GoNDOH = app.GoNDOH;
var AppTester = vumigo.AppTester;

fixtures = require('./fixtures');

describe('app', function () {

  var app;
  var tester;
  // var fixtures = [
  //   'test/fixtures/identification-message.json',
  //   'test/fixtures/encounter-message.json'
  // ];

  beforeEach(function () {
    app = new GoNDOH();
    // mock out the time
    app.get_timestamp = function() { return '20130819144811'; };
    tester = new AppTester(app);

    tester
      .setup.config.app({
        jembi: {
          username: 'foo',
          password: 'bar',
          url: 'http://test'
        }
      })
      .setup.user({addr: 'user_default'})
      .setup(function(api) {
          fixtures().forEach(api.http.fixtures.add);
      });
  });

  it('should ask for the patients name', function() {
    return tester
      .start()
      .check.reply([
        'Welcome to the Pregnancy Registration Vumi Demo.',
        'What is your name?'
        ].join('\n'))
      .check.user.state('states:name')
      .run();
  });

  it('should ask for the patients surname', function() {
    return tester
      .setup.user.state('states:name')
      .input('Simon')
      .check.reply('What is your surname?')
      .check.user.state('states:surname')
      .run();
  });

  it('should ask for the patients dob', function() {
    return tester
      .setup.user.state('states:surname')
      .input('de Haan')
      .check.reply('What is your date of birth? (YYYY-MM-DD)')
      .check.user.state('states:dob')
      .run();
  });

  it('should check the submitted dob format for correctness', function() {
    return tester
      .setup.user.state('states:dob')
      .input('foo')
      .check.reply('Please provide the date in the YYYY-MM-DD format:')
      .check.user.state('states:dob')
      .run();
  });

  it('should capture the dob and ask for the NID', function() {
    return tester
      .setup.user.state('states:dob')
      .input('1980-7-30')
      .check.reply('Please enter the first 4 digits of your National ID:')
      .check.user.state('states:nid_1')
      .run();
  });

  it('should capture the first 4 digits of the NID', function() {
    return tester
      .setup.user.state('states:nid_1')
      .input('1234')
      .check.reply('Please enter the second 4 digits of your National ID:')
      .check.user.state('states:nid_2')
      .run();
  });

  it('should capture the second 4 digits of the NID', function() {
    return tester
      .setup.user.state('states:nid_2')
      .input('1234')
      .check.reply('Please enter the next 4 digits of your National ID:')
      .check.user.state('states:nid_3')
      .run();
  });

  it('should capture the third 4 digits of the NID', function() {
    return tester
      .setup.user.state('states:nid_3')
      .input('1234')
      .check.reply('Please enter the last 4 digits of your National ID:')
      .check.user.state('states:nid_4')
      .run();
  });

  it('should capture the last 4 digits of the NID', function() {
    return tester
      .setup.user.answers({
        'states:nid_1': '1234',
        'states:nid_2': '5678',
        'states:nid_3': '1234'
      })
      .setup.user.state('states:nid_4')
      .input('5678')
      .check.reply([
        'Please confirm your National ID:',
        '1234567812345678',
        '',
        '1. This is correct.',
        '2. This is incorrect.'
      ].join('\n'))
      .check.user.state('states:nid_confirm')
      .run();
  });

  it('should allow for correcting of the NID', function() {
    return tester
      .setup.user.state('states:nid_confirm')
      .input('2')
      .check.reply('Please enter the first 4 digits of your National ID:')
      .check.user.state('states:nid_1')
      .run();
  });

  it('should ask for the date of the last menstruation', function() {
    return tester
      .setup.user.state('states:nid_confirm')
      .input('1')
      .check.reply('When was your last menstruation? (YYYY-MM-DD)')
      .check.user.state('states:last_menstruation')
      .run();
  });

  it('should check the last menstruation date for correctness', function() {
    return tester
      .setup.user.state('states:last_menstruation')
      .input('foo')
      .check.reply('Please provide the date in the YYYY-MM-DD format:')
      .check.user.state('states:last_menstruation')
      .run();
  });

  it('should check the pregnancy status', function() {
    return tester
      .setup.user.state('states:last_menstruation')
      .input('2013-09-19')
      .check.reply([
        'Do you think you are pregnant or has it been confirmed?',
        '1. I suspect I am pregnant.',
        '2. It has been confirmed, I am pregnant.'
      ].join('\n'))
      .check.user.state('states:pregnancy_status')
      .run();
  });

  it('should end the menu and store the contact', function() {
    return tester
      .setup.user.state('states:pregnancy_status')
      .setup.user.answers({
        'states:name': 'Simon',
        'states:surname': 'de Haan',
        'states:dob': '1980-07-30',
        'states:last_menstruation': '2013-09-19',
        'states:pregnancy_status': 'suspected',
        'states:nid_1': '1234',
        'states:nid_2': '5678',
        'states:nid_3': '90AB',
        'states:nid_4': 'CDEF'
      })
      .input('1')
      .check.reply('Thank you! Your details have been captured.')
      .check.user.state('states:end')
      .check(function (api) {
        var contact = api.contacts.store[0];
        assert.equal(contact.name, 'Simon');
        assert.equal(contact.surname, 'de Haan');
        assert.equal(contact.dob, '1980-07-30T00:00:00.000Z');
        assert.equal(contact.extra.last_menstruation,
                     '2013-09-19T00:00:00.000Z');
        assert.equal(contact.extra.pregnancy_status, 'suspected');
        assert.equal(contact.extra.nid, '1234567890ABCDEF');
      })
      .run();

    // tester.check_state({
    //   user: {
    //     current_state: 'pregnancy_status',
    //     answers: {
    //       name: 'Simon',
    //       surname: 'de Haan',
    //       dob: '1980-07-30',
    //       last_menstruation: '2013-09-19',
    //       pregnancy_status: 'suspected',
    //       nid_1: '1234',
    //       nid_2: '5678',
    //       nid_3: '90AB',
    //       nid_4: 'CDEF'
    //     }
    //   },
    //   content: '1',
    //   next_state: 'end',
    //   response: 'Thank you! Your details have been captured.',
    //   continue_session: false,
    //   from_addr: '+27761234567',
    // }).then(function() {
    //   var contact = app.api.find_contact('ussd', '+27761234567');
    //   assert.equal(contact.name, 'Simon');
    //   assert.equal(contact.surname, 'de Haan');
    //   assert.equal(contact.dob, '1980-07-30T00:00:00.000Z');
    //   assert.equal(contact['extras-last-menstruation'],
    //                '2013-09-19T00:00:00.000Z');
    //   assert.equal(contact['extras-pregnancy-status'], 'suspected');
    //   assert.equal(contact['extras-nid'],
    //                '1234567890ABCDEF');
    // }).then(done, done);
  });
});