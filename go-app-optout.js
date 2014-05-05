var go = {};
go;

var _ = require('lodash');
var vumigo = require('vumigo_v02');
var Choice = vumigo.states.Choice;
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
        return go.utils.check_valid_number(input) && (parseInt(input) >= start) && (parseInt(input) <= end);
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
        var birth_year = id.slice(0,2);
        var birth_month = id.slice(2,4);
        var birth_day = id.slice(4,6);

        // assume if born before 1950 they won't get pregnant
        // assumption necessary due to sa id number duplication
        if (parseInt(birth_year) >= 50) {
           birth_year = '19' + birth_year;
        } else {
           birth_year = '20' + birth_year;
        }
        return birth_year + '-' + birth_month + '-' + birth_day;
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

};
go.app = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;

    var GoNDOH = App.extend(function(self) {
        App.call(self, 'states:start');
        var $ = self.$;

        self.states.add('states:start', function(name) {
            return new ChoiceState(name, {
                question: $('Welcome to MomConnect. Why do you want to ' +
                            'stop receiving our messages?'),

                choices: [
                    new Choice('miscarriage', $('Miscarriage')),
                    new Choice('not_pregnant', $('Not pregnant')),
                    new Choice('not_useful', $('Messages not useful')),
                    new Choice('had_baby', $('Had my baby')),
                    new Choice('other', $('Other')),
                ],

                next: 'states:end'
            });
        });

        self.states.add('states:end', function(name) {
            return new EndState(name, {
                text: $('Thank you. You will no longer receive ' +
                        'messages from us. If you have any medical ' +
                        'concerns please visit your nearest clinic.'),

                next: 'states:start'
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
