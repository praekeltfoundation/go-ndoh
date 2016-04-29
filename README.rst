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
Note all metrics are prepended by their <env>, e.g. 'qa.'


NurseConnect Metrics

* nurse_ussd.registrations.sum (SUM metric total registrations)
* nurse_ussd.registrations.last (LAST metric total registrations)

* nurse_ussd.optouts.sum (SUM metric total optouts)
* nurse_ussd.optouts.last (LAST metric total optouts)
* nurse_sms.optouts.sum (SUM metric total optouts)
* nurse_sms.optouts.last (LAST metric total optouts)
* nurseconnect.optouts.sum (SUM metric total optouts)
* nurseconnect.optouts.last (LAST metric total optouts)
* nurseconnect.optouts.<reason>.sum (SUM metric optouts for reason)
* nurseconnect.optouts.<reason>.last (Last metric optouts for reason)

* nurse_sms.inbound.sum (SUM total inbound messages)
* nurse_sms.inbound.last (LAST total inbound messages)

MomConnect Metrics

* sum.unique_users
* sum.subscriptions

.. Unique users
.. agg: last
* clinic.sum.unique_users
* chw.sum.unique_users
* personal.sum.unique_users
* smsinbound.sum.unique_users
* servicerating.sum.unique_users
.. agg: sum
* servicerating.sum.unique_users.transient

.. Sessions to register
* clinic.avg.sessions_to_register
* chw.avg.sessions_to_register
* personal.avg.sessions_to_register

.. Percentage users (clinic + chw + personal = 100)
* clinic.percentage_users
* chw.percentage_users
* personal.percentage_users

* clinic.<state-name>.no_incomplete (1 metric for each state name except end states)
* chw.<state-name>.no_incomplete
* personal.<state-name>.no_incomplete

* clinic.percent_incomplete_registrations
* clinic.percent_complete_registrations
* chw.percent_incomplete_registrations
* chw.percent_complete_registrations
* personal.percent_incomplete_registrations
* personal.percent_complete_registrations

* clinic.sum.doc_to_jembi_success
* clinic.sum.json_to_jembi_success
* chw.sum.doc_to_jembi_success
* chw.sum.json_to_jembi_success
* personal.sum.json_to_jembi_success

* clinic.sum.doc_to_jembi_fail
* clinic.sum.json_to_jembi_fail
* chw.sum.doc_to_jembi_fail
* chw.sum.json_to_jembi_fail
* personal.sum.json_to_jembi_fail

.. Registration source at time of opting out
.. Based on contact.extra.is_registered_by
.. agg: last
* sum.optout_on.clinic
* sum.optout_on.chw
* sum.optout_on.personal

.. Manual switch to baby (smsinbound)
* sum.baby_sms

.. Total number of optouts
.. agg: last
* sum.optouts

.. Reason for opting out
.. agg: last
* sum.optout_cause.miscarriage
* sum.optout_cause.babyloss
* sum.optout_cause.stillbirth
* sum.optout_cause.not_useful
* sum.optout_cause.other
* sum.optout_cause.unknown (smsinbound)

.. Reason for opting out - loss/non-loss
.. Categorises sum.optout_cause metrics 1-3 above as loss, 4-6 as non-loss
.. agg: last
* sum.optout_cause.loss
* sum.optout_cause.non_loss

.. Percentage optouts
.. agg: last
* percent.optout.all (total optouts / total subscriptions)
* percent.optout.non_loss (non-loss optouts / total subscriptions)
* percent.optout.loss.msgs (percentage loss optouts that chose to get messages)

.. Subscriptions to loss messages
.. agg: last
* optout.sum.subscription_to_protocol_success (vumi success)
* optout.sum.subscription_to_protocol_fail (vumi failure)
* optout.sum.json_to_jembi_success (jembi success)
* optout.sum.json_to_jembi_success (jembi failure)

.. Servicerating sessions
.. agg: last
* servicerating.sum.sessions
.. agg: sum
* servicerating.sum.sessions.transient
.. agg: avg
* servicerating.avg.sessions.rate_service (avg sessions to rate service)

.. Servicerating dropoffs
.. agg: last
* servicerating.sum.question_1_friendliness.exits
* servicerating.sum.question_2_waiting_times_feel.exits
* servicerating.sum.question_3_waiting_times_length.exits
* servicerating.sum.question_4_cleanliness.exits
* servicerating.sum.question_5_privacy.exits

.. Servicerating completion
.. agg:last
* servicerating.sum.servicerating_success
* servicerating.sum.servicerating_to_jembi_success
* servicerating.percent.complete_serviceratings
* servicerating.percent.incomplete_serviceratings


Analytics produced:

* self.contact.extra.<question>  (responses to each question per user)
* sum.sessions (metric) (number of sessions - total)
* self.user.extra.metric_sum_sessions (number of sessions - per user)
* self.contact.extra.last_stage (position in menu where each user drops off)
* self.contact.extra.metric_sessions_to_register (number of sessions needed to complete registration per user)
* self.user.extra.no_registrations (number of registrations for other numbers)
* self.contact.extra.opt_out_reason (reasons for optout per person)
