var _ = require('lodash');
var moment = require('moment');
var vumigo = require('vumigo_v02');
var Q = require('q');
var Choice = vumigo.states.Choice;

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
                    new Choice('12', $('Dec')),
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

    check_valid_number: function(input){
        // an attempt to solve the insanity of JavaScript numbers
        var numbers_only = new RegExp('^\\d+$');
        if (input !== '' && numbers_only.test(input) && !Number.isNaN(Number(input))){
            return true;
        } else {
            return false;
        }
    },

    check_number_in_range: function(input, start, end){
        return go.utils.check_valid_number(input) && (parseInt(input, 10) >= start) && (parseInt(input, 10) <= end);
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

    is_true: function(boolean) {
        //If is is not undefined and boolean is true
        return (!_.isUndefined(boolean) && (boolean==='true' || boolean===true));
    },

    readable_sa_msisdn: function(msisdn) {
        readable_no = '0' + msisdn.slice(3,12);
        return readable_no;
    },

    normalise_sa_msisdn: function(msisdn) {
        denormalised_no = '+27' + msisdn.slice(1,10);
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
                im.metrics.fire([metric_prefix, 'percent_incomplete_registrations'].join('.'), percentage_incomplete),
                im.metrics.fire([metric_prefix, 'percent_complete_registrations'].join('.'), percentage_complete)
            ]);
        });
    },

    fire_users_metrics: function(im, store_name, env, metric_prefix) {
        return Q.all([
            go.utils.incr_kv(im, [store_name, 'unique_users'].join('.')),
            go.utils.get_kv(im, [env, 'clinic', 'unique_users'].join('.'), 0),
            go.utils.get_kv(im, [env, 'chw', 'unique_users'].join('.'), 0),
            go.utils.get_kv(im, [env, 'personal', 'unique_users'].join('.'), 0)
        ]).spread(function(placeholder, clinic_users, chw_users, personal_users) {
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
    },

};
