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
    'nid_1',
    'What is your date of birth? (YYYY-MM-DD)',
    function(content) {
      return isValidDate(new Date(content));
    },
    'Please provide the date in the YYYY-MM-DD format:'));

  self.add_state(new FreeText(
    'nid_1',
    'nid_2',
    'Please enter the first 4 digits of your National ID:'
    ));

  self.add_state(new FreeText(
    'nid_2',
    'nid_3',
    'Please enter the next 4 digits of your National ID:'
    ));

  self.add_state(new FreeText(
    'nid_3',
    'nid_4',
    'Please enter the next 4 digits of your National ID:'
    ));

  self.add_state(new FreeText(
    'nid_4',
    'nid_confirm',
    'Please enter the last 4 digits of your National ID:'
    ));

  self.add_creator('nid_confirm', function(state_name, im) {
    return new ChoiceState(
      state_name,
      function(choice) {
        return (choice.value == 'correct' ?
                'last_menstruation' : 'nid_1');
      },
      ('Please confirm your National ID:\n' +
        im.get_user_answer('nid_1') +
        im.get_user_answer('nid_2') +
        im.get_user_answer('nid_3') +
        im.get_user_answer('nid_4') + '\n'),
      [
        new Choice('correct', 'This is correct.'),
        new Choice('incorrect', 'This is incorrect.')
      ]
    );
  });

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

  self.add_creator('end', function(state_name, im) {
    var p = im.api_request('contacts.get_or_create', {
      addr: im.user_addr,
      delivery_class: 'ussd',
    });
    p.add_callback(function(result) {
      var contact = result.contact;
      return im.api_request('contacts.update', {
        key: contact.key,
        fields: {
          name: im.get_user_answer('name'),
          surname: im.get_user_answer('surname'),
          dob: new Date(im.get_user_answer('dob')).toISOString()
        }
      });
    });
    p.add_callback(function(result) {
      var contact = result.contact;
      return im.api_request('contacts.update_extras', {
        key: contact.key,
        fields: {
          'last-menstruation': new Date(
            im.get_user_answer('last_menstruation')).toISOString(),
          'pregnancy-status': im.get_user_answer('pregnancy_status'),
          'nid': (
            im.get_user_answer('nid_1') +
            im.get_user_answer('nid_2') +
            im.get_user_answer('nid_3') +
            im.get_user_answer('nid_4'))
        }
      });
    });
    p.add_callback(self.post_identification_request);
    p.add_callback(function(result) {
      return new EndState(
        state_name,
        'Thank you! Your details have been captured.',
        'name');
    });
    return p;
  });

  self.get_headers = function() {
    var username = im.config.jembi.username,
        password = im.config.jembi.password;
    var auth = new Buffer(username + ':' + password).toString('base64');

    return {
      'Content-Type': ['application/xml'],
      'Authorization': ['Basic ' + auth]
    };
  };

  self.get_identification_message = function() {
    /**

    HERE BE DRAGONS

    I'm searching and replacing on XML data.

    **/
    var sample_msg = '' +
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<ADT_A05 xmlns="urn:hl7-org:v2xml">' +
    '   <MSH>' +
    '      <MSH.1>|</MSH.1>' +
    '      <MSH.2>^~\&amp;</MSH.2>' +
    '      <MSH.7>' +
    '         <TS.1>${now}</TS.1>' +
    '      </MSH.7>' +
    '      <MSH.9>' +
    '         <MSG.1>ADT</MSG.1>' +
    '         <MSG.2>A28</MSG.2>' +
    '         <MSG.3>ADT_A05</MSG.3>' +
    '      </MSH.9>' +
    '      <MSH.12>' +
    '         <VID.1>2.5</VID.1>' +
    '      </MSH.12>' +
    '   </MSH>' +
    '   <PID>' +
    '      <PID.3>' +
    '         <CX.1>${nid}</CX.1>' +
    '         <CX.5>NID</CX.5>' +
    '      </PID.3>' +
    '      <PID.5>' +
    '         <XPN.1>' +
    '            <FN.1>${family_name}</FN.1>' +
    '         </XPN.1>' +
    '         <XPN.2>${given_name}</XPN.2>' +
    '      </PID.5>' +
    '      <PID.7>' +
    '         <TS.1>${dob}</TS.1>' +
    '      </PID.7>' +
    '      <PID.8>${gender}</PID.8>' +
    '   </PID>' +
    '   <NK1>' +
    '      <NK1.1>1</NK1.1>' +
    '      <NK1.2>' +
    '         <XPN.1>' +
    '            <FN.1></FN.1>' +
    '         </XPN.1>' +
    '      </NK1.2>' +
    '      <NK1.3>' +
    '         <CE.1>MTH</CE.1>' +
    '         <CE.2>mother</CE.2>' +
    '         <CE.3>REL_RTS</CE.3>' +
    '      </NK1.3>' +
    '   </NK1>' +
    '   <NK1>' +
    '      <NK1.1>2</NK1.1>' +
    '      <NK1.2>' +
    '         <XPN.1>' +
    '            <FN.1></FN.1>' +
    '         </XPN.1>' +
    '      </NK1.2>' +
    '      <NK1.3>' +
    '         <CE.1>FTH</CE.1>' +
    '         <CE.2>father</CE.2>' +
    '         <CE.3>REL_RTS</CE.3>' +
    '      </NK1.3>' +
    '   </NK1>' +
    '</ADT_A05>';

    var map = {
      'dob': im.get_user_answer('dob'),
      'gender': 'F',
      'family_name': im.get_user_answer('surname'),
      'given_name': im.get_user_answer('name'),
      'nid': (
        im.get_user_answer('nid_1') +
        im.get_user_answer('nid_2') +
        im.get_user_answer('nid_3') +
        im.get_user_answer('nid_4')),
      'now': self.get_timestamp()
    };

    Object.keys(map).forEach(function(key) {
      sample_msg = sample_msg.replace('${' + key + '}', map[key]);
    });
    return sample_msg;
  };

  self.get_timestamp = function() {

    var zero_pad = function(v) {
      return v < 10 ? '0' + v : v;
    };

    var d = new Date();
    return (
      d.getFullYear() +
      zero_pad(d.getMonth()) +
      zero_pad(d.getDate()) +
      zero_pad(d.getHours()) +
      zero_pad(d.getMinutes()) +
      zero_pad(d.getSeconds()));
  };

  self.post_identification_request = function(result) {
    return im.api_request('http.post', {
      url: im.config.jembi.url,
      data: self.get_identification_message(),
      headers: self.get_headers(),
    });
  };
}

// launch app
var states = new GoNDOH();
var im = new InteractionMachine(api, states);
im.attach();
