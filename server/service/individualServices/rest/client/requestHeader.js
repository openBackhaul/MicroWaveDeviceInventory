/**
 * @file This class provides functionality to create a http request header.
 **/

'use strict';
/** 
 * This class provides functionality to create a http request header.
 */
class RequestHeader {
    Authorization

    /**
     * constructor 
     * @param {String | undefined} user User identifier from the system starting the service call. If not available , 
     * originator value will be copied to this attribute.
     * @param {String | undefined} xCorrelator UUID for the service execution flow that allows to correlate requests and responses.
     * @param {String | undefined} traceIndicator Sequence of request numbers along the flow, if it is empty , set it to 1.
     * @param {String | undefined} customerJourney Holds information supporting customer’s journey to which the execution applies.
     * @param {String} operationKey operation key to access the service in the client application.
     */
     constructor(Authorization) {
        if (Authorization != undefined && Authorization.length > 0) {
            this.Authorization = Authorization;
        }
    }
}

module.exports = RequestHeader;