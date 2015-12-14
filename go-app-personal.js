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
                var timeout_opts = opts || {};
                timeout_opts.name = name;

                if (!_.contains(registration_states, name)) {
                    return self.states.create('states_start', timeout_opts);
                }

                return self.states.create('states_timed_out', timeout_opts);

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
                            content: $(
                                "Please reply to this message with your compliment. If it " +
                                "relates to the service at the clinic, include the clinic or " +
                                "clinic worker name. Standard rates apply.")
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
                            content: $(
                                "Please reply to this message with your complaint. If it " +
                                "relates to the service at the clinic, include the clinic or " +
                                "clinic worker name. Standard rates apply.")
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
            return new PaginatedChoiceState(name, {
                question: 'Welcome to the Department of Health\'s MomConnect. Choose your language:',
                options_per_page: null,
                characters_per_page: 160,
                choices: [
                    new Choice('zu', 'isiZulu'),
                    new Choice('xh', 'isiXhosa'),
                    new Choice('af', 'Afrikaans'),
                    new Choice('en', 'English'),
                    new Choice('nso', 'Sesotho sa Leboa'),
                    new Choice('tn', 'Setswana'),
                    new Choice('st', 'Sesotho'),
                    new Choice('ts', 'Xitsonga'),
                    new Choice('ss', 'siSwati'),
                    new Choice('ve', 'Tshivenda'),
                    new Choice('nr', 'isiNdebele'),
                ],

                next: function(choice) {
                    self.contact.extra.language_choice = choice.value;
                    self.contact.extra.is_registered = 'false';

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
                    if (!go.utils.check_number_in_range(content, 1900,
                      go.utils.get_today(self.im.config).getFullYear() - 5)) {
                        // assumes youngest possible birth age is 5 years old
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
                    var dob = go.utils.get_entered_birth_date(self.im.user.answers.states_birth_year,
                        self.im.user.answers.states_birth_month, content);

                    if (go.utils.is_valid_date(dob, 'YYYY-MM-DD')) {
                        self.contact.extra.birth_day = go.utils.double_digit_day(content);
                        self.contact.extra.dob = dob;

                        return self.im.contacts.save(self.contact)
                            .then(function() {
                                return {
                                    name: 'save_subscription_data'
                                };
                            });
                    } else {
                        return {
                            name: 'states_invalid_dob',
                            creator_opts: {dob: dob}
                        };
                    }
                }
            });
        });

        self.add('states_invalid_dob', function(name, opts) {
            return new ChoiceState(name, {
                question:
                    $('The date you entered ({{ dob }}) is not a ' +
                        'real date. Please try again.'
                     ).context({ dob: opts.dob }),

                choices: [
                    new Choice('continue', $('Continue'))
                ],

                next: 'states_birth_year'
            });
        });

        self.states.add('save_subscription_data', function(name) {
            self.contact.extra.is_registered = 'true';
            self.contact.extra.is_registered_by = 'personal';
            self.contact.extra.metric_sessions_to_register = self.contact.extra.ussd_sessions;
            self.contact.extra.ussd_sessions = '0';
            return Q.all([
                go.utils.post_registration(self.contact.msisdn, self.contact, self.im, 'personal'),
                self.im.outbound.send_to_user({
                    endpoint: 'sms',
                    content: $("Congratulations on your pregnancy. You will now get free SMSs about MomConnect. " +
                             "You can register for the full set of FREE helpful messages at a clinic.")
                }),
                self.im.metrics.fire.avg((self.metric_prefix + ".avg.sessions_to_register"),
                    parseInt(self.contact.extra.metric_sessions_to_register, 10)),
                go.utils.incr_kv(self.im, [self.store_name, 'no_complete_registrations'].join('.')),
                go.utils.decr_kv(self.im, [self.store_name, 'no_incomplete_registrations'].join('.')),
                go.utils.incr_kv(self.im, [self.store_name, 'conversion_registrations'].join('.')),
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
