var vumigo = require('vumigo_v02');
var libxml = require('libxmljs');
var crypto = require('crypto');

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
                  return self.jembi_api_call(self.build_cda_doc());
                })
                .then(function(result) {
                  return result.code == 200 ? 'states:end' : 'states:error';
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

  self.states.add('states:error', function(name) {
    return new EndState(name, {
      text: 'Sorry, something went wrong when saving the data. Please try again.',
      next: 'states:name'
    });
  });

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

  self.build_metadata = function(cda_docstr) {

    var shasum = crypto.createHash('sha1');
    shasum.update(cda_docstr);

    return {
      "documentEntry": {
        "patientId": self.get_nid() + "^^^ZAF^NI",
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
        return self.update_attr(element, 'extension', self.get_nid() + '^^^ZAF^NI');
      },
      '//*[@value="tel:${cellNumber}"]': function (element) {
        return self.update_attr(element, 'value', 'tel:' + user.addr);
      },
      '//*[text()="${givenName}"]': function (element) {
        return self.replace_element(element, user.get_answer('states:name'));
      },
      '//*[text()="${familyName}"]': function (element) {
        return self.replace_element(element, user.get_answer('states:surname'));
      },
      '//*[@value="${birthDate}"]': function (element) {
        return self.update_attr(
          element, 'value', self.format_dob(user.get_answer('states:dob')));
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
        return self.update_attr(element, 'value', 'tel:' + user.addr);
      },
      '//*[@extension="${hcwCode}"]': function (element) {
        return self.update_attr(element, 'extension', '1234');
      },
      '//*[text()="${hcwGivenName}"]': function (element) {
        return self.replace_element(element, 'Grace');
      },
      '//*[text()="${hcwFamilyName}"]': function (element) {
        return self.replace_element(element, 'Doctor');
      },
      '//*[@extension="${facilityId}"]': function (element) {
        return self.update_attr(element, 'extension', '2345');
      },
      '//*[text()="${facilityName}"]': function (element) {
        return self.replace_element(element, 'Good Health Center');
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
    }).join('\n') + '\n--' + boundary;
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
