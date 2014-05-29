module.exports = function() {
    return [
    // CLINIC
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['multipart/formdata; boundary=yolo']
            },
            'url': 'http://test/v2/',
            'body': [
                '--yolo',
                'Content-Disposition: form-data; name="ihe-mhd-metadata"; filename="MHDMetadata.json"',
                'Content-Type: application/json',
                '',
                '{"documentEntry":{"patientId":"5101025009086^^^ZAF^NI","uniqueId":"2.25.169380846032024","entryUUID":"urn:uuid:b18c62b4-828e-4b52-25c9-725a1f43fb37","classCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"typeCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"formatCode":{"code":"npr-pn-cda","codingScheme":"4308822c-d4de-49db-9bb8-275394ee971d","codeName":"NPR Patient Note CDA"},"mimeType":"text/xml","hash":"c73527eb1409820bc8ff2b835b2f1fdd73ef3a2c","size":5561}}',
                '',
                '--yolo',
                'Content-Disposition: form-data; name="content"; filename="CDARequest.xml"',
                'Content-Type: text/xml',
                '',
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:cda="urn:hl7-org:v3" xmlns:voc="urn:hl7-org:v3/voc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:pcc="urn:ihe:pcc:hl7v3" xmlns:lab="urn:oid:1.3.6.1.4.1.19376.1.3.2" xmlns:sdtc="urn:hl7-org:sdtc" xsi:schemaLocation="urn:hl7-org:v3 CDA.xsd">',
                '<typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>',
                '<templateId root="2.16.840.1.113883.10" extension="IMPL_CDAR2_LEVEL1"/>',
                '<id root="b18c62b4-828e-4b52-25c9-725a1f43fb37"/>',
                '<code code="51855-5" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
                '<title>SA National Pregnancy Register - Patient Note</title>',
                '<!-- Creation time of document, e.g. 20140217121212 -->',
                '<effectiveTime value="20130819144811"/>',
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
                '    <id extension="5101025009086^^^ZAF^NI" root="526ef9c3-6f18-420a-bc53-9b733920bc67"/>',
                '    <!-- Telephone number in RFC3966 format, e.g. tel:+27731234567 -->',
                '    <telecom value="tel:+27821234567"/>',
                '    <patient>',
                '      <name>',
                '        <given nullFlavor="NI"/>',
                '        <family nullFlavor="NI"/>',
                '      </name>',
                '      <administrativeGenderCode code="F" codeSystem="2.16.840.1.113883.5.1"/>',
                '      <!-- If available, else set nullFlavor -->',
                '      <!-- Format yyyy[MM[dd]] e.g. 19700123 or 197001 for an estimated date -->',
                '      <birthTime value="19510102"/>',
                '      <languageCommunication>',
                '        <languageCode code="en"/>',
                '        <preferenceInd value="true"/>',
                '      </languageCommunication>',
                '    </patient>',
                '  </patientRole>',
                '</recordTarget>',
                '<author>',
                '  <time value="20130819144811"/>',
                '  <assignedAuthor>',
                '    <id root="833f2856-b9e1-4f54-8694-c74c4283755f"/>',
                '    <telecom value="tel:+270001"/>',
                '    <assignedPerson/>',
                '    <!-- if facility code available, else leave out representedOrganization -->',
                '    <representedOrganization>',
                '      <id extension="12345" root="9a560d61-85f1-4d7b-8ee2-090d2900f836"/>',
                '    </representedOrganization>',
                '  </assignedAuthor>',
                '</author>',
                '<author>',
                '  <time value="20130819144811"/>',
                '  <assignedAuthor>',
                '    <id root="9a560d61-85f1-4d7b-8ee2-090d2900f836"/>',
                '    <assignedAuthoringDevice>',
                '      <code code="PF" codeSystem="56877fb7-e3a9-4ad5-bfb5-64d48a045e83"/>',
                '      ',
                '    <softwareName>Vumi</softwareName></assignedAuthoringDevice>',
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
                '    <effectiveTime value="20130819144811"/>',
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
                '            <effectiveTime value="20130819144811"/>',
                '            <value xsi:type="CE" code="77386006" displayName="Pregnancy confirmed" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>',
                '            <!-- For CHW identification use case, use "Unconfirmed pregnancy" -->',
                '            <!--<value xsi:type="CE" code="102874004" displayName="Unconfirmed pregnancy" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>-->',
                '            <entryRelationship typeCode="SPRT" inversionInd="true">',
                '              <!-- Delivery Date -->',
                '              <observation classCode="OBS" moodCode="EVN">',
                '                <code code="11778-8" displayName="Delivery date Estimated" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
                '                <text/>',
                '                <statusCode code="completed"/>',
                '                <!-- e.g. 20141017 -->',
                '                <!-- use yyyyMM if only estimated up to month level -->',
                '                <value xsi:type="TS" value="20130819144811"/>',
                '              </observation>',
                '            </entryRelationship>',
                '          </observation>',
                '        </entry>',
                '      </section>',
                '    </component>',
                '  </structuredBody>',
                '</component>',
                '</ClinicalDocument>'
            ].join('\n')
        },
        'response': {
            'body': ''
        },
    },
    // CLINIC - MOTHERS PHONE
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['multipart/formdata; boundary=yolo']
            },
            'url': 'http://test/v2/',
            'body': [
                '--yolo',
                'Content-Disposition: form-data; name="ihe-mhd-metadata"; filename="MHDMetadata.json"',
                'Content-Type: application/json',
                '',
                '{"documentEntry":{"patientId":"5101025009086^^^ZAF^NI","uniqueId":"2.25.169380846032024","entryUUID":"urn:uuid:b18c62b4-828e-4b52-25c9-725a1f43fb37","classCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"typeCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"formatCode":{"code":"npr-pn-cda","codingScheme":"4308822c-d4de-49db-9bb8-275394ee971d","codeName":"NPR Patient Note CDA"},"mimeType":"text/xml","hash":"0af0882f882b6e8e1e282d1ab3f71a717f8959b0","size":5557}}',
                '',
                '--yolo',
                'Content-Disposition: form-data; name="content"; filename="CDARequest.xml"',
                'Content-Type: text/xml',
                '',
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:cda="urn:hl7-org:v3" xmlns:voc="urn:hl7-org:v3/voc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:pcc="urn:ihe:pcc:hl7v3" xmlns:lab="urn:oid:1.3.6.1.4.1.19376.1.3.2" xmlns:sdtc="urn:hl7-org:sdtc" xsi:schemaLocation="urn:hl7-org:v3 CDA.xsd">',
                '<typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>',
                '<templateId root="2.16.840.1.113883.10" extension="IMPL_CDAR2_LEVEL1"/>',
                '<id root="b18c62b4-828e-4b52-25c9-725a1f43fb37"/>',
                '<code code="51855-5" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
                '<title>SA National Pregnancy Register - Patient Note</title>',
                '<!-- Creation time of document, e.g. 20140217121212 -->',
                '<effectiveTime value="20130819144811"/>',
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
                '    <id extension="5101025009086^^^ZAF^NI" root="526ef9c3-6f18-420a-bc53-9b733920bc67"/>',
                '    <!-- Telephone number in RFC3966 format, e.g. tel:+27731234567 -->',
                '    <telecom value="tel:+27821234567"/>',
                '    <patient>',
                '      <name>',
                '        <given nullFlavor="NI"/>',
                '        <family nullFlavor="NI"/>',
                '      </name>',
                '      <administrativeGenderCode code="F" codeSystem="2.16.840.1.113883.5.1"/>',
                '      <!-- If available, else set nullFlavor -->',
                '      <!-- Format yyyy[MM[dd]] e.g. 19700123 or 197001 for an estimated date -->',
                '      <birthTime value="19510102"/>',
                '      <languageCommunication>',
                '        <languageCode code="en"/>',
                '        <preferenceInd value="true"/>',
                '      </languageCommunication>',
                '    </patient>',
                '  </patientRole>',
                '</recordTarget>',
                '<author>',
                '  <time value="20130819144811"/>',
                '  <assignedAuthor>',
                '    <id root="833f2856-b9e1-4f54-8694-c74c4283755f"/>',
                '    ',
                '    <assignedPerson/>',
                '    <!-- if facility code available, else leave out representedOrganization -->',
                '    <representedOrganization>',
                '      <id extension="12345" root="9a560d61-85f1-4d7b-8ee2-090d2900f836"/>',
                '    </representedOrganization>',
                '  <telecom nullFlavor="NI"/></assignedAuthor>',
                '</author>',
                '<author>',
                '  <time value="20130819144811"/>',
                '  <assignedAuthor>',
                '    <id root="9a560d61-85f1-4d7b-8ee2-090d2900f836"/>',
                '    <assignedAuthoringDevice>',
                '      <code code="PF" codeSystem="56877fb7-e3a9-4ad5-bfb5-64d48a045e83"/>',
                '      ',
                '    <softwareName>Vumi</softwareName></assignedAuthoringDevice>',
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
                '    <effectiveTime value="20130819144811"/>',
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
                '            <effectiveTime value="20130819144811"/>',
                '            <value xsi:type="CE" code="77386006" displayName="Pregnancy confirmed" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>',
                '            <!-- For CHW identification use case, use "Unconfirmed pregnancy" -->',
                '            <!--<value xsi:type="CE" code="102874004" displayName="Unconfirmed pregnancy" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>-->',
                '            <entryRelationship typeCode="SPRT" inversionInd="true">',
                '              <!-- Delivery Date -->',
                '              <observation classCode="OBS" moodCode="EVN">',
                '                <code code="11778-8" displayName="Delivery date Estimated" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
                '                <text/>',
                '                <statusCode code="completed"/>',
                '                <!-- e.g. 20141017 -->',
                '                <!-- use yyyyMM if only estimated up to month level -->',
                '                <value xsi:type="TS" value="20130819144811"/>',
                '              </observation>',
                '            </entryRelationship>',
                '          </observation>',
                '        </entry>',
                '      </section>',
                '    </component>',
                '  </structuredBody>',
                '</component>',
                '</ClinicalDocument>'
            ].join('\n')
        },
        'response': {
            'body': ''
        }
    },
    // PERSONAL SUBSCRIPTION
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "id": "5101015009088^^^ZAF^NI",
                "type": 1,
                "lang": "en",
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "id": "5101025009086^^^ZAF^NI",
                "type": 1,
                "lang": "en",
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "id": "12345^^^ZW^FI",
                "type": 1,
                "lang": "en",
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "id": null,
                "type": 3,
                "lang": "en",
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "id": "2012315678097^^^ZAF^NI",
                "type": 1,
                "lang": "en",
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "id": "5002285000007^^^ZAF^NI",
                "type": 1,
                "lang": "en",
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27821234567",
                "cmsisdn": "+27821234567",
                "id": "5101025009086^^^ZAF^NI",
                "type": 3,
                "lang": "en",
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+270001",
                "cmsisdn": "+27821234567",
                "id": "5101025009086^^^ZAF^NI",
                "type": 3,
                "lang": "en",
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "id": "12345^^^ZW^FI",
                "type": 2,
                "lang": "en",
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27001",
                "cmsisdn": "+27821234567",
                "id": "12345^^^ZW^FI",
                "type": 2,
                "lang": "en",
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    }];
};
