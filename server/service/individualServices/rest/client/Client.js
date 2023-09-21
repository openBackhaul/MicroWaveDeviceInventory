

const axios = require('axios');
/**
 * This function initiates a post method for the provided request object
 * @param {object} request : http request object
 * @returns {promise} object response
 */
exports.post = async function (options) {
    return new Promise(async function (resolve, reject) {
        const url = options.url;
        const header = { headers: { Authorization: options.headers.Authorization}};
        try {
            
            let response = await axios(url, header);
            resolve(response);
            console.log(JSON.stringify(response.data));
        } catch (error) {
            reject(error);
        }
    });
}