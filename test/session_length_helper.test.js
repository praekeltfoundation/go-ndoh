var vumigo = require('vumigo_v02');
var App = vumigo.App;
var AppTester = vumigo.AppTester;
var EndState = vumigo.states.EndState;
var FreeText = vumigo.states.FreeText;
var assert = require('assert');
var moment = require('moment');


describe('SessionLengthHelper', function() {

  var app;
  var tester;
  var sessionH;
  // November, months are 0 indexed
  var default_start_time = moment('2014-11-10 00:00:00.00+00:00').toDate();

  beforeEach(function() {
      app = new App('states:test');

      tester = new AppTester(app);
      // stub out the clock
      sessionH = new go.SessionLengthHelper(app.im,
        {
          name: function () {
            return 'vodacom';
          },
          clock: function () {
            return default_start_time;
          }
        });
      sessionH.attach();

      app.states.add('states:test', function(name) {
        return new FreeText(name, {
            question: 'This is the first state.',
            next: 'states:test2'
        });
      });

      app.states.add('states:test2', function(name) {
        return new EndState(name, {
            text: 'This is the end state.',
            next: 'states:test'
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
        .check(function(api, im, app) {
          var slh = im.user.metadata.session_length_helper;
          assert.equal(slh.start, Number(default_start_time));
        })
        .run();
    });

    it('should reset the daily sentinel', function () {
      return tester
        .setup(function (api) {
          // set an old sentinal
          api.kv.store['session_length_helper.vodacom.sentinel'] = '2000-12-12';
          api.kv.store['session_length_helper.vodacom'] = 42;
        })
        .start()
        .check(function (api, im, app) {
          // reset to correct date
          assert.equal(
            api.kv.store['session_length_helper.vodacom.sentinel'],
            '2014-11-10');
          // reset to correct value
          assert.equal(api.kv.store['session_length_helper.vodacom'], 0);
        })
        .run();
    });
  });

  describe('When a session completes', function () {
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
          assert.equal(slh.stop, Number(default_start_time));
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
            '2014-11-10');

          var m_store = api.metrics.stores['sessionlengthhelper-tester'];
          assert.equal(
            m_store['session_length_helper.vodacom'].agg, 'max');
          assert.equal(
            m_store['session_length_helper.vodacom'].values[0], 1);
        })
        .run();
    });

    it('should add to what is already in the kv store', function () {
      return timehop_tester(tester, -1000)
        .setup(function (api) {
          // set an old sentinal
          api.kv.store['session_length_helper.vodacom.sentinel'] = '2014-11-10';
          api.kv.store['session_length_helper.vodacom'] = 2000;
        })
        .input('bar')
        .check(function (api, im, app) {
          // maintains the correct date
          assert.equal(
            api.kv.store['session_length_helper.vodacom.sentinel'],
            '2014-11-10');
          // incremented value
          assert.equal(api.kv.store['session_length_helper.vodacom'], 3000);
        })
        .run();
    });
  });

});
