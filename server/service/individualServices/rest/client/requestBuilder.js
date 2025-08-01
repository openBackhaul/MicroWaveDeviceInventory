// @ts-check

/**
 * This class provides functionality to construct a rest request
 **/
const restClient = require('./Client');
const createHttpError = require('http-errors');
const logger = require('../../../LoggingService.js').getLogger();

/**
 * This function trigger a rest request by calling the restClient class<br>
 * @param {object} requestHeader http request header for the REST call
 * @param {object} requestBody request body for the REST call
 * @returns {Promise<Object>} returns the http response received
 */
exports.BuildAndTriggerRestRequest = async function (url, requestHeader, requestBody) {
  try {

    let request = {
      url: url,
      headers: requestHeader
      //   data: requestBody
    }
    let response = await restClient.post(request);

    logger.debug("callback : " + url + " header :" + JSON.stringify(requestHeader) +
      "body :" + JSON.stringify(requestBody) + "response code:" + response.status)
    return response;
  } catch (error) {
    logger.error("POST fail!");
    if (error.response) {
      return error.response;
    } else if (error.request) {
      logger.error(`Request errored with ${error}`);
      return new createHttpError.RequestTimeout();
    }
    logger.error(`Unknown request error: ${error}`);
    return new createHttpError.InternalServerError();
  }
}