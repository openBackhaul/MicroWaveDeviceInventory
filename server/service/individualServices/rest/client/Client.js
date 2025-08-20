process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const axios = require('axios');
const https = require('https');
const logger = require('../../../LoggingService.js').getLogger();
/**
 * This function initiates a post method for the provided request object
 * @param {object} request : http request object
 * @returns {promise} object response
 */
/*const agent = new https.Agent({
    rejectUnauthorized: false
  });
  */
exports.post = async function (options) {
    return new Promise(async function (resolve, reject) {
        const url = options.url;
        const config = { headers: { Authorization: options.headers.Authorization}};
        if(options.timeout) {
            config.timeout = options.timeout;
        }
        //const Agent = {httpsAgent: agent};
        try {
            let response = await axios(url, config);
            resolve(response);
            // logger.trace(JSON.stringify(response.data));
        } catch (error) {
            logger.error(error, "Post error");
            reject(error);
        }
    });
}