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


var month_choices = [
        'Jan', 'Feb', 'March', 'April', 'May', 'June',
        'July', 'August', 'Sept', 'Oct', 'Nov', 'Dec'
    ].map(function(month, index) {
      return new Choice((index + 1).toString(), month);
    });


var GoNDOH = App.extend(function (self) {
  App.call(self, 'states:language');

  self.init = function() {
    // always lookup user
    return self.im.contacts.for_user().then(function(user_contact) {
      self.contact = user_contact;
    });
  };

  self.states.add('states:language', function (name) {
    return new ChoiceState(name, {
      question: 'Which language would you prefer?',
      next: 'states:year_of_birth',
      choices: [
        new Choice('english', 'English'),
        new Choice('afrikaans', 'Afrikaans'),
        new Choice('zulu', 'Zulu'),
        new Choice('xhosa', 'Xhosa'),
        new Choice('sotho', 'Sotho')
      ]
    });
  });

  self.states.add('states:year_of_birth', function (name) {
    return new FreeText(name, {
      question: 'Please enter the year of your birth (eg 1981)',
      next: 'states:month_of_birth'
    });
  });

  self.states.add('states:month_of_birth', function (name) {
    return new ChoiceState(name, {
      question: 'Please enter the month that you were born',
      next: 'states:day_of_birth',
      choices: month_choices
    });
  });

  self.states.add('states:day_of_birth', function (name) {
    return new FreeText(name, {
      question: 'Please enter the day that you were born (eg 14)',
      next: 'states:name'
    });
  });

  self.states.add('states:name', function (name) {
    return new FreeText(name, {
      question: 'Please enter your first name as it appears on your ID or Passport (eg Precious)',
      next: 'states:surname'
    });
  });

  self.states.add('states:surname', function (name) {
    return new FreeText(name, {
      question: 'Please enter your surname as it appears on your ID or passport (eg Dube)',
      next: function(content) {
        var user = self.im.user;

        self.contact.name = user.get_answer('states:name');
        self.contact.surname = user.get_answer('states:surname');
        self.contact.dob = [
          user.get_answer('states:year_of_birth'),
          user.get_answer('states:month_of_birth'),
          user.get_answer('states:day_of_birth')
        ].join('-');
        self.contact.extra.language = user.get_answer('states:language');

        return self.im
          .contacts.save(self.contact)
          .then(function (result){
            return 'states:end';
          });
      }
    });
  });

  self.states.add('states:end', function (name) {
    return new EndState(name, {
      text: 'Thank you for your details. You will now receive weekly updates on your pregnancy.',
      next: 'states:language'
    });
  });
});


if (typeof api != 'undefined') {
  new InteractionMachine(api, new GoNDOH());
}

this.GoNDOH = GoNDOH;
