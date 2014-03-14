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

// Thanks SO!
// http://stackoverflow.com/q/1353684
function isValidDate(d) {
  if (Object.prototype.toString.call(d) !== "[object Date]") {
    return false;
  }
  return !isNaN(d.getTime());
}

// Thanks SO!
// http://stackoverflow.com/a/1685917
function toFixed(x) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split('e-')[1]);
    if (e) {
        x *= Math.pow(10,e-1);
        x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split('+')[1]);
    if (e > 20) {
        e -= 20;
        x /= Math.pow(10,e);
        x += (new Array(e+1)).join('0');
    }
  }
  return x;
}

var zero_pad = function(v) {
  return v < 10 ? '0' + v : v;
};

var CDA_Template = [
  '<?xml version="1.0"?>',
  '<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:cda="urn:hl7-org:v3" xmlns:voc="urn:hl7-org:v3/voc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:pcc="urn:ihe:pcc:hl7v3" xmlns:lab="urn:oid:1.3.6.1.4.1.19376.1.3.2" xmlns:sdtc="urn:hl7-org:sdtc" xsi:schemaLocation="urn:hl7-org:v3 CDA.xsd">',
  '<typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>',
  '<templateId root="2.16.840.1.113883.10" extension="IMPL_CDAR2_LEVEL1"/>',
  '<id root="${uniqueId}"/>',
  '<code code="51855-5" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
  '<title>SA National Pregnancy Register - Patient Note</title>',
  '<!-- Creation time of document, e.g. 20140217121212 -->',
  '<effectiveTime value="${createdTime}"/>',
  '<confidentialityCode code="N" displayName="Normal" codeSystem="2.16.840.1.113883.5.25" codeSystemName="Confidentiality"/>',
  '<languageCode code="en-UK"/>',
  '<!-- Client details -->',
  '<recordTarget>',
  '  <patientRole>',
  ' <!-- Patient Identifier -->',
  ' <!-- The value for extension must be specified in HL7 CX format: -->',
  ' <!-- id^^^assigningAuthority^typeCode -->',
  ' <!-- The typeCode specified the type of identifier, e.g. NI for National Identifier or PPN for Passport Number -->',
  ' <!-- The assigningAuthority specifies the issuer of the id, e.g. ZAR for South Africa -->',
  ' <!-- An example for a South African National ID is: -->',
  ' <!-- <id extension="7612241234567^^^ZAF^NI" root="526ef9c3-6f18-420a-bc53-9b733920bc67" /> -->',
  ' <id extension="${pidCX}" root="526ef9c3-6f18-420a-bc53-9b733920bc67"/>',
  ' <addr/>',
  ' <!-- Telephone number in RFC3966 format, e.g. tel:+27731234567 -->',
  ' <telecom value="tel:${cellNumber}"/>',
  ' <patient>',
  '   <name>',
  '   <given>${givenName}</given>',
  '   <family>${familyName}</family>',
  '   </name>',
  '   <administrativeGenderCode code="F" codeSystem="2.16.840.1.113883.5.1"/>',
  '   <!-- e.g. 19700123 -->',
  '   <birthTime value="${birthDate}"/>',
  '   <languageCommunication>',
  '   <languageCode code="${languageCode}"/>',
  '   <preferenceInd value="true"/>',
  '   </languageCommunication>',
  ' </patient>',
  '  </patientRole>',
  '</recordTarget>',
  '<!-- HCW Details -->',
  '<author>',
  '  <time value="${time}"/>',
  '  <assignedAuthor>',
  ' <id extension="${hcwCode}" root="833f2856-b9e1-4f54-8694-c74c4283755f" assigningAuthorityName="HCW Code"/>',
  ' <addr/>',
  ' <telecom value="tel:${hcwCellNumber}"/>',
  ' <assignedPerson>',
  '   <name>',
  '   <given>${hcwGivenName}</given>',
  '   <family>${hcwFamilyName}</family>',
  '   </name>',
  ' </assignedPerson>',
  ' <representedOrganization>',
  '   <id extension="${facilityId}" root="ab8c9bd1-26e9-47bf-8bbe-3524fccb9f2c" assigningAuthorityName="Facility Code"/>',
  '   <name>${facilityName}</name>',
  ' </representedOrganization>',
  '  </assignedAuthor>',
  '</author>',
  '<custodian>',
  '  <assignedCustodian>',
  ' <representedCustodianOrganization>',
  '   <id root="a5881e6c-b42e-4559-a1fd-d1dc52379658"/>',
  '   <name>SA National Department of Health</name>',
  ' </representedCustodianOrganization>',
  '  </assignedCustodian>',
  '</custodian>',
  '<documentationOf>',
  '  <serviceEvent classCode="PCPR">',
  ' <effectiveTime value="${encounterDateTime}"/>',
  '  </serviceEvent>',
  '</documentationOf>',
  '<component>',
  '  <structuredBody>',
  ' <component>',
  '   <section>',
  '   <code code="57060-6" displayName="Estimated date of delivery Narrative" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
  '   <text>',
  '     <table>',
  '     <thead>',
  '       <tr>',
  '       <td>Pregnancy status</td>',
  '       <td>Note Date</td>',
  '       <td>Delivery Date (Estimated)</td>',
  '       </tr>',
  '     </thead>',
  '     <tbody>',
  '       <!-- e.g. -->',
  '       <tr>',
  '       <td>Pregnancy confirmed</td>',
  '       <td>2014-02-17</td>',
  '       <td>2014-10-17</td>',
  '       </tr>',
  '     </tbody>',
  '     </table>',
  '   </text>',
  '   <entry>',
  '     <!-- Pregnancy Status -->',
  '     <observation classCode="OBS" moodCode="EVN">',
  '     <code code="11449-6" displayName="Pregnancy status" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
  '     <text/>',
  '     <statusCode code="completed"/>',
  '     <!-- e.g. 20140217 -->',
  '     <effectiveTime value="${effectiveTime}"/>',
  '     <!-- one of \'value\' -->',
  '     <value xsi:type="CE" code="77386006" displayName="Pregnancy confirmed" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>',
  '     <!--<value xsi:type="CE" code="102874004" displayName="Unconfirmed pregnancy" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>-->',
  '     <!--<value xsi:type="CE" code="60001007" displayName="Not pregnant" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>-->',
  '     <!--<value xsi:type="CE" code="289256000" displayName="Mother delivered" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>-->',
  '     <!-- Remove entryRelationship if \'Not pregnant\' -->',
  '     <entryRelationship typeCode="SPRT" inversionInd="true">',
  '       <!-- Delivery Date -->',
  '       <observation classCode="OBS" moodCode="EVN">',
  '       <!-- one of \'code\' -->',
  '       <code code="11778-8" displayName="Delivery date Estimated" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
  '       <!-- <code code="8665-2" displayName="Last menstrual period start date" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/> -->',
  '       <!-- Delivery Date (if \'Mother Delivered\') -->',
  '       <!-- <code code="21112-8" displayName="Birth date" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/> -->',
  '       <text/>',
  '       <statusCode code="completed"/>',
  '       <!-- e.g. 20141017 -->',
  '       <value xsi:type="TS" value="${date}"/>',
  '       </observation>',
  '     </entryRelationship>',
  '     </observation>',
  '   </entry>',
  '   </section>',
  ' </component>',
  '  </structuredBody>',
  '</component>',
  '</ClinicalDocument>'
].join('\n');


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
  App.call(self, 'states:self_opt_in');

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

  self.states.add('states:self_opt_in', function (name) {
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
        return {
          'due_date': 'states:due_date_month',
          'last_menstruation': 'states:last_menstruation_month'
        }[choice.value];
      },
      choices: [
        new Choice('due_date', 'Due date'),
        new Choice('last_menstruation', 'Last period')
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
      next: function (content) {
        var user = self.im.user;

        return self.im.contacts.get(self.get_optin_addr(), {
            create: true,
            delivery_class: 'ussd'
          })
          .then(function (contact) {
            if(user.get_answer('states:due_date_calculation') == 'due_date') {
              contact.extra.due_date_day = user.get_answer('states:due_date_day');
              contact.extra.due_date_month = user.get_answer('states:due_date_month');
            } else {
              contact.extra.last_menstruation_day = user.get_answer('states:last_menstruation_day');
              contact.extra.last_menstruation_month = user.get_answer('states:last_menstruation_month');
            }

            contact.extra.self_opt_in = user.get_answer('states:self_opt_in');
            contact.extra.identity_number = user.get_answer('states:identity_number');
            contact.extra.facility_code = user.get_answer('states:facility_code');

            return self.im.contacts.save(contact);
          })
          .then(function (result) {
            return self.jembi_api_call(self.build_cda_doc());
          })
          .then(function(result) {
              return result.code == 200 ? 'states:end' : 'states:error';
          });
      }
    });
  });

  self.states.add('states:end', function (name) {
    return new EndState(name, {
      text: (
        'Thank you, registration is complete. The pregnant woman should ' +
        'receive a confirmation SMS on her mobile phone. ' +
        'Department of Health'),
      next: 'states:self_opt_in'
    });
  });

  // HERE BE DRAGONS

  self.format_dob = function(dob) {
    var d = new Date(dob);
    return (d.getFullYear() +
            zero_pad(d.getMonth() + 1) +
            zero_pad(d.getDate()));
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

  self.get_uuid = function () {
    return utils.uuid();
  };

  self.get_oid = function () {
    var uuid = self.get_uuid();
    var hex = uuid.replace('-', '');
    var number = parseInt(hex, 16);
    return '2.25.' + toFixed(number);
  };

  self.get_patient_id = function() {
    var user = self.im.user;
    var formatter = {
      'za_id': function (id) {
        return id + '^^^ZAF^NI';
      },
      'facility_id': function (id) {
        return id + '^^^' + user.get_answer('states:facility_code') + '^FI';
      },
      'wc_id': function (id) {
        return id + '^^^WC^RRI';
      }
    }[user.get_answer('states:opt_in')];
    return formatter(user.get_answer('states:identity_number'));
  };

  self.get_optin_addr = function () {
    var user = self.im.user;
    return user.get_answer('states:self_opt_in') == 'yes' ?
           user.addr : user.get_answer('states:guided_opt_in');
  };

  self.build_metadata = function(cda_docstr) {

    var shasum = crypto.createHash('sha1');
    shasum.update(cda_docstr);

    return {
      "documentEntry": {
        "patientId": self.get_patient_id(),
        "uniqueId": self.get_oid(),
        "entryUUID": "urn:uuid:" + self.get_uuid(),
        // NOTE: these need to be these hard coded values according to
        //       https://jembiprojects.jira.com/wiki/display/NPRE/Save+Registration+Encounter
        "classCode": { "code": "51855-5", "codingScheme": "2.16.840.1.113883.6.1", "codeName": "Patient Note" },
        "typeCode": { "code": "51855-5", "codingScheme": "2.16.840.1.113883.6.1", "codeName": "Patient Note" },
        "formatCode": { "code": "npr-pn-cda", "codingScheme": "4308822c-d4de-49db-9bb8-275394ee971d", "codeName": "NPR Patient Note CDA" },
        "mimeType": "text/xml",
        "hash": shasum.digest('hex'),
        "size": cda_docstr.length
      }
    };
  };

  self.replace_element = function (element, content) {
    var parent = element.parent();
    var replacement = new libxml.Element(
      element.doc(), element.name(), content);
    parent.addChild(replacement);
    element.remove();
    return replacement;
  };

  self.update_attr = function (element, attname, attvalue) {
    var attrs = {};
    attrs[attname] = attvalue;
    return element.attr(attrs);
  };

  self.build_cda_doc = function() {
    /**

    HERE BE MODERATE DRAGONS

    **/
    var user = self.im.user;
    var doc = libxml.parseXmlString(CDA_Template);
    var map = {
      '//*[@root="${uniqueId}"]': function (element) {
        return self.update_attr(element, 'root', self.get_uuid());
      },
      '//*[@value="${createdTime}"]': function (element) {
        return self.update_attr(element, 'value', self.get_timestamp());
      },
      '//*[@extension="${pidCX}"]': function (element) {
        return self.update_attr(element, 'extension', self.get_patient_id());
      },
      '//*[@value="tel:${cellNumber}"]': function (element) {
        return self.update_attr(element, 'value', 'tel:' + self.get_optin_addr());
      },
      // TODO?
      '//*[text()="${givenName}"]': function (element) {
        return self.replace_element(element, 'Testing');
      },
      // TODO?
      '//*[text()="${familyName}"]': function (element) {
        return self.replace_element(element, 'Testing');
      },
      // TODO?
      '//*[@value="${birthDate}"]': function (element) {
        return self.update_attr(
          element, 'value', '2000-01-01');
      },
      '//*[@code="${languageCode}"]': function (element) {
        return self.update_attr(
          element, 'code', 'en');
      },
      '//*[@value="${time}"]': function (element) {
        return self.update_attr(
          element, 'value', self.get_timestamp());
      },
      '//*[@value="tel:${hcwCellNumber}"]': function (element) {
        return self.update_attr(element, 'value', 'tel:' + self.get_optin_addr());
      },
      // TODO?
      '//*[@extension="${hcwCode}"]': function (element) {
        return self.update_attr(element, 'extension', user.get_answer('states:facility_code'));
      },
      // TODO?
      '//*[text()="${hcwGivenName}"]': function (element) {
        return self.replace_element(element, 'Testing');
      },
      // TODO?
      '//*[text()="${hcwFamilyName}"]': function (element) {
        return self.replace_element(element, 'Testing');
      },
      '//*[@extension="${facilityId}"]': function (element) {
        return self.update_attr(element, 'extension', user.get_answer('states:facility_code'));
      },
      // TODO?
      '//*[text()="${facilityName}"]': function (element) {
        return self.replace_element(element, 'Testing');
      },
      '//*[@value="${encounterDateTime}"]': function (element) {
        return self.update_attr(element, 'value', self.get_timestamp().slice(0, 8));
      },
      '//*[@value="${effectiveTime}"]': function (element) {
        return self.update_attr(element, 'value', self.get_timestamp().slice(0, 8));
      },
      '//*[@value="${date}"]': function (element) {
        return self.update_attr(element, 'value', self.get_timestamp().slice(0, 8));
      }
    };
    Object.keys(map).forEach(function (key) {
      var elements = doc.find(key);
      elements.forEach(function (element) {
        handler = map[key];
        handler(element);
      });
    });
    return doc;
  };

  self.build_multipart_data = function(boundary, parts) {
    return parts.map(function (part) {
      return [
        '--' + boundary,
        'Content-Disposition: form-data; name="' + part.name + '"; filename="' + part.file_name + '"',
        'Content-Type: ' + part.content_type,
        '',
        part.body,
        ''
      ].join('\n');
    }).join('\n').trim();
  };

  self.build_request_data = function (doc, boundary) {
    var docstr = doc.toString().trim();
    return self.build_multipart_data(boundary, [
      {
        name: "ihe-mhd-metadata",
        file_name: 'MHDMetadata.json',
        content_type: 'application/json',
        body: JSON.stringify(self.build_metadata(docstr))
      },
      {
        name: 'content',
        file_name: 'CDARequest.xml',
        content_type: 'text/xml',
        body: docstr
      }
    ]);
  };

  self.jembi_api_call = function (doc) {
    var http = new HttpApi(self.im, {
      auth: {
        username: self.im.config.jembi.username,
        password: self.im.config.jembi.password
      }
    });
    return http.post(self.im.config.jembi.url, {
      data: self.build_request_data(doc, 'yolo'),
      headers: {
        'Content-Type': ['multipart/form-data; boundary=yolo']
      }
    });
  };

});

if (typeof api != 'undefined') {
    new InteractionMachine(api, new GoNDOH());
}

this.GoNDOH = GoNDOH;
