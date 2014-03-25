require('mocha-as-promised')();

var vumigo = require("vumigo_v02");
var app = require("../lib/go-ndoh-v2-part2");
var assert = require('assert');
var _ = require('lodash');

var GoNDOH = app.GoNDOH;
var AppTester = vumigo.AppTester;

describe('GoNDOH version 2 part2', function () {

  var app;
  var tester;

  beforeEach(function () {
    app = new GoNDOH();
    // mock out the time
    app.get_timestamp = function() {
      return '20130819144811';
    };
    app.get_uuid = function() {
      return 'b18c62b4-828e-4b52-25c9-725a1f43fb37';
    };
    tester = new AppTester(app);

    tester
      .setup.user({addr: '+27749927190'});
  });

  it('should ask the language preference', function () {
    return tester
      .start()
      .check.reply([
        'Which language would you prefer?',
        '1. English',
        '2. Afrikaans',
        '3. Zulu',
        '4. Xhosa',
        '5. Sotho'
      ].join('\n'))
      .check.user.state('states:language')
      .run();
  });

  it('should ask the year of birth', function () {
    return tester
      .setup.user.state('states:language')
      .input('1')
      .check.reply('Please enter the year of your birth (eg 1981)')
      .check.user.state('states:year_of_birth')
      .run();
  });

  it('should ask the month of birth', function () {
    return tester
      .setup.user.state('states:year_of_birth')
      .input('1980')
      .check.reply([
        'Please enter the month that you were born',
        '1. Jan',
        '2. Feb',
        '3. March',
        '4. April',
        '5. May',
        '6. June',
        '7. July',
        '8. August',
        '9. Sept',
        '10. Oct',
        '11. Nov',
        '12. Dec'
        ].join('\n'))
      .check.user.state('states:month_of_birth')
      .run();
  });

  it('should ask the day of birth', function () {
    return tester
      .setup.user.state('states:month_of_birth')
      .input('1')
      .check.reply('Please enter the day that you were born (eg 14)')
      .check.user.state('states:day_of_birth')
      .run();
  });

  it('should ask the name', function () {
    return tester
      .setup.user.state('states:day_of_birth')
      .input('1')
      .check.reply('Please enter your first name as it appears on your ID or Passport (eg Precious)')
      .check.user.state('states:name')
      .run();
  });

  it('should ask the surname', function () {
    return tester
      .setup.user.state('states:name')
      .input('Simon')
      .check.reply('Please enter your surname as it appears on your ID or passport (eg Dube)')
      .check.user.state('states:surname')
      .run();
  });

  it('should store the info on the contact', function () {
    return tester
      .setup.user.state('states:surname')
      .setup.user.answers({
        'states:name': 'Simon',
        'states:language': 'english',
        'states:year_of_birth': '1980',
        'states:month_of_birth': '7',
        'states:day_of_birth': '30'
      })
      .input('de Haan')
      .check.reply('Thank you for your details. You will now receive weekly updates on your pregnancy.')
      .check(function (api) {
        var contact = api.contacts.store[0];
        assert.equal(contact.name, 'Simon');
        assert.equal(contact.surname, 'de Haan');
        assert.equal(contact.extra.language, 'english');
        assert.equal(contact.dob, '1980-7-30 00:00:00');
      })
      .run();
  });
});