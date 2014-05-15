NDOH MomConnect Apps
====================

Includes 3 different apps - for use by:
1. Clinic workers - upon confirmed pregnancy
2. Community Health Workers - for suspected pregnancy
3. Public use

Idea is:

1. Clinic worker gathers mom's data:
    1. Phone number
    2. Due date
    3. Identification
    4. Language pref

2. CHW worker gathers woman's data:
    1. Phone number
    2. Identification
    3. Language pref

3. Public registration:
    1. Choose their language
    2. Ask if they suspect pregnancy
    3. Supply ID


Metrics produced:

* sum.unique_users

* clinic.sum.unique_users
* chw.sum.unique_users
* personal.sum.unique_users

* clinic.avg.sessions_to_register
* chw.avg.sessions_to_register
* personal.avg.sessions_to_register

* percentage_users (clinic + chw + personal = 100)

* clinic.<state-name>.no_incomplete (1 metric for each state name except end states)
* chw.<state-name>.no_incomplete
* personal.<state-name>.no_incomplete

* clinic.percent_incomplete_registrations
* clinic.percent_complete_registrations
* chw.percent_incomplete_registrations
* chw.percent_complete_registrations
* personal.percent_incomplete_registrations
* personal.percent_complete_registrations


Analytics produced:

* self.contact.extra.<question>  (responses to each question per user)
* sum.sessions (metric) (number of sessions - total)
* self.user.extra.metric_sum_sessions (number of sessions - per user)
* self.contact.extra.last_stage (position in menu where each user drops off)


Metrics required (v1):

* clinic.sum.sent_to_hie (records number of complete registrations sent to HIE)
* chw.sum.sent_to_hie
* personal.sum.sent_to_hie


Analytics required (v2):

* number of sessions needed to complete registration per user
 - self.contact.extra.metric_ussd_sessions

 
* number of moms registered per facility/nurse phone
 - self.user.extra.no_registrations (should increase when we set working_on to "")
* reasons for optout per person
 - self.gsvr.is.going.home.and.hasn't.gotten.to.this