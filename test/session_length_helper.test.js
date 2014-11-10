var vumigo = require('vumigo_v02');
var App = vumigo.App;
var AppTester = vumigo.AppTester;
var EndState = vumigo.states.EndState;
var FreeText = vumigo.states.FreeText;
var slh = require('../src/session_length_helper');
var SessionLengthHelper = slh.SessionLengthHelper;
var Q = require('q');
var assert = require('assert');


describe('SessionLengthHelper', function() {

  var app;
  var tester;
  var sessionH;
  var default_start_time = new Date(2014, 11, 10);

  beforeEach(function() {
      app = new App('states:test');

      tester = new AppTester(app);
      // stub out the clock
      sessionH = new SessionLengthHelper(app.im, {
        clock: function () {
          return default_start_time;
        }
      });

      app.im.on('session:new', function (e) {
        sessionH.mark.session_start();
      });

      app.im.on('session:close', function (e) {
        sessionH.mark.session_close();
      });

      app.exit = function () {
        return sessionH.increment_and_fire(function () {
          return 'vodacom';
        });
      };

      app.states.add('states:test', function(name) {
        return new FreeText(name, {
            question: 'This is the first state.',
            next: 'states:test2'
        });
      });

      app.states.add('states:test2', function(name) {
        return Q(function () {
          return sessionH.mark.session_close();
        }).then(function () {
          return new EndState(name, {
              text: 'This is the end state.',
              next: 'states:test'
          });
        });
      });

      tester
        .setup.config.app({
            name: 'sessionlengthhelper-tester'
        });
  });

  describe('When a new session starts', function () {

      it('should flag the start', function () {
        return tester
          .start()
          .check(function(api, im , app) {
            var slh = im.user.metadata.session_length_helper;
            assert.equal(slh.start, Number(default_start_time));
          })
          .run();
      });

      var timehop_tester = function (tester, delta) {
        return tester
          .setup.user({
            state: 'states:test',
            metadata: {
              session_length_helper: {
                start: Number(default_start_time) + delta
              }
            }
          });
      };

      it('should flag the end', function () {
        return timehop_tester(tester, -1000)
          .input('bar')
          .check(function(api, im , app) {
            var slh = im.user.metadata.session_length_helper;
            assert.equal(slh.stop, Number(default_start_time));
          })
          .run();
      });

      it('should calculate the duration', function () {
        return timehop_tester(tester, -1000)
          .input('bar')
          .check(function(api, im , app) {
            var slh = im.user.metadata.session_length_helper;
            assert.equal(slh.stop, Number(new Date(2014, 11, 10)));
            assert.equal(sessionH.duration(), 1000);  // milliseconds
          })
          .run();
      });

      it('should add the duration to a daily total', function () {
        return timehop_tester(tester, -1000)
          .input('bar')
          .check(function(api, im , app) {
            var kv_store = api.kv.store;
            assert.equal(kv_store['session_length_helper.vodacom'], 1000);
            assert.equal(
              kv_store['session_length_helper.vodacom.sentinel'],
              '2014-12-09');

            var m_store = api.metrics.stores['sessionlengthhelper-tester'];
            assert.equal(
              m_store['session_length_helper.vodacom'].agg, 'max');
            assert.equal(
              m_store['session_length_helper.vodacom'].values[0], 1000);
          })
          .run();
      });

      it('should reset the daily sentinel');

      it('should add to what is already in the kv store');
  });

});
