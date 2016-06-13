module.exports = function() {
    return [
// GET Count Active Subscriptions (go.utils.subscription_count_active)
    // +27821234444
    {
        'request': {
            'method': 'GET',
            'params': {
                'to_addr': '+27821234444'
            },
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
        },
        'response': {
            "code": 200,
            "meta": {
                "limit": 20,
                "next": null,
                "offset": 0,
                "previous": null,
                "total_count": 2
            },
            "data": {
                "objects": [
                    {
                        "active": false,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:22:34.838969",
                        "id": 1,
                        "lang": "en",
                        "message_set": "/api/v1/message_set/3/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/1/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27821234444",
                        "updated_at": "2014-08-05T11:22:34.838996",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    },
                    {
                        "active": true,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:31:50.908974",
                        "id": 2,
                        "lang": "af",
                        "message_set": "/api/v1/message_set/3/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/2/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27821234444",
                        "updated_at": "2014-08-05T11:31:50.909025",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    }
                ]
            }
        }
    },
    // +27821235555
    {
        'request': {
            'method': 'GET',
            'params': {
                'to_addr': '+27821235555'
            },
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
        },
        'response': {
            "code": 200,
            "meta": {
                "limit": 20,
                "next": null,
                "offset": 0,
                "previous": null,
                "total_count": 2
            },
            "data": {
                "objects": [
                    {
                        "active": false,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:22:34.838969",
                        "id": 1,
                        "lang": "en",
                        "message_set": "/api/v1/message_set/3/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/1/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27821235555",
                        "updated_at": "2014-08-05T11:22:34.838996",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    },
                    {
                        "active": false,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:31:50.908974",
                        "id": 2,
                        "lang": "af",
                        "message_set": "/api/v1/message_set/3/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/2/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27821235555",
                        "updated_at": "2014-08-05T11:31:50.909025",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    }
                ]
            }
        }
    },

// GET Vumi Subscription - Optout
    // Opt out line subscription for 27001
    {
        'request': {
            'method': 'GET',
            'params': {
                'to_addr': '+27001'
            },
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
        },
        'response': {
            "code": 200,
            "meta": {
                "limit": 20,
                "next": null,
                "offset": 0,
                "previous": null,
                "total_count": 2
            },
            "data": {
                "objects": [
                    {
                        "active": true,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:22:34.838969",
                        "id": 1,
                        "lang": "en",
                        "message_set": "/api/v1/message_set/3/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/1/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27001",
                        "updated_at": "2014-08-05T11:22:34.838996",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    },
                    {
                        "active": true,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:31:50.908974",
                        "id": 2,
                        "lang": "af",
                        "message_set": "/api/v1/message_set/3/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/2/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27001",
                        "updated_at": "2014-08-05T11:31:50.909025",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    }
                ]
            }
        }
    },
    // Opt out line subscription for 27831112222
    {
        'request': {
            'method': 'GET',
            'params': {
                'to_addr': '+27831112222'
            },
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
        },
        'response': {
            "code": 200,
            "meta": {
                "limit": 20,
                "next": null,
                "offset": 0,
                "previous": null,
                "total_count": 0
            },
            "data": {
                "objects": []
            }
        }
    },
    // Opt out line subscription for 27831113333
    {
        'request': {
            'method': 'GET',
            'params': {
                'to_addr': '+27831113333'
            },
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
        },
        'response': {
            "code": 200,
            "meta": {
                "limit": 20,
                "next": null,
                "offset": 0,
                "previous": null,
                "total_count": 0
            },
            "data": {
                "objects": []
            }
        }
    },

// PATCH Vumi Subscription - Unsubscribe
    // Opt out line 27001 unsubscribe from active message sets
    {
        'request': {
            'method': 'PATCH',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
            "data": {
                "objects": [
                    {
                        "active": false,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:22:34.838969",
                        "id": 1,
                        "lang": "en",
                        "message_set": "/api/v1/message_set/3/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/1/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27001",
                        "updated_at": "2014-08-05T11:22:34.838996",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    },
                    {
                        "active": false,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:31:50.908974",
                        "id": 2,
                        "lang": "af",
                        "message_set": "/api/v1/message_set/3/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/2/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27001",
                        "updated_at": "2014-08-05T11:31:50.909025",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    }
                ]
            }
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },

// POST Jembi Optout
    // Jembi Opt out call for: 27001 reason: miscarriage
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/optout',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "id": "12345^^^ZW^PPN",
                "type": 4,
                "lang": "en",
                "encdate": "20130819144811",
                "faccode": null,
                "dob": null,
                "optoutreason": 1
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    // Jembi Opt out - for: 27831113333 reason: miscarriage
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/optout',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27831113333",
                "cmsisdn": "+27831113333",
                "id": "12345^^^ZW^PPN",
                "type": 4,
                "lang": "en",
                "encdate": "20130819144811",
                "faccode": null,
                "dob": null,
                "optoutreason": 1
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    // Opt out - for: 27831113333 reason: not_useful
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/optout',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27831113333",
                "cmsisdn": "+27831113333",
                "id": "12345^^^ZW^PPN",
                "type": 4,
                "lang": "en",
                "encdate": "20130819144811",
                "faccode": null,
                "dob": null,
                "optoutreason": 4
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    // Opt out - for: 27001 reason: not_useful
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/optout',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "id": "12345^^^ZW^PPN",
                "type": 4,
                "lang": "en",
                "encdate": "20130819144811",
                "faccode": null,
                "dob": null,
                "optoutreason": 4
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    // Opt out for: 27001 reason: unknown (for smsinbound)
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/optout',
            'data': {
                "mha": 1,
                "swt": 2,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "id": "27001^^^ZAF^TEL",
                "type": 4,
                "lang": "en",
                "encdate": "20130819144811",
                "faccode": null,
                "dob": null,
                "optoutreason": 6
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },

// POST Vumi Subscriptions
    // Vumi Subscription to Loss Messages for: 27001
    {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/subscription/",
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "lang": "en",
            "message_set": "/api/v1/message_set/6/",
            "next_sequence_number": 1,
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27001",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "active": true,
            "completed": false,
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "created_at": "2014-07-05T11:01:54.497870",
            "id": 8,
            "lang": "en",
            "message_set": "/api/v1/message_set/6/",
            "next_sequence_number": 1,
            "resource_uri": "/api/v1/subscription/8/",
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27001",
            "updated_at": "2014-07-05T11:01:54.498122",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        }
    },
    // Vumi Subscription to Loss Messages for: 27831112222
    {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/subscription/",
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "lang": "en",
            "message_set": "/api/v1/message_set/6/",
            "next_sequence_number": 1,
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27831112222",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "active": true,
            "completed": false,
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "created_at": "2014-07-05T11:01:54.497870",
            "id": 8,
            "lang": "en",
            "message_set": "/api/v1/message_set/6/",
            "next_sequence_number": 1,
            "resource_uri": "/api/v1/subscription/8/",
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27831112222",
            "updated_at": "2014-07-05T11:01:54.498122",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        }
    },
    // Vumi Subscription to Loss Messages for: 27831113333
    {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/subscription/",
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "lang": "en",
            "message_set": "/api/v1/message_set/6/",
            "next_sequence_number": 1,
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27831113333",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "active": true,
            "completed": false,
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "created_at": "2014-07-05T11:01:54.497870",
            "id": 8,
            "lang": "en",
            "message_set": "/api/v1/message_set/6/",
            "next_sequence_number": 1,
            "resource_uri": "/api/v1/subscription/8/",
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27831113333",
            "updated_at": "2014-07-05T11:01:54.498122",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        }
    },
    // Vumi Subscription to Baby1
    {
        "request": {
          "method": "POST",
          'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
          "url": "http://ndoh-control/api/v1/subscription/",
          "data": {
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "lang": "en",
            "message_set": "/api/v1/message_set/4/",
            "next_sequence_number": 1,
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27001",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        },
        "response": {
          "code": 201,
          "data": {
            "active": true,
            "completed": false,
            "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
            "created_at": "2014-07-05T11:01:54.497870",
            "id": 8,
            "lang": "en",
            "message_set": "/api/v1/message_set/4/",
            "next_sequence_number": 1,
            "resource_uri": "/api/v1/subscription/8/",
            "schedule": "/api/v1/periodic_task/3/",
            "to_addr": "+27001",
            "updated_at": "2014-07-05T11:01:54.498122",
            "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4"
          }
        }
    },

// POST Jembi Subscription - Loss
    // Jembi Subscription to Loss Messages for: 27001
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/subscription',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "id": "12345^^^ZW^PPN",
                "type": 5,
                "lang": "en",
                "encdate": "20130819144811",
                "faccode": null,
                "dob": null
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    // Jembi Subscription to Loss Messages for: 27831112222
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/subscription',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27831112222",
                "cmsisdn": "+27831112222",
                "id": "12345^^^ZW^PPN",
                "type": 5,
                "lang": "en",
                "encdate": "20130819144811",
                "faccode": null,
                "dob": null
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },
    // Jembi Subscription to Loss Messages for: 27831113333
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/subscription',
            'data': {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27831113333",
                "cmsisdn": "+27831113333",
                "id": "12345^^^ZW^PPN",
                "type": 5,
                "lang": "en",
                "encdate": "20130819144811",
                "faccode": null,
                "dob": null
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },

// GET Jembi facilityCheck
    // Jembi Clinic Code validation - code 123456
    {
        "request": {
            "method": "GET",
            "headers": {
                "Authorization": ["Basic " + new Buffer("test:test").toString("base64")],
                "Content-Type": ["application/json"]
            },
            "url": "http://test/v2/json/facilityCheck",
            "params": {
                "criteria": "code:123456"
            }
        },
        "response": {
            "code": 200,
            "data": {
              "title": "FacilityRegistry",
              "headers": [
                {
                  "name": "value",
                  "column": "value",
                  "type": "java.lang.String",
                  "hidden": false,
                  "meta": false
                },
                {
                  "name": "uid",
                  "column": "uid",
                  "type": "java.lang.String",
                  "hidden": false,
                  "meta": false
                },
                {
                  "name": "name",
                  "column": "name",
                  "type": "java.lang.String",
                  "hidden": false,
                  "meta": false
                }
              ],
              "rows": [
                [
                  "123456",
                  "asdf7a803",
                  "WCL clinic"
                ]
              ],
              "width": 3,
              "height": 1
            }
        }
    },
    // Jembi Clinic Code validation - code 234567
    {
        "request": {
            "method": "GET",
            "headers": {
                "Authorization": ["Basic " + new Buffer("test:test").toString("base64")],
                "Content-Type": ["application/json"]
            },
            "url": "http://test/v2/json/facilityCheck",
            "params": {
                "criteria": "code:234567"
            }
        },
        "response": {
            "code": 200,
            "data": {
              "title": "FacilityRegistry",
              "headers": [
                {
                  "name": "value",
                  "column": "value",
                  "type": "java.lang.String",
                  "hidden": false,
                  "meta": false
                },
                {
                  "name": "uid",
                  "column": "uid",
                  "type": "java.lang.String",
                  "hidden": false,
                  "meta": false
                },
                {
                  "name": "name",
                  "column": "name",
                  "type": "java.lang.String",
                  "hidden": false,
                  "meta": false
                }
              ],
              "rows": [
                [
                  "234567",
                  "asdf7aaff",
                  "OLT clinic"
                ]
              ],
              "width": 3,
              "height": 1
            }
        }
    },
    // Jembi Clinic Code validation - code 888888 (non-valid clinic code)
    {
        "request": {
            "method": "GET",
            "headers": {
                "Authorization": ["Basic " + new Buffer("test:test").toString("base64")],
                "Content-Type": ["application/json"]
            },
            "url": "http://test/v2/json/facilityCheck",
            "params": {
                "criteria": "code:888888"
            }
        },
        "response": {
            "code": 200,
            "data": {
                "title": "FacilityCheck",
                "headers": [{
                    "name": "code",
                    "column": "code",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": false
                }],
                "rows": [],
                "width": 1,
                "height": 1
            }
        }
    },
    // Jembi NurseConnect Clinic Code validation - code 123456
    {
        "request": {
            "method": "GET",
            "headers": {
                "Authorization": ["Basic " + new Buffer("test:test").toString("base64")],
                "Content-Type": ["application/json"]
            },
            "url": "http://test/v2/json/NCfacilityCheck",
            "params": {
                "criteria": "value:123456"
            }
        },
        "response": {
            "code": 200,
            "data": {
              "title": "Facility Check Nurse Connect",
              "headers": [
                {
                  "name": "value",
                  "column": "value",
                  "type": "java.lang.String",
                  "hidden": false,
                  "meta": false
                },
                {
                  "name": "uid",
                  "column": "uid",
                  "type": "java.lang.String",
                  "hidden": false,
                  "meta": false
                },
                {
                  "name": "name",
                  "column": "name",
                  "type": "java.lang.String",
                  "hidden": false,
                  "meta": false
                }
              ],
              "rows": [
                [
                  "123456",
                  "asdf7a803",
                  "WCL clinic"
                ]
              ],
              "width": 3,
              "height": 1
            }
        }
    },
    // Jembi NurseConnect Clinic Code validation - code 234567
    {
        "request": {
            "method": "GET",
            "headers": {
                "Authorization": ["Basic " + new Buffer("test:test").toString("base64")],
                "Content-Type": ["application/json"]
            },
            "url": "http://test/v2/json/NCfacilityCheck",
            "params": {
                "criteria": "value:234567"
            }
        },
        "response": {
            "code": 200,
            "data": {
              "title": "Facility Check Nurse Connect",
              "headers": [
                {
                  "name": "value",
                  "column": "value",
                  "type": "java.lang.String",
                  "hidden": false,
                  "meta": false
                },
                {
                  "name": "uid",
                  "column": "uid",
                  "type": "java.lang.String",
                  "hidden": false,
                  "meta": false
                },
                {
                  "name": "name",
                  "column": "name",
                  "type": "java.lang.String",
                  "hidden": false,
                  "meta": false
                }
              ],
              "rows": [
                [
                  "234567",
                  "asdf7aaff",
                  "OLT clinic"
                ]
              ],
              "width": 3,
              "height": 1
            }
        }
    },
    // Jembi NurseConnect Clinic Code validation - code 888888 (non-valid clinic code)
    {
        "request": {
            "method": "GET",
            "headers": {
                "Authorization": ["Basic " + new Buffer("test:test").toString("base64")],
                "Content-Type": ["application/json"]
            },
            "url": "http://test/v2/json/NCfacilityCheck",
            "params": {
                "criteria": "value:888888"
            }
        },
        "response": {
            "code": 200,
            "data": {
                "title": "Facility Check Nurse Connect",
                "headers": [{
                    "name": "code",
                    "column": "code",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": false
                }],
                "rows": [],
                "width": 1,
                "height": 1
            }
        }
    },

// POST Vumi Registrations
    // Vumi registration post - clinic 1
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn": null,
                "mom_msisdn": "+27821234567",
                "mom_id_type": "sa_id",
                "mom_passport_origin":null,
                "mom_lang": "en",
                "mom_edd": "2014-05-30",
                "mom_id_no": "5101025009086",
                "mom_dob": "1951-01-02",
                "clinic_code": "123456",
                "consent": "true",
                "authority": "clinic"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn": null,
                "mom_msisdn": "+27821234567",
                "mom_id_type": "sa_id",
                "mom_passport_origin":null,
                "mom_lang": "en",
                "mom_edd": "2014-05-30",
                "mom_id_no": "5101025009086",
                "mom_dob": "1951-01-02",
                "clinic_code": "123456",
                "consent": "true",
                "authority": "clinic"
            }
        }
    },
    // Vumi registration post - clinic 2
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":"+270001",
                "mom_msisdn":"+27821234567",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":"2014-05-30",
                "mom_id_no":"5101025009086",
                "mom_dob":"1951-01-02",
                "clinic_code":"123456",
                "consent": "true",
                "authority":"clinic"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":"+270001",
                "mom_msisdn":"+27821234567",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":"2014-05-30",
                "mom_id_no":"5101025009086",
                "mom_dob":"1951-01-02",
                "clinic_code":"123456",
                "consent": "true",
                "authority":"clinic"
            }
        }
    },
    // Vumi registration post - clinic 3
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"none",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":"2014-05-30",
                "mom_id_no":null,
                "mom_dob":"1951-01-02",
                "clinic_code":"123456",
                "consent": true,
                "authority":"clinic"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"none",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":"2014-05-30",
                "mom_id_no":null,
                "mom_dob":"1951-01-02",
                "clinic_code":"123456",
                "consent": true,
                "authority":"clinic"
            }
        }
    },
    // Vumi registration post - clinic 4
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":"+270001",
                "mom_msisdn":"+27821234567",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":"2014-05-30",
                "mom_id_no":"5101025009086",
                "mom_dob":"1951-01-02",
                "consent": true,
                "clinic_code":"123456",
                "authority":"clinic"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":"+270001",
                "mom_msisdn":"+27821234567",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":"2014-05-30",
                "mom_id_no":"5101025009086",
                "mom_dob":"1951-01-02",
                "consent": true,
                "clinic_code":"123456",
                "authority":"clinic"
            }
        }
    },
    // Vumi registration post - clinic 5
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
              	"hcw_msisdn": null,
              	"mom_msisdn": "+27821234567",
              	"mom_id_type": "sa_id",
              	"mom_passport_origin": null,
              	"mom_lang": "en",
              	"mom_edd": "2014-05-30",
              	"mom_id_no": "5101025009086",
              	"mom_dob": "1951-01-02",
              	"consent": true,
              	"clinic_code": "123456",
              	"authority": "clinic"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn": null,
                "mom_msisdn": "+27821234567",
                "mom_id_type": "sa_id",
                "mom_passport_origin":null,
                "mom_lang": "en",
                "mom_edd": "2014-05-30",
                "mom_id_no": "5101025009086",
                "mom_dob": "1951-01-02",
                "consent": true,
                "clinic_code": "123456",
                "authority": "clinic"
            }
        }
    },
    // Vumi registration post - personal 1
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"5101015009088",
                "mom_dob":"1951-01-01",
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"5101015009088",
                "mom_dob":"1951-01-01",
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        }
    },
    // Vumi registration post - personal 2
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"5002285000007",
                "mom_dob":"1950-02-28",
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"5002285000007",
                "mom_dob":"1950-02-28",
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        }
    },
    // Vumi registration post - personal 3
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"5101025009086",
                "mom_dob":"1951-01-02",
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"5101025009086",
                "mom_dob":"1951-01-02",
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        }
    },
    // Vumi registration post - personal 4
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"2012315678097",
                "mom_dob":"2020-12-31",
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"2012315678097",
                "mom_dob":"2020-12-31",
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        }
    },
    // Vumi registration post - personal 5
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"passport",
                "mom_passport_origin":"zw",
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"12345",
                "mom_dob":null,
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"passport",
                "mom_passport_origin":"zw",
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"12345",
                "mom_dob":null,
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        }
    },
    // Vumi registration post - personal 6
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"passport",
                "mom_passport_origin":"zw",
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"12345",
                "mom_dob":"1981-01-01",
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"passport",
                "mom_passport_origin":"zw",
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"12345",
                "mom_dob":"1981-01-01",
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        }
    },
    // Vumi registration post - personal 7
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"none",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":null,
                "mom_dob":null,
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"none",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":null,
                "mom_dob":null,
                "clinic_code":null,
                "consent": true,
                "authority":"personal"
            }
        }
    },
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"none",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":null,
                "mom_dob":null,
                "clinic_code":null,
                "consent": "true",
                "authority":"personal"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"none",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":null,
                "mom_dob":null,
                "clinic_code":null,
                "consent": "true",
                "authority":"personal"
            }
        }
    },
    // Vumi registration post - chw 1
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":"+27001",
                "mom_msisdn":"+27821234567",
                "mom_id_type":"passport",
                "mom_passport_origin":"zw",
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"12345",
                "mom_dob":null,
                "clinic_code":null,
                "consent": true,
                "authority":"chw"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":"+27001",
                "mom_msisdn":"+27821234567",
                "mom_id_type":"passport",
                "mom_passport_origin":"zw",
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"12345",
                "mom_dob":null,
                "clinic_code":null,
                "consent": true,
                "authority":"chw"
            }
        }
    },
    // Vumi registration post - chw 2
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"passport",
                "mom_passport_origin":"zw",
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"5101025009086",
                "mom_dob":null,
                "clinic_code":null,
                "consent": true,
                "authority":"chw"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"passport",
                "mom_passport_origin":"zw",
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"5101025009086",
                "mom_dob":null,
                "clinic_code":null,
                "consent": true,
                "authority":"chw"
            }
        }
    },
    // Vumi registration post - chw 3
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"5101025009086",
                "mom_dob":"1951-01-02",
                "clinic_code":null,
                "consent": true,
                "authority":"chw"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":null,
                "mom_msisdn":"+27001",
                "mom_id_type":"sa_id",
                "mom_passport_origin":null,
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"5101025009086",
                "mom_dob":"1951-01-02",
                "clinic_code":null,
                "consent": true,
                "authority":"chw"
            }
        }
    },
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/registrations/",
            "data": {
                "hcw_msisdn":"+27001",
                "mom_msisdn":"+27821234567",
                "mom_id_type":"passport",
                "mom_passport_origin":"zw",
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"12345",
                "mom_dob":null,
                "clinic_code":null,
                "consent": "true",
                "authority":"chw"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "hcw_msisdn":"+27001",
                "mom_msisdn":"+27821234567",
                "mom_id_type":"passport",
                "mom_passport_origin":"zw",
                "mom_lang":"en",
                "mom_edd":null,
                "mom_id_no":"12345",
                "mom_dob":null,
                "clinic_code":null,
                "consent": "true",
                "authority":"chw"
            }
        }
    },

// POST Vumi NurseReg
    // Vumi nursereg post - sa_id (self reg)
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregs/",
            "data": {
                "cmsisdn": "+27821234444",
                "dmsisdn": "+27821234444",
                "faccode": "123456",
                "sanc_reg_no": null,
                "persal_no": null,
                "id_type": null,
                "id_no": null,
                "dob": null
            }
        },
        "response": {
            "code": 201,
            "data": {
                "cmsisdn": "+27821234444",
                "dmsisdn": "+27821234444",
                "faccode": "123456",
                "sanc_reg_no": null,
                "persal_no": null,
                "id_type": null,
                "id_no": null,
                "dob": null
            }
        }
    },

    // Vumi nursereg post - passport (other reg)
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregs/",
            "data": {
                "cmsisdn": "+27821235555",
                "dmsisdn": "+27821234444",
                "faccode": "123456",
                "sanc_reg_no": null,
                "persal_no": null,
                "id_type": null,
                "id_no": null,
                "dob": null
            }
        },
        "response": {
            "code": 201,
            "data": {
                "cmsisdn": "+27821235555",
                "dmsisdn": "+27821234444",
                "faccode": "123456",
                "sanc_reg_no": null,
                "persal_no": null,
                "id_type": null,
                "id_no": null,
                "dob": null
            }
        }
    },

    // Vumi nursereg post - change detail faccode
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregs/",
            "data": {
                "cmsisdn": "+27821237777",
                "dmsisdn": "+27821237777",
                "faccode": "234567",
                "id_type": "sa_id",
                "id_no": "5101025009086",
                "dob": "1951-01-02",
                "sanc_reg_no": null,
                "persal_no": null
            }
        },
        "response": {
            "code": 201,
            "data": {
                "cmsisdn": "+27821237777",
                "dmsisdn": "+27821237777",
                "faccode": "234567",
                "id_type": "sa_id",
                "id_no": "5101025009086",
                "dob": "1951-01-02",
                "sanc_reg_no": null,
                "persal_no": null
            }
        }
    },

    // Vumi nursereg post - change detail sanc
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregs/",
            "data": {
                "cmsisdn": "+27821237777",
                "dmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "5101025009086",
                "dob": "1951-01-02",
                "sanc_reg_no": "34567890",
                "persal_no": null
            }
        },
        "response": {
            "code": 201,
            "data": {
                "cmsisdn": "+27821237777",
                "dmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "5101025009086",
                "dob": "1951-01-02",
                "sanc_reg_no": "34567890",
                "persal_no": null
            }
        }
    },

    // Vumi nursereg post - change detail persal
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregs/",
            "data": {
                "cmsisdn": "+27821237777",
                "dmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "5101025009086",
                "dob": "1951-01-02",
                "sanc_reg_no": null,
                "persal_no": "11114444"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "cmsisdn": "+27821237777",
                "dmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "5101025009086",
                "dob": "1951-01-02",
                "sanc_reg_no": null,
                "persal_no": "11114444"
            }
        }
    },

    // Vumi nursereg post - change detail id - ID
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregs/",
            "data": {
                "cmsisdn": "+27821237777",
                "dmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "sa_id",
                "dob": "1990-01-01",
                "sanc_reg_no": null,
                "persal_no": null,
                "id_no": "9001016265166"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "cmsisdn": "+27821237777",
                "dmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "sa_id",
                "dob": "1990-01-01",
                "sanc_reg_no": null,
                "persal_no": null,
                "id_no": "9001016265166"
            }
        }
    },

    // Vumi nursereg post - change detail id - Passport
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregs/",
            "data": {
                "cmsisdn": "+27821237777",
                "dmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "passport",
                "dob": "1976-03-07",
                "sanc_reg_no": null,
                "persal_no": null,
                "id_no": "Nam1234",
                "passport_origin": "na"
            }
        },
        "response": {
            "code": 201,
            "data": {
                "cmsisdn": "+27821237777",
                "dmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "passport",
                "dob": "1976-03-07",
                "sanc_reg_no": null,
                "persal_no": null,
                "id_no": "Nam1234",
                "passport_origin": "na"
            }
        }
    },

    // Vumi nursereg post - change old phone number
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregs/",
            "data": {
                "cmsisdn": "+27821234444",
                "dmsisdn": "+27821234444",
                "rmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "5101025009086",
                "dob": "1951-01-02",
                "sanc_reg_no": null,
                "persal_no": null
            }
        },
        "response": {
            "code": 201,
            "data": {
                "cmsisdn": "+27821234444",
                "dmsisdn": "+27821234444",
                "rmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "5101025009086",
                "dob": "1951-01-02",
                "sanc_reg_no": null,
                "persal_no": null
            }
        }
    },

    // Vumi nursereg post - switch to new number 0821238888
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregs/",
            "data": {
                "cmsisdn": "+27821238888",
                "dmsisdn": "+27821237777",
                "rmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "5101025009086",
                "dob": "1951-01-02",
                "sanc_reg_no": null,
                "persal_no": null
            }
        },
        "response": {
            "code": 201,
            "data": {
                "cmsisdn": "+27821238888",
                "dmsisdn": "+27821237777",
                "rmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "5101025009086",
                "dob": "1951-01-02",
                "sanc_reg_no": null,
                "persal_no": null
            }
        }
    },

    // Vumi nursereg post - switch to new number 0821239999
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregs/",
            "data": {
                "cmsisdn": "+27821239999",
                "dmsisdn": "+27821237777",
                "rmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "5101025009086",
                "dob": "1951-01-02",
                "sanc_reg_no": null,
                "persal_no": null
            }
        },
        "response": {
            "code": 201,
            "data": {
                "cmsisdn": "+27821239999",
                "dmsisdn": "+27821237777",
                "rmsisdn": "+27821237777",
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "5101025009086",
                "dob": "1951-01-02",
                "sanc_reg_no": null,
                "persal_no": null
            }
        }
    },

// PATCH Vumi NurseConnect Subscription - Unsubscribe
    // Opt out line 27821237777 unsubscribe from active message sets
    {
        'request': {
            'method': 'PATCH',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
            "data": {
                "objects": [
                    {
                        "active": false,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:22:34.838969",
                        "id": 1,
                        "lang": "en",
                        "message_set": "/api/v1/message_set/11/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/1/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27821237777",
                        "updated_at": "2014-08-05T11:22:34.838996",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    }
                ]
            }
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },

// GET Vumi Subscription - NurseReg
    // Nursereg subscription for 27821237777
    {
        'request': {
            'method': 'GET',
            'params': {
                'to_addr': '+27821237777'
            },
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
        },
        'response': {
            "code": 200,
            "meta": {
                "limit": 20,
                "next": null,
                "offset": 0,
                "previous": null,
                "total_count": 2
            },
            "data": {
                "objects": [
                    {
                        "active": true,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:22:34.838969",
                        "id": 1,
                        "lang": "en",
                        "message_set": "/api/v1/message_set/11/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/1/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27821237777",
                        "updated_at": "2014-08-05T11:22:34.838996",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    }
                ]
            }
        }
    },
    // Nursereg subscription for 27821233333
    {
        'request': {
            'method': 'GET',
            'params': {
                'to_addr': '+27821233333'
            },
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
        },
        'response': {
            "code": 200,
            "meta": {
                "limit": 20,
                "next": null,
                "offset": 0,
                "previous": null,
                "total_count": 2
            },
            "data": {
                "objects": [
                    {
                        "active": false,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:22:34.838969",
                        "id": 2,
                        "lang": "en",
                        "message_set": "/api/v1/message_set/11/",
                        "next_sequence_number": 7,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/2/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27821233333",
                        "updated_at": "2014-08-05T11:22:34.838996",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    }
                ]
            }
        }
    },
    // Nursereg subscription for 27821233333
    {
        'request': {
            'method': 'GET',
            'params': {
                'to_addr': '+27821240000'
            },
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
        },
        'response': {
            "code": 200,
            "meta": {
                "limit": 20,
                "next": null,
                "offset": 0,
                "previous": null,
                "total_count": 2
            },
            "data": {
                "objects": [
                    {
                        "active": false,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:22:34.838969",
                        "id": 2,
                        "lang": "en",
                        "message_set": "/api/v1/message_set/11/",
                        "next_sequence_number": 7,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/2/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27821240000",
                        "updated_at": "2014-08-05T11:22:34.838996",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    }
                ]
            }
        }
    },
    // Nursereg subscription for 27821238888
    {
        'request': {
            'method': 'GET',
            'params': {
                'to_addr': '+27821238888'
            },
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
        },
        'response': {
            "code": 200,
            "meta": {
                "limit": 20,
                "next": null,
                "offset": 0,
                "previous": null,
                "total_count": 0
            },
            "data": {
                "objects": []
            }
        }
    },
    // Nursereg subscription for 27821238889
    {
        'request': {
            'method': 'GET',
            'params': {
                'to_addr': '+27821238889'
            },
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://ndoh-control/api/v1/subscription/',
        },
        'response': {
            "code": 200,
            "meta": {
                "limit": 20,
                "next": null,
                "offset": 0,
                "previous": null,
                "total_count": 0
            },
            "data": {
                "objects": [
                    {
                        "active": true,
                        "completed": false,
                        "contact_key": "e5b0888cdb4347158ea5cd2f2147d28f",
                        "created_at": "2014-08-05T11:22:34.838969",
                        "id": 1,
                        "lang": "en",
                        "message_set": "/api/v1/message_set/11/",
                        "next_sequence_number": 1,
                        "process_status": 0,
                        "resource_uri": "/api/v1/subscription/1/",
                        "schedule": "/api/v1/periodic_task/1/",
                        "to_addr": "+27821238889",
                        "updated_at": "2014-08-05T11:22:34.838996",
                        "user_account": "1aa0dea2f82945a48cc258c61d756f16"
                    }
                ]
            }
        }
    },

// GET Last Nursereg - Nurse
    // Optout for 27821237777
    {
        "request": {
            "method": "GET",
            "headers": {
                "Authorization": ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregistrations/7/",
        },
        "response": {
            "code": 200,
            "data": {
                "id": 7,
                "cmsisdn": "+27821237777",
                "dmsisdn": "+27821237777",
                "rmsisdn": null,
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "8009151234001",
                "passport_origin": null,
                "dob": "1980-09-15",
                "nurse_source": 2,
                "persal_no": null,
                "opted_out": false,
                "optout_reason": null,
                "optout_count": 0,
                "sanc_reg_no": null
            }
        }
    },
    // Optout for 27821233333
    {
        "request": {
            "method": "GET",
            "headers": {
                "Authorization": ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregistrations/3/",
        },
        "response": {
            "code": 200,
            "data": {
                "id": 3,
                "cmsisdn": "+27821233333",
                "dmsisdn": "+27821233333",
                "rmsisdn": null,
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "8009151234001",
                "passport_origin": null,
                "dob": "1980-09-15",
                "nurse_source": 2,
                "persal_no": null,
                "opted_out": true,
                "optout_reason": "unknown",
                "optout_count": 3,
                "sanc_reg_no": null
            }
        }
    },
    // Optout for 27821240000
    {
        "request": {
            "method": "GET",
            "headers": {
                "Authorization": ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregistrations/4/",
        },
        "response": {
            "code": 200,
            "data": {
                "id": 4,
                "cmsisdn": "+27821240000",
                "dmsisdn": "+27821240000",
                "rmsisdn": null,
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "8009151234001",
                "passport_origin": null,
                "dob": "1980-09-15",
                "nurse_source": 2,
                "persal_no": null,
                "opted_out": true,
                "optout_reason": "unknown",
                "optout_count": 3,
                "sanc_reg_no": null
            }
        }
    },
    // Optout for 27001 (sms)
    {
        "request": {
            "method": "GET",
            "headers": {
                "Authorization": ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregistrations/99/",
        },
        "response": {
            "code": 200,
            "data": {
                "id": 99,
                "cmsisdn": "+27001",
                "dmsisdn": "+27001",
                "rmsisdn": null,
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "8009151234001",
                "passport_origin": null,
                "dob": "1980-09-15",
                "nurse_source": 2,
                "persal_no": null,
                "opted_out": false,
                "optout_reason": null,
                "optout_count": 0,
                "sanc_reg_no": null
            }
        }
    },

// PATCH Last Nursereg
    // Optout for 27821237777
    {
        "request": {
            "method": "PATCH",
            "headers": {
                "Authorization": ["Token test_token"]
            },
            "url": "http://ndoh-control/api/v2/nurseregistrations/7/",
            "data": {
                "id": 7,
                "cmsisdn": "+27821237777",
                "dmsisdn": "+27821237777",
                "rmsisdn": null,
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "8009151234001",
                "passport_origin": null,
                "dob": "1980-09-15",
                "nurse_source": 2,
                "persal_no": null,
                "opted_out": true,
                "optout_reason": "job_change",
                "optout_count": 1,
                "sanc_reg_no": null
            }
        },
        "response": {
            "code": 200,
            "data": {
                "id": 7,
                "cmsisdn": "+27821237777",
                "dmsisdn": "+27821237777",
                "rmsisdn": null,
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "8009151234001",
                "passport_origin": null,
                "dob": "1980-09-15",
                "nurse_source": 2,
                "persal_no": null,
                "opted_out": true,
                "optout_reason": "job_change",
                "optout_count": 1,
                "sanc_reg_no": null
            }
        }
    },
    // Optout for 27821233333
    {
        "request": {
            "method": "PATCH",
            "headers": {
                "Authorization": ["Token test_token"]
            },
            "url": "http://ndoh-control/api/v2/nurseregistrations/3/",
            "data": {
                "id": 3,
                "cmsisdn": "+27821233333",
                "dmsisdn": "+27821233333",
                "rmsisdn": null,
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "8009151234001",
                "passport_origin": null,
                "dob": "1980-09-15",
                "nurse_source": 2,
                "persal_no": null,
                "opted_out": true,
                "optout_reason": "other",
                "optout_count": 4,
                "sanc_reg_no": null
            }
        },
        "response": {
            "code": 200,
            "data": {
                "id": 3,
                "cmsisdn": "+27821233333",
                "dmsisdn": "+27821233333",
                "rmsisdn": null,
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "8009151234001",
                "passport_origin": null,
                "dob": "1980-09-15",
                "nurse_source": 2,
                "persal_no": null,
                "opted_out": true,
                "optout_reason": "other",
                "optout_count": 4,
                "sanc_reg_no": null
            }
        }
    },
    // Optout for 27821240000
    {
        "request": {
            "method": "PATCH",
            "headers": {
                "Authorization": ["Token test_token"]
            },
            "url": "http://ndoh-control/api/v2/nurseregistrations/4/",
            "data": {
                "id": 4,
                "cmsisdn": "+27821240000",
                "dmsisdn": "+27821240000",
                "rmsisdn": null,
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "8009151234001",
                "passport_origin": null,
                "dob": "1980-09-15",
                "nurse_source": 2,
                "persal_no": null,
                "opted_out": true,
                "optout_reason": "other",
                "optout_count": 4,
                "sanc_reg_no": null
            }
        },
        "response": {
            "code": 200,
            "data": {
                "id": 3,
                "cmsisdn": "+27821240000",
                "dmsisdn": "+27821240000",
                "rmsisdn": null,
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "8009151234001",
                "passport_origin": null,
                "dob": "1980-09-15",
                "nurse_source": 2,
                "persal_no": null,
                "opted_out": true,
                "optout_reason": "other",
                "optout_count": 4,
                "sanc_reg_no": null
            }
        }
    },
    // Optout for 27001 (sms)
    {
        "request": {
            "method": "PATCH",
            "headers": {
                "Authorization": ['Token test_token']
            },
            "url": "http://ndoh-control/api/v2/nurseregistrations/99/",
            "data": {
                "id": 99,
                "cmsisdn": "+27001",
                "dmsisdn": "+27001",
                "rmsisdn": null,
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "8009151234001",
                "passport_origin": null,
                "dob": "1980-09-15",
                "nurse_source": 2,
                "persal_no": null,
                "opted_out": true,
                "optout_reason": "unknown",
                "optout_count": 1,
                "sanc_reg_no": null
            }
        },
        "response": {
            "code": 200,
            "data": {
                "id": 99,
                "cmsisdn": "+27001",
                "dmsisdn": "+27001",
                "rmsisdn": null,
                "faccode": "123456",
                "id_type": "sa_id",
                "id_no": "8009151234001",
                "passport_origin": null,
                "dob": "1980-09-15",
                "nurse_source": 2,
                "persal_no": null,
                "opted_out": true,
                "optout_reason": "unknown",
                "optout_count": 1,
                "sanc_reg_no": null
            }
        }
    },

// POST Nurse Optouts to Jembi
    // Optout for 27821237777
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/nc/optout',
            'data': {
                "mha": 1,
                "swt": 3,
                "dmsisdn": "+27821237777",
                "cmsisdn": "+27821237777",
                "type": 8,
                "id": "5101025009086^^^ZAF^NI",
                "faccode": "123456",
                "dob": "19510102",
                "optoutreason": 7,
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },

    // Optout for 27821233333
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/nc/optout',
            'data': {
                "mha": 1,
                "swt": 3,
                "dmsisdn": "+27821233333",
                "cmsisdn": "+27821233333",
                "type": 8,
                "id": "5101025009086^^^ZAF^NI",
                "faccode": "123456",
                "dob": "19760304",
                "optoutreason": 5,
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },

    // Optout for 27821240000
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/nc/optout',
            'data': {
                "mha": 1,
                "swt": 3,
                "dmsisdn": "+27821240000",
                "cmsisdn": "+27821240000",
                "type": 8,
                "id": "44444^^^BW^PPN",
                "faccode": "123456",
                "dob": "19760304",
                "optoutreason": 5,
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },

    // Optout for 27001
    {
        'request': {
            'method': 'POST',
            'headers': {
                'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                'Content-Type': ['application/json']
            },
            'url': 'http://test/v2/json/nc/optout',
            'data': {
                "mha": 1,
                "swt": 4,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "type": 8,
                "id": "7103035001001^^^ZAF^NI",
                "faccode": null,
                "dob": null,
                "optoutreason": 6,
                "encdate": "20130819144811"
            },
        },
        'response': {
            "code": 200,
            "data": {
                "success": "true"
            }
        }
    },

// POST Snappy Ticket
    // Snappy ticket post - with clinic_code
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
            "url": "http://ndoh-control/api/v1/snappybouncer/ticket/",
            "data": {
                "conversation":"/api/v1/snappybouncer/conversation/key/dummyconversation/",
                "message": "DONUTS",
                "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                "msisdn": "+27001",
                "faccode": 123456
            }
        },
        "response": {
            "code": 201,
            "data": {
                "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                "conversation": "/api/v1/snappybouncer/conversation/1/",
                "created_at": "2014-07-27T21:59:50.463810",
                "id": 1,
                "message": "DONUTS",
                "msisdn": "+27001",
                "resource_uri": "/api/v1/snappybouncer/ticket/1/",
                "response": "",
                "support_id": null,
                "support_nonce": "alfz1cc1qkitdarc",
                "faccode": 123456,
                "updated_at": "2014-07-27T21:59:56.489255"
            }
        },
    },

    // Snappy ticket post - without clinic_code
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
            "url": "http://ndoh-control/api/v1/snappybouncer/ticket/",
            "data": {
                "conversation":"/api/v1/snappybouncer/conversation/key/dummyconversation/",
                "message": "DONUTS",
                "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                "msisdn": "+27001",
                "faccode": null
            }
        },
        "response": {
            "code": 201,
            "data": {
                "contact_key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                "conversation": "/api/v1/snappybouncer/conversation/1/",
                "created_at": "2014-07-27T21:59:50.463810",
                "id": 1,
                "message": "DONUTS",
                "msisdn": "+27001",
                "resource_uri": "/api/v1/snappybouncer/ticket/1/",
                "response": "",
                "support_id": null,
                "support_nonce": "alfz1cc1qkitdarc",
                "faccode": null,
                "updated_at": "2014-07-27T21:59:56.489255"
            }
        },
    },

// POST Vumi Servicerating
    // Vumi Servicerating Post
    {
        "request": {
            "method": "POST",
            'headers': {
                'Authorization': ['ApiKey test_user:test_key'],
                'Content-Type': ['application/json']
            },
            "url": "http://ndoh-control/api/v1/servicerating/rate/",
            "data": {
                "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4",
                "conversation_key": "dummyconversationkey",
                "contact": {
                    "extra": {
                        "is_registered_by": "clinic",
                        "clinic_code": "123456",
                        "last_service_rating": "never"
                    },
                    "groups": [],
                    "subscription": {},
                    "msisdn": "+27001",
                    "created_at": "2014-07-28 09:35:26.732",
                    "key": "63ee4fa9-6888-4f0c-065a-939dc2473a99",
                    "user_account": "4a11907a-4cc4-415a-9011-58251e15e2b4",
                    "name": null,
                    "surname": null,
                    "email_address": null,
                    "dob": null,
                    "twitter_handle": null,
                    "facebook_id": null,
                    "bbm_pin": null,
                    "gtalk_id": null
                },
                "answers": {
                    "question_1_friendliness": "very-satisfied",
                    "question_2_waiting_times_feel": "very-satisfied",
                    "question_3_waiting_times_length": "less-than-an-hour",
                    "question_4_cleanliness": "very-satisfied",
                    "question_5_privacy": "very-satisfied"
                }
            },
            "response": {
                "code": 201,
                "data": {}
            }
        }
    },

// POST Jembi Servicerating
    // Jembi Servicerating Post
    {
        "request": {
            "method": "POST",
            "headers": {
                "Authorization": ["Basic " + new Buffer("test:test").toString("base64")],
                "Content-Type": ["application/json"]
            },
            "url": "http://test/v2/json/serviceRating",
            "data": {
                "mha": 1,
                "swt": 1,
                "dmsisdn": "+27001",
                "cmsisdn": "+27001",
                "type": 6,
                "faccode": "123456",
                "encdate": "20130819144811",
                "data": [
                    {
                        "question": "question_1_friendliness",
                        "answer": "very-satisfied"
                    }, {
                        "question": "question_2_waiting_times_feel",
                        "answer": "very-satisfied"
                    }, {
                        "question": "question_3_waiting_times_length",
                        "answer": "less-than-an-hour"
                    }, {
                        "question": "question_4_cleanliness",
                        "answer": "very-satisfied"
                    }, {
                        "question": "question_5_privacy",
                        "answer": "very-satisfied"
                    }
                ]
            }
        }
    },

// FAQ Browsing
    // TOPIC RESPONSE
    {
            'request': {
                'method': 'GET',
                'headers': {
                    'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                    'Content-Type': ['application/json']
                },
                'url': 'https://app.besnappy.com/api/v1/account/1/faqs/1/topics'
            },
            'response': {
                "code": "200",
                "data": [
                    {
                        "id": 903,
                        "faq_id": 3134,
                        "topic": "Baby",
                        "order": 0,
                        "created_at": "2014-07-29 10:37:56",
                        "updated_at": "2014-07-29 10:37:56",
                        "slug": "baby"
                    },
                    {
                        "id": 904,
                        "faq_id": 3134,
                        "topic": "HIV",
                        "order": 0,
                        "created_at": "2014-07-29 10:38:04",
                        "updated_at": "2014-07-29 10:38:04",
                        "slug": "hiv"
                    },
                    {
                        "id": 902,
                        "faq_id": 3134,
                        "topic": "Labour",
                        "order": 0,
                        "created_at": "2014-07-29 10:37:47",
                        "updated_at": "2014-07-29 10:37:47",
                        "slug": "labour"
                    },
                    {
                        "id": 905,
                        "faq_id": 3134,
                        "topic": "Other Diseases",
                        "order": 0,
                        "created_at": "2014-07-29 10:38:21",
                        "updated_at": "2014-07-29 10:38:21",
                        "slug": "other-diseases"
                    },
                    {
                        "id": 881,
                        "faq_id": 3134,
                        "topic": "Pregnancy",
                        "order": 0,
                        "created_at": "2014-07-15 09:51:44",
                        "updated_at": "2014-07-15 09:51:44",
                        "slug": "pregnancy"
                    },
                    {
                        "id": 906,
                        "faq_id": 3134,
                        "topic": "Support",
                        "order": 0,
                        "created_at": "2014-07-29 10:38:29",
                        "updated_at": "2014-07-29 10:38:29",
                        "slug": "support"
                    }
                ]
            }
    },
    // QA RESPONSE
    {
            'request': {
                'method': 'GET',
                'headers': {
                    'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                    'Content-Type': ['application/json']
                },
                'url': 'https://app.besnappy.com/api/v1/account/1/faqs/1/topics/881/questions'
            },
            'responses': [{
                "code": 200,
                "data": [{
                    "id": "635",
                    "account_id": "50",
                    "question": "Can I order more than one box at a time?",
                    "answer": "If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).",
                    "created_at": "2013-11-19 09:17:34",
                    "updated_at": "2014-02-24 09:36:54",
                    "active": "1",
                    "parsed_answer": "<p>If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "635",
                        "featured": "0",
                        "order": "0"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                }, {
                    "id": "634",
                    "account_id": "50",
                    "question": "What happens if I fall in love with one particular coffee?",
                    "answer": "At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!",
                    "created_at": "2013-11-19 09:16:36",
                    "updated_at": "2013-11-19 14:34:50",
                    "active": "1",
                    "parsed_answer": "<p>At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "634",
                        "featured": "0",
                        "order": "1"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                },
                {
                    "id": "999",
                    "account_id": "50",
                    "question": "What happens if the FAQ answer is really long? (too long)",
                    "answer": "It will be split into multiple pages on a bookletstate, showing content on different screens as the text gets too long. To illustrate this, this super long response has been faked. This should be split over at least 2 screens just because we want to test properly. Let's see.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                },
                {
                    "id": "633",
                    "account_id": "50",
                    "question": "What happens if I realise the amount of coffee I've ordered doesn't suit?",
                    "answer": "If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                }]
            },
            {
                "code": 200,
                "data": [{
                    "id": "635",
                    "account_id": "50",
                    "question": "Can I order more than one box at a time?",
                    "answer": "If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).",
                    "created_at": "2013-11-19 09:17:34",
                    "updated_at": "2014-02-24 09:36:54",
                    "active": "1",
                    "parsed_answer": "<p>If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "635",
                        "featured": "0",
                        "order": "0"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                }, {
                    "id": "634",
                    "account_id": "50",
                    "question": "What happens if I fall in love with one particular coffee?",
                    "answer": "At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!",
                    "created_at": "2013-11-19 09:16:36",
                    "updated_at": "2013-11-19 14:34:50",
                    "active": "1",
                    "parsed_answer": "<p>At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "634",
                        "featured": "0",
                        "order": "1"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                },
                {
                    "id": "999",
                    "account_id": "50",
                    "question": "What happens if the FAQ answer is really long? (too long)",
                    "answer": "It will be split into multiple pages on a bookletstate, showing content on different screens as the text gets too long. To illustrate this, this super long response has been faked. This should be split over at least 2 screens just because we want to test properly. Let's see.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                },
                {
                    "id": "633",
                    "account_id": "50",
                    "question": "What happens if I realise the amount of coffee I've ordered doesn't suit?",
                    "answer": "If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                }]
            },{
                "code": 200,
                "data": [{
                    "id": "635",
                    "account_id": "50",
                    "question": "Can I order more than one box at a time?",
                    "answer": "If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).",
                    "created_at": "2013-11-19 09:17:34",
                    "updated_at": "2014-02-24 09:36:54",
                    "active": "1",
                    "parsed_answer": "<p>If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "635",
                        "featured": "0",
                        "order": "0"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                }, {
                    "id": "634",
                    "account_id": "50",
                    "question": "What happens if I fall in love with one particular coffee?",
                    "answer": "At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!",
                    "created_at": "2013-11-19 09:16:36",
                    "updated_at": "2013-11-19 14:34:50",
                    "active": "1",
                    "parsed_answer": "<p>At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "634",
                        "featured": "0",
                        "order": "1"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                },
                {
                    "id": "999",
                    "account_id": "50",
                    "question": "What happens if the FAQ answer is really long? (too long)",
                    "answer": "It will be split into multiple pages on a bookletstate, showing content on different screens as the text gets too long. To illustrate this, this super long response has been faked. This should be split over at least 2 screens just because we want to test properly. Let's see.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                },
                {
                    "id": "633",
                    "account_id": "50",
                    "question": "What happens if I realise the amount of coffee I've ordered doesn't suit?",
                    "answer": "If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "881",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                }]
            }]
    }

];
};
