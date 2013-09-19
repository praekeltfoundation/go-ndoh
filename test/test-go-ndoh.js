var fs = require("fs");
var assert = require("assert");
var vumigo = require("vumigo_v01");
// CHANGE THIS to your-app-name
var app = require("../lib/go-ndoh");

// This just checks that you hooked you InteractionMachine
// up to the api correctly and called im.attach();
describe("test_api", function () {
  it("should exist", function () {
    assert.ok(app.api);
  });
  it("should have an on_inbound_message method", function () {
    assert.ok(app.api.on_inbound_message);
  });
  it("should have an on_inbound_event method", function () {
    assert.ok(app.api.on_inbound_event);
  });
});

describe('NDOH', function () {

  var tester;
  var fixtures = [
  ];

  beforeEach(function () {
    tester = new vumigo.test_utils.ImTester(app.api, {
      custom_setup: function (api) {
        api.config_store.config = JSON.stringify({
        });
        fixtures.forEach(function (f) {
          api.load_http_fixture(f);
        });

        // mock methods for testing
        var state_creator = tester.api.im.state_creator;
      },
      async: true
    });
  });
});