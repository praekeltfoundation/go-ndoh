var go = {};
go;

var _ = require('lodash');
var moment = require('moment');
var vumigo = require('vumigo_v02');
var Q = require('q');
var Choice = vumigo.states.Choice;
var utils = vumigo.utils;
var libxml = require('libxmljs');
var crypto = require('crypto');
var HttpApi = vumigo.http.api.HttpApi;
var JsonApi = vumigo.http.api.JsonApi;

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

    is_out_of_hours: function(config) {
        var today = go.utils.get_today(config);
        var motoday = moment.utc(today);
        // hours are between 8 and 16 local SA time
        return (motoday.hour() < 6 || motoday.hour() >= 14);
    },

    get_due_year_from_month: function(month, today) {
      // if due month is less than current month then mother must be due next year
      motoday = moment(today);
      if ((motoday.month()+1) > parseInt(month, 10)) {
        return motoday.year()+1;
      } else {
        return motoday.year();
      }
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

    check_valid_phone_number: function(input) {
        // check that it is a number, starts with 0, and has at 10 digits
        if (go.utils.check_valid_number(input) && input[0] === '0' && input.length === 10) {
            return true;
        } else {
            return false;
        }
    },

    check_number_in_range: function(input, start, end){
        return go.utils.check_valid_number(input) && (parseInt(input, 10) >= start) && (parseInt(input, 10) <= end);
    },

    double_digit_day: function(input) {
        input_numeric = parseInt(input, 10);
        if (parseInt(input, 10) < 10) {
            return "0" + input_numeric.toString();
        } else {
            return input_numeric.toString();
        }
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
        readable_no = '0' + msisdn.slice(msisdn.length-9, msisdn.length);
        return readable_no;
    },

    normalise_sa_msisdn: function(msisdn) {
        denormalised_no = '+27' + msisdn.slice(msisdn.length-9, msisdn.length);
        return denormalised_no;
    },

    incr_user_extra: function(data_to_increment, amount_to_increment) {
        if (_.isUndefined(data_to_increment)) {
            new_data_amount = 1;
        } else {
            new_data_amount = parseInt(data_to_increment, 10) + amount_to_increment;
        }
        return new_data_amount.toString();
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
        var hex = uuid.replace('-', '');
        var number = parseInt(hex, 16);
        return '2.25.' + go.utils.toFixed(number);
    },

    get_timestamp: function() {
        return moment().format("YYYYMMDDhhmmss");
    },

    // CLARIFY NEW STRATEGY
    get_patient_id: function(contact) {
        var formatter = {
          'sa_id': function () {
            return contact.extra.sa_id + '^^^ZAF^NI';
          },
          'passport': function () {
            return contact.extra.passport_no + '^^^' + contact.extra.passport_origin.toUpperCase() + '^PPN';
          },
          'none': function () {
            return null;
          }
        }[contact.extra.id_type];
        return formatter();
    },

    get_subscription_type: function(type){
      var types = {
        "subscription": 1,
        "pre-registration": 2,
        "registration": 3
      };
      return types[type];
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
            // temp hardcode instructed
            return go.utils.update_attr(element, 'extension', '11399');
        } else {
            return go.utils.update_attr(element, 'extension', contact.extra.clinic_code);
        }
    },

    get_hcw_msisdn: function(user, contact, element){
        if (!_.isUndefined(user.extra.working_on)){
          // user is a hcw
            return go.utils.update_attr(element, 'value', 'tel:' + user.msisdn);
        } else {
           // user is contact - no way to know hcw currently
            return go.utils.null_element(element);
        }
    },

    get_birthdate: function(contact, element){
        if (!_.isUndefined(contact.extra.dob)){
            return go.utils.update_attr(
              element, 'value', moment(contact.extra.dob, 'YYYY-MM-DD').format('YYYYMMDD'));
        } else {
            return go.utils.null_element(element);
        }
    },

    get_pregnancy_code: function(im, element){
      if (im.config.name.substring(0,3) == "chw") {
        return go.utils.update_attr(element, 'code', '102874004');
      } else {
        return go.utils.update_attr(element, 'code', '77386006');
      }
    },

    get_pregnancy_display_name: function(im, element){
      if (im.config.name.substring(0,3) == "chw") {
        return go.utils.update_attr(element, 'displayName', 'Unconfirmed pregnancy');
      } else {
        return go.utils.update_attr(element, 'displayName', 'Pregnancy confirmed');
      }
    },

    get_duedate: function(contact, element, config){
        if (!_.isUndefined(contact.extra.due_date_month) && !_.isUndefined(contact.extra.due_date_day)){
          var day = contact.extra.due_date_day;
          var month = contact.extra.due_date_month;
          var year = go.utils.get_due_year_from_month(month, go.utils.get_today(config));
            return go.utils.update_attr(
              element, 'value', [year, month, day].join(''));
        } else {
            // Jembi can't handle null duedates
            return go.utils.update_attr(
              element, 'value', '17000101');
        }
    },

    build_cda_doc: function(contact, user, im) {
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
            return go.utils.get_birthdate(contact, element);
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
            return go.utils.get_hcw_msisdn(user, contact, element);
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
          '//*[@extension="${facilityCode}"]': function (element) {
            return go.utils.get_clinic_id(contact, element);
          },
          // Not in scope
          '//*[text()="${facilityName}"]': function (element) {
            return go.utils.null_element(element);
          },
          '//*[@value="${encounterDateTime}"]': function (element) {
            return go.utils.update_attr(element, 'value', go.utils.get_timestamp());
          },
          '//*[@value="${effectiveTime}"]': function (element) {
            return go.utils.update_attr(element, 'value', go.utils.get_timestamp());
          },
          '//*[@value="${date}"]': function (element) {
            return go.utils.get_duedate(contact, element, im.config);
          },
          '//*[@code="${mobileHealthApplicationCode}"]': function (element) {
            return go.utils.update_attr(element, 'code', 'PF');
          },
          '//*[text()="${softwareName}"]': function (element) {
            return go.utils.replace_element(element, 'Vumi');
          },
          '//*[@code="${pregStatusCode}"]': function (element) {
            return go.utils.get_pregnancy_code(im, element);
          },
          '//*[@displayName="${pregStatusDisplayName}"]': function (element) {
            return go.utils.get_pregnancy_display_name(im, element);
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
        // Leave this in for easier debugging of stupid whitespace bugs
        // console.log(docstr.replace(/ /g,"©"));
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

    get_swt: function(im) {
        if (im.config.name.substring(0,10) === "smsinbound") {
            return 2;  // swt = 2 for sms optout
        } else {
            return 1;  // swt = 1 for ussd optout
        }
    },

    get_optoutreason: function(contact) {
        return contact.extra.opt_out_reason || 'unknown';
        // TODO This should return an integer #154
    },

    get_faccode: function(contact) {
        return contact.extra.clinic_code || null;
    },

    get_dob: function(contact) {
        if (!_.isUndefined(contact.extra.dob)) {
            return moment(contact.extra.dob).format('YYYYMMDD');
        } else {
            return null;
        }
    },

    build_json_doc: function(im, contact, user, type) {
        var JSON_template = {
          "mha": 1,
          "swt": go.utils.get_swt(im),
          "dmsisdn": user.msisdn,
          "cmsisdn": contact.msisdn,
          "id": go.utils.get_patient_id(contact),
          "type": go.utils.get_subscription_type(type),
          "lang": contact.extra.language_choice,
          "encdate": go.utils.get_timestamp(),
          "faccode": go.utils.get_faccode(contact),
          "dob": go.utils.get_dob(contact)
        };

        if (type === 'optout') {
            JSON_template.optoutreason = go.utils.get_optoutreason(contact);
        }

        return JSON_template;
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
          },
          ssl_method: "SSLv3"
        });
    },

    jembi_json_api_call: function (json_doc, im) {
        var http = new HttpApi(im, {
          auth: {
            username: im.config.jembi.username,
            password: im.config.jembi.password
          },
          headers: {
            'Content-Type': ['application/json']
          }
        });
        return http.post(im.config.jembi.url_json, {
          ssl_method: "SSLv3",
          data: JSON.stringify(json_doc)
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
            '    <!-- The assigningAuthority specifies the issuer of the id, e.g. ZAF for South Africa -->',
            '    <!-- An example for a South African National ID is: -->',
            '    <!-- <id extension="7612241234567^^^ZAF^NI" root="526ef9c3-6f18-420a-bc53-9b733920bc67" /> -->',
            '    <id extension="${pidCX}" root="526ef9c3-6f18-420a-bc53-9b733920bc67"/>',
            '    <!-- Telephone number in RFC3966 format, e.g. tel:+27731234567 -->',
            '    <telecom value="tel:${cellNumber}"/>',
            '    <patient>',
            '      <name>',
            '        <given nullFlavor="NI"/>',
            '        <family nullFlavor="NI"/>',
            '      </name>',
            '      <administrativeGenderCode code="F" codeSystem="2.16.840.1.113883.5.1"/>',
            '      <!-- If available, else set nullFlavor -->',
            '      <!-- Format yyyy[MM[dd]] e.g. 19700123 or 197001 for an estimated date -->',
            '      <birthTime value="${birthDate}"/>',
            '      <languageCommunication>',
            '        <languageCode code="${languageCode}"/>',
            '        <preferenceInd value="true"/>',
            '      </languageCommunication>',
            '    </patient>',
            '  </patientRole>',
            '</recordTarget>',
            '<author>',
            '  <time value="${time}"/>',
            '  <assignedAuthor>',
            '    <id root="833f2856-b9e1-4f54-8694-c74c4283755f"/>',
            '    <telecom value="tel:${hcwCellNumber}"/>',
            '    <assignedPerson/>',
            '    <!-- if facility code available, else leave out representedOrganization -->',
            '    <representedOrganization>',
            '      <id extension="${facilityCode}" root="9a560d61-85f1-4d7b-8ee2-090d2900f836"/>',
            '    </representedOrganization>',
            '  </assignedAuthor>',
            '</author>',
            '<author>',
            '  <time value="${time}"/>',
            '  <assignedAuthor>',
            '    <id root="9a560d61-85f1-4d7b-8ee2-090d2900f836"/>',
            '    <assignedAuthoringDevice>',
            '      <code code="${mobileHealthApplicationCode}" codeSystem="56877fb7-e3a9-4ad5-bfb5-64d48a045e83"/>',
            '      <softwareName>${softwareName}</softwareName>',
            '    </assignedAuthoringDevice>',
            '  </assignedAuthor>',
            '</author>',
            '<custodian>',
            '  <assignedCustodian>',
            '    <representedCustodianOrganization>',
            '      <id root="a5881e6c-b42e-4559-a1fd-d1dc52379658"/>',
            '      <name>SA National Department of Health</name>',
            '    </representedCustodianOrganization>',
            '  </assignedCustodian>',
            '</custodian>',
            '<documentationOf>',
            '  <serviceEvent classCode="PCPR">',
            '    <effectiveTime value="${encounterDateTime}"/>',
            '  </serviceEvent>',
            '</documentationOf>',
            '<component>',
            '  <structuredBody>',
            '    <component>',
            '      <section>',
            '        <code code="57060-6" displayName="Estimated date of delivery Narrative" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
            '        <text>',
            '          <table>',
            '            <thead>',
            '              <tr>',
            '                <td>Pregnancy status</td>',
            '                <td>Note Date</td>',
            '                <td>Delivery Date (Estimated)</td>',
            '              </tr>',
            '            </thead>',
            '            <tbody>',
            '              <!-- e.g. -->',
            '              <tr>',
            '                <td>Pregnancy confirmed</td>',
            '                <td>2014-02-17</td>',
            '                <td>2014-10-17</td>',
            '              </tr>',
            '            </tbody>',
            '          </table>',
            '        </text>',
            '        <entry>',
            '          <!-- Pregnancy Status -->',
            '          <observation classCode="OBS" moodCode="EVN">',
            '            <code code="11449-6" displayName="Pregnancy status" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
            '            <text/>',
            '            <statusCode code="completed"/>',
            '            <!-- e.g. 20140217 -->',
            '            <effectiveTime value="${effectiveTime}"/>',
            '            <!-- For CHW identification use case, use: code="102874004" displayName="Unconfirmed pregnancy" -->',
            '            <!-- For Clinic identification use case, use: code="77386006" displayName="Pregnancy confirmed" -->',
            '            <value xsi:type="CE" code="${pregStatusCode}" displayName="${pregStatusDisplayName}" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>',
            '            <entryRelationship typeCode="SPRT" inversionInd="true">',
            '              <!-- Delivery Date -->',
            '              <observation classCode="OBS" moodCode="EVN">',
            '                <code code="11778-8" displayName="Delivery date Estimated" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
            '                <text/>',
            '                <statusCode code="completed"/>',
            '                <!-- e.g. 20141017 -->',
            '                <!-- use yyyyMM if only estimated up to month level -->',
            '                <value xsi:type="TS" value="${date}"/>',
            '              </observation>',
            '            </entryRelationship>',
            '          </observation>',
            '        </entry>',
            '      </section>',
            '    </component>',
            '  </structuredBody>',
            '</component>',
            '</ClinicalDocument>'
        ].join('\n');
        return CDA_Template;
    },

    incr_kv: function(im, name) {
        return im.api_request('kv.incr', {key: name, amount: 1})
            .then(function(result){
                return result.value;
            });
    },

    decr_kv: function(im, name) {
        return im.api_request('kv.incr', {key: name, amount: -1})
            .then(function(result){
                return result.value;
            });
    },

    set_kv: function(im, name, value) {
        return im.api_request('kv.set',  {key: name, value: value})
            .then(function(result){
                return result.value;
            });
    },

    get_kv: function(im, name, default_value) {
        // returns the default if null/undefined
        return im.api_request('kv.get',  {key: name})
            .then(function(result){
                if(result.value === null) return default_value;
                return result.value;
            });
    },

    adjust_percentage_registrations: function(im, metric_prefix) {
        return Q.all([
            go.utils.get_kv(im, [metric_prefix, 'no_incomplete_registrations'].join('.'), 0),
            go.utils.get_kv(im, [metric_prefix, 'no_complete_registrations'].join('.'), 0)
        ]).spread(function(no_incomplete, no_complete) {
            var total_attempted = no_incomplete + no_complete;
            var percentage_incomplete = (no_incomplete / total_attempted) * 100;
            var percentage_complete = (no_complete / total_attempted) * 100;
            return Q.all([
                im.metrics.fire.last([metric_prefix, 'percent_incomplete_registrations'].join('.'), percentage_incomplete),
                im.metrics.fire.last([metric_prefix, 'percent_complete_registrations'].join('.'), percentage_complete)
            ]);
        });
    },

    fire_users_metrics: function(im, store_name, env, metric_prefix) {
        return go.utils.incr_kv(im, [store_name, 'unique_users'].join('.'))
            .then(function() {
                return Q.all([
                    go.utils.get_kv(im, [env, 'clinic', 'unique_users'].join('.'), 0),
                    go.utils.get_kv(im, [env, 'chw', 'unique_users'].join('.'), 0),
                    go.utils.get_kv(im, [env, 'personal', 'unique_users'].join('.'), 0)
                ]).spread(function(clinic_users, chw_users, personal_users) {
                    var total_users = clinic_users + chw_users + personal_users;
                    var clinic_percentage = (clinic_users / total_users) * 100;
                    var chw_percentage = (chw_users / total_users) * 100;
                    var personal_percentage = (personal_users / total_users) * 100;
                    return Q.all([
                        im.metrics.fire.inc([metric_prefix, 'sum', 'unique_users'].join('.')),
                        im.metrics.fire.last([env, 'clinic', 'percentage_users'].join('.'), clinic_percentage),
                        im.metrics.fire.last([env, 'chw', 'percentage_users'].join('.'), chw_percentage),
                        im.metrics.fire.last([env, 'personal', 'percentage_users'].join('.'), personal_percentage),
                        im.metrics.fire.inc([env, 'sum', 'unique_users'].join('.'))
                    ]);
                });
            });
    },


    is_alpha_numeric_only: function(input) {
        alpha_numeric = new RegExp('^[A-Za-z0-9]+$');
        return alpha_numeric.test(input);
    },

    jembi_send_json: function(contact, user, type, im, metric_prefix) {
        var built_json = go.utils.build_json_doc(im, contact, user, type);
        return go.utils
            .jembi_json_api_call(built_json, im)
            .then(function(json_result) {
                var json_to_fire;
                if (json_result.code >= 200 && json_result.code < 300){
                    json_to_fire = (([metric_prefix, "sum", "json_to_jembi_success"].join('.')));
                } else {
                    json_to_fire = (([metric_prefix, "sum", "json_to_jembi_fail"].join('.')));
                }
                return im.metrics.fire.inc(json_to_fire, {amount: 1});
        });
    },

    jembi_send_doc: function(contact, user, im, metric_prefix) {
        var built_doc = go.utils.build_cda_doc(contact, user, im);
        return go.utils
            .jembi_api_call(built_doc, contact, im)
            .then(function(doc_result) {
                var doc_to_fire;
                if (doc_result.code >= 200 && doc_result.code < 300){
                    doc_to_fire = (([metric_prefix, "sum", "doc_to_jembi_success"].join('.')));
                } else {
                    doc_to_fire = (([metric_prefix, "sum", "doc_to_jembi_fail"].join('.')));
                }
                return im.metrics.fire.inc(doc_to_fire, {amount: 1});
        });
    },

    control_api_call: function (method, params, payload, endpoint, im) {
        var http = new HttpApi(im, {
          headers: {
            'Content-Type': ['application/json'],
            'Authorization': ['ApiKey ' + im.config.control.username + ':' + im.config.control.api_key]
          }
        });
        switch (method) {
          case "post":
            return http.post(im.config.control.url + endpoint, {
                data: JSON.stringify(payload)
              });
          case "get":
            return http.get(im.config.control.url + endpoint, {
                params: params
              });
          case "put":
            return http.put(im.config.control.url + endpoint, {
                params: params,
                data: JSON.stringify(payload)
              });
          case "delete":
            return http.delete(im.config.control.url + endpoint);
        }
    },

    subscription_type_and_rate: function(contact, im) {
      var response = {
          sub_type: null,
          sub_rate: null,
          sub_seq_start: 1
      };
      // substrings because QA names are appended with _qa
      if (im.config.name.substring(0,8) == "personal") {
          response.sub_type = im.config.subscription.subscription;
          response.sub_rate = im.config.rate.two_per_week;
      } else if (im.config.name.substring(0,3) == "chw") {
          response.sub_type = im.config.subscription.chw;
          response.sub_rate = im.config.rate.two_per_week;
      } else if (im.config.name.substring(0,6) == "optout") {
          response.sub_type = im.config.subscription[im.user.answers.states_start];
          response.sub_rate = im.config.rate.two_per_week;
      } else if (im.config.name.substring(0,10) == "smsinbound") {
          response.sub_type = im.config.subscription.baby1;
          response.sub_rate = im.config.rate.two_per_week;
      } else {
        // clinic line
          var week = go.utils.calc_weeks(go.utils.get_today(im.config),
                  contact.extra.due_date_month, contact.extra.due_date_day);
          var mapped = go.utils.protocol_mapper(week, im);
          var sub_seq_start = go.utils.calc_sequence_start(week);
          response.sub_type = mapped.sub_type;
          response.sub_rate = mapped.sub_rate;
          response.sub_seq_start = sub_seq_start;
      }
      return response;
    },

    subscription_send_doc: function(contact, im, metric_prefix, env, opts) {
        var payload = {
          contact_key: contact.key,
          lang: contact.extra.language_choice,
          message_set: "/api/v1/message_set/" + opts.sub_type + "/",
          next_sequence_number: opts.sub_seq_start,
          schedule: "/api/v1/periodic_task/" + opts.sub_rate + "/",
          to_addr: contact.msisdn,
          user_account: contact.user_account
        };
        return go.utils
            .control_api_call("post", null, payload, 'subscription/', im)
            .then(function(doc_result) {
                var metrics_to_fire;
                if (doc_result.code >= 200 && doc_result.code < 300){
                    metrics_to_fire = [
                        im.metrics.fire.inc([metric_prefix, "sum", "subscription_to_protocol_success"].join('.'), {amount:1}),
                        im.metrics.fire.inc([env, "sum", "subscriptions"].join('.'), {amount:1})
                    ];
                } else {
                    //TODO - implement proper fail issue #36
                    metrics_to_fire = [
                        im.metrics.fire.inc([metric_prefix, "sum", "subscription_to_protocol_fail"].join('.'), {amount:1})
                    ];
                }
                return Q.all(metrics_to_fire);
        });
    },

    subscription_unsubscribe_all: function(contact, im) {
        var params = {
            to_addr: contact.msisdn
        };
        return go.utils
            .control_api_call("get", params, null, 'subscription/', im)
            .then(function(json_result) {
                // make all subscriptions inactive
                var update = JSON.parse(json_result.data);
                var clean = true;  // clean tracks if api call is unnecessary
                for (i=0;i<update.objects.length;i++) {
                    if (update.objects[i].active === true){
                        update.objects[i].active = false;
                        clean = false;
                    }
                }
                if (!clean) {
                    return go.utils.control_api_call("put", params, update, 'subscription/', im);
                } else {
                    return Q();
                }
            });
    },

    subscription_count_active: function(contact, im) {
        var params = {
            to_addr: contact.msisdn
        };
        return go.utils
            .control_api_call("get", params, null, 'subscription/', im)
            .then(function(json_result) {
                var subs = JSON.parse(json_result.data);
                var active = 0;
                for (i=0;i<subs.objects.length;i++) {
                    if (subs.objects[i].active === true) {
                        active++;
                    }
                }
                return active;
            });
    },

    is_month_this_year: function(today, month) {
        return ((today.getMonth() + 1)) <= month;
    },

    calc_weeks: function(today, due_month, due_day) {
        // Taken from MAMA USSD
        // today should be var today = new Date();
        // due_month should be 1 bound (1 = Jan)
        // check if month provided is this year
        // console.log("Today:", today);
        // console.log("Due Month:", due_month);
        var month_is_this_year = go.utils.is_month_this_year(today, due_month);
        // console.log("Month this year?", month_is_this_year);
        // set the due year to this or next
        var due_year = (month_is_this_year ? today.getFullYear() : today.getFullYear()+1);
        // console.log("Due Year:", due_year);
        // due dates are estimated at mid-month
        var due_date = new Date(due_month+"/" + due_day + "/"+due_year);
        // console.log("Due date:", due_date);
        // calc diff betwen now and due day
        var diff = (due_date - today);
        // console.log("Dates diff:", diff);
        // get it in weeks
        var diff_weeks = Math.floor((diff / (1000*7*24*60*60)));
        // console.log("Dates diff in weeks:", diff_weeks);
        // get preg week
        var preg_week = 40-diff_weeks;
        // console.log("Week of preg:", preg_week);
        // You can't be less than two week preg
        if (preg_week <= 1) {
            return false;
        } else {
            return preg_week;
        }
    },

    protocol_mapper: function(weeks, im) {
        // defines which message set at what rate for weeks
      var response = {
          sub_type: null,
          sub_rate: null
      };
      if (weeks <= 31) {
        response.sub_type = im.config.subscription.standard;
        response.sub_rate = im.config.rate.two_per_week;
      } else if (weeks <= 35) {
        response.sub_type = im.config.subscription.later;
        response.sub_rate = im.config.rate.three_per_week;
      } else if (weeks <= 36) {
        response.sub_type = im.config.subscription.accelerated;
        response.sub_rate = im.config.rate.three_per_week;
      } else if (weeks <= 37) {
        response.sub_type = im.config.subscription.accelerated;
        response.sub_rate = im.config.rate.four_per_week;
      } else if (weeks <= 38) {
        response.sub_type = im.config.subscription.accelerated;
        response.sub_rate = im.config.rate.five_per_week;
      } else {
        response.sub_type = im.config.subscription.accelerated;
        response.sub_rate = im.config.rate.daily;
      }
      return response;
    },

    calc_sequence_start: function(weeks) {
        // calculates which sms in the sequence to start with
        var seq_start;
        if (weeks < 5) {
            seq_start = 1;
        } else if (weeks <= 31) {
            seq_start = ((weeks-4)*2)-1;
        } else if (weeks <= 35) {
            seq_start = ((weeks-30)*3)-2;
        } else {
            seq_start = 1;
        }
        return seq_start;
    },

    support_log_ticket: function(message, contact, im, metric_prefix) {
        var payload = {
          conversation: "/api/v1/snappybouncer/conversation/key/" + im.config.snappybouncer.conversation + "/",
          message: message,
          contact_key: contact.key,
          msisdn: contact.msisdn
        };
        return go.utils
            .control_api_call("post", null, payload, 'snappybouncer/ticket/', im)
            .then(function(doc_result) {
                var metric;
                if (doc_result.code >= 200 && doc_result.code < 300){
                    metric = (([metric_prefix, "sum", "ticket_logged_to_control_success"].join('.')));
                } else {
                    //TODO - implement proper fail issue #36
                    metric = (([metric_prefix, "sum", "ticket_logged_to_control_fail"].join('.')));
                }
                return im.metrics.fire.inc(metric, {amount: 1});
        });
    },

    servicerating_log: function(contact, im, metric_prefix) {
        var payload = {
            "user_account": contact.user_account,
            "conversation_key": im.config.conversation_key,
            "contact": contact,
            "answers": im.user.answers
        };
        return go.utils
            .control_api_call("post", null, payload, 'servicerating/rate/', im)
            .then(function(doc_result) {
                var metric;
                if (doc_result.code >= 200 && doc_result.code < 300){
                    metric = (([metric_prefix, "sum", "servicerating_success"].join('.')));
                } else {
                    //TODO - implement proper fail issue #36
                    metric = (([metric_prefix, "sum", "subscription_to_protocol_fail"].join('.')));
                }
                return im.metrics.fire.inc(metric, {amount: 1});
        });
    },

    get_snappy_topics: function (im, faq_id) {
        var http = new JsonApi(im, {
          auth: {
            username: im.config.snappy.username,
            password: 'x'
          }
        });
        return http.get(im.config.snappy.endpoint + 'account/'+im.config.snappy.account_id+'/faqs/'+faq_id+'/topics', {
          data: JSON.stringify(),
          headers: {
            'Content-Type': ['application/json']
          }
        });
    },

    get_snappy_topic_content: function(im, faq_id, topic_id) {
        var http = new JsonApi(im, {
          auth: {
            username: im.config.snappy.username,
            password: 'x'
          }
        });
        return http.get(im.config.snappy.endpoint + 'account/'+im.config.snappy.account_id+'/faqs/'+faq_id+'/topics/'+topic_id+'/questions', {
          data: JSON.stringify(),
          headers: {
            'Content-Type': ['application/json']
          }
        });
    },

    set_language: function(user, contact) {
        if (contact.extra.language_choice !== null) {
            return user.set_lang(contact.extra.language_choice);
        } else {
            return Q();
        }
    },

    timed_out: function(im) {
        return im.msg.session_event === 'new'
            && im.user.state.name
            && im.user.state.name !== 'states_start';
    },

    opt_out: function(im, contact, optout_reason, api_optout, unsub_all, jembi_optout, metric_prefix) {
        var queue1 = [];
        var queue2 = [];
        var queue3 = [];

      // Start Queue 1
        if (optout_reason !== undefined) {
            contact.extra.opt_out_reason = optout_reason;
            queue1.push(im.contacts.save(contact));
        }
      // End Queue 1

      // Start Queue 2
        queue2.push(go.utils.opted_out(im, contact));
      // End Queue 2

      // Start Queue 3
        if (api_optout === true) {
            queue3.push(
                im.api_request('optout.optout', {
                    address_type: "msisdn",
                    address_value: contact.msisdn,
                    message_id: im.msg.message_id
                })
            );
        }

        if (unsub_all === true) {
            queue3.push(go.utils.subscription_unsubscribe_all(contact, im));
        }


        if (jembi_optout === true) {
            queue3.push(go.utils.jembi_send_json(contact, contact, 'subscription', im,
                metric_prefix));
        }
      // End Queue 3

        return Q
            .all(queue1)
            .then(function() {
                return Q
                    .all(queue2)
                    .then(function(opted_out) {
                        if (opted_out === false) {
                            return Q.all(queue3);
                        } else {
                            return Q();
                        }
                    });
            });
    },

    opted_out: function(im, contact) {
        return im
          .api_request('optout.status', {
              address_type: "msisdn",
              address_value: contact.msisdn
          })
          .then(function(result) {
              return result.opted_out;
          });
    },

    opted_out_by_msisdn: function(im, msisdn) {
        return im.contacts
          .get(msisdn, {create: true})
          .then(function(contact) {
              return go.utils.opted_out(im, contact);
          });
    },

    opt_in: function(im, contact) {
        contact.extra.opt_out_reason = '';

        return Q.all([
            im.api_request('optout.cancel_optout', {
                address_type: "msisdn",
                address_value: contact.msisdn
            }),
            im.contacts.save(contact)
        ]);
    },

    attach_session_length_helper: function (im) {
      // If we have transport metadata then attach the session length
      // helper to this app
      if(!im.msg.transport_metadata)
        return;

      var slh = new go.SessionLengthHelper(im, {
          name: function () {
              var metadata = im.msg.transport_metadata.aat_ussd;
              var provider;
              if(metadata) {
                provider = (metadata.provider || 'unspecified').toLowerCase();
              } else {
                provider = 'unknown';
              }
              return [im.config.name, provider].join('.');
          },
          clock: function () {
              return go.utils.get_today(im.config);
          }
      });
      slh.attach();
      return slh;
    }
};

go.SessionLengthHelper = function () {

  var vumigo = require('vumigo_v02');
  var events = vumigo.events;
  var Eventable = events.Eventable;

  var SessionLengthHelper = Eventable.extend(function(self, im, params) {
    /**class:SessionLengthHelper

    A helper for common session length calculation tasks.

    :param InteractionMachine im:
      The interaction machine that the metrics should be run on.
    :param object params:
      Optional parameters:

      {
        name: 'default',
        clock: function () {
          return new Date();
        },
        metrics_prefix: 'session_length_helper'
      }

    */
    self.im = im;

    self.user = im.user;

    self.name = params.name || 'default';

    self.now = params.clock || function () { return new Date(); };

    self.metrics_prefix = params.metrics_prefix || 'session_length_helper';

    self.mark = {};

    self.attach = function () {
      self.im.on('session:new', function (e) {
        return self.mark.session_start();
      });

      self.im.on('session:close', function (e) {
        return self.mark.session_close();
      });

      self.im.on('im:shutdown', function() {
        return self.increment_and_fire(self.name);
      });
    };

    self.mark.session_start = function () {
      self.user.metadata.session_length_helper = {};
      self.user.metadata.session_length_helper.start = Number(self.now());
      return self;
    };

    self.mark.session_close = function () {
      if(!self.user.metadata.session_length_helper) {
        self.user.metadata.session_length_helper = {};
      }
      self.user.metadata.session_length_helper.stop = Number(self.now());
      return self;
    };

    self.duration = function() {
      var data = self.user.metadata.session_length_helper;
      if(data && data.stop && data.start) {
        return data.stop - data.start;
      }
      return -1;
    };

    self.get_today_as_string = function() {
      var today_iso = self.now().toISOString();
      return today_iso.split('T')[0];
    };

    self.ensure_today = function (name) {
      var sentinel_key_name = [self.metrics_prefix, name, 'sentinel'].join('.');
      return self.im
        .api_request('kv.get', {
          key: sentinel_key_name
        })
        .then(function (result) {
          if(result.value != self.get_today_as_string()) {
            return self.reset_for_today(name);
          }
        });
    };

    self.reset_for_today = function (name) {
      var sentinel_key_name = [self.metrics_prefix, name, 'sentinel'].join('.');
      var key_name = [self.metrics_prefix, name].join('.');
      return self.im
        .api_request('kv.set', {
          key: key_name,
          value: 0
        })
        .then(function (result) {
          return self.im.api_request('kv.set', {
            key: sentinel_key_name,
            value: self.get_today_as_string()
          });
        });
    };

    self.store = function(name) {
      return self.im
        .api_request('kv.incr', {
          key: [self.metrics_prefix, name].join('.'),
          amount: self.duration()
        })
        .then(function (result){
          return result.value;
        });
    };

    self.fire_metrics = function (name, result) {
      var full_name = [self.metrics_prefix, name].join('.');
      return self.im.metrics.fire.max(full_name, result / 1000);
    };

    self.increment_and_fire = function (fn_or_str) {
      var name = vumigo.utils.maybe_call(fn_or_str, self);
      return self
        .ensure_today(name)
        .then(function (result) {

          // return early if we've got nothing to report
          if(self.duration() < 0)
            return;

          return self
            .store(name)
            .then(function (result) {
              return self.fire_metrics(name, result);
            });
        });
    };

  });

  return SessionLengthHelper;

}();

go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var Q = require('q');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var PaginatedChoiceState = vumigo.states.PaginatedChoiceState;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;
    var PaginatedState = vumigo.states.PaginatedState;

    var GoNDOH = App.extend(function(self) {
        App.call(self, 'states_start');
        var $ = self.$;
        var interrupt = true;


        self.init = function() {
            self.env = self.im.config.env;
            self.metric_prefix = [self.env, self.im.config.name].join('.');
            self.store_name = [self.env, self.im.config.name].join('.');

            go.utils.attach_session_length_helper(self.im);

            self.im.on('session:new', function(e) {
                self.contact.extra.ussd_sessions = go.utils.incr_user_extra(
                    self.contact.extra.ussd_sessions, 1);
                self.contact.extra.metric_sum_sessions = go.utils.incr_user_extra(self.contact.extra.metric_sum_sessions, 1);

                return Q.all([
                    self.im.contacts.save(self.contact),
                    self.im.metrics.fire.inc([self.env, 'sum.sessions'].join('.'), 1),
                    self.fire_incomplete(e.im.state.name, -1)
                ]);
            });

            self.im.on('session:close', function(e) {
                return Q.all([
                    self.fire_incomplete(e.im.state.name, 1),
                    self.dial_back(e)
                ]);
            });

            self.im.user.on('user:new', function(e) {
                return Q.all([
                    go.utils.fire_users_metrics(self.im, self.store_name, self.env, self.metric_prefix),
                    // TODO re-evaluate the use of this metric
                    // self.fire_incomplete('states_start', 1)
                ]);
            });

            self.im.on('state:enter', function(e) {
                self.contact.extra.last_stage = e.state.name;
                return self.im.contacts.save(self.contact);
            });

            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                   self.contact = user_contact;
                });
        };

        self.should_send_dialback = function(e) {
            var dial_back_states = [
                'states_language',
                'states_register_info',
                'states_suspect_pregnancy',
                'states_id_type',
                'states_sa_id',
                'states_passport_origin',
                'states_passport_no',
                'states_birth_year',
                'states_birth_month',
                'states_birth_day'
            ];
            return e.user_terminated
                && !go.utils.is_true(self.contact.extra.redial_sms_sent)
                && _.contains(dial_back_states, e.im.state.name);
        };

        self.send_dialback = function() {
            return self.im.outbound
                .send_to_user({
                    endpoint: 'sms',
                    content: self.get_finish_reg_sms()
                })
                .then(function() {
                    self.contact.extra.redial_sms_sent = 'true';
                    return self.im.contacts.save(self.contact);
                });
        };

        self.dial_back = function(e) {
            if (!self.should_send_dialback(e)) { return; }
            return self.send_dialback();
        };

        self.get_finish_reg_sms = function() {
            return $("Your session timed out. Please dial back in to {{USSD_number}} to complete the pregnancy registration so that you can receive messages.")
                .context({
                    USSD_number: self.im.config.channel
                });
        };

        self.fire_incomplete = function(name, val) {
            var ignore_states = [
                                    'states_end_success',
                                    'states_end_not_pregnant',
                                    'states_start',
                                    'states_registered_full',
                                    'states_registered_not_full',
                                    'states_end_compliment',
                                    'states_end_complaint',
                                    'states_end_go_clinic',
                                    'states_faq_topics',
                                    'states_error',
                                    'states_faq_questions',
                                    'states_faq_answers',
                                    'states_faq_end'
                                ];
            if (!_.contains(ignore_states, name)) {
                return self.im.metrics.fire.inc(([self.metric_prefix, name, "no_incomplete"].join('.')), {amount: val});
            }
        };

        self.add = function(name, creator) {
            self.states.add(name, function(name, opts) {
                // UPDATE if registration states change
                var registration_states = [
                    'states_language',
                    'states_register_info',
                    'states_suspect_pregnancy',
                    'states_id_type',
                    'states_sa_id',
                    'states_passport_origin',
                    'states_passport_no',
                    'states_birth_year',
                    'states_birth_month',
                    'states_birth_day'
                ];

                if (!interrupt || !go.utils.timed_out(self.im))
                    return creator(name, opts);

                interrupt = false;
                opts = opts || {};
                opts.name = name;

                if (!_.contains(registration_states, name)) {
                    return self.states.create('states_start', opts);
                }

                return self.states.create('states_timed_out', opts);

            });
        };



        self.add('states_start', function(name, opts) {
            if (_.isUndefined(self.contact.extra.is_registered)
                || self.contact.extra.is_registered === 'false') {
                // hasn't completed registration on any line
                return self.states.create('states_language', opts);

            } else if (self.contact.extra.is_registered_by === 'clinic') {
                // registered on clinic line
                return go.utils
                    .set_language(self.im.user, self.contact)
                    .then(function() {
                        return go.utils
                            .subscription_count_active(self.contact, self.im)
                            .then(function(count) {
                                if (count === 0) {
                                    // if no active subscriptions, register user
                                    if (!self.im.config.faq_enabled) {
                                        return self.states.create('states_suspect_pregnancy', opts);
                                    } else {
                                        return self.states.create('states_register_info', opts);
                                    }
                                } else {
                                    return self.states.create('states_registered_full', opts);
                                }
                            });
                    });

            } else {
                // registered on chw / public lines
                return go.utils.set_language(self.im.user, self.contact)
                    .then(function() {
                        return self.states.create('states_registered_not_full', opts);
                    });
            }
        });

        self.states.add('states_timed_out', function(name, creator_opts) {
            return new ChoiceState(name, {
                question: $('Welcome back. Please select an option:'),

                choices: [
                    new Choice(creator_opts.name, $('Continue signing up for messages')),
                    new Choice('states_start', $('Main menu'))
                ],

                next: function(choice) {
                    return {
                        name: choice.value,
                        creator_opts: creator_opts
                    };
                }
            });
        });

        self.add('states_registered_full', function(name) {
            if (self.im.config.faq_enabled){
                choices = [
                    new Choice('info', $('Baby and pregnancy info')),
                    new Choice('compliment', $('Send us a compliment')),
                    new Choice('complaint', $('Send us a complaint'))
                ];
            } else {
                choices = [
                    new Choice('compliment', $('Send us a compliment')),
                    new Choice('complaint', $('Send us a complaint'))
                ];
            }

            return new ChoiceState(name, {
                question: $('Welcome to the Department of Health\'s ' +
                    'MomConnect. Please choose an option:'),

                choices: choices,

                next: function(choice) {
                    return {
                        info: 'states_faq_topics',
                        compliment: 'states_end_compliment',
                        complaint: 'states_end_complaint'
                    } [choice.value];
                }
            });
        });

        self.add('states_end_compliment', function(name) {
            return new EndState(name, {
                text: $('Thank you. We will send you a message ' +
                    'shortly with instructions on how to send us ' +
                    'your compliment.'),

                next: 'states_start',

                events: {
                    'state:enter': function() {
                        return self.im.outbound.send_to_user({
                            endpoint: 'sms',
                            content: $('Please reply to this message with your compliment. If your compliment relates to the service at a clinic, tell us the name of the clinic or clinic worker.')
                        });
                    }
                }
            });
        });

        self.add('states_end_complaint', function(name) {
            return new EndState(name, {
                text: $('Thank you. We will send you a message ' +
                    'shortly with instructions on how to send us ' +
                    'your complaint.'),
                next: 'states_start',

                events: {
                    'state:enter': function() {
                        return self.im.outbound.send_to_user({
                            endpoint: 'sms',
                            content: $('Please reply to this message with your complaint. If your complaint relates to the service at a clinic, please tell us the name of the clinic or clinic worker.')
                        });
                    }
                }
            });
        });



        self.add('states_registered_not_full', function(name) {
            if (self.im.config.faq_enabled){
                choices = [
                    new Choice('info', $('Baby and pregnancy info (English only)')),
                    new Choice('full_set', $('Get the full set of messages'))
                ];
            } else {
                choices = [
                    new Choice('full_set', $('Get the full set of messages'))
                ];
            }

            return new ChoiceState(name, {
                question: $('Welcome to the Department of Health\'s ' +
                    'MomConnect. Choose an option:'),

                choices: choices,

                next: function(choice) {
                    return {
                        info: 'states_faq_topics',
                        full_set: 'states_end_go_clinic'
                    } [choice.value];
                }
            });
        });

        self.add('states_end_go_clinic', function(name) {
            return new EndState(name, {
                text: $('To register for the full set of MomConnect ' +
                    'messages, please visit your nearest clinic.'),
                next: 'states_start'
            });
        });



        self.add('states_language', function(name) {
            return new ChoiceState(name, {
                question: 'Welcome to the Department of Health\'s MomConnect. Choose your language:',

                choices: [
                    new Choice('en', 'English'),
                    new Choice('af', 'Afrikaans'),
                    new Choice('zu', 'Zulu'),
                    new Choice('xh', 'Xhosa'),
                    new Choice('st', 'Sotho'),
                    new Choice('tn', 'Setswana')
                ],

                next: function(choice) {
                    self.contact.extra.language_choice = choice.value;
                    self.contact.extra.is_registered = 'false';

                    return self.im.groups.get(choice.value)
                        .then(function(group) {
                            self.contact.groups.push(group.key);
                            return self.im.user
                                .set_lang(choice.value)
                                .then(function() {
                                    return self.im.contacts.save(self.contact);
                                })
                                .then(function() {
                                    if (!self.im.config.faq_enabled){
                                        return 'states_suspect_pregnancy';
                                    } else {
                                        return 'states_register_info';
                                    }

                                });
                        });
                },

                events: {
                    'state:enter': function(content) {
                        return go.utils
                            .incr_kv(self.im, [self.store_name, 'no_incomplete_registrations'].join('.'))
                            .then(function() {
                                return go.utils.adjust_percentage_registrations(self.im, self.metric_prefix);
                            });
                    }
                }
            });
        });

        self.add('states_register_info', function(name) {
            if (self.im.config.faq_enabled){
                choices = [
                    new Choice('register', $('Register for messages')),
                    new Choice('info', $('Baby and Pregnancy info (English only)'))
                ];
            } else {
                choices = [
                    new Choice('register', $('Register for messages'))
                ];
            }

            return new ChoiceState(name, {
                question: $('Welcome to the Department of Health\'s ' +
                    'MomConnect. Please select:'),

                choices: choices,

                next: function(choice) {
                    return {
                        register: 'states_suspect_pregnancy',
                        info: 'states_faq_topics'
                    } [choice.value];
                }
            });
        });


        self.add('states_suspect_pregnancy', function(name) {
            return new ChoiceState(name, {
                question: $('MomConnect sends free support SMSs to ' +
                    'pregnant mothers. Are you or do you suspect that you ' +
                    'are pregnant?'),

                choices: [
                    new Choice('yes', $('Yes')),
                    new Choice('no', $('No'))
                ],

                next: function(choice) {
                    self.contact.extra.suspect_pregnancy = choice.value;
                    if (!self.im.config.detailed_data_collection) {
                        self.contact.extra.id_type = "none";
                    }

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            if (choice.value === 'yes') {
                                return go.utils
                                    .opted_out(self.im, self.contact)
                                    .then(function(opted_out) {
                                        if (opted_out) {
                                            return 'states_opt_in';
                                        } else {
                                            if (self.im.config.detailed_data_collection){
                                                return 'states_id_type';
                                            } else {
                                                return 'save_subscription_data';
                                            }
                                        }
                                    });
                            } else {
                                return 'states_end_not_pregnant';
                            }
                        });
                }
            });
        });

        self.add('states_opt_in', function(name) {
            return new ChoiceState(name, {
                question: $('You have previously opted out of MomConnect ' +
                            'SMSs. Please confirm that you would like to ' +
                            'opt in to receive messages again?'),

                choices: [
                    new Choice('yes', $('Yes')),
                    new Choice('no', $('No'))
                ],

                next: function(choice) {
                    if (choice.value === 'yes') {
                        return go.utils
                            .opt_in(self.im, self.contact)
                            .then(function() {
                                return 'states_id_type';
                            });
                    } else {
                        return 'states_stay_out';
                    }
                }
            });
        });

        self.add('states_stay_out', function(name) {
            return new ChoiceState(name, {
                question: $('You have chosen not to receive MomConnect SMSs ' +
                            'and so cannot complete registration.'),

                choices: [
                    new Choice('main_menu', $('Main Menu'))
                ],

                next: function(choice) {
                    return 'states_start';
                }
            });
        });


        self.add('states_end_not_pregnant', function(name) {
            return new EndState(name, {
                text: $('We are sorry but this service is only for ' +
                    'pregnant mothers. If you have other health concerns ' +
                    'please visit your nearest clinic.'),
                next: 'states_start'
            });
        });

        self.add('states_id_type', function(name) {
            return new ChoiceState(name, {
                question: $('We need some info to message you. This ' +
                    'is private and will only be used to help you at a ' +
                    'clinic. What kind of ID do you have?'),

                choices: [
                    new Choice('sa_id', $('SA ID')),
                    new Choice('passport', $('Passport')),
                    new Choice('none', $('None'))
                ],

                next: function(choice) {
                    self.contact.extra.id_type = choice.value;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                sa_id: 'states_sa_id',
                                passport: 'states_passport_origin',
                                none: 'states_birth_year'
                            } [choice.value];
                        });
                }
            });
        });

        self.add('states_sa_id', function(name, opts) {
            var error = $('Sorry, your ID number did not validate. ' +
                          'Please reenter your SA ID number:');

            var question = $('Please enter your SA ID number:');

            return new FreeText(name, {
                question: question,

                check: function(content) {
                    if (!go.utils.validate_id_sa(content)) {
                        return error;
                    }
                },

                next: function(content) {
                    self.contact.extra.sa_id = content;

                    var id_date_of_birth = go.utils.extract_id_dob(content);
                    self.contact.extra.birth_year = id_date_of_birth.slice(0,4);
                    self.contact.extra.birth_month = id_date_of_birth.slice(5,7);
                    self.contact.extra.birth_day = id_date_of_birth.slice(8,10);
                    self.contact.extra.dob = id_date_of_birth;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                name: 'save_subscription_data'
                            };
                        });
                }
            });
        });

        self.add('states_passport_origin', function(name) {
            return new ChoiceState(name, {
                question: $('What is the country of origin of the passport?'),

                choices: [
                    new Choice('zw', $('Zimbabwe')),
                    new Choice('mz', $('Mozambique')),
                    new Choice('mw', $('Malawi')),
                    new Choice('ng', $('Nigeria')),
                    new Choice('cd', $('DRC')),
                    new Choice('so', $('Somalia')),
                    new Choice('other', $('Other'))
                ],

                next: function(choice) {
                    self.contact.extra.passport_origin = choice.value;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                name: 'states_passport_no'
                            };
                        });
                }
            });
        });

        self.add('states_passport_no', function(name) {
            var error = $('There was an error in your entry. Please ' +
                        'carefully enter your passport number again.');
            var question = $('Please enter your Passport number:');

            return new FreeText(name, {
                question: question,

                check: function(content) {
                    if (!go.utils.is_alpha_numeric_only(content) || content.length <= 4) {
                        return error;
                    }
                },

                next: function(content) {
                    self.contact.extra.passport_no = content;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                name: 'save_subscription_data'
                            };
                        });
                }
            });
        });

        self.add('states_birth_year', function(name, opts) {
            var error = $('There was an error in your entry. Please ' +
                        'carefully enter your year of birth again (for ' +
                        'example: 2001)');

            var question = $('Since you don\'t have an ID or passport, ' +
                            'please enter the year that you were born (for ' +
                            'example: 1981)');

            return new FreeText(name, {
                question: question,

                check: function(content) {
                    if (!go.utils.check_number_in_range(content, 1900, go.utils.get_today(self.im.config).getFullYear())) {
                        return error;
                    }
                },

                next: function(content) {
                    self.contact.extra.birth_year = content;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                name: 'states_birth_month'
                            };
                        });
                }
            });
        });

        self.add('states_birth_month', function(name) {
            return new ChoiceState(name, {
                question: $('Please enter the month that you were born.'),

                choices: go.utils.make_month_choices($, 0, 12),

                next: function(choice) {
                    self.contact.extra.birth_month = choice.value;

                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return {
                                name: 'states_birth_day'
                            };
                        });
                }
            });
        });

        self.add('states_birth_day', function(name, opts) {
            var error = $('There was an error in your entry. Please ' +
                        'carefully enter your day of birth again (for ' +
                        'example: 8)');

            var question = $('Please enter the day that you were born ' +
                    '(for example: 14).');

            return new FreeText(name, {
                question: question,

                check: function(content) {
                    if (!go.utils.check_number_in_range(content, 1, 31)) {
                        return error;
                    }
                },

                next: function(content) {
                    self.contact.extra.birth_day = go.utils.double_digit_day(content);
                    self.contact.extra.dob = (self.im.user.answers.states_birth_year +
                        '-' + self.im.user.answers.states_birth_month +
                        '-' + go.utils.double_digit_day(content));

                    return self.im.contacts.save(self.contact)
                        .then(function() {
                            return {
                                name: 'save_subscription_data'
                            };
                        });
                }
            });
        });

        self.states.add('save_subscription_data', function(name) {

            var opts = go.utils.subscription_type_and_rate(self.contact, self.im);
            self.contact.extra.subscription_type = opts.sub_type.toString();
            self.contact.extra.subscription_rate = opts.sub_rate.toString();
            self.contact.extra.is_registered = 'true';
            self.contact.extra.is_registered_by = 'personal';
            self.contact.extra.metric_sessions_to_register = self.contact.extra.ussd_sessions;
            self.contact.extra.ussd_sessions = '0';
            return Q.all([
                go.utils.jembi_send_json(self.contact, self.contact, 'subscription', self.im, self.metric_prefix),
                go.utils.subscription_send_doc(self.contact, self.im, self.metric_prefix, self.env, opts),
                self.im.outbound.send_to_user({
                    endpoint: 'sms',
                    content: $("Congratulations on your pregnancy. You will now get free SMSs about MomConnect. " +
                             "You can register for the full set of FREE helpful messages at a clinic.")
                }),
                self.im.metrics.fire.avg((self.metric_prefix + ".avg.sessions_to_register"), parseInt(self.contact.extra.metric_sessions_to_register, 10)),
                go.utils.incr_kv(self.im, [self.store_name, 'no_complete_registrations'].join('.')),
                go.utils.decr_kv(self.im, [self.store_name, 'no_incomplete_registrations'].join('.')),
                self.im.contacts.save(self.contact)
            ])
            .then(function() {
                return go.utils.adjust_percentage_registrations(self.im, self.metric_prefix);
            })
            .then(function() {
                return self.states.create('states_end_success');
            });
        });


        self.add('states_end_success', function(name) {
            return new EndState(name, {
                text: $('Congratulations on your pregnancy. You will now get free SMSs about MomConnect. You can register for the full set of FREE helpful messages at a clinic.'),
                next: 'states_start'
            });
        });

        self.add('states_error', function(name) {
            return new EndState(name, {
              text: 'Sorry, something went wrong when saving the data. Please try again.',
              next: 'states_start'
            });
        });




        // FAQ Browser
        // Select topic
        self.add('states_faq_topics', function(name) {
            return go.utils.get_snappy_topics(self.im, self.im.config.snappy.default_faq)
                .then(function(response) {
                    if (typeof response.data.error  !== 'undefined') {
                        // TODO Throw proper error
                        return error;
                    } else {
                        return _.map(_.sortBy(response.data, 'id'), function(d) {
                            return new Choice(d.id, d.topic);
                        });
                    }
                })
                .then(function(choices) {
                    return new PaginatedChoiceState(name, {
                        question: $('We have gathered information in the areas below. Please select:'),
                        choices: choices,
                        options_per_page: 8,
                        next: function(choice) {
                            return self.im.metrics.fire
                                .inc([
                                        self.env,
                                        'faq_view_topic',
                                        choice.value
                                    ].join('.'), 1)
                                .then(function() {
                                    return 'states_faq_questions';
                                });
                        }
                    });
                });
        });

        // Show questions in selected topic
        self.add('states_faq_questions', function(name, opts) {
            return go.utils.get_snappy_topic_content(self.im,
                        self.im.config.snappy.default_faq, self.im.user.answers.states_faq_topics)
                .then(function(response) {
                    if (typeof response.data.error  !== 'undefined') {
                        // TODO Throw proper error
                        return error;
                    } else {
                        var choices = response.data.map(function(d) {
                            return new Choice(d.id, d.question);
                        });

                        return new PaginatedChoiceState(name, {
                            question: $('Please select one:'),
                            choices: choices,
                            // TODO calculate options_per_page once content length is known
                            options_per_page: null,
                            next: function(choice) {
                                var question_id = choice.value;
                                var index = _.findIndex(response.data, { 'id': question_id});
                                var answer = response.data[index].answer.trim();

                                return self.im.metrics.fire
                                    .inc([self.env, 'faq_view_question'].join('.'), 1)
                                    .then(function() {
                                        return {
                                            name: 'states_faq_answers',
                                            creator_opts: {
                                                answer: answer
                                            }
                                        };
                                    });
                            }
                        });
                    }
                });
        });

        // Show answer to selected question
        self.add('states_faq_answers', function(name, opts) {
            return new PaginatedState(name, {
                text: opts.answer,
                more: $('More'),
                back: $('Back'),
                exit: $('Send to me by SMS'),
                next: function() {
                    return {
                        name: 'states_faq_sms_send',
                        creator_opts: {
                            answer: opts.answer
                        }
                    };
                }
            });
        });

        // Sms answer to user
        self.add('states_faq_sms_send', function(name, opts) {
            return self.im
                .outbound.send_to_user({
                    endpoint: 'sms',
                    content: opts.answer
                })
                .then(function() {
                    return self.im.metrics.fire.inc([self.env, 'faq_sent_via_sms'].join('.'), 1);
                })
                .then(function() {
                    return self.states.create('states_faq_end');
                });
        });

        // FAQ End
        self.add('states_faq_end', function(name, opts) {
            return new EndState(name, {
                text: $('Thank you. Your SMS will be delivered shortly.'),

                next: 'states_start'
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
