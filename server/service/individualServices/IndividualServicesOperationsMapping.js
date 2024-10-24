module.exports.individualServicesOperationsMapping =
    {
        "/v1/regard-application" : {
            "redirect-service-request-operation" : {
                "api-segment" : "im",
                "sequence" : "004"
            }
        },

        //mwdi actions
       
        "/v1/notify-device-alarms": {
            "/v1/notify-device-alarms": {
                "api-segment": "is",
                "sequence": "020"
            },
        },
        "/v1/notify-device-attribute-value-changes": {
            "/v1/notify-device-attribute-value-changes": {
                "api-segment": "is",
                "sequence": "021"
            },
        },
        "/v1/notify-device-object-creations": {
            "/v1/notify-device-object-creations": {
                "api-segment": "is",
                "sequence": "022"
            },
        },
        "/v1/notify-device-object-deletions": {
            "/v1/notify-device-object-deletions": {
                "api-segment": "is",
                "sequence": "023"
            },
        },

        //external callback functions
        "/v1/regard-attribute-value-change": {
            "/v1/regard-attribute-value-change": {
                "api-segment": "is",
                "sequence": "100"
            },
        },
        "/v1/regard-object-creation": {
            "/v1/regard-object-creation": {
                "api-segment": "is",
                "sequence": "101"
            },
        },
        "/v1/regard-object-deletion": {
            "/v1/regard-object-deletion": {
                "api-segment": "is",
                "sequence": "102"
            },
        },
        "/v1/regard-device-alarm": {
            "/v1/regard-device-alarm": {
                "api-segment": "is",
                "sequence": "120"
            },
        },
        "/v1/regard-device-attribute-value-change": {
            "/v1/regard-device-attribute-value-change": {
                "api-segment": "is",
                "sequence": "121"
            },
        },
        "/v1/regard-device-object-creation": {
            "/v1/regard-device-object-creation": {
                "api-segment": "is",
                "sequence": "122"
            },
        },
        "/v1/regard-device-object-deletion": {
            "/v1/regard-device-object-deletion": {
                "api-segment": "is",
                "sequence": "123"
            },
        },
    }