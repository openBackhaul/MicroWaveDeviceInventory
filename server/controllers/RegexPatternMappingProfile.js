'use strict';

var RegexPatternMappingProfile = require('../service/RegexPatternMappingProfileService');
var responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');


module.exports.getRegexPatternMappingProfileMappingListValue = function getRegexPatternMappingProfileMappingListValue (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
    RegexPatternMappingProfile.getRegexPatternMappingProfileMappingListValue(req.url)
    .then(function (response) {
          responseBuilder.buildResponse(res, responseCode, response);
        })
        .catch(function (response) {
          let sentResp = responseBuilder.buildResponse(res, undefined, response);
          responseCode = sentResp.code;
        });
      oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
    };

module.exports.getRegexPatternMappingProfileMappingNameValue = function getRegexPatternMappingProfileMappingNameValue (req, res, next, uuid) {
    let responseCode = responseCodeEnum.code.OK;
    RegexPatternMappingProfile.getRegexPatternMappingProfileMappingNameValue(req.url)
   .then(function (response) {
          responseBuilder.buildResponse(res, responseCode, response);
        })
        .catch(function (response) {
          let sentResp = responseBuilder.buildResponse(res, undefined, response);
          responseCode = sentResp.code;
        });
      oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
    };

module.exports.getRegexPatternMappingProfilePurposeValue = function getRegexPatternMappingProfilePurposeValue (req, res, next, uuid) {
   let responseCode = responseCodeEnum.code.OK;
    RegexPatternMappingProfile.getRegexPatternMappingProfilePurposeValue(req.url)
    .then(function (response) {
          responseBuilder.buildResponse(res, responseCode, response);
        })
        .catch(function (response) {
          let sentResp = responseBuilder.buildResponse(res, undefined, response);
          responseCode = sentResp.code;
        });
      oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
    };

module.exports.putRegexPatternMappingProfileMappingListValue = function putRegexPatternMappingProfileMappingListValue (req, res, next, body, uuid) {
   let responseCode = responseCodeEnum.code.NO_CONTENT;
    RegexPatternMappingProfile.putRegexPatternMappingProfileMappingListValue(body,req.url)
    .then(function (response) {
          responseBuilder.buildResponse(res, responseCode, response);
        })
        .catch(function (response) {
          let sentResp = responseBuilder.buildResponse(res, undefined, response);
          responseCode = sentResp.code;
        });
      oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
    };
module.exports.putRegexPatternMappingProfileMappingNameValue = function putRegexPatternMappingProfileMappingNameValue (req, res, next, body, uuid) {
   let responseCode = responseCodeEnum.code.NO_CONTENT;
    RegexPatternMappingProfile.putRegexPatternMappingProfileMappingNameValue(body, req.url)
    .then(function (response) {
          responseBuilder.buildResponse(res, responseCode, response);
        })
        .catch(function (response) {
          let sentResp = responseBuilder.buildResponse(res, undefined, response);
          responseCode = sentResp.code;
        });
      oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
    };

module.exports.putRegexPatternMappingProfilePurposeValue = function putRegexPatternMappingProfilePurposeValue (req, res, next, body, uuid) {
   let responseCode = responseCodeEnum.code.NO_CONTENT;
    RegexPatternMappingProfile.putRegexPatternMappingProfilePurposeValue(body, req.url)
    .then(function (response) {
          responseBuilder.buildResponse(res, responseCode, response);
        })
        .catch(function (response) {
          let sentResp = responseBuilder.buildResponse(res, undefined, response);
          responseCode = sentResp.code;
        });
      oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
    };
