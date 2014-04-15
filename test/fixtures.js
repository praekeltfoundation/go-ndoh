module.exports = function() {
    return [{
        "request": {
            "method": "POST",
            "url": "http://example.com",
            "data": {
                "bar": "baz"
            }
        },
        "response": {
            "code": 200,
            "data": {
                "ham": "spam"
            }
        }
    }];
};
