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
