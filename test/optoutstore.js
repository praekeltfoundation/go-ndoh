var vumigo = require('vumigo_v02');
var DummyResource = vumigo.dummy.resources.DummyResource;


var DummyOptoutResource = DummyResource.extend(function(self) {
    DummyResource.call(self, 'optout');

    /* opt-out stubbery */
    self.optout_store = [];


    self.handlers.optout = function (address_type, address_value) {
        var key = address_type + ':' + address_value;
        self.optout_store.push(key);
        return {
            success: true
        };
    };

    self.handlers.status = function (address_type, address_value) {
        var key = address_type + ':' + address_value;
        return {
            success: true,
            opted_out: self.optout_store.indexOf(key) >= 0,
            created_at: new Date().toISOString(),
            message_id: 'the-message-id'
        };
    };

    self.handlers.cancel_optout = function (address_type, address_value) {
        var key = address_type + ':' + address_value;
        var index = self.optout_store.indexOf(key);
        if(index > -1) {
            self.optout_store.splice(index, 1);
        }
        return {
            success: true,
            opted_out: false
        };
    };
  
});

this.DummyOptoutResource = DummyOptoutResource;
