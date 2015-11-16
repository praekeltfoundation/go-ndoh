// from package.json

"dependencies": {
    "libxmljs": "~0.8.1"
}

// from src/utils.js

var utils = vumigo.utils;
var libxml = require('libxmljs');
var crypto = require('crypto');


    // investigate again later:
    get_timestamp



    // used in:
    //  utils 1 - loss_message_opt_in
    //  clinic 1
    //  chw 1
    //  personal 1
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

    // used in:
    //  clinic 1
    //  chw 1
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
                '//*[text()="${givenName}"]': function (element) {  // NULL
                    return go.utils.null_element(element);
                },
                // Not in Scope
                '//*[text()="${familyName}"]': function (element) {  // NULL
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
                '//*[@extension="${hcwCode}"]': function (element) {  // DOESN'T SEEM TO BE IN THE TEMPLATE?
                    return go.utils.get_clinic_id(contact, element);
                },
                // Not in Scope
                '//*[text()="${hcwGivenName}"]': function (element) {  // NOT IN TEMPLATE
                    return go.utils.null_element(element);
                },
                // Not in Scope
                '//*[text()="${hcwFamilyName}"]': function (element) {  // NOT IN TEMPLATE
                    return go.utils.null_element(element);
                },
                // Only possible on Clinic line
                '//*[@extension="${facilityCode}"]': function (element) {
                    return go.utils.get_clinic_id(contact, element);
                },
                // Not in scope
                '//*[text()="${facilityName}"]': function (element) {  // NOT IN TEMPLATE
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

            if (type === 'registration') {
                JSON_template.edd = go.utils.get_duedate_string(contact, im.config);
            }

            return JSON_template;
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
            return http.post(im.config.jembi.url_json + 'subscription', {
              data: JSON.stringify(json_doc)
            });
        },

        jembi_optout_api_call: function (json_doc, im) {
            var http = new HttpApi(im, {
                auth: {
                    username: im.config.jembi.username,
                    password: im.config.jembi.password
                },
                headers: {
                    'Content-Type': ['application/json']
                }
            });
            return http.post(im.config.jembi.url_json + 'optout', {
                data: JSON.stringify(json_doc)
            });
        },



            get_duedate_string: function(contact, config){
                if (!_.isUndefined(contact.extra.due_date_month) && !_.isUndefined(contact.extra.due_date_day)){
                    var day = contact.extra.due_date_day;
                    var month = contact.extra.due_date_month;
                    var year = go.utils.get_due_year_from_month(month, go.utils.get_today(config));
                    return [year, month, day].join('');
                } else {
                    return null;
                }
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

            get_pregnancy_display_name: function(im, element){
              if (im.config.name.substring(0,3) == "chw") {
                return go.utils.update_attr(element, 'displayName', 'Unconfirmed pregnancy');
              } else {
                return go.utils.update_attr(element, 'displayName', 'Pregnancy confirmed');
              }
            },

            get_pregnancy_code: function(im, element){
              if (im.config.name.substring(0,3) == "chw") {
                return go.utils.update_attr(element, 'code', '102874004');
              } else {
                return go.utils.update_attr(element, 'code', '77386006');
              }
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

            get_uuid: function () {
                return utils.uuid();
            },

            get_oid: function () {
                var uuid = go.utils.get_uuid();
                var hex = uuid.replace('-', '');
                var number = parseInt(hex, 16);
                return '2.25.' + go.utils.toFixed(number);
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




