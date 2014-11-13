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
                '{"documentEntry":{"patientId":"5101025009086^^^ZAF^NI","uniqueId":"2.25.169380846032024","entryUUID":"urn:uuid:b18c62b4-828e-4b52-25c9-725a1f43fb37","classCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"typeCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"formatCode":{"code":"npr-pn-cda","codingScheme":"4308822c-d4de-49db-9bb8-275394ee971d","codeName":"NPR Patient Note CDA"},"mimeType":"text/xml","hash":"3148e4fa10356909d7021e12d5b777a6b8b9e9cc","size":5539}}',
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
                '            <!-- For CHW identification use case, use: code="102874004" displayName="Unconfirmed pregnancy" -->',
                '            <!-- For Clinic identification use case, use: code="77386006" displayName="Pregnancy confirmed" -->',
                '            <value xsi:type="CE" code="77386006" displayName="Pregnancy confirmed" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>',
                '            <entryRelationship typeCode="SPRT" inversionInd="true">',
                '              <!-- Delivery Date -->',
                '              <observation classCode="OBS" moodCode="EVN">',
                '                <code code="11778-8" displayName="Delivery date Estimated" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
                '                <text/>',
                '                <statusCode code="completed"/>',
                '                <!-- e.g. 20141017 -->',
                '                <!-- use yyyyMM if only estimated up to month level -->',
                '                <value xsi:type="TS" value="20140530"/>',
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
                '{"documentEntry":{"patientId":"5101025009086^^^ZAF^NI","uniqueId":"2.25.169380846032024","entryUUID":"urn:uuid:b18c62b4-828e-4b52-25c9-725a1f43fb37","classCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"typeCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"formatCode":{"code":"npr-pn-cda","codingScheme":"4308822c-d4de-49db-9bb8-275394ee971d","codeName":"NPR Patient Note CDA"},"mimeType":"text/xml","hash":"3bf58d84bb5d34f906daf234ecb4c78099b9406f","size":5535}}',
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
                '            <!-- For CHW identification use case, use: code="102874004" displayName="Unconfirmed pregnancy" -->',
                '            <!-- For Clinic identification use case, use: code="77386006" displayName="Pregnancy confirmed" -->',
                '            <value xsi:type="CE" code="77386006" displayName="Pregnancy confirmed" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>',
                '            <entryRelationship typeCode="SPRT" inversionInd="true">',
                '              <!-- Delivery Date -->',
                '              <observation classCode="OBS" moodCode="EVN">',
                '                <code code="11778-8" displayName="Delivery date Estimated" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
                '                <text/>',
                '                <statusCode code="completed"/>',
                '                <!-- e.g. 20141017 -->',
                '                <!-- use yyyyMM if only estimated up to month level -->',
                '                <value xsi:type="TS" value="20140530"/>',
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
    // CHW SELF - ZW Passport
    {
        'request': {
            'method': 'POST',
            'url': 'http://test/v2/',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['multipart/formdata; boundary=yolo']
            },
            'body': [
                '--yolo',
                'Content-Disposition: form-data; name="ihe-mhd-metadata"; filename="MHDMetadata.json"',
                'Content-Type: application/json',
                '',
                '{"documentEntry":{"patientId":"5101025009086^^^ZW^PPN","uniqueId":"2.25.169380846032024","entryUUID":"urn:uuid:b18c62b4-828e-4b52-25c9-725a1f43fb37","classCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"typeCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"formatCode":{"code":"npr-pn-cda","codingScheme":"4308822c-d4de-49db-9bb8-275394ee971d","codeName":"NPR Patient Note CDA"},"mimeType":"text/xml","hash":"ba66f5a84d268c221aebb32313ea2e2b22ddc7c4","size":5531}}',
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
                '    <id extension="5101025009086^^^ZW^PPN" root="526ef9c3-6f18-420a-bc53-9b733920bc67"/>',
                '    <!-- Telephone number in RFC3966 format, e.g. tel:+27731234567 -->',
                '    <telecom value="tel:+27001"/>',
                '    <patient>',
                '      <name>',
                '        <given nullFlavor="NI"/>',
                '        <family nullFlavor="NI"/>',
                '      </name>',
                '      <administrativeGenderCode code="F" codeSystem="2.16.840.1.113883.5.1"/>',
                '      <!-- If available, else set nullFlavor -->',
                '      <!-- Format yyyy[MM[dd]] e.g. 19700123 or 197001 for an estimated date -->',
                '      ',
                '      <languageCommunication>',
                '        <languageCode code="en"/>',
                '        <preferenceInd value="true"/>',
                '      </languageCommunication>',
                '    <birthTime nullFlavor="NI"/></patient>',
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
                '      <id extension="11399" root="9a560d61-85f1-4d7b-8ee2-090d2900f836"/>',
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
                '            <!-- For CHW identification use case, use: code="102874004" displayName="Unconfirmed pregnancy" -->',
                '            <!-- For Clinic identification use case, use: code="77386006" displayName="Pregnancy confirmed" -->',
                '            <value xsi:type="CE" code="102874004" displayName="Unconfirmed pregnancy" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>',
                '            <entryRelationship typeCode="SPRT" inversionInd="true">',
                '              <!-- Delivery Date -->',
                '              <observation classCode="OBS" moodCode="EVN">',
                '                <code code="11778-8" displayName="Delivery date Estimated" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
                '                <text/>',
                '                <statusCode code="completed"/>',
                '                <!-- e.g. 20141017 -->',
                '                <!-- use yyyyMM if only estimated up to month level -->',
                '                <value xsi:type="TS" value="17000101"/>',
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
            'code': 200,
            'data': '{}',
            'body': ''
        },
    },
    // CHW NOT MOTHER PHONE - ZW Passport
    {
        'request': {
            'method': 'POST',
            'url': 'http://test/v2/',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['multipart/formdata; boundary=yolo']
            },
            'body': [
                '--yolo',
                'Content-Disposition: form-data; name="ihe-mhd-metadata"; filename="MHDMetadata.json"',
                'Content-Type: application/json',
                '',
                '{"documentEntry":{"patientId":"12345^^^ZW^PPN","uniqueId":"2.25.169380846032024","entryUUID":"urn:uuid:b18c62b4-828e-4b52-25c9-725a1f43fb37","classCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"typeCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"formatCode":{"code":"npr-pn-cda","codingScheme":"4308822c-d4de-49db-9bb8-275394ee971d","codeName":"NPR Patient Note CDA"},"mimeType":"text/xml","hash":"1cf11086c8f417d81ecb9bfcd74a18f9b83bb867","size":5532}}',
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
                '    <id extension="12345^^^ZW^PPN" root="526ef9c3-6f18-420a-bc53-9b733920bc67"/>',
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
                '      ',
                '      <languageCommunication>',
                '        <languageCode code="en"/>',
                '        <preferenceInd value="true"/>',
                '      </languageCommunication>',
                '    <birthTime nullFlavor="NI"/></patient>',
                '  </patientRole>',
                '</recordTarget>',
                '<author>',
                '  <time value="20130819144811"/>',
                '  <assignedAuthor>',
                '    <id root="833f2856-b9e1-4f54-8694-c74c4283755f"/>',
                '    <telecom value="tel:+27001"/>',
                '    <assignedPerson/>',
                '    <!-- if facility code available, else leave out representedOrganization -->',
                '    <representedOrganization>',
                '      <id extension="11399" root="9a560d61-85f1-4d7b-8ee2-090d2900f836"/>',
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
                '            <!-- For CHW identification use case, use: code="102874004" displayName="Unconfirmed pregnancy" -->',
                '            <!-- For Clinic identification use case, use: code="77386006" displayName="Pregnancy confirmed" -->',
                '            <value xsi:type="CE" code="102874004" displayName="Unconfirmed pregnancy" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>',
                '            <entryRelationship typeCode="SPRT" inversionInd="true">',
                '              <!-- Delivery Date -->',
                '              <observation classCode="OBS" moodCode="EVN">',
                '                <code code="11778-8" displayName="Delivery date Estimated" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
                '                <text/>',
                '                <statusCode code="completed"/>',
                '                <!-- e.g. 20141017 -->',
                '                <!-- use yyyyMM if only estimated up to month level -->',
                '                <value xsi:type="TS" value="17000101"/>',
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
            'code': 200,
            'data': '{}',
            'body': ''
        },
    },
    // CHW NOT MOTHER PHONE - ZA ID
    {
        'request': {
            'method': 'POST',
            'url': 'http://test/v2/',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['multipart/formdata; boundary=yolo']
            },
            'body': [
                '--yolo',
                'Content-Disposition: form-data; name="ihe-mhd-metadata"; filename="MHDMetadata.json"',
                'Content-Type: application/json',
                '',
                '{"documentEntry":{"patientId":"5101025009086^^^ZAF^NI","uniqueId":"2.25.169380846032024","entryUUID":"urn:uuid:b18c62b4-828e-4b52-25c9-725a1f43fb37","classCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"typeCode":{"code":"51855-5","codingScheme":"2.16.840.1.113883.6.1","codeName":"Patient Note"},"formatCode":{"code":"npr-pn-cda","codingScheme":"4308822c-d4de-49db-9bb8-275394ee971d","codeName":"NPR Patient Note CDA"},"mimeType":"text/xml","hash":"e18de9da3355c624e43dd62300aa616e91333fcd","size":5532}}',
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
                '    <telecom value="tel:+27001"/>',
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
                '      <id extension="11399" root="9a560d61-85f1-4d7b-8ee2-090d2900f836"/>',
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
                '            <!-- For CHW identification use case, use: code="102874004" displayName="Unconfirmed pregnancy" -->',
                '            <!-- For Clinic identification use case, use: code="77386006" displayName="Pregnancy confirmed" -->',
                '            <value xsi:type="CE" code="102874004" displayName="Unconfirmed pregnancy" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>',
                '            <entryRelationship typeCode="SPRT" inversionInd="true">',
                '              <!-- Delivery Date -->',
                '              <observation classCode="OBS" moodCode="EVN">',
                '                <code code="11778-8" displayName="Delivery date Estimated" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>',
                '                <text/>',
                '                <statusCode code="completed"/>',
                '                <!-- e.g. 20141017 -->',
                '                <!-- use yyyyMM if only estimated up to month level -->',
                '                <value xsi:type="TS" value="17000101"/>',
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
            'code': 200,
            'data': '{}',
            'body': ''
        },
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
                "id": "12345^^^ZW^PPN",
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
                "id": "12345^^^ZW^PPN",
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
                "id": "12345^^^ZW^PPN",
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
    // PERSONAL - DATA LIMITED
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
    // CHW
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
                "cmsisdn": "+27001",
                "id": "5101025009086^^^ZW^PPN",
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
    // Subscription
    {
        'request': {
            'method': 'GET',
            'params': {
                'to_addr': '+27001'
            },
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
        },
        'response': {
            "code": 200,
            "meta": {
                "limit": 20,
                "next": null,
                "offset": 0,
                "previous": null,
                "total_count": 2
            },
            "data": {
                "objects": [
                    {
                        "active": true,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:22:34.838969",
                        "id": 1,
                        "lang": "en",
                        "message_set": "/api/v1/message_set/3/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/1/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27001",
                        "updated_at": "2014-08-05T11:22:34.838996",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    },
                    {
                        "active": true,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:31:50.908974",
                        "id": 2,
                        "lang": "af",
                        "message_set": "/api/v1/message_set/3/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/2/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27001",
                        "updated_at": "2014-08-05T11:31:50.909025",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    }
                ]
            }
        }
    },

    {
        'request': {
            'method': 'GET',
            'params': {
                'to_addr': '+27002'
            },
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
        },
        'response': {
            "code": 200,
            "meta": {
                "limit": 20,
                "next": null,
                "offset": 0,
                "previous": null,
                "total_count": 0
            },
            "data": {
                "objects": []
            }
        }
    },

    {
        'request': {
            'method': 'PUT',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
            "data": {
                "objects": [
                    {
                        "active": false,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:22:34.838969",
                        "id": 1,
                        "lang": "en",
                        "message_set": "/api/v1/message_set/3/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/1/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27001",
                        "updated_at": "2014-08-05T11:22:34.838996",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    },
                    {
                        "active": false,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:31:50.908974",
                        "id": 2,
                        "lang": "af",
                        "message_set": "/api/v1/message_set/3/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/2/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27001",
                        "updated_at": "2014-08-05T11:31:50.909025",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    }
                ]
            }
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },

    // Opt out
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/optout',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "id": "12345^^^ZW^PPN",
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
            'url': 'http://test/v2/json/optout',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27002",
                "cmsisdn": "+27002",
                "id": "12345^^^ZW^PPN",
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
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/subscription/",
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "lang": "en",
            "message_set": "/api/v1/message_set/9/",
            "next_sequence_number": 1,
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27001",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "active": true,
            "completed": false,
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "created_at": "2014-07-05T11:01:54.497870",
            "id": 8,
            "lang": "en",
            "message_set": "/api/v1/message_set/9/",
            "next_sequence_number": 1,
            "resource_uri": "/api/v1/subscription/8/",
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+271234",
            "updated_at": "2014-07-05T11:01:54.498122",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        }
    },
    {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/subscription/",
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "lang": "en",
            "message_set": "/api/v1/message_set/10/",
            "next_sequence_number": 1,
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27821234567",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "active": true,
            "completed": false,
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "created_at": "2014-07-05T11:01:54.497870",
            "id": 8,
            "lang": "en",
            "message_set": "/api/v1/message_set/10/",
            "next_sequence_number": 1,
            "resource_uri": "/api/v1/subscription/8/",
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27821234567",
            "updated_at": "2014-07-05T11:01:54.498122",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        }
      },
      {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/subscription/",
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "lang": "en",
            "message_set": "/api/v1/message_set/3/",
            "next_sequence_number": 1,
            "schedule": "/api/v1/periodic_task/1/",
            "to_addr": "+27001",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "active": true,
            "completed": false,
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "created_at": "2014-07-05T11:01:54.497870",
            "id": 8,
            "lang": "en",
            "message_set": "/api/v1/message_set/3/",
            "next_sequence_number": 1,
            "resource_uri": "/api/v1/subscription/8/",
            "schedule": "/api/v1/periodic_task/1/",
            "to_addr": "+27001",
            "updated_at": "2014-07-05T11:01:54.498122",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        }
      },
      {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/subscription/",
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "lang": "en",
            "message_set": "/api/v1/message_set/1/",
            "next_sequence_number": 1,
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27821234567",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "active": true,
            "completed": false,
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "created_at": "2014-07-05T11:01:54.497870",
            "id": 8,
            "lang": "en",
            "message_set": "/api/v1/message_set/1/",
            "next_sequence_number": 1,
            "resource_uri": "/api/v1/subscription/8/",
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27821234567",
            "updated_at": "2014-07-05T11:01:54.498122",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        }
      },
      {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/subscription/",
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "lang": "en",
            "message_set": "/api/v1/message_set/10/",
            "next_sequence_number": 1,
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27001",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "active": true,
            "completed": false,
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "created_at": "2014-07-05T11:01:54.497870",
            "id": 8,
            "lang": "en",
            "message_set": "/api/v1/message_set/10/",
            "next_sequence_number": 1,
            "resource_uri": "/api/v1/subscription/8/",
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27001",
            "updated_at": "2014-07-05T11:01:54.498122",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        }
      },
      {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/subscription/",
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "lang": "en",
            "message_set": "/api/v1/message_set/4/",
            "next_sequence_number": 1,
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27001",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "active": true,
            "completed": false,
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "created_at": "2014-07-05T11:01:54.497870",
            "id": 8,
            "lang": "en",
            "message_set": "/api/v1/message_set/4/",
            "next_sequence_number": 1,
            "resource_uri": "/api/v1/subscription/8/",
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27001",
            "updated_at": "2014-07-05T11:01:54.498122",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        }
      },
      {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/subscription/",
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "lang": "en",
            "message_set": "/api/v1/message_set/6/",
            "next_sequence_number": 1,
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27001",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "active": true,
            "completed": false,
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "created_at": "2014-07-05T11:01:54.497870",
            "id": 8,
            "lang": "en",
            "message_set": "/api/v1/message_set/6/",
            "next_sequence_number": 1,
            "resource_uri": "/api/v1/subscription/8/",
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27001",
            "updated_at": "2014-07-05T11:01:54.498122",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        }
      },
      {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/subscription/",
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "lang": "en",
            "message_set": "/api/v1/message_set/6/",
            "next_sequence_number": 1,
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27002",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "active": true,
            "completed": false,
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "created_at": "2014-07-05T11:01:54.497870",
            "id": 8,
            "lang": "en",
            "message_set": "/api/v1/message_set/6/",
            "next_sequence_number": 1,
            "resource_uri": "/api/v1/subscription/8/",
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27002",
            "updated_at": "2014-07-05T11:01:54.498122",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        }
      },
      {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/subscription/",
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "lang": "en",
            "message_set": "/api/v1/message_set/2/",
            "next_sequence_number": 7,
            "schedule": "/api/v1/periodic_task/4/",
            "to_addr": "+27821234567",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "active": true,
            "completed": false,
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "created_at": "2014-07-05T11:01:54.497870",
            "id": 8,
            "lang": "en",
            "message_set": "/api/v1/message_set/2/",
            "next_sequence_number": 7,
            "resource_uri": "/api/v1/subscription/8/",
            "schedule": "/api/v1/periodic_task/4/",
            "to_addr": "+27821234567",
            "updated_at": "2014-07-05T11:01:54.498122",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        }
      },
      {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },

          "url": "http://ndoh-control/api/v1/snappybouncer/ticket/",
          "data": {
            "conversation":"/api/v1/snappybouncer/conversation/key/dummyconversation/",
            "message": "DONUTS",
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "msisdn": "+27001"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "conversation": "/api/v1/snappybouncer/conversation/1/",
            "created_at": "2014-07-27T21:59:50.463810",
            "id": 1,
            "message": "DONUTS",
            "msisdn": "+27001",
            "resource_uri": "/api/v1/snappybouncer/ticket/1/",
            "response": "",
            "support_id": null,
            "support_nonce": "alfz1cc1qkitdarc",
            "updated_at": "2014-07-27T21:59:56.489255"
          }
        },
      },
      {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/servicerating/rate/",
          "data": {
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4",
            "conversation_key": "dummyconversationkey",
            "contact": {
                "extra": {},
                "groups": [],
                "subscription": {},
                "msisdn": "+27001",
                "created_at": "2014-07-28 09:35:26.732",
                "key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4",
                "name": null,
                "surname": null,
                "email_address": null,
                "dob": null,
                "twitter_handle": null,
                "facebook_id": null,
                "bbm_pin": null,
                "gtalk_id": null
            },
            "answers": {
                "question_1_friendliness": "very-satisfied",
                "question_2_waiting_times_feel": "very-satisfied",
                "question_3_waiting_times_length": "less-than-an-hour",
                "question_4_cleanliness": "very-satisfied",
                "question_5_privacy": "very-satisfied"
            }
        },
        "response": {
          "code": 201,
          "data": {}
        }
      }
    },// TOPIC RESPONSE
        {
            'request': {
                'method': 'GET',
                'headers': {
                    'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                    'Content-Type': ['application/json']
                },
                'url': 'https://app.besnappy.com/api/v1/account/1/faqs/1/topics'
            },
            'response': {
                "code": "200",
                "data": [
                    {
                        "id": 903,
                        "faq_id": 3134,
                        "topic": "Baby",
                        "order": 0,
                        "created_at": "2014-07-29 10:37:56",
                        "updated_at": "2014-07-29 10:37:56",
                        "slug": "baby"
                    },
                    {
                        "id": 904,
                        "faq_id": 3134,
                        "topic": "HIV",
                        "order": 0,
                        "created_at": "2014-07-29 10:38:04",
                        "updated_at": "2014-07-29 10:38:04",
                        "slug": "hiv"
                    },
                    {
                        "id": 902,
                        "faq_id": 3134,
                        "topic": "Labour",
                        "order": 0,
                        "created_at": "2014-07-29 10:37:47",
                        "updated_at": "2014-07-29 10:37:47",
                        "slug": "labour"
                    },
                    {
                        "id": 905,
                        "faq_id": 3134,
                        "topic": "Other Diseases",
                        "order": 0,
                        "created_at": "2014-07-29 10:38:21",
                        "updated_at": "2014-07-29 10:38:21",
                        "slug": "other-diseases"
                    },
                    {
                        "id": 881,
                        "faq_id": 3134,
                        "topic": "Pregnancy",
                        "order": 0,
                        "created_at": "2014-07-15 09:51:44",
                        "updated_at": "2014-07-15 09:51:44",
                        "slug": "pregnancy"
                    },
                    {
                        "id": 906,
                        "faq_id": 3134,
                        "topic": "Support",
                        "order": 0,
                        "created_at": "2014-07-29 10:38:29",
                        "updated_at": "2014-07-29 10:38:29",
                        "slug": "support"
                    }
                ]
            }
        },
        // QA RESPONSE
        {
            'request': {
                'method': 'GET',
                'headers': {
                    'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                    'Content-Type': ['application/json']
                },
                'url': 'https://app.besnappy.com/api/v1/account/1/faqs/1/topics/881/questions'
            },
            'responses': [{
                "code": 200,
                "data": [{
                    "id": "635",
                    "account_id": "50",
                    "question": "Can I order more than one box at a time?",
                    "answer": "If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).",
                    "created_at": "2013-11-19 09:17:34",
                    "updated_at": "2014-02-24 09:36:54",
                    "active": "1",
                    "parsed_answer": "<p>If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "635",
                        "featured": "0",
                        "order": "0"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                }, {
                    "id": "634",
                    "account_id": "50",
                    "question": "What happens if I fall in love with one particular coffee?",
                    "answer": "At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!",
                    "created_at": "2013-11-19 09:16:36",
                    "updated_at": "2013-11-19 14:34:50",
                    "active": "1",
                    "parsed_answer": "<p>At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "634",
                        "featured": "0",
                        "order": "1"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                },
                {
                    "id": "999",
                    "account_id": "50",
                    "question": "What happens if the FAQ answer is really long?",
                    "answer": "It will be split into multiple pages on a bookletstate, showing content on different screens as the text gets too long. To illustrate this, this super long response has been faked. This should be split over at least 2 screens just because we want to test properly. Let's see.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                },
                {
                    "id": "633",
                    "account_id": "50",
                    "question": "What happens if I realise the amount of coffee I've ordered doesn't suit?",
                    "answer": "If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                }]
            },
            {
                "code": 200,
                "data": [{
                    "id": "635",
                    "account_id": "50",
                    "question": "Can I order more than one box at a time?",
                    "answer": "If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).",
                    "created_at": "2013-11-19 09:17:34",
                    "updated_at": "2014-02-24 09:36:54",
                    "active": "1",
                    "parsed_answer": "<p>If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "635",
                        "featured": "0",
                        "order": "0"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                }, {
                    "id": "634",
                    "account_id": "50",
                    "question": "What happens if I fall in love with one particular coffee?",
                    "answer": "At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!",
                    "created_at": "2013-11-19 09:16:36",
                    "updated_at": "2013-11-19 14:34:50",
                    "active": "1",
                    "parsed_answer": "<p>At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "634",
                        "featured": "0",
                        "order": "1"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                },
                {
                    "id": "999",
                    "account_id": "50",
                    "question": "What happens if the FAQ answer is really long?",
                    "answer": "It will be split into multiple pages on a bookletstate, showing content on different screens as the text gets too long. To illustrate this, this super long response has been faked. This should be split over at least 2 screens just because we want to test properly. Let's see.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                },
                {
                    "id": "633",
                    "account_id": "50",
                    "question": "What happens if I realise the amount of coffee I've ordered doesn't suit?",
                    "answer": "If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                }]
            },{
                "code": 200,
                "data": [{
                    "id": "635",
                    "account_id": "50",
                    "question": "Can I order more than one box at a time?",
                    "answer": "If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).",
                    "created_at": "2013-11-19 09:17:34",
                    "updated_at": "2014-02-24 09:36:54",
                    "active": "1",
                    "parsed_answer": "<p>If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "635",
                        "featured": "0",
                        "order": "0"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                }, {
                    "id": "634",
                    "account_id": "50",
                    "question": "What happens if I fall in love with one particular coffee?",
                    "answer": "At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!",
                    "created_at": "2013-11-19 09:16:36",
                    "updated_at": "2013-11-19 14:34:50",
                    "active": "1",
                    "parsed_answer": "<p>At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "634",
                        "featured": "0",
                        "order": "1"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                },
                {
                    "id": "999",
                    "account_id": "50",
                    "question": "What happens if the FAQ answer is really long?",
                    "answer": "It will be split into multiple pages on a bookletstate, showing content on different screens as the text gets too long. To illustrate this, this super long response has been faked. This should be split over at least 2 screens just because we want to test properly. Let's see.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                },
                {
                    "id": "633",
                    "account_id": "50",
                    "question": "What happens if I realise the amount of coffee I've ordered doesn't suit?",
                    "answer": "If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                }]
            }]
        }
    ];
};
