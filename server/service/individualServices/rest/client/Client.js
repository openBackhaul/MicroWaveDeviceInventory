process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const axios = require('axios');
const https = require('https');
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
        const header = { headers: { Authorization: options.headers.Authorization}};
        //const Agent = {httpsAgent: agent};
        try {
            
            let response = await axios( url,header);
            resolve(response);
            //console.log(JSON.stringify(response.data));
        } catch (error) {
            reject(error);
        }
    });
}