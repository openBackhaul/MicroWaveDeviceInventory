// @ts-check
'use strict';

const operationServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationServerInterface');


/**
* Function compares "operation-key" from request header to operation-key from load file.
* The function is meant as a handler for validateSecurity option from express-openapi-validator.
* @param {object} request express request
* @param {string[]} scopes security scopes
* @param {object} schema SecuritySchemeObject
* @returns {Promise<boolean>} Promise is true when operation keys are equal.
*/
// eslint-disable-next-line no-unused-vars
module.exports.validateOperationKey = async function validateOperationKey(request, scopes, schema) {
    let pathDefinedInOpenApi = request.openapi.openApiRoute;
    const operationUuid = await operationServerInterface.getOperationServerUuidAsync(pathDefinedInOpenApi);
    const operationKeyFromLoadfile = await operationServerInterface.getOperationKeyAsync(operationUuid);
    const isAuthorized = operationKeyFromLoadfile === request.headers['operation-key'];
    return isAuthorized;
}