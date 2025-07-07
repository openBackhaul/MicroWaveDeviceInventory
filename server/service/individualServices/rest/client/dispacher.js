// @ts-check

/**
 * @file This module provides funtionality to trigger and dispatch rest request from this application to other applications  
 * This class consolidates the technology specific extensions.
 **/

'use strict';

const RequestHeader = require('./requestHeader');
const RestRequestBuilder = require('./requestBuilder');

/**
 * This funtion formulates the request body based on the operation name and application 
 * @param {object} httpRequestBody request body for the operation
 */
exports.dispatchEvent = function (url, method, httpRequestBody, Authorization) {
    return new Promise(async function (resolve, reject) {
        let result = false;
        try {
           
            let httpRequestHeader = new RequestHeader(
                Authorization
                     
                );
            let response = await RestRequestBuilder.BuildAndTriggerRestRequest(
                //decodeURIComponent(url),
                url,
                httpRequestHeader, 
                httpRequestBody
                );
            // let responseCode = response.status;
            // if (responseCode.toString().startsWith("2")) {
            //     result = true;
            //     //resolve(response);
            // } /* else {
            //     resolve(false)
            // } */
            resolve(response);
        } catch (error) {
            //reject(error);
            resolve(false);
        }
    });
}