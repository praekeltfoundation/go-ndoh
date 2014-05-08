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


Analytics produced:

* self.contact.extra.<question>  (responses to each question per user)


Metrics required (v1):

* clinic.sum.sent_to_hie (records number of complete registrations sent to HIE)
* chw.sum.sent_to_hie
* personal.sum.sent_to_hie


Metrics required (v2):

* percentage_users (clinic + chw + personal = 100)

* clinic.<state-name>.sum.dropoffs (records number of fatal dropoffs for each state - suggest fire an increase when you enter each state and fire a decrease when you exit the state)
* chw.<state-name>.sum.dropoffs
* personal.<state-name>.sum.dropoffs

* clinic.percentage_complete_registrations
* clinic.percentage_incomplete_registrations
 - (complete + incomplete registrations = 100.)
* chw.percentage_complete_registrations
* chw.percentage_incomplete_registrations
* personal.percentage_complete_registrations
* personal.percentage_incomplete_registrations

Analytics required (v2):

* number of sessions - total and per user
 - sum.sessions (global metric)
 - self.user.extra.metric_total_sessions
* position in menu where each user drops off (this is basically last_stage_completed)
 - self.contact.extra.dropoff_state
* number of sessions needed to complete registration per user
 - self.contact.extra.metric_ussd_sessions
* number of moms registered per facility/nurse phone
 - self.user.extra.no_registrations (should increase when we set working_on to "")
* reasons for optout per person
 - self.gsvr.is.going.home.and.hasn't.gotten.to.this