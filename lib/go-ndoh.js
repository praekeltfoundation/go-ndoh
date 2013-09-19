var vumigo = require("vumigo_v01");
var jed = require("jed");
var libxml = require('libxmljs');

if (typeof api === "undefined") {
  // testing hook (supplies api when it is not passed in by the real sandbox)
  var api = this.api = new vumigo.dummy_api.DummyApi();
}

var Promise = vumigo.promise.Promise;
var success = vumigo.promise.success;
var Stae = vumigo.states.State;
var Choice = vumigo.states.Choice;
var ChoiceState = vumigo.states.ChoiceState;
var PaginatedChoiceState = vumigo.states.PaginatedChoiceState;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;
var BookletState = vumigo.states.BookletState;
var InteractionMachine = vumigo.state_machine.InteractionMachine;
var StateCreator = vumigo.state_machine.StateCreator;

// Thanks SO!
// http://stackoverflow.com/q/1353684
function isValidDate(d) {
  if ( Object.prototype.toString.call(d) !== "[object Date]" )
    return false;
  return !isNaN(d.getTime());
}

function GoNDOH() {
  var self = this;

  // The first state to enter
  StateCreator.call(self, 'name');

  self.add_state(new FreeText(
    'name',
    'surname',
    ('Welcome to Pregnancy Registration Vumi Demo.\n' +
     'What is your name?')
    ));

  self.add_state(new FreeText(
    'surname',
    'dob',
    'What is your surname?'
    ));

  self.add_state(new FreeText(
    'dob',
    'last_menstruation',
    'What is your date of birth? (YYYY-MM-DD)',
    function(content) {
      return isValidDate(new Date(content));
    },
    'Please provide the date in the YYYY-MM-DD format:'));

  self.add_state(new FreeText(
    'last_menstruation',
    'pregnancy_status',
    'When was your last menstruation? (YYYY-MM-DD)',
    function(content) {
      return isValidDate(new Date(content));
    },
    'Please provide the date in the YYYY-MM-DD format:'));

  self.add_state(new ChoiceState(
    'pregnancy_status',
    'end',
    'Do you think you are pregnant or has it been confirmed?',
    [
      new Choice('suspected', 'I suspect I am pregnant.'),
      new Choice('confirmed', 'It has been confirmed, I am pregnant.'),
    ]
    ));

  self.add_state(new EndState(
    'end',
    'Thank you! Your details have been captured.',
    'name'));
}

// launch app
var states = new GoNDOH();
var im = new InteractionMachine(api, states);
im.attach();
