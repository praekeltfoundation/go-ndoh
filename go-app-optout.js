var go = {};
go;

var _ = require('lodash');
var moment = require('moment');
var vumigo = require('vumigo_v02');
var Choice = vumigo.states.Choice;
var utils = vumigo.utils;
var libxml = require('libxmljs');
var crypto = require('crypto');
var HttpApi = vumigo.http.api.HttpApi;

// override moment default century switch at '68 with '49
moment.parseTwoDigitYear = function (input) {
    return +input + (+input > 49 ? 1900 : 2000);
};

go.utils = {
    // Shared utils lib

    // make choices options with options
    make_month_choices: function($, start, limit) {
            // start should be 0 for Jan - array position
            var choices = [
                    new Choice('01', $('Jan')),
                    new Choice('02', $('Feb')),
                    new Choice('03', $('Mar')),
                    new Choice('04', $('Apr')),
                    new Choice('05', $('May')),
                    new Choice('06', $('Jun')),
                    new Choice('07', $('Jul')),
                    new Choice('08', $('Aug')),
                    new Choice('09', $('Sep')),
                    new Choice('10', $('Oct')),
                    new Choice('11', $('Nov')),
                    new Choice('12', $('Dec'))
                ];

            var choices_show = [];
            var choices_show_count = 0;
            var end = start + limit;

            for (var i=start; i<end; i++) {
                var val = (i >= 12 ? (i-12) : i);
                choices_show[choices_show_count] = choices[val];
                choices_show_count++;
            }

            return choices_show;

    },

    get_today: function(config) {
        var today;
        if (config.testing_today) {
            today = new Date(config.testing_today);
        } else {
            today = new Date();
        }
        return today;
    },

    check_valid_number: function(input){
        // an attempt to solve the insanity of JavaScript numbers
        var numbers_only = new RegExp('^\\d+$');
        if (input !== '' && numbers_only.test(input) && !Number.isNaN(Number(input))){
            return true;
        } else {
            return false;
        }
    },

    check_number_in_range: function(input, start, end){
        return go.utils.check_valid_number(input) && (parseInt(input, 10) >= start) && (parseInt(input, 10) <= end);
    },

    validate_id_sa: function(id) {
        var i, c,
            even = '',
            sum = 0,
            check = id.slice(-1);

        if (id.length != 13 || id.match(/\D/)) {
            return false;
        }
        id = id.substr(0, id.length - 1);
        for (i = 0; id.charAt(i); i += 2) {
            c = id.charAt(i);
            sum += +c;
            even += id.charAt(i + 1);
        }
        even = '' + even * 2;
        for (i = 0; even.charAt(i); i++) {
            c = even.charAt(i);
            sum += +c;
        }
        sum = 10 - ('' + sum).charAt(1);
        return ('' + sum).slice(-1) == check;
    },

    extract_id_dob: function(id) {
        return moment(id.slice(0,6), 'YYMMDD').format('YYYY-MM-DD');
    },

    is_true: function(bool) {
        //If is is not undefined and boolean is true
        return (!_.isUndefined(bool) && (bool==='true' || bool===true));
    },

    readable_sa_msisdn: function(msisdn) {
        readable_no = '0' + msisdn.slice(3,12);
        return readable_no;
    },

    normalise_sa_msisdn: function(msisdn) {
        denormalised_no = '+27' + msisdn.slice(1,10);
        return denormalised_no;
    },

    // Thanks SO!
    // http://stackoverflow.com/a/1685917
    toFixed: function(x) {
      var e;
      if (Math.abs(x) < 1.0) {
        e = parseInt(x.toString().split('e-')[1], 10);
        if (e) {
            x *= Math.pow(10,e-1);
            x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
        }
      } else {
        e = parseInt(x.toString().split('+')[1], 10);
        if (e > 20) {
            e -= 20;
            x /= Math.pow(10,e);
            x += (new Array(e+1)).join('0');
        }
      }
      return x;
    },

    // HERE BE SEMI-TAMED DRAGONS


    get_uuid: function () {
        return utils.uuid();
    },

    get_oid: function () {
        var uuid = go.utils.get_uuid();
        console.log(uuid);
        var hex = uuid.replace('-', '');
        var number = parseInt(hex, 16);
        return '2.25.' + go.utils.toFixed(number);
    },

    get_timestamp: function() {
        return moment().unix();
    },

    // CLARIFY NEW STRATEGY
    get_patient_id: function(contact) {
        var formatter = {
          'sa_id': function () {
            return contact.extra.sa_id + '^^^ZAF^NI';
          },
          'passport': function () {
            return contact.extra.passport_no + '^^^TODO^FI';
          },
          'none': function () { // TODO - CHECK
            return 'NI';
          }
        }[contact.extra.id_type];
        return formatter();
    },

    build_metadata: function(cda_docstr, contact) {

        var shasum = crypto.createHash('sha1');
        shasum.update(cda_docstr);

        return {
          "documentEntry": {
            "patientId": go.utils.get_patient_id(contact),
            "uniqueId": go.utils.get_oid(),
            "entryUUID": "urn:uuid:" + go.utils.get_uuid(),
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
    },

    replace_element: function (element, content) {
        var parent = element.parent();
        var replacement = new libxml.Element(
          element.doc(), element.name(), content);
        parent.addChild(replacement);
        element.remove();
        return replacement;
    },

    null_element: function (element) {
        var parent = element.parent();
        var replacement = new libxml.Element(
          element.doc(), element.name(), null);
        replacement.attr({'nullFlavor': 'NI'});
        parent.addChild(replacement);
        element.remove();
        return replacement;
    },

    update_attr: function (element, attname, attvalue) {
        var attrs = {};
        attrs[attname] = attvalue;
        return element.attr(attrs);
    },

    get_clinic_id: function(contact, element){
        if (_.isUndefined(contact.extra.clinic_code)){
            return go.utils.null_element(element);
        } else {
            return go.utils.update_attr(element, 'extension', contact.extra.clinic_code);
        }
    },

    get_hcw_msisdn: function(contact, element){
        if (!_.isUndefined(contact.extra.registered_by) && contact.extra.registered_by !== 'self'){
            return go.utils.update_attr(element, 'value', 'tel:' + contact.extra.registered_by);
        } else {
            return go.utils.null_element(element);
        }
    },

    build_cda_doc: function(contact, user) {
        /**

        HERE BE MODERATE DRAGONS

        **/
        var xml_template = go.utils.get_CDA_template();
        var doc = libxml.parseXmlString(xml_template);
        var map = {
          '//*[@root="${uniqueId}"]': function (element) {
            return go.utils.update_attr(element, 'root', go.utils.get_uuid());
          },
          '//*[@value="${createdTime}"]': function (element) {
            return go.utils.update_attr(element, 'value', go.utils.get_timestamp());
          },
          '//*[@extension="${pidCX}"]': function (element) { // TODO Fix
            return go.utils.update_attr(element, 'extension', go.utils.get_patient_id(contact));
          },
          '//*[@value="tel:${cellNumber}"]': function (element) {
            return go.utils.update_attr(element, 'value', 'tel:' + contact.msisdn);
          },
          // Not in Scope
          '//*[text()="${givenName}"]': function (element) {
            return go.utils.null_element(element);
          },
          // Not in Scope
          '//*[text()="${familyName}"]': function (element) {
            return go.utils.null_element(element);
          },
          '//*[@value="${birthDate}"]': function (element) {
            return go.utils.update_attr(
              element, 'value', moment(contact.extra.dob, 'YYYY-MM-DD').format('YYYYMMDD'));
          },
          '//*[@code="${languageCode}"]': function (element) {
            return go.utils.update_attr(
              element, 'code', contact.extra.language_choice);
          },
          '//*[@value="${time}"]': function (element) {
            return go.utils.update_attr(
              element, 'value', go.utils.get_timestamp());
          },
          '//*[@value="tel:${hcwCellNumber}"]': function (element) {
            return go.utils.get_hcw_msisdn(contact, element);
          },
          // Only possible on Clinic line
          '//*[@extension="${hcwCode}"]': function (element) {
            return go.utils.get_clinic_id(contact, element);
          },
          // Not in Scope
          '//*[text()="${hcwGivenName}"]': function (element) {
            return go.utils.null_element(element);
          },
          // Not in Scope
          '//*[text()="${hcwFamilyName}"]': function (element) {
            return go.utils.null_element(element);
          },
          // Only possible on Clinic line
          '//*[@extension="${facilityId}"]': function (element) {
            return go.utils.get_clinic_id(contact, element);
          },
          // Not in scope
          '//*[text()="${facilityName}"]': function (element) {
            return go.utils.null_element(element);
          },
          '//*[@value="${encounterDateTime}"]': function (element) {
            return go.utils.update_attr(element, 'value', go.utils.get_timestamp().toString().slice(0, 8));
          },
          '//*[@value="${effectiveTime}"]': function (element) {
            return go.utils.update_attr(element, 'value', go.utils.get_timestamp().toString().slice(0, 8));
          },
          '//*[@value="${date}"]': function (element) {
            return go.utils.update_attr(element, 'value', go.utils.get_timestamp().toString().slice(0, 8));
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
    },

    build_multipart_data: function(boundary, parts) {
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
    },

    build_request_data: function (doc, boundary, contact) {
        var docstr = doc.toString().trim();
        return go.utils.build_multipart_data(boundary, [
          {
            name: "ihe-mhd-metadata",
            file_name: 'MHDMetadata.json',
            content_type: 'application/json',
            body: JSON.stringify(go.utils.build_metadata(docstr, contact))
          },
          {
            name: 'content',
            file_name: 'CDARequest.xml',
            content_type: 'text/xml',
            body: docstr
          }
        ]);
    },

    jembi_api_call: function (doc, contact, im) {
        var http = new HttpApi(im, {
          auth: {
            username: im.config.jembi.username,
            password: im.config.jembi.password
          }
        });
        return http.post(im.config.jembi.url, {
          data: go.utils.build_request_data(doc, 'yolo', contact),
          headers: {
            'Content-Type': ['multipart/form-data; boundary=yolo']
          }
        });
    },

    get_CDA_template: function () {
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
        '    <!-- Patient Identifier -->',
        '    <!-- The value for extension must be specified in HL7 CX format: -->',
        '    <!-- id^^^assigningAuthority^typeCode -->',
        '    <!-- The typeCode specified the type of identifier, e.g. NI for National Identifier or PPN for Passport Number -->',
        '    <!-- The assigningAuthority specifies the issuer of the id, e.g. ZAR for South Africa -->',
        '    <!-- An example for a South African National ID is: -->',
        '    <!-- <id extension="7612241234567^^^ZAF^NI" root="526ef9c3-6f18-420a-bc53-9b733920bc67" /> -->',
        '    <id extension="${pidCX}" root="526ef9c3-6f18-420a-bc53-9b733920bc67"/>',
        '    <addr/>',
        '    <!-- Telephone number in RFC3966 format, e.g. tel:+27731234567 -->',
        '    <telecom value="tel:${cellNumber}"/>',
        '    <patient>',
        '      <name>',
        '        <given>${givenName}</given>',
        '        <family>${familyName}</family>',
        '      </name>',
        '      <administrativeGenderCode code="F" codeSystem="2.16.840.1.113883.5.1"/>',
        '      <!-- e.g. 19700123 -->',
        '      <birthTime value="${birthDate}"/>',
        '      <languageCommunication>',
        '        <languageCode code="${languageCode}"/>',
        '        <preferenceInd value="true"/>',
        '      </languageCommunication>',
        '    </patient>',
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
      return CDA_Template;
    }
};
go.app = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;

    var GoNDOH = App.extend(function(self) {
        App.call(self, 'states:start');
        var $ = self.$;

        self.states.add('states:start', function(name) {
            return new ChoiceState(name, {
                question: $('Welcome to MomConnect. Why do you want to ' +
                            'stop receiving our messages?'),

                choices: [
                    new Choice('miscarriage', $('Miscarriage')),
                    new Choice('not_pregnant', $('Not pregnant')),
                    new Choice('not_useful', $('Messages not useful')),
                    new Choice('had_baby', $('Had my baby')),
                    new Choice('other', $('Other'))
                ],

                next: 'states:end'
            });
        });

        self.states.add('states:end', function(name) {
            return new EndState(name, {
                text: $('Thank you. You will no longer receive ' +
                        'messages from us. If you have any medical ' +
                        'concerns please visit your nearest clinic.'),

                next: 'states:start'
            });
        });

    });

    return {
        GoNDOH: GoNDOH
    };
}();

go.init = function() {
    var vumigo = require('vumigo_v02');
    var InteractionMachine = vumigo.InteractionMachine;
    var GoNDOH = go.app.GoNDOH;


    return {
        im: new InteractionMachine(api, new GoNDOH())
    };
}();
