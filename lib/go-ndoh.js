var vumigo = require('vumigo_v02');
var jed = require("jed");
var libxml = require('libxmljs');

var App = vumigo.App;
var Choice = vumigo.states.Choice;
var ChoiceState = vumigo.states.ChoiceState;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;


// var Promise = vumigo.promise.Promise;
// var success = vumigo.promise.success;
// var Stae = vumigo.states.State;
// var Choice = vumigo.states.Choice;
// var ChoiceState = vumigo.states.ChoiceState;
// var PaginatedChoiceState = vumigo.states.PaginatedChoiceState;
// var FreeText = vumigo.states.FreeText;
// var EndState = vumigo.states.EndState;
// var BookletState = vumigo.states.BookletState;
// var InteractionMachine = vumigo.state_machine.InteractionMachine;
// var StateCreator = vumigo.state_machine.StateCreator;

// Thanks SO!
// http://stackoverflow.com/q/1353684
function isValidDate(d) {
  if ( Object.prototype.toString.call(d) !== "[object Date]" )
    return false;
  return !isNaN(d.getTime());
}

var zero_pad = function(v) {
  return v < 10 ? '0' + v : v;
};

var GoNDOH = App.extend(function(self) {
  App.call(self, 'states:name');

  self.init = function() {
      return self.im.contacts.for_user().then(function(user_contact) {
          self.contact = user_contact;
      });
  };

  self.get_nid = function() {
    return (
      self.im.user.get_answer('states:nid_1') +
      self.im.user.get_answer('states:nid_2') +
      self.im.user.get_answer('states:nid_3') +
      self.im.user.get_answer('states:nid_4'));
  };

  self.states.add('states:name', function(name) {
    return new FreeText(name, {
      next: 'states:surname',
      question: ('Welcome to the Pregnancy Registration Vumi Demo.\n' +
                 'What is your name?')
    });
  });

  self.states.add('states:surname', function(name) {
    return new FreeText(name, {
      next: 'states:dob',
      question: 'What is your surname?'
    });
  });

  self.states.add('states:dob', function(name) {
    return new FreeText(name, {
      next: 'states:nid_1',
      question: 'What is your date of birth? (YYYY-MM-DD)',
      check: function(content) {
        if(!isValidDate(new Date(content))) {
          return 'Please provide the date in the YYYY-MM-DD format:';
        }
      }
    });
  });

  self.states.add('states:nid_1', function(name) {
    return new FreeText(name, {
      next: 'states:nid_2',
      question: 'Please enter the first 4 digits of your National ID:'
    });
  });

  self.states.add('states:nid_2', function(name) {
    return new FreeText(name, {
      next: 'states:nid_3',
      question: 'Please enter the second 4 digits of your National ID:'
    });
  });

  self.states.add('states:nid_3', function(name) {
    return new FreeText(name, {
      next: 'states:nid_4',
      question: 'Please enter the next 4 digits of your National ID:'
    });
  });

  self.states.add('states:nid_4', function(name) {
    return new FreeText(name, {
      next: 'states:nid_confirm',
      question: 'Please enter the last 4 digits of your National ID:'
    });
  });

  self.states.add('states:nid_confirm', function(name) {
    return new ChoiceState(name, {
      question: 'Please confirm your National ID:\n' + self.get_nid() + '\n',
      next: function(choice) {
        return (choice.value == 'correct' ?
                'states:last_menstruation' : 'states:nid_1');
      },
      choices: [
        new Choice('correct', 'This is correct.'),
        new Choice('incorrect', 'This is incorrect.')
      ]
    });
  });

  self.states.add('states:last_menstruation', function(name) {
    return new FreeText(name, {
      question: 'When was your last menstruation? (YYYY-MM-DD)',
      next: 'states:pregnancy_status',
      check: function(content) {
        if(!isValidDate(new Date(content))) {
          return 'Please provide the date in the YYYY-MM-DD format:';
        }
      }
    });
  });

  self.states.add('states:pregnancy_status', function(name) {
    return new ChoiceState(name, {
      question: 'Do you think you are pregnant or has it been confirmed?',
      choices: [
        new Choice('suspected', 'I suspect I am pregnant.'),
        new Choice('confirmed', 'It has been confirmed, I am pregnant.')
      ],
      next: function(choice) {
        var contact = self.contact;
        var user = self.im.user;

        contact.name = user.get_answer('states:name');
        contact.surname = user.get_answer('states:surname');
        contact.dob = new Date(user.get_answer('states:dob')).toISOString();
        contact.extra.last_menstruation = new Date(user.get_answer('states:last_menstruation')).toISOString();
        contact.extra.pregnancy_status = user.get_answer('states:pregnancy_status');
        contact.extra.nid = self.get_nid();

        return self.im.contacts.save(contact)
                .then(function() {
                  return 'states:end';
                });
      }
    });
  });

  self.states.add('states:end', function(name) {
    return new EndState(name, {
      text: 'Thank you! Your details have been captured.',
      next: 'states:name'
    });
  });

});

function _GoNDOH() {
  var self = this;

  self.add_state(new ChoiceState(
    'pregnancy_status',
    'end',
    'Do you think you are pregnant or has it been confirmed?',
    [
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
          'nid': self.get_nid()
        }
      });
    });
    p.add_callback(self.post_identification_request);
    p.add_callback(self.log_response);
    p.add_callback(self.post_encounter_request);
    p.add_callback(self.log_response);
    p.add_callback(function(result) {
      return new EndState(
        state_name,
        'Thank you! Your details have been captured.',
        'name');
    });
    return p;
  });

  self.log_response = function(result) {
    return im.log(JSON.stringify(result));
  };

  self.get_headers = function() {
    var username = im.config.jembi.username,
        password = im.config.jembi.password;
    var auth = new Buffer(username + ':' + password).toString('base64');

    return {
      'Content-Type': ['application/xml'],
      'Authorization': ['Basic ' + auth]
    };
  };

   self.search_and_replace = function(map, msg) {
    Object.keys(map).forEach(function(key) {
      // global RegExp replace
      msg = msg.replace(new RegExp('\\$\\{' + key + '\\}', 'g'), map[key]);
    });
    return msg;
  };

  self.format_dob = function(dob) {
    var d = new Date(dob);
    return (d.getFullYear() +
            zero_pad(d.getMonth() + 1) +
            zero_pad(d.getDate()));
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
      'dob': self.format_dob(im.get_user_answer('dob')),
      'gender': 'F',
      'family_name': im.get_user_answer('surname'),
      'given_name': im.get_user_answer('name'),
      'nid': self.get_nid(),
      'now': self.get_timestamp()
    };

    return self.search_and_replace(map, sample_msg);
  };

  self.get_encounter_message = function() {
    /**

    HERE BE MORE OF THE SAME DRAGONS

    **/
    var sample_msg = '' +
    '<?xml version="1.0"?>' +
    '<ORU_R01 xmlns="urn:hl7-org:v2xml">' +
    '    <MSH>' +
    '        <MSH.1>|</MSH.1>' +
    '        <MSH.2>^~\&amp;amp;</MSH.2>' +
    '        <MSH.4>' +
    '            <HD.1>363</HD.1>' +
    '        </MSH.4>' +
    '        <MSH.6>' +
    '            <HD.1>Shared Health Record</HD.1>' +
    '        </MSH.6>' +
    '        <MSH.7>' +
    '            <TS.1>${now}</TS.1>' +
    '        </MSH.7>' +
    '        <MSH.9>' +
    '            <MSG.1>ORU</MSG.1>' +
    '            <MSG.2>R01</MSG.2>' +
    '            <MSG.3>ORU_R01</MSG.3>' +
    '        </MSH.9>' +
    '        <MSH.10>63357449-6a6c-4faa-af7a-e8843a545c31</MSH.10>' +
    '        <MSH.11>' +
    '            <PT.1>D</PT.1>' +
    '            <PT.2>C</PT.2>' +
    '        </MSH.11>' +
    '        <MSH.12>' +
    '            <VID.1>2.5</VID.1>' +
    '            <VID.2>' +
    '                <CE.1>RWA</CE.1>' +
    '            </VID.2>' +
    '        </MSH.12>' +
    '        <MSH.21>' +
    '            <EI.1>CLSM_V0.83</EI.1>' +
    '        </MSH.21>' +
    '    </MSH>' +
    '    <ORU_R01.PATIENT_RESULT>' +
    '        <ORU_R01.PATIENT>' +
    '            <PID>' +
    '                <PID.3>' +
    '                    <CX.1>${nid}</CX.1>' +
    '                    <CX.5>NID</CX.5>' +
    '                </PID.3>' +
    '                <PID.5>' +
    '                    <XPN.1>' +
    '                        <FN.1>${family_name}</FN.1>' +
    '                    </XPN.1>' +
    '                    <XPN.2>${given_name}</XPN.2>' +
    '                </PID.5>' +
    '                <PID.7>' +
    '                    <TS.1>${dob}</TS.1>' +
    '                </PID.7>' +
    '            </PID>' +
    '            <ORU_R01.VISIT>' +
    '                <PV1>' +
    '                    <PV1.2>0</PV1.2>' +
    '                    <PV1.3>' +
    '                        <PL.1>111</PL.1>' +
    '                        <PL.4>' +
    '                            <HD.1>Ruhunda</HD.1>' +
    '                        </PL.4>' +
    '                    </PV1.3>' +
    '                    <PV1.4>ANC OB and Past Medical History</PV1.4>' +
    '                    <PV1.7>' +
    '                        <XCN.1>3525410</XCN.1>' +
    '                        <XCN.2>' +
    '                            <FN.1>Developer</FN.1>' +
    '                        </XCN.2>' +
    '                        <XCN.3>Jembi</XCN.3>' +
    '                        <XCN.13>NID</XCN.13>' +
    '                    </PV1.7>' +
    '                    <PV1.44>' +
    '                        <TS.1>${now}</TS.1>' +
    '                    </PV1.44>' +
    '                </PV1>' +
    '            </ORU_R01.VISIT>' +
    '        </ORU_R01.PATIENT>' +
    '        <ORU_R01.ORDER_OBSERVATION>' +
    '            <ORC>' +
    '                <ORC.1>RE</ORC.1>' +
    '                <ORC.9>' +
    '                    <TS.1>${now}</TS.1>' +
    '                </ORC.9>' +
    '                <ORC.12>' +
    '                    <XCN.1>3525410</XCN.1>' +
    '                </ORC.12>' +
    '                <ORC.16>' +
    '                    <CE.1>Identifier</CE.1>' +
    '                    <CE.2>Text</CE.2>' +
    '                    <CE.3>Name of Coding System</CE.3>' +
    '                </ORC.16>' +
    '            </ORC>' +
    '            <OBR>' +
    '                <OBR.1>0</OBR.1>' +
    '                <OBR.3>' +
    '                    <EI.1>1437</EI.1>' +
    '                </OBR.3>' +
    '                <OBR.4>' +
    '                    <CE.2>ANC OB and Past Medical History</CE.2>' +
    '                </OBR.4>' +
    '                <OBR.7>' +
    '                    <TS.1>${now}</TS.1>' +
    '                </OBR.7>' +
    '                <OBR.20>111</OBR.20>' +
    '                <OBR.21>Ruhunda</OBR.21>' +
    '            </OBR>' +
    '        </ORU_R01.ORDER_OBSERVATION>' +
    '        <ORU_R01.ORDER_OBSERVATION>' +
    '            <OBR>' +
    '                <OBR.1>1</OBR.1>' +
    '                <OBR.18>0</OBR.18>' +
    '                <OBR.29>' +
    '                    <EIP.2>' +
    '                        <EI.3>1437</EI.3>' +
    '                    </EIP.2>' +
    '                </OBR.29>' +
    '            </OBR>' +
    '            <ORU_R01.OBSERVATION>' +
    '                <OBX>' +
    '                    <OBX.1>0</OBX.1>' +
    '                    <OBX.2>CE</OBX.2>' +
    '                    <OBX.3>' +
    '                        <CE.1>${obs_code}</CE.1>' +
    '                        <CE.2>${obs_name}</CE.2>' +
    '                        <CE.3>ICD10</CE.3>' +
    '                    </OBX.3>' +
    '                    <OBX.5>' +
    '                        <CE.1>1065</CE.1>' +
    '                        <CE.2>YES</CE.2>' +
    '                        <CE.3>RWCS</CE.3>' +
    '                    </OBX.5>' +
    '                    <OBX.14>' +
    '                        <TS.1>${now}</TS.1>' +
    '                    </OBX.14>' +
    '                </OBX>' +
    '            </ORU_R01.OBSERVATION>' +
    '        </ORU_R01.ORDER_OBSERVATION>' +
    '    </ORU_R01.PATIENT_RESULT>' +
    '</ORU_R01>';

    var map = {
      'now': self.get_timestamp(),
      'nid': self.get_nid(),
      'family_name': im.get_user_answer('surname'),
      'given_name': im.get_user_answer('name'),
      'dob': self.format_dob(im.get_user_answer('dob')),
      'obs_code': (im.get_user_answer('pregnancy_status') == 'confirmed' ?
                    'Pregnancy confirmed' : 'Pregnancy, not (yet) confirmed'),
      'obs_name': (im.get_user_answer('pregnancy_status') == 'confirmed' ?
                    'Z32.9' : 'Z32.0')
    };

    return self.search_and_replace(map, sample_msg);
  };

  self.get_timestamp = function() {

    var d = new Date();
    return (
      d.getFullYear() +
      zero_pad(d.getMonth() + 1) +
      zero_pad(d.getDate()) +
      zero_pad(d.getHours()) +
      zero_pad(d.getMinutes()) +
      zero_pad(d.getSeconds()));
  };

  self.post_identification_request = function(result) {
    return im.api_request('http.post', {
      url: im.config.jembi.url + '/ws/rest/v1/patients/',
      data: self.get_identification_message(),
      headers: self.get_headers(),
      verify_options: ['VERIFY_NONE']
    });
  };

  self.post_encounter_request = function(result) {
    return im.api_request('http.post', {
      url: (im.config.jembi.url +
            '/ws/rest/v1/patient/NID-' + self.get_nid() + '/encounters'),
      data: self.get_encounter_message(),
      headers: self.get_headers(),
      verify_options: ['VERIFY_NONE']
    });
  };
}

if (typeof api != 'undefined') {
    new InteractionMachine(api, new GoNDOH());
}


this.GoNDOH = GoNDOH;
