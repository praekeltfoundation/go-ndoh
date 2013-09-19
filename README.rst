Go Hack App for mHealth Connectathon
====================================

|travis|_

.. |travis| image:: https://travis-ci.org/smn/go-ndoh.png?branch=develop
.. _travis: https://travis-ci.org/smn/go-ndoh

General idea is:

1. Capture demographics:
    1. Name
    2. Date of Birth
    3. ID Number
    4. Last menstruation date
    5. Pregnancy Status
2. Push LH7v2 XML payload to app server
    1. Register patient at HIE
    2. Publish pregnancy status at HIE
