var vumigo = require('vumigo_v02');
var DummyResource = vumigo.dummy.resources.DummyResource;


var DummyMessageStoreResource = DummyResource.extend(function(self) {
    DummyResource.call(self, 'optout');

var setup_api = function(api) {

    /* opt-out stubbery */
    api.optout_store = [];
    api.optout = function (address_type, address_value) {
        var key = address_type + ':' + address_value;
        api.optout_store.push(key);
    };

    api._handle_optout_status = function (cmd, reply) {
        var key = cmd.address_type + ':' + cmd.address_value;
        reply(api._populate_reply(cmd, {
            success: true,
            opted_out: api.optout_store.indexOf(key) >= 0,
            created_at: new Date().toISOString(),
            message_id: 'the-message-id'
        }));
    };

    api._handle_optout_cancel_optout = function (cmd, reply) {
        var key = cmd.address_type + ':' + cmd.address_value;
        var index = api.optout_store.indexOf(key);
        if(index > -1) {
            api.optout_store.splice(index, 1);
        }
        reply(api._populate_reply(cmd, {
            success: true,
            opted_out: false
        }));
    };

    api._handle_messagestore_count_outbound_uniques = function (cmd, reply) {
        return reply(api._populate_reply(cmd, {
            success: true,
            count: 10
        }));
    };

    api._handle_messagestore_count_replies = function (cmd, reply) {
        return reply(api._populate_reply(cmd, {
            success: true,
            count: 5
        }));
    };

    api._handle_messagestore_count_sent_messages = function (cmd, reply) {
        return reply(api._populate_reply(cmd, {
            success: true,
            count: 3
        }));
    };
};
