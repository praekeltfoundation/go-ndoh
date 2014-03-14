var vumigo = require('vumigo_v02');
var libxml = require('libxmljs');
var crypto = require('crypto');
var _ = require('lodash');

var App = vumigo.App;
var Choice = vumigo.states.Choice;
var ChoiceState = vumigo.states.ChoiceState;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;
var HttpApi = vumigo.http.api.HttpApi;
var utils = vumigo.utils;
var InteractionMachine = vumigo.InteractionMachine;

var IDENTITY_OPTIONS = {
  'za_id': 'South African ID',
  'facility_id': 'Facility ID',
  'wc_id': 'Western Cape ID'
};

var month_choices = [
        'Jan', 'Feb', 'March', 'April', 'May', 'June',
        'July', 'August', 'Sept', 'Oct', 'Nov', 'Dec'
    ].map(function(month, index) {
      return new Choice((index + 1).toString(), month);
    });

var GoNDOH = App.extend(function (self) {
  App.call(self, 'states:welcome');

  self.init = function() {

    self.im.on('session:close', function(event) {
      // in case of timeout, send reminder other wise send
      // confirmation sms copy
      copy = event.user_terminated ?
              self.im.config.timeout_sms_copy :
              self.im.config.confirmation_sms_copy;

      return self.im.outbound
        .send_to_user({
          endpoint: 'sms',
          content: copy
        });
    });

    // always lookup user
    return self.im.contacts.for_user().then(function(user_contact) {
      self.contact = user_contact;
    });
  };

  self.states.add('states:welcome', function (name) {
    return new ChoiceState(name, {
      question: (
        'Welcome to MAMA & the DOH Pregnancy Registry. Is this no. (' +
        self.im.user.addr + ') ' +
        'the mobile no. of the pregnant woman to be registered?\n'
      ),
      next: function (choice) {
        return {
          'yes': 'states:opt_in',
          'no': 'states:guided_opt_in'
        }[choice.value];
      },
      choices: [
        new Choice('yes', 'Yes'),
        new Choice('no', 'No')
      ]
    });
  });

  self.states.add('states:opt_in', function (name, opts) {
    var opt_in_addr = opts.opt_in_addr || self.im.user.addr;
    return new ChoiceState(name, {
      question: 'What form of identification will you be using?',
      next: 'states:identity_number',
      choices: _.map(IDENTITY_OPTIONS, function(value, key) {
          return new Choice(key, value);
        })
    });
  });

  self.states.add('states:guided_opt_in', function (name) {
    return new FreeText(name, {
      next: 'states:opt_in',
      question: (
        'Please input the mobile number of the pregnant woman ' +
        'to be registered')
    });
  });

  self.states.add('states:identity_number', function (name) {
    var id_name = IDENTITY_OPTIONS[self.im.user.get_answer('states:opt_in')];
    return new FreeText(name, {
      next: 'states:due_date_calculation',
      question: (
        'Please enter the patient\'s ' + id_name + ' number')
    });
  });

  self.states.add('states:due_date_calculation', function (name) {
    return new ChoiceState(name, {
      question: (
        'We need to know the estimated due date or the date of '+
        'the pregnant woman in question\'s last menstrual period.\n' +
        'Please select:'),
      next: function (choice) {
        return choice.value;
      },
      choices: [
        new Choice('states:due_date_month', 'Due date'),
        new Choice('states:last_menstruation_month', 'Last period')
      ]
    });
  });

  self.states.add('states:due_date_month', function (name) {
    return new ChoiceState(name, {
      question: (
        'Please enter the month of the patient\'s estimated due date'),
      next: 'states:due_date_day',
      choices: month_choices
    });
  });

  self.states.add('states:due_date_day', function (name) {
    return new FreeText(name, {
      question: (
        'Please enter the day of the patient\'s estimated due date (eg 14)'),
      next: 'states:facility_code'
    });
  });

  self.states.add('states:last_menstruation_month', function (name) {
    return new ChoiceState(name, {
      question: (
        'Please enter the month of the patient\'s last menstrual period.'
        ),
      next: 'states:last_menstruation_day',
      choices: month_choices
    });
  });

  self.states.add('states:last_menstruation_day', function (name) {
    return new FreeText(name, {
      question: (
        'Please enter the day of the patient\'s last menstrual period (eg 14)'),
      next: 'states:facility_code'
    });
  });

  self.states.add('states:facility_code', function (name) {
    return new FreeText(name, {
      question: (
        'Please enter the clinic code for the facility where ' +
        'this pregnancy is being registered.'),
      next: 'states:end'
    });
  });

  self.states.add('states:end', function (name) {
    return new EndState(name, {
      text: (
        'Thank you, registration is complete. The pregnant woman should ' +
        'receive a confirmation SMS on her mobile phone. ' +
        'Department of Health'),
      next: 'states:welcome'
    });
  });

});

this.GoNDOH = GoNDOH;
