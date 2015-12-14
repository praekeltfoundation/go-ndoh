var go = {};
go;

var _ = require('lodash');
var moment = require('moment');
var vumigo = require('vumigo_v02');
var Q = require('q');
var Choice = vumigo.states.Choice;
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

    get_tomorrow: function(config) {
        var today = go.utils.get_today(config);
        var moment_tomorrow = moment(today).add(1, 'days');
        return moment_tomorrow.format('YYYY-MM-DD');
    },

    is_weekend: function(config) {
        var today = go.utils.get_today(config);
        var moment_today = moment.utc(today);
        return moment_today.format('dddd') === 'Saturday' ||
          moment_today.format('dddd') === 'Sunday';
    },

    is_public_holiday: function(config) {
        var today = go.utils.get_today(config);
        var moment_today = moment.utc(today);
        var date_as_string = moment_today.format('YYYY-MM-DD');
        return _.contains(config.public_holidays, date_as_string);
    },

    is_out_of_hours: function(config) {
        var today = go.utils.get_today(config);
        var moment_today = moment.utc(today);
        // get business hours from config, -2 for utc to local time conversion
        var opening_time = Math.min.apply(null, config.helpdesk_hours) - 2;
        var closing_time = Math.max.apply(null, config.helpdesk_hours) - 2;
        return (moment_today.hour() < opening_time || moment_today.hour() >= closing_time);
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
        if (!moment(id.slice(0,6), 'YYMMDD', true).isValid()) {
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

    is_valid_date: function(date, format) {
        // implements strict validation with 'true' below
        return moment(date, format, true).isValid();
    },

    get_entered_due_date: function(month, day, config) {
        var year = go.utils.get_due_year_from_month(month, go.utils.get_today(config));
        return (year +'-'+ month +'-'+ go.utils.double_digit_day(day));
    },

    get_entered_birth_date: function(year, month, day) {
      return year +'-'+ month +'-'+ go.utils.double_digit_day(day);
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

    normalize_msisdn: function(raw, country_code) {
        // don't touch shortcodes
        if (raw.length <= 5) {
            return raw;
        }
        // remove chars that are not numbers or +
        raw = raw.replace(/[^0-9+]/g);
        if (raw.substr(0,2) === '00') {
            return '+' + raw.substr(2);
        }
        if (raw.substr(0,1) === '0') {
            return '+' + country_code + raw.substr(1);
        }
        if (raw.substr(0,1) === '+') {
            return raw;
        }
        if (raw.substr(0, country_code.length) === country_code) {
            return '+' + raw;
        }
        return raw;
    },

    incr_user_extra: function(data_to_increment, amount_to_increment) {
        if (_.isUndefined(data_to_increment)) {
            new_data_amount = 1;
        } else {
            new_data_amount = parseInt(data_to_increment, 10) + amount_to_increment;
        }
        return new_data_amount.toString();
    },

    get_timestamp: function() {
        return moment().format("YYYYMMDDHHmmss");
    },

    get_subscription_type: function(type){
      var types = {
        "optout": 4,
        "babyloss": 5,
        "servicerating": 6,
        "nurse_optout": 8
      };
      return types[type];
    },

    get_swt: function(im) {
        if (im.config.name.substring(0,9) === "nurse_sms") {
            return 4;  // swt = 4 for nurse sms optout
        } else if (im.config.name.substring(0,10) === "nurse_ussd") {
            return 3;  // swt = 3 for nurse ussd optout
        } else if (im.config.name.substring(0,10) === "smsinbound") {
            return 2;  // swt = 2 for sms optout
        } else {
            return 1;  // swt = 1 for ussd optout
        }
    },

    get_faccode: function(contact) {
        return contact.extra.clinic_code || null;
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
            var percentage_incomplete = parseFloat(((no_incomplete / total_attempted) * 100).toFixed(2));
            var percentage_complete = parseFloat(((no_complete / total_attempted) * 100).toFixed(2));
            return Q.all([
                im.metrics.fire.last([metric_prefix, 'percent_incomplete_registrations'].join('.'), percentage_incomplete),
                im.metrics.fire.last([metric_prefix, 'percent_complete_registrations'].join('.'), percentage_complete)
            ]);
        });
    },

    incr_kv_conversions: function(im, contact, env) {
        var is_reg_by = contact.extra.is_registered_by;
        if (is_reg_by === 'personal' || is_reg_by === 'chw') {
            return go.utils.incr_kv(im, [env, is_reg_by, 'conversions_to_clinic'].join('.'));
        }
    },

    adjust_conversion_rates: function(im, env) {
        return Q.all([
            go.utils.get_kv(im, [env, 'personal', 'conversion_registrations'].join('.'), 0),
            go.utils.get_kv(im, [env, 'chw', 'conversion_registrations'].join('.'), 0),
            go.utils.get_kv(im, [env, 'personal', 'conversions_to_clinic'].join('.'), 0),
            go.utils.get_kv(im, [env, 'chw', 'conversions_to_clinic'].join('.'), 0)
        ]).spread(function(personal_regs, chw_regs, personal_convs, chw_convs) {
            if (personal_regs > 0 && chw_regs > 0) {
                var personal_conv_rate = parseFloat(((personal_convs / personal_regs) * 100).toFixed(2));
                var chw_conv_rate = parseFloat(((chw_convs / chw_regs) * 100).toFixed(2));
                return Q.all([
                    im.metrics.fire.last([env, 'personal', 'conversion_rate'].join('.'), personal_conv_rate),
                    im.metrics.fire.last([env, 'chw', 'conversion_rate'].join('.'), chw_conv_rate)
                ]);
            } else {
                return Q();
            }
        });
    },

    adjust_percentage_serviceratings: function(im, metric_prefix) {
        return Q.all([
            go.utils.get_kv(im, [im.config.metric_store, metric_prefix, 'sum', 'servicerating_start'].join('.'), 0),
            go.utils.get_kv(im, [im.config.metric_store, metric_prefix, 'sum', 'servicerating_success'].join('.'), 0)
        ]).spread(function(no_started, no_finished) {
            var percentage_complete = parseFloat(((no_finished / no_started) * 100).toFixed(2));
            var percentage_incomplete = 100 - percentage_complete;
            return Q.all([
                im.metrics.fire.last([metric_prefix, 'percent_incomplete_serviceratings'].join('.'), percentage_incomplete),
                im.metrics.fire.last([metric_prefix, 'percent_complete_serviceratings'].join('.'), percentage_complete)
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

    jembi_clinic_validate: function (im, clinic_code) {
        var params = {
            'criteria': 'code:' + clinic_code
        };
        return go.utils
            .jembi_json_api_call('get', params, null, 'facilityCheck', im);
    },

    validate_clinic_code: function(im, clinic_code) {
        if (!go.utils.check_valid_number(clinic_code) ||
            clinic_code.length !== 6) {
            return Q()
                .then(function() {
                    return false;
                });
        } else {
            return go.utils
                .jembi_clinic_validate(im, clinic_code)
                .then(function(json_result) {
                    var rows = JSON.parse(json_result.data).rows;
                    if (rows.length === 0) {
                        return false;
                    } else {
                        return rows[0][2];
                    }
                });
        }
    },

    is_alpha_numeric_only: function(input) {
        alpha_numeric = new RegExp('^[A-Za-z0-9]+$');
        return alpha_numeric.test(input);
    },

    get_servicerating_data: function(im) {
        var servicerating_data = [];
        for (var question in im.user.answers) {
            servicerating_data.push({
                "question": question,
                "answer": im.user.answers[question]
            });
        }
        return servicerating_data;
    },

    build_servicerating_json: function(im, contact, type) {
        var JSON_template = {
          "mha": 1,
          "swt": go.utils.get_swt(im),
          // "supplier_unique_id": servicerating_id,  // Marked as Optional in mini-scope and custom
                                                      // api doesn't provide an id so not submitting
          "dmsisdn": contact.msisdn,
          "cmsisdn": contact.msisdn,
          "type": go.utils.get_subscription_type(type),
          "faccode": go.utils.get_faccode(contact),
          "encdate": go.utils.get_timestamp(),
          "data": go.utils.get_servicerating_data(im)
        };
        return JSON_template;
    },

    jembi_send_servicerating: function(im, contact, metric_prefix, type) {
        var built_json = go.utils.build_servicerating_json(im, contact, type);
        return go.utils
            .jembi_json_api_call('post', null, built_json, 'serviceRating', im)
            .then(function(json_result) {
                var metric_name = [metric_prefix, "sum", "servicerating_to_jembi"].join('.');
                return go.utils.json_success_fail_metric(im, metric_name, json_result);
            });
    },

    get_patient_id: function(contact) {
        var formatter = {
            'sa_id': function () {
                return contact.extra.sa_id + '^^^ZAF^NI';
            },
            'passport': function () {
                return contact.extra.passport_no + '^^^' + contact.extra.passport_origin.toUpperCase() + '^PPN';
            },
            'none': function () {
                return contact.msisdn.replace('+', '') + '^^^ZAF^TEL';
            }
        }[contact.extra.id_type];
        return formatter();
    },

    get_nurse_id: function(contact) {
        var formatter = {
            'sa_id': function () {
                return contact.extra.nc_sa_id_no + '^^^ZAF^NI';
            },
            'passport': function () {
                return contact.extra.nc_passport_num + '^^^' + contact.extra.nc_passport_country.toUpperCase() + '^PPN';
            }
        }[contact.extra.nc_id_type];
        return formatter();
    },

    get_dob: function(contact) {
        if (!_.isUndefined(contact.extra.dob)) {
            return moment(contact.extra.dob, 'YYYY-MM-DD').format('YYYYMMDD');
        } else if (!_.isUndefined(contact.extra.nc_dob)) {
            return moment(contact.extra.nc_dob, 'YYYY-MM-DD').format('YYYYMMDD');
        } else {
            return null;
        }
    },

    get_optoutreason: function(contact) {
        var optoutreason_map = {
            "miscarriage": 1,
            "stillbirth": 2,
            "babyloss": 3,
            "not_useful": 4,
            "other": 5,
            "unknown": 6,
            "job_change": 7,
            "number_owner_change": 8
        };
        return optoutreason_map[contact.extra.opt_out_reason] || 6;
    },

    build_jembi_json: function(im, contact, user, type) {
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

    get_nurse_optoutreason: function(contact) {
        var optoutreason_map = {
            "miscarriage": 1,
            "stillbirth": 2,
            "babyloss": 3,
            "not_useful": 4,
            "other": 5,
            "unknown": 6,
            "job_change": 7,
            "number_owner_change": 8
        };
        return optoutreason_map[contact.extra.nc_opt_out_reason] || 6;
    },

    jembi_optout_send_json: function(contact, user, type, im, metric_prefix) {
        var built_json = go.utils.build_jembi_json(im, contact, user, type);
        return go.utils
            .jembi_json_api_call('post', null, built_json, 'optout', im)
            .then(function(json_result) {
                var metric_name = [metric_prefix, "sum", "optout_to_jembi"].join('.');
                return go.utils.json_success_fail_metric(im, metric_name, json_result);
        });
    },

    build_nurse_jembi_json: function(im, contact, user, type) {
        var JSON_template = {
            "mha": 1,
            "swt": go.utils.get_swt(im),
            "dmsisdn": user.msisdn,
            "cmsisdn": contact.msisdn,
            "type": go.utils.get_subscription_type(type),
            "encdate": go.utils.get_timestamp(),
            "faccode": contact.extra.nc_faccode || null,
            "dob": go.utils.get_dob(contact) || null,
            "id": go.utils.get_nurse_id(contact),
            "optoutreason": go.utils.get_nurse_optoutreason(contact)
        };
        return JSON_template;
    },

    jembi_nurse_optout_send_json: function(contact, user, type, im, metric_prefix) {
        var built_json = go.utils.build_nurse_jembi_json(im, contact, user, type);
        return go.utils
            .jembi_json_api_call('post', null, built_json, 'nc/optout', im);
    },

    jembi_babyloss_send_json: function(contact, user, type, im, metric_prefix) {
        var built_json = go.utils.build_jembi_json(im, contact, user, type);
        return go.utils
            .jembi_json_api_call('post', null, built_json, 'subscription', im)
            .then(function(json_result) {
                var metric_name = [metric_prefix, "sum", "babyloss_to_jembi"].join('.');
                return go.utils.json_success_fail_metric(im, metric_name, json_result);
        });
    },

    json_success_fail_metric: function(im, metric_name, json_result) {
        var metric_to_fire = json_result.code >= 200 && json_result.code < 300
            ? metric_name + '_success'
            : metric_name + '_fail';
        return im.metrics.fire.inc(metric_to_fire, {amount: 1});
    },

    jembi_json_api_call: function(method, params, payload, endpoint, im) {
        var http = new HttpApi(im, {
            auth: {
                username: im.config.jembi.username,
                password: im.config.jembi.password
            },
            headers: {
                'Content-Type': ['application/json']
            }
        });
        switch(method) {
            case "post":
                return http.post(im.config.jembi.url_json + endpoint, {
                    data: JSON.stringify(payload)
                });
            case "get":
                return http.get(im.config.jembi.url_json + endpoint, {
                    params: params
                });
        }
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
          case "patch":
            return http.patch(im.config.control.url + endpoint, {
                data: JSON.stringify(payload)
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

    control_v2_api_call: function (method, params, payload, endpoint, im) {
        var http = new JsonApi(im, {
            headers: {
                'Authorization': ['Token ' + im.config.control_v2.api_token]
            }
        });
        switch (method) {
            case "post":
                return http.post(im.config.control_v2.url + endpoint, {
                    data: payload
                });
            case "get":
                return http.get(im.config.control_v2.url + endpoint, {
                    params: params
                });
            case "patch":
                return http.patch(im.config.control_v2.url + endpoint, {
                    data: payload
                });
            case "put":
                return http.put(im.config.control_v2.url + endpoint, {
                    params: params,
                  data: payload
                });
            case "delete":
                return http.delete(im.config.control_v2.url + endpoint);
            }
    },

    subscription_type_and_rate: function(contact, im) {
        // Returns the subscription type, rate and start point
        // for loss and baby message subscriptions
        var response = {
            sub_type: null,
            sub_rate: null,
            sub_seq_start: 1
        };
        if (im.config.name.substring(0,6) == "optout") {
            response.sub_type = im.config.subscription[im.user.answers.states_start];
            response.sub_rate = im.config.rate.two_per_week;
        } else if (im.config.name.substring(0,10) == "smsinbound") {
            response.sub_type = im.config.subscription.baby1;
            response.sub_rate = im.config.rate.two_per_week;
        }
        return response;
    },

    get_edd: function(im, contact) {
        // Return estimated due date YYYY-MM-DD, default to null if unknown
        if (!_.isUndefined(contact.extra.due_date_month) &&
            !_.isUndefined(contact.extra.due_date_day)) {
            var day = contact.extra.due_date_day;
            var month = contact.extra.due_date_month;
            var year = go.utils.get_due_year_from_month(month, go.utils.get_today(im.config));
            return [year, month, day].join('-');
        } else {
            return null;
        }
    },

    get_identification_no: function(contact) {
        if (contact.extra.id_type === 'sa_id') {
            return contact.extra.sa_id;
        } else if (contact.extra.id_type === 'passport') {
            return contact.extra.passport_no;
        } else {
            return null;
        }
    },

    get_hcw_no: function(device_msisdn, contact_msisdn) {
        var n_device_msisdn = go.utils.normalize_msisdn(device_msisdn, '27');
        var n_contact_msisdn = go.utils.normalize_msisdn(contact_msisdn, '27');
        if (n_device_msisdn === n_contact_msisdn) {
            return null;
        } else {
            return n_device_msisdn;
        }
    },

    get_passport_origin: function(id_type, passport_origin) {
        if (id_type === 'passport') {
            return passport_origin;
        } else {
            return null;
        }
    },

    post_registration: function(device_msisdn, contact, im, reg_type) {
        var payload = {
            hcw_msisdn: go.utils.get_hcw_no(device_msisdn, contact.msisdn),  // +27...
            mom_msisdn: go.utils.normalize_msisdn(contact.msisdn, '27'),  // +27...
            mom_id_type: contact.extra.id_type,  // 'sa_id' | 'passport' | 'none'
            mom_passport_origin: go.utils.get_passport_origin(
                contact.extra.id_type, contact.extra.passport_origin),
            mom_lang: contact.extra.language_choice,  // 'en' | 'af' | 'xh' ...
            mom_edd: go.utils.get_edd(im, contact),  // 'YYYY-MM-DD' | null
            mom_id_no: go.utils.get_identification_no(contact),
            mom_dob: contact.extra.dob || null,  // 'YYYY-MM-DD' | null
            clinic_code: contact.extra.clinic_code || null,
            authority: reg_type,  // 'clinic' | 'chw' | 'personal'
        };
        return go.utils
            .control_v2_api_call("post", null, payload, 'registrations/', im)
            .then(function(post_response) {
                return go.utils.json_success_fail_metric(im, 'registration_call', post_response);
            });
    },

    post_nursereg: function(im, contact, dmsisdn, rmsisdn) {
        var payload = {
            cmsisdn: go.utils.normalize_msisdn(contact.msisdn, '27'),  // +27...
            dmsisdn: go.utils.normalize_msisdn(dmsisdn, '27'),  // +27...
            faccode: contact.extra.nc_faccode,
            id_type: contact.extra.nc_id_type,
            dob: contact.extra.nc_dob,
            sanc_reg_no: contact.extra.nc_sanc || null,
            persal_no: contact.extra.nc_persal || null
        };
        if (contact.extra.nc_id_type === 'sa_id') {
            payload.id_no = contact.extra.nc_sa_id_no;
        } else {
            payload.id_no = contact.extra.nc_passport_num;
            payload.passport_origin = contact.extra.nc_passport_country;
        }
        if (rmsisdn) {
            payload.rmsisdn = rmsisdn;
        }
        return go.utils
            .control_v2_api_call("post", null, payload, 'nurseregs/', im);
    },

    post_subscription: function(contact, im, metric_prefix, env, opts) {
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
                if (doc_result.code >= 200 && doc_result.code < 300){
                    return Q.all([
                        im.metrics.fire.inc([metric_prefix, "sum", "subscription_to_protocol_success"].join('.'), {amount:1}),
                        im.metrics.fire.inc([env, "sum", "subscriptions"].join('.'), {amount:1})
                    ]);
                } else {
                    //TODO - implement proper fail issue #36
                    return im.metrics.fire.inc([metric_prefix, "sum", "subscription_to_protocol_fail"].join('.'), {amount:1});
                }
        });
    },

    get_subscriptions_by_msisdn: function(msisdn, im) {
        var params = {
            to_addr: msisdn
        };
        return go.utils
            .control_api_call("get", params, null, 'subscription/', im)
            .then(function(result) {
                return JSON.parse(result.data);
            });
    },

    subscription_unsubscribe_all: function(contact, im) {
        return go.utils
            .get_subscriptions_by_msisdn(contact.msisdn, im)
            .then(function(update) {
                var clean = true;  // clean tracks if api call is unnecessary
                for (i=0;i<update.objects.length;i++) {
                    if (update.objects[i].active === true){
                        update.objects[i].active = false;
                        clean = false;
                    }
                }
                if (!clean) {
                    return go.utils.control_api_call("patch", {}, update, 'subscription/', im);
                } else {
                    return Q();
                }
        });
    },

    get_nursereg_by_id: function(nursereg_id, im) {
        return go.utils
            .control_v2_api_call("get", null, null,
                'nurseregistrations/' + nursereg_id + '/', im)
            .then(function(get_response) {
                return get_response.data;
            });
    },

    patch_last_reg: function(contact, im, optout_reason) {
        return go.utils
            .get_nursereg_by_id(contact.extra.nc_last_reg_id, im)
            .then(function(nursereg) {
                nursereg.opted_out = true;
                nursereg.optout_count += 1;
                nursereg.optout_reason = optout_reason;
                return go.utils.control_v2_api_call("patch", null, nursereg,
                    'nurseregistrations/' + contact.extra.nc_last_reg_id + '/',
                    im);
            });
    },

    subscription_count_active: function(contact, im) {
        // This function is used in the public line to determine routing
        // depending on whether users have an active subscription
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

    support_log_ticket: function(message, contact, im, metric_prefix) {
        var payload = {
          conversation: "/api/v1/snappybouncer/conversation/key/" + im.config.snappybouncer.conversation + "/",
          message: message,
          contact_key: contact.key,
          msisdn: contact.msisdn,
          faccode: parseInt(contact.extra.clinic_code, 10) || null
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

    get_reg_source: function(contact) {
        var reg_source;
        var reg_options = ['clinic', 'chw', 'personal'];
        if (!_.contains(reg_options, contact.extra.is_registered_by)) {
            reg_source = 'unknown';
        } else {
            reg_source = contact.extra.is_registered_by;
        }
        return reg_source;
    },

    adjust_percentage_optouts: function(im, env) {
        var m_store = im.config.metric_store;
        return Q.all([
            go.utils.get_kv(im, [m_store, env, 'sum', 'subscriptions'].join('.'), 0),
            go.utils.get_kv(im, [m_store, env, 'sum', 'optouts'].join('.'), 0),
            go.utils.get_kv(im, [m_store, env, 'sum', 'optout_cause', 'non_loss'].join('.'), 0),
            go.utils.get_kv(im, [m_store, env, 'sum', 'optout_cause', 'loss'].join('.'), 0),
            go.utils.get_kv(im, [m_store, env, 'optout', 'sum', 'subscription_to_protocol_success'].join('.'), 0)
        ]).spread(function(total_subscriptions, total_optouts, non_loss_optouts, loss_optouts, loss_msg_signups) {
            var percentage_optouts = parseFloat(((total_optouts/total_subscriptions)*100).toFixed(2));
            var percentage_non_loss_optouts = parseFloat(((non_loss_optouts / total_subscriptions) * 100).toFixed(2));
            var percentage_loss_msg_signups = parseFloat(((loss_msg_signups / loss_optouts) * 100).toFixed(2));
            return Q.all([
                im.metrics.fire.last([env, 'percent', 'optout', 'all'].join('.'), percentage_optouts),
                im.metrics.fire.last([env, 'percent', 'optout', 'non_loss'].join('.'), percentage_non_loss_optouts),
                im.metrics.fire.last([env, 'percent', 'optout', 'loss', 'msgs'].join('.'), percentage_loss_msg_signups)
            ]);
        });
    },

    loss_message_opt_in: function(im, contact, metric_prefix, env, opts) {
        return Q.all([
            // ensure user is not opted out
            go.utils.opt_in(im, contact),
            // activate new subscription
            go.utils.post_subscription(contact, im, metric_prefix, env, opts),
            // send new subscription info to jembi
            go.utils.jembi_babyloss_send_json(contact, contact, 'babyloss', im, metric_prefix)
        ]);
    },

    opt_out: function(im, contact, optout_reason, api_optout, unsub_all, jembi_optout,
                      metric_prefix, env) {
        var queue1 = [];
        var prior_opt_out_reason;

        // Start Queue 1
        if (optout_reason !== undefined) {
            prior_opt_out_reason = contact.extra.opt_out_reason || 'unknown';
              // if reason was not previously saved it should be 'unknown' (from smsinbound)
            contact.extra.opt_out_reason = optout_reason;
            queue1.push(function() {
                return im.contacts.save(contact);
            });
        }
        // End Queue 1

        return Q
            .all(queue1.map(Q.try))
            .then(function() {
                return go.utils
                    .opted_out(im, contact)
                    .then(function(opted_out) {
                        // if the contact is not opted out, opt them out OR
                        // if the contact has opted out, but has an opted-out reason 'unknown'
                        // (through SMSing STOP) but is now dialing in to opt-out line and
                        // supplying a reason for their optout, opt them out again
                        if (opted_out === false || (prior_opt_out_reason === 'unknown'
                          && im.config.name.substring(0,6) === "optout")) {
                            var queue2 = [];

                            // Start Queue 2
                            if (api_optout === true) {
                                // vumi optout
                                queue2.push(function() {
                                    return im.api_request('optout.optout', {
                                        address_type: "msisdn",
                                        address_value: contact.msisdn,
                                        message_id: im.msg.message_id
                                    });
                                });
                            }

                            if (unsub_all === true) {
                                // deactivate all subscriptions
                                queue2.push(function() {
                                    return go.utils.subscription_unsubscribe_all(contact, im);
                                });
                            }

                            if (jembi_optout === true) {
                                // send optout to jembi
                                queue2.push(function() {
                                    return go.utils.jembi_optout_send_json(contact, contact,
                                      'optout', im, metric_prefix);
                                });

                                // fire opt-out registration source metric
                                var reg_source = go.utils.get_reg_source(contact);
                                queue2.push(function() {
                                    return im.metrics.fire.inc([env, 'sum', 'optout_on',
                                      reg_source].join('.'), {amount: 1});
                                });

                                // fire sum of all opt-outs metric
                                queue2.push(function() {
                                    return im.metrics.fire.inc([env, 'sum', 'optouts'].join('.'),
                                      {amount: 1});
                                });

                                // fire loss / non-loss metric
                                var loss_causes = ['miscarriage', 'babyloss', 'stillbirth'];
                                if (_.contains(loss_causes, contact.extra.opt_out_reason)) {
                                    queue2.push(function() {
                                        return im.metrics.fire.inc([env, 'sum', 'optout_cause',
                                          'loss'].join('.'), {amount: 1});
                                    });
                                } else {
                                    queue2.push(function() {
                                        return im.metrics.fire.inc([env, 'sum', 'optout_cause',
                                          'non_loss'].join('.'), {amount: 1});
                                    });
                                }

                                // fire cause metric
                                queue2.push(function() {
                                    return im.metrics.fire.inc([env, 'sum', 'optout_cause',
                                      optout_reason].join('.'), {amount: 1});
                                });

                            }
                            // End Queue 2

                            return Q
                                .all(queue2.map(Q.try))
                                .then(function() {
                                    return go.utils.adjust_percentage_optouts(im, env);
                                });
                        } else {
                            return Q();
                        }
                    });
            });
    },

    nurse_optout: function(im, contact, optout_reason, api_optout, unsub_all, jembi_optout,
                      patch_last_reg, metric_prefix, env) {
        var queue1 = [];
        var prior_opt_out_reason;

        // Start Queue 1
        if (optout_reason !== undefined) {
            prior_opt_out_reason = contact.extra.nc_opt_out_reason || 'unknown';
              // if reason was not previously saved it should be 'unknown' (from smsinbound)
            contact.extra.nc_opt_out_reason = optout_reason;
            queue1.push(function() {
                return im.contacts.save(contact);
            });
        }
        // End Queue 1

        return Q
            .all(queue1.map(Q.try))
            .then(function() {
                return go.utils
                    .opted_out(im, contact)
                    .then(function(opted_out) {
                        // if the contact is not opted out, opt them out OR
                        // if the contact has opted out, but has an opted-out reason 'unknown'
                        // (through SMSing STOP) but is now dialing in to opt-out line and
                        // supplying a reason for their optout, opt them out again
                        if (opted_out === false || (prior_opt_out_reason === 'unknown'
                          && im.config.name.substring(0,10) === "nurse_ussd")) {
                            var queue2 = [];

                            // Start Queue 2
                            if (api_optout === true) {
                                // vumi optout
                                queue2.push(function() {
                                    return im.api_request('optout.optout', {
                                        address_type: "msisdn",
                                        address_value: contact.msisdn,
                                        message_id: im.msg.message_id
                                    });
                                });
                            }

                            if (unsub_all === true) {
                                // deactivate all subscriptions
                                queue2.push(function() {
                                    return go.utils.subscription_unsubscribe_all(contact, im);
                                });
                            }

                            if (jembi_optout === true) {
                                // send optout to jembi
                                queue2.push(function() {
                                    return go.utils.jembi_nurse_optout_send_json(contact, contact,
                                      'nurse_optout', im, metric_prefix);
                                });
                            }

                            if (patch_last_reg === true) {
                                // patch last registration to show opted out
                                queue2.push(function() {
                                    return go.utils.patch_last_reg(contact, im, optout_reason);
                                });
                            }
                            // End Queue 2

                            return Q
                                .all(queue2.map(Q.try));
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

    nurse_opt_in: function(im, contact) {
        contact.extra.nc_opt_out_reason = '';
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
    var moment = require('moment');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;

    var GoNDOH = App.extend(function(self) {
        App.call(self, 'isl_route');
        var $ = self.$;
        var interrupt = true;

        self.init = function() {
            self.env = self.im.config.env;
            self.metric_prefix = [self.env, self.im.config.name].join('.');
            self.store_name = [self.env, self.im.config.name].join('.');

            go.utils.attach_session_length_helper(self.im);

            self.im.on('session:close', function(e) {
                return self.dial_back(e);
            });

            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                    if ((!_.isUndefined(user_contact.extra.nc_working_on))
                        && (user_contact.extra.nc_working_on !== "")) {
                        self.user = user_contact;
                        return self.im.contacts
                            .get(user_contact.extra.nc_working_on, {create: true})
                            .then(function(working_on){
                                self.contact = working_on;
                            });
                    } else {
                        self.user = user_contact;
                        self.contact = user_contact;
                    }
                });
        };


    // DIALBACK SMS HANDLING

        self.should_send_dialback = function(e) {
            return e.user_terminated
                && !go.utils.is_true(self.contact.extra.nc_redial_sms_sent);
        };

        self.send_dialback = function() {
            return self.im.outbound
                .send_to_user({
                    endpoint: 'sms',
                    content: self.get_finish_reg_sms()
                })
                .then(function() {
                    self.contact.extra.nc_redial_sms_sent = 'true';
                    return self.im.contacts.save(self.contact);
                });
        };

        self.dial_back = function(e) {
            if (!self.should_send_dialback(e)) { return; }
            return self.send_dialback();
        };

        self.get_finish_reg_sms = function() {
            return $("Please dial back in to {{channel}} to complete the NurseConnect registration.")
                .context({
                    channel: self.im.config.channel
                });
        };


    // REGISTRATION FINISHED SMS HANDLING

        self.send_registration_thanks = function() {
            return self.im.outbound.send({
                to: self.contact,
                endpoint: 'sms',
                lang: self.contact.extra.nc_language_choice,
                content: $("Welcome to NurseConnect. For more options or to " +
                           "opt out, dial {{channel}}.")
                    .context({channel: self.im.config.channel})
            });
        };


    // TIMEOUT HANDLING

        // determine whether timed_out state should be used
        self.timed_out = function() {
            var no_redirects = [
                'st_subscribed',
                'st_not_subscribed',
                'st_end_detail_changed',
                'st_end_reg',
                'st_block_active_subs',
            ];
            return self.im.msg.session_event === 'new'
                && self.im.user.state.name
                && no_redirects.indexOf(self.im.user.state.name) === -1;
        };

        // override normal state adding
        self.add = function(name, creator) {
            self.states.add(name, function(name, opts) {
                if (!interrupt || !self.timed_out(self.im))
                    return creator(name, opts);

                interrupt = false;
                var timeout_opts = opts || {};
                timeout_opts.name = name;
                return self.states.create('st_timed_out', timeout_opts);
            });
        };

        // timeout state
        self.states.add('st_timed_out', function(name, creator_opts) {
            var readable_no = go.utils.readable_sa_msisdn(self.contact.msisdn);

            return new ChoiceState(name, {
                question: $("Welcome to NurseConnect. Would you like to continue your previous session for {{num}}?")
                    .context({ num: readable_no }),

                choices: [
                    new Choice(creator_opts.name, $('Yes')),
                    new Choice('isl_route', $('Start Over'))
                ],

                next: function(choice) {
                    if (choice.value === 'isl_route') {
                        self.user.extra.nc_working_on = "";
                        return self.im.contacts
                            .save(self.user)
                            .then(function() {
                                return 'isl_route';
                            });
                    } else {
                        return Q()
                            // self.fire_incomplete(creator_opts.name, -1)
                            .then(function() {
                                return {
                                    name: choice.value,
                                    creator_opts: creator_opts
                                };
                            });
                    }
                }
            });
        });


    // DELEGATOR START STATE

        self.add('isl_route', function(name) {
            // reset working_on extra
            self.user.extra.nc_working_on = "";
            return self.im.contacts
                .save(self.user)
                .then(function() {
                    if (self.contact.extra.nc_is_registered === 'true') {
                        return self.states.create('st_subscribed');
                    } else {
                        return self.states.create('st_not_subscribed');
                    }
                });
        });


    // INITIAL STATES

        self.add('st_subscribed', function(name) {
            return new ChoiceState(name, {
                question: $("Welcome to NurseConnect"),
                choices: [
                    new Choice('st_subscribe_other', $('Subscribe a friend')),
                    new Choice('st_change_num', $('Change your no.')),
                    new Choice('st_change_faccode', $('Change facility code')),
                    new Choice('st_change_sanc', $('Change SANC no.')),
                    new Choice('st_change_persal', $('Change Persal no.')),
                    new Choice('isl_check_optout_optout', $('Stop SMS')),
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_not_subscribed', function(name) {
            return new ChoiceState(name, {
                question: $("Welcome to NurseConnect. Do you want to:"),
                choices: [
                    new Choice('st_subscribe_self', $("Subscribe for the first time")),
                    new Choice('st_change_old_nr', $('Change your old number')),
                    new Choice('st_subscribe_other', $('Subscribe somebody else'))
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });


    // CHANGE STATES

        self.add('st_change_faccode', function(name) {
            var question = $("Please enter the 6-digit facility code for your new facility, e.g. 456789:");
            var error = $("Sorry, that code is not recognized. Please enter the 6-digit facility code again, e. 535970:");
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    return go.utils
                        .validate_clinic_code(self.im, content)
                        .then(function(facname) {
                            if (!facname) {
                                return error;
                            } else {
                                self.contact.extra.nc_facname = facname;
                                self.contact.extra.nc_faccode = content;
                                return self.im.contacts
                                    .save(self.contact)
                                    .then(function() {
                                        return null;  // vumi expects null or undefined if check passes
                                    });
                            }
                        });
                },
                next: 'isl_post_change_detail'
            });
        });

        self.add('st_change_sanc', function(name) {
            var question = $("Please enter your 8-digit SANC registration number, e.g. 34567899:");
            var error = $("Sorry, the format of the SANC registration number is not correct. Please enter it again, e.g. 34567899:");
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.check_valid_number(content)
                        || content.length !== 8) {
                        return error;
                    } else {
                        return null;
                    }
                },
                next: function(content) {
                    self.contact.extra.nc_sanc = content;
                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return 'isl_post_change_detail';
                        });
                }
            });
        });

        self.add('st_change_persal', function(name) {
            var question = $("Please enter your 8-digit Persal employee number, e.g. 11118888:");
            var error = $("Sorry, the format of the Persal employee number is not correct. Please enter it again, e.g. 11118888:");
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.check_valid_number(content)
                        || content.length !== 8) {
                        return error;
                    } else {
                        return null;
                    }
                },
                next: function(content) {
                    self.contact.extra.nc_persal = content;
                    return self.im.contacts
                        .save(self.contact)
                        .then(function() {
                            return 'isl_post_change_detail';
                        });
                }
            });
        });

        self.add('isl_post_change_detail', function() {
            return go.utils
                .post_nursereg(self.im, self.contact, self.contact.msisdn, null)  // dmsisdn = cmsisdn for det changed
                .then(function(response) {
                    return self.states.create('st_end_detail_changed');
                });
        });

        self.add('st_end_detail_changed', function(name) {
            return new EndState(name, {
                text: $("Thank you. Your NurseConnect details have been changed. To change any other details, please dial {{channel}} again.")
                    .context({channel: self.im.config.channel}),
                next: 'isl_route',
            });
        });

        self.add('st_change_num', function(name) {
            var question = $("Please enter the new number on which you want to receive messages, e.g. 0736252020:");
            var error = $("Sorry, the format of the mobile number is not correct. Please enter the new number on which you want to receive messages, e.g. 0736252020");
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.check_valid_phone_number(content)) {
                        return error;
                    }
                },
                next: function(content) {
                    return 'isl_check_optout_change';
                }
            });
        });

        self.add('isl_check_optout_change', function(name) {
            return go.utils
                .opted_out_by_msisdn(self.im, go.utils.normalize_msisdn(
                    self.im.user.answers.st_change_num, '27'))
                .then(function(opted_out) {
                    if (opted_out === true) {
                        return self.states.create('st_opt_in_change');
                    } else {
                        return self.states.create('isl_check_active_subs');
                    }
                });
        });

        self.add('isl_check_active_subs', function(name) {
            return go.utils
                .get_subscriptions_by_msisdn(go.utils.normalize_msisdn(
                    self.im.user.answers.st_change_num, '27'), self.im)
                .then(function(subs) {
                    var active_subs = 0;
                    for (i=0; i<subs.objects.length; i++) {
                        if (subs.objects[i].active === true) {
                            active_subs += 1;
                        }
                    }
                    if (active_subs === 0) {
                        return self.states.create('isl_switch_new_nr');
                    } else {
                        return self.states.create('st_block_active_subs');
                    }
                });
        });

        self.add('st_block_active_subs', function(name) {
            return new EndState(name, {
                text: $("Sorry, the number you are trying to move to already has an active registration. To manage that registration, please redial from that number."),
                next: 'isl_route',
            });
        });

        self.add('isl_switch_new_nr', function(name) {
            // load new contact
            return self.im.contacts
                .get(go.utils.normalize_msisdn(
                    self.im.user.answers.st_change_num, '27'), {create: true})  // false raises exception
                .then(function(new_contact) {
                    // transfer the old extras to the new contact
                    new_contact.extra = self.contact.extra;
                    // clean up old contact
                    self.contact.extra = {};
                    // save the contacts and post nursereg
                    return Q.all([
                        self.im.contacts.save(self.contact),
                        self.im.contacts.save(new_contact),
                        go.utils.post_nursereg(self.im, new_contact, self.contact.msisdn, self.contact.msisdn),
                    ])
                    .then(function() {
                        return self.states.create('st_end_detail_changed');
                    });
                });
        });

        self.add('st_opt_in_change', function(name) {
            return new ChoiceState(name, {
                question: $("This number opted out of NurseConnect messages before. Please confirm that you want to receive messages again on this number?"),
                choices: [
                    new Choice('yes', $('Yes')),
                    new Choice('no', $('No'))
                ],
                next: function(choice) {
                    if (choice.value === 'yes') {
                        return self.im.contacts
                            .get(go.utils.normalize_msisdn(
                                self.im.user.answers.st_change_num, '27'), {create: true})  // false raises exception
                            .then(function(new_contact) {
                                return go.utils
                                    .nurse_opt_in(self.im, new_contact)
                                    .then(function() {
                                        return 'isl_switch_new_nr';
                                    });
                            });
                    } else {
                        return 'st_permission_denied';
                    }
                }
            });
        });

        self.add('st_change_old_nr', function(name) {
            var question = $("Please enter the old number on which you used to receive messages, e.g. 0736436265:");
            var error = $("Sorry, the format of the mobile number is not correct. Please enter your old mobile number again, e.g. 0726252020");
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.check_valid_phone_number(content)) {
                        return error;
                    }
                },
                next: function(content) {
                    return self.im.contacts
                        .get(go.utils.normalize_msisdn(content, '27'), {create: true})  // false raises exception
                        .then(function(contact) {
                            if (contact.extra.nc_is_registered === "true") {
                                return {
                                    name: 'isl_change_old_nr',
                                    creator_opts: {contact: contact}
                                };
                            } else {
                                return 'st_change_old_not_found';
                            }
                        });
                }
            });
        });

        self.add('st_change_old_not_found', function(name) {
            return new ChoiceState(name, {
                question: $("The number {{msisdn}} is not currently subscribed to receive NurseConnect messages. Try again?")
                    .context({msisdn: self.im.user.answers.st_change_old_nr}),
                choices: [
                    new Choice('st_change_old_nr', $('Yes')),
                    new Choice('st_permission_denied', $('No')),
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('isl_change_old_nr', function(name, opts) {
            // transfer the old extras to the new contact
            self.contact.extra = opts.contact.extra;
            // clean up old contact
            opts.contact.extra = {};
            // save the contacts and post nursereg
            return Q.all([
                self.im.contacts.save(self.contact),
                self.im.contacts.save(opts.contact),
                go.utils.post_nursereg(self.im, self.contact, self.contact.msisdn, opts.contact.msisdn),
            ])
            .then(function() {
                return self.states.create('st_end_detail_changed');
            });
        });

        self.add('isl_check_optout_optout', function(name) {
            return go.utils
                .opted_out(self.im, self.contact)
                .then(function(opted_out) {
                    return self.states.create(
                        'st_optout', {opted_out: opted_out}
                    );
                });
        });

        self.add('st_optout', function(name, opts) {
            var question = opts.opted_out === false
                ? $("Please tell us why you no longer want messages:")
                : $("You have opted out before. Please tell us why:");
            return new ChoiceState(name, {
                question: question,
                choices: [
                    new Choice('job_change', $('Not a nurse or midwife')),
                    new Choice('number_owner_change', $('New user of number')),
                    new Choice('not_useful', $("Messages not useful")),
                    new Choice('other', $("Other")),
                    new Choice('main_menu', $("Main menu"))
                ],
                next: function(choice) {
                    if (choice.value === 'main_menu') {
                        return 'isl_route';
                    } else {
                        return go.utils
                            .nurse_optout(
                                self.im, self.contact,
                                optout_reason=choice.value,
                                api_optout=true,
                                unsub_all=true,
                                jembi_optout=true,
                                patch_last_reg=true,
                                self.metric_prefix,
                                self.env
                            )
                            .then(function() {
                                return 'st_end_detail_changed';
                            });
                    }
                }
            });
        });


    // REGISTRATION STATES

        self.add('st_subscribe_self', function(name) {
            return new ChoiceState(name, {
                question: $("To register we need to collect, store & use your info. You may also get messages on public holidays & weekends. Do you consent?"),
                choices: [
                    new Choice('isl_check_optout_reg', $('Yes')),
                    new Choice('st_permission_denied', $('No')),
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_subscribe_other', function(name) {
            return new ChoiceState(name, {
                question: $("We need to collect, store & use your friend's info. She may get messages on public holidays & weekends. Does she consent?"),
                choices: [
                    new Choice('st_msisdn', $('Yes')),
                    new Choice('st_permission_denied', $('No')),
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_permission_denied', function(name) {
            return new ChoiceState(name, {
                question: $("You have chosen not to receive NurseConnect SMSs on this number and so cannot complete registration."),
                choices: [
                    new Choice('isl_route', $('Main Menu'))
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_msisdn', function(name) {
            var error = $("Sorry, the format of the mobile number is not correct. Please enter the mobile number again, e.g. 0726252020");
            var question = $("Please enter the number you would like to register, e.g. 0726252020:");
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.check_valid_phone_number(content)) {
                        return error;
                    }
                },
                next: function(content) {
                    msisdn = go.utils.normalize_msisdn(content, '27');
                    self.user.extra.nc_working_on = msisdn;
                    return self.im.contacts
                        .save(self.user)
                        .then(function() {
                            return 'isl_reload_contact';
                        });
                }
            });
        });

        self.add('isl_reload_contact', function(name) {
            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                    return self.im.contacts
                        .get(user_contact.extra.nc_working_on, {create: true})
                        .then(function(working_on){
                            self.contact = working_on;
                        });
                })
                .then(function() {
                    return self.states.create('isl_check_optout_reg');
                });
        });

        self.add('isl_check_optout_reg', function(name) {
            return go.utils
                .opted_out(self.im, self.contact)
                .then(function(opted_out) {
                    if (opted_out === true) {
                        return self.states.create('st_opt_in_reg');
                    } else {
                        return self.states.create('st_faccode');
                    }
                });
        });

        self.add('st_opt_in_reg', function(name) {
            return new ChoiceState(name, {
                question: $("This number previously opted out of NurseConnect messages. Please confirm that you would like to register this number again?"),
                choices: [
                    new Choice('yes', $('Yes')),
                    new Choice('no', $('No'))
                ],
                next: function(choice) {
                    if (choice.value === 'yes') {
                        return go.utils
                            .nurse_opt_in(self.im, self.contact)
                            .then(function() {
                                return 'st_faccode';
                            });
                    } else {
                        return 'st_permission_denied';
                    }
                }
            });
        });

        self.add('st_faccode', function(name) {
            var owner = self.user.extra.nc_working_on === "" ? 'your' : 'their';
            var error = $("Sorry, that code is not recognized. Please enter the 6-digit facility code again, e. 535970:");
            var question = $("Please enter {{owner}} 6-digit facility code:")
                .context({owner: owner});
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    return go.utils
                        .validate_clinic_code(self.im, content)
                        .then(function(facname) {
                            if (!facname) {
                                return error;
                            } else {
                                self.contact.extra.nc_facname = facname;
                                self.contact.extra.nc_faccode = content;
                                return self.im.contacts
                                    .save(self.contact)
                                    .then(function() {
                                        return null;  // vumi expects null or undefined if check passes
                                    });
                            }
                        });
                },
                next: 'st_facname'
            });
        });

        self.add('st_facname', function(name) {
            var owner = self.user.extra.nc_working_on === "" ? 'your' : 'their';
            return new ChoiceState(name, {
                question: $("Please confirm {{owner}} facility: {{facname}}")
                    .context({
                        owner: owner,
                        facname: self.contact.extra.nc_facname
                    }),
                choices: [
                    new Choice('st_id_type', $('Confirm')),
                    new Choice('st_faccode', $('Not the right facility')),
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_id_type', function(name) {
            var owner = self.user.extra.nc_working_on === "" ? 'your' : 'their';
            return new ChoiceState(name, {
                question: $("Please select {{owner}} type of identification:")
                    .context({owner: owner}),
                choices: [
                    new Choice('st_sa_id', $('RSA ID')),
                    new Choice('st_passport_country', $('Passport')),
                ],
                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.add('st_sa_id', function(name) {
            var owner = self.user.extra.nc_working_on === "" ? 'your' : 'their';
            var error = $("Sorry, the format of the ID number is not correct. Please enter {{owner}} RSA ID number again, e.g. 7602095060082")
                .context({owner: owner});
            var question = $("Please enter {{owner}} 13-digit RSA ID number:")
                .context({owner: owner});
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.validate_id_sa(content)) {
                        return error;
                    }
                },
                next: 'isl_save_nursereg'
            });
        });

        self.add('st_passport_country', function(name) {
            return new ChoiceState(name, {
                question: $("What is the country of origin of the passport?"),
                choices: [
                    new Choice('na', $('Namibia')),
                    new Choice('bw', $('Botswana')),
                    new Choice('mz', $('Mozambique')),
                    new Choice('sz', $('Swaziland')),
                    new Choice('ls', $('Lesotho')),
                    new Choice('cu', $('Cuba')),
                    new Choice('other', $('Other')),
                ],
                next: function(choice) {
                    return 'st_passport_num';
                }
            });
        });

        self.add('st_passport_num', function(name) {
            var error = $("Sorry, the format of the passport number is not correct. Please enter the passport number again.");
            var question = $("Please enter the passport number:");
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.is_alpha_numeric_only(content)
                        || content.length <= 4) {
                        return error;
                    }
                },
                next: 'st_dob'
            });
        });

        self.add('st_dob', function(name) {
            var error = $("Sorry, the format of the date of birth is not correct. Please enter it again, e.g. 27 May 1975 as 27051975:");
            var question = $("Please enter the date of birth, e.g. 27 May 1975 as 27051975:");
            return new FreeText(name, {
                question: question,
                check: function(content) {
                    if (!go.utils.is_valid_date(content, 'DDMMYYYY')) {
                        return error;
                    }
                },
                next: 'isl_save_nursereg'
            });
        });

        self.add('isl_save_nursereg', function(name) {
            // Save useful contact extras
            self.contact.extra.nc_is_registered = 'true';

            if (self.im.user.answers.st_id_type === 'st_sa_id') {  // rsa id
                self.contact.extra.nc_id_type = 'sa_id';
                self.contact.extra.nc_sa_id_no = self.im.user.answers.st_sa_id;
                self.contact.extra.nc_dob = go.utils.extract_id_dob(
                    self.im.user.answers.st_sa_id);
            } else {  // passport
                self.contact.extra.nc_id_type = 'passport';
                self.contact.extra.nc_passport_country = self.im.user.answers.st_passport_country;
                self.contact.extra.nc_passport_num = self.im.user.answers.st_passport_num;
                self.contact.extra.nc_dob = moment(self.im.user.answers.st_dob, 'DDMMYYYY'
                    ).format('YYYY-MM-DD');
            }

            if (self.user.extra.nc_working_on !== "") {
                self.contact.extra.nc_registered_by = self.user.msisdn;
                if (self.user.extra.nc_registrees === undefined) {
                    self.user.extra.nc_registrees = self.contact.msisdn;
                } else {
                    self.user.extra.nc_registrees += ', ' + self.contact.msisdn;
                }
            }

            return Q
                .all([
                    self.im.contacts.save(self.user),
                    self.im.contacts.save(self.contact),
                    self.send_registration_thanks(),
                    go.utils.post_nursereg(self.im, self.contact, self.user.msisdn, null),
                ])
                .then(function() {
                    return self.states.create('st_end_reg');
                });
        });

        self.add('st_end_reg', function(name) {
            return new EndState(name, {
                text: $("Thank you. Weekly NurseConnect messages will now be sent to this number."),
                next: 'isl_route',
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
