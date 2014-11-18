var vumigo = require('vumigo_v02');
var DummyResource = vumigo.dummy.resources.DummyResource;


var DummyOptoutResource = DummyResource.extend(function(self) {
    DummyResource.call(self, 'optout');

    /* opt-out stubbery */
    self.optout_store = [
        'msisdn:+27831112222'
    ];


    self.handlers.optout = function (payload) {
        var key = payload.address_type + ':' + payload.address_value;
        self.optout_store.push(key);
        return {
            success: true
        };
    };

    self.handlers.status = function (payload) {
        var key = payload.address_type + ':' + payload.address_value;
        return {
            success: true,
            opted_out: self.optout_store.indexOf(key) >= 0,
            created_at: new Date().toISOString(),
            message_id: 'the-message-id'
        };
    };

    self.handlers.cancel_optout = function (payload) {
        var key = payload.address_type + ':' + payload.address_value;
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
