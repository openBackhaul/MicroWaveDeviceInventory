const Profile = require('onf-core-model-ap/applicationPattern/onfModel/models/Profile');
const ProfileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');

const fieldsManager = require('./fieldsManagement');
const logger = require('../LoggingService.js').getLogger();

// -- Application
const OPENDAYLIGHT_STR = "OpenDayLight";
const ELASTICSEARCH_STR = "ElasticSearch";

/**
 * This function returns the string-value object for given string-name
 * 
 * @param {String} stringProfileName - name of the string-profile
 * @returns {Object} stringValue - returns the integer-profile/configuration/string-value
 */
exports.getStringValueForStringProfileNameAsync = async function (stringProfileName) {
  let stringValue;
  let profileList = await ProfileCollection.getProfileListAsync();
  for (let i = 0; i < profileList.length; i++) {
    let profileInstance = profileList[i];
    let profileName = profileInstance[onfAttributes.PROFILE.PROFILE_NAME];
    if (profileName == Profile.profileNameEnum.STRING_PROFILE) {
      let stringName = profileInstance[onfAttributes.STRING_PROFILE.PAC][onfAttributes.STRING_PROFILE.CAPABILITY][onfAttributes.STRING_PROFILE.STRING_NAME];
      if (stringName == stringProfileName) {
        stringValue = profileInstance[onfAttributes.STRING_PROFILE.PAC][onfAttributes.STRING_PROFILE.CONFIGURATION][onfAttributes.STRING_PROFILE.STRING_VALUE];
        break;
      }
    }
  }
  return stringValue;
}

/**
 * This function returns the integer-profile object for given integer-name
 * 
 * @param {String} integerProfileName - name of the integer-profile
 * @returns {Object} integerProfile - returns the integer-profile instance for given integer-name
 */
exports.getIntegerProfileForIntegerName = async function (integerProfileName) {
  let integerProfile = {};
  let profileList = await ProfileCollection.getProfileListAsync();
  for (let i = 0; i < profileList.length; i++) {
    let profileInstance = profileList[i];
    let profileName = profileInstance[onfAttributes.PROFILE.PROFILE_NAME];
    if (profileName == Profile.profileNameEnum.INTEGER_PROFILE) {
      const pac = profileInstance[onfAttributes.INTEGER_PROFILE.PAC];
      const capability = pac?.[onfAttributes.INTEGER_PROFILE.CAPABILITY];
      const integerName = capability?.[onfAttributes.INTEGER_PROFILE.INTEGER_NAME];

      if (integerName == integerProfileName) {
        integerProfile = profileInstance;
        break;
      }
    }
  }
  return integerProfile;
}

/**
 * This function returns the mapping-list of given regex-profile instance
 * 
 * @param {String} expectedMappingName - name of the regex-pattern-mapping-profile
 * @returns {List} mappingList - value given in regex-pattern-mapping-profile/configuration/mapping-list
 */
exports.getMappingListForRegexProfile = async function (expectedMappingName) {
  let mappingList = [];
  let profileList = await ProfileCollection.getProfileListAsync();
  for (let i = 0; i < profileList.length; i++) {
    let profileInstance = profileList[i];
    let profileName = profileInstance[onfAttributes.PROFILE.PROFILE_NAME];
    if (profileName == Profile.profileNameEnum.REGEX_PATTERN_MAPPING_PROFILE) {
      let mappingName = profileInstance[onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.PAC][onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.CAPABILITY][onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.MAPPING_NAME];
      if (mappingName == expectedMappingName) {
        mappingList = profileInstance[onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.PAC][onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.CONFIGURATION][onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.MAPPING_LIST];
        break;
      }
    }
  }
  return mappingList;
}


let lastCompleteCcUpdateTimeMappingEnsured = false;

async function ensureLastCompleteCcUpdateTimeFieldMapping(client, indexAlias) {
  if (lastCompleteCcUpdateTimeMappingEnsured) {
    return;
  }

  await client.indices.putMapping({
    index: indexAlias,
    body: {
      properties: {
        "last-complete-control-construct-update-time": {
          type: "date"
        }
      }
    }
  });

  lastCompleteCcUpdateTimeMappingEnsured = true;
}

/**
* Records a request
*
* body controlconstruct 
* no response value expected for this operation
**/
exports.recordRequest = async function (body, cc, isAddPropertyToMapping = false) {
  let pipelineExists = false;
  let client = await common[1].EsClient;
  if (USE_ELK_PIPELINE) {
    try {
      // Check if the pipeline exists
      await client.ingest.getPipeline({ id: 'mwdi' });
      pipelineExists = true;
    } catch (error) {
      if (error.statusCode === 404) {
        // Pipeline does not exist
        console.warn(`Pipeline mwdi not found. Indexing without the pipeline.`);
      } else {
        // Other errors
        console.error("An error occurred while checking the pipeline:", error);
        throw error; // Re-throw the error if it's not a 404
      }
    }
  }

  try {
    let indexAlias = common[1].indexAlias
    let startTime = process.hrtime();

    /* if (isAddPropertyToMapping) {
      await ensureLastCompleteCcUpdateTimeFieldMapping(client, indexAlias);
    } */

    let indexParams = {
      index: indexAlias,
      id: cc,
      body: body
    };

    if (pipelineExists) {
      indexParams.pipeline = 'mwdi';
    }

    let result = await client.index(indexParams);
    let backendTime = process.hrtime(startTime);
    if (result.body.result == 'created' || result.body.result == 'updated') {
      return { "took": backendTime[0] * 1000 + backendTime[1] / 1000000 };
    }
  } catch (error) {
    console.error(error);
  }
  return {};
}

/**
* getTime()
* 
* Returns formatted date/time information Ex: ( 25/11/2023 09:43.14 )
*/

exports.getTime = function () {
  let d = new Date();
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

exports.arraysHaveSameElements = async function (array1, array2) {
  try {
    if (array1.length !== array2.length) {
      return false;
    }

    const frequencyMap = {};
    for (const element of array1) {
      frequencyMap[element] = (frequencyMap[element] || 0) + 1;
    }


    for (const element of array2) {
      if (!(element in frequencyMap)) {
        return false;
      }
      frequencyMap[element]--;
      if (frequencyMap[element] === 0) {
        delete frequencyMap[element];
      }
    }

    return Object.keys(frequencyMap).length === 0;
  } catch (error) {
    console.error(error);
  }

}

/**
 * returns time in milliseconds for given unit
 */
exports.calculateTimeInMilliSeconds = function (value, unit) {
  let timeInMilliseconds = 0;
  try {
    if (unit.includes("day")) {
      timeInMilliseconds = parseInt(value) * 24 * 60 * 60 * 1000;
    } else if (unit.includes("hour")) {
      timeInMilliseconds = parseInt(value) * 60 * 60 * 1000;
    } else if (unit.includes("minute")) {
      timeInMilliseconds = parseInt(value) * 60 * 1000;
    } else if (unit.includes("second")) {
      timeInMilliseconds = parseInt(value) * 1000;
    } else {
      timeInMilliseconds = value;
    }

    return timeInMilliseconds;
  } catch (error) {
    logger.error(error);
    return 0;
  }
}

/**
 * This function returns the string-name for given uuid
 * 
 * @param {String} uuid - uuid of the string-profile
 * @returns {String} stringName - returns the string-profile/capability/string-name
 */
exports.getStringNameForUuidAsync = async function (uuid) {
  let stringName;
  try {
    let profileList = await ProfileCollection.getProfileListForProfileNameAsync(Profile.profileNameEnum.STRING_PROFILE);
    for (let i = 0; i < profileList.length; i++) {
      let profileInstance = profileList[i];
      let stringProfileUuid = profileInstance["uuid"];
      if (stringProfileUuid == uuid) {
        stringName = profileInstance[onfAttributes.STRING_PROFILE.PAC][onfAttributes.STRING_PROFILE.CAPABILITY][onfAttributes.STRING_PROFILE.STRING_NAME];
        break;
      }
    }
    return stringName;
  } catch (error) {
    throw error;
  }
}


// Utilities ----------------------------------------------------------
const fieldsFilterCache = new Map();

exports.getFieldsFilter = function getFieldsFilter(myFields) {
  let filter = fieldsFilterCache.get(myFields);

  if (filter !== undefined) {
    return filter;
  }

  const decodedFields = decodeURIComponent(myFields);
  const replacedUrlFilter = exports.replaceFilterString(decodedFields);

  const rootObj = {
    value: 'root',
    children: []
  };

  fieldsManager.decodeFieldsSubstringExt(
    replacedUrlFilter,
    0,
    rootObj
  );

  filter = rootObj.children;

  fieldsFilterCache.set(myFields, filter);

  return filter;
}


exports.replaceFilterString = function replaceFilterString(filter) {
  if (typeof filter !== 'string') {
    return filter;
  }

  const replacements = [
    ['equipment', 'uuid'],
    ['connector', 'local-id'],
    ['contained-holder', 'local-id'],
    ['expected-equipment', 'local-id'],
    ['firmware-component-list', 'local-id'],
    ['profile', 'uuid'],
    ['logical-termination-point', 'uuid'],
    ['forwarding-domain', 'uuid'],
    ['fc', 'uuid1'],
    ['fc-port', 'local-id'],
    ['layer-protocol', 'local-id']
  ];

  let replacedFilter = filter;

  for (const [element, requiredField] of replacements) {
    const regex = new RegExp(
      `${element}\\((?!${requiredField}(?:;|\\)))`,
      'g'
    );

    replacedFilter = replacedFilter.replace(
      regex,
      `${element}(${requiredField};`
    );
  }

  return replacedFilter;
}

exports.isFilterValid = function isFilterValid(filter) {
  if (typeof filter !== 'string') {
    return false;
  }

  try {
    const decodedFilter = decodeURIComponent(filter);

    // Allowed:
    // a-z, A-Z, 0-9, (, ), /, ;, -, :
    return /^[a-zA-Z0-9()/;:-]*$/.test(decodedFilter);
  } catch {
    // Invalid URI encoding
    return false;
  }
}

exports.isJsonEmpty = function isJsonEmpty(value) {
  if (value == null) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(item =>
      item != null &&
      typeof item === 'object' &&
      Object.keys(item).length === 0
    );
  }

  return typeof value === 'object' &&
    Object.keys(value).length === 0;
}

exports.retrieveCorrectUrl = function retrieveCorrectUrl(originalUrl, path, applicationName) {
  try {
    const urlParts = originalUrl.split("?fields=");
    const myFields = urlParts[1];
    const controlConstruct = urlParts[0].match(/control-construct=([^/]+)/)[1];
    let placeHolder = "";
    if (applicationName === OPENDAYLIGHT_STR) { // "OpenDayLight"
      placeHolder = "/rests/data/network-topology:network-topology/topology=topology-netconf/node=tochange/yang-ext:mount/core-model-1-4:control-construct"
    } else if (applicationName === ELASTICSEARCH_STR) { //"ElasticSearch"
      placeHolder = "/";
    }

    const ctrlConstrToFind = `${CTR_CONST}=${controlConstruct}`;
    const ctrlConstrIdx = originalUrl.indexOf(ctrlConstrToFind);

    let subStringCC = "";
    if (ctrlConstrIdx !== -1) {
      // let subtringCCextra = urlParts[0].substring(0, ctrlConstrIdx); // is not needed
      if (applicationName === OPENDAYLIGHT_STR) { //"OpenDayLight"
        subStringCC = urlParts[0].substring(ctrlConstrIdx + ctrlConstrToFind.length);
      } else if (applicationName === ELASTICSEARCH_STR) { //"ElasticSearch"
        subStringCC = urlParts[0].substring(ctrlConstrIdx);
      }
    }

    const correctPlaceHolder = placeHolder.replace("tochange", controlConstruct);
    let final = `${path}${correctPlaceHolder}${subStringCC}`;

    let correctUrl = "";
    if (final.indexOf("+") != -1) {
      correctUrl = final.replace(/=.*?\+/g, "=");
    } else {
      correctUrl = final;
    }

    if (myFields != undefined) {
      final = final + "?fields=" + myFields;
    }
    return final;
  } catch (error) {
    logger.error(error);
  }
}

exports.modifyReturnJson = function modifyReturnJson(obj) {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  const stack = [obj];

  while (stack.length > 0) {
    const current = stack.pop();

    for (const key in current) {
      const value = current[key];

      if (value !== null && typeof value === 'object') {
        stack.push(value);
      } else if (
        (key === 'uuid' || key === 'local-id') &&
        typeof value === 'string'
      ) {
        const index = value.indexOf('+');

        if (index !== -1) {
          current[key] = value.slice(index + 1);
        }
      }
    }
  }
}

exports.modifyUrlConcatenateMountNamePlusUuid = function modifyUrlConcatenateMountNamePlusUuid(url, mountName) {
  try {
    if (!url || !mountName) {
      return url;
    }

    const [path, query] = url.split("?", 2);

    const modifiedPath = path.replace(
      /=([^/]+)/g,
      (match, value) => {
        if (value.includes("+")) {
          return match;
        }

        return `=${mountName}+${value}`;
      }
    );

    return query !== undefined
      ? `${modifiedPath}?${query}`
      : modifiedPath;

  } catch (error) {
    logger.error(error);
    return url;
  }
}

exports.decodeURIWithCheck = function decodeURIWithCheck(encodedUri) {
  // Verify if URI contains "%25"
  if (encodedUri.includes("%25")) {
    // if contains "%25", it means that it's double codified
    return decodeURIComponent(decodeURIComponent(encodedUri));
  } else {
    // Otherwise is codified only once
    return decodeURIComponent(encodedUri);
  }
}

exports.decodeMountName = function decodeMountName(url, cc) {
  try {
    if (typeof url !== 'string' || url.length === 0) {
      return buildError("Invalid URL");
    }

    const decodedUrl = decodeURIComponent(url);

    const marker = `${CTR_CONST}=`;
    const startIndex = decodedUrl.indexOf(marker);

    if (startIndex === -1) {
      return buildError("Control-construct not found");
    }

    const valueStart = startIndex + marker.length;
    let extractedValue = decodedUrl.substring(valueStart);

    // When cc === false, control-construct ends at the next "/"
    if (!cc) {
      extractedValue = extractedValue.split('/')[0];
    } else {
      // Remove fields query parameter
      extractedValue = extractedValue.split('?fields')[0];
    }

    if (!extractedValue) {
      return buildError("Control-construct is empty");
    }

    // Only letters, numbers and "+" are allowed
    if (!/^[a-zA-Z0-9+]+$/.test(extractedValue)) {
      return buildError(
        "Control-construct must not contain special characters"
      );
    }

    const parts = extractedValue.split('+');

    // mountName
    if (parts.length === 1) {
      return parts[0];
    }

    // mountName+mountName
    if (
      parts.length === 2 &&
      parts[0] !== '' &&
      parts[0] === parts[1]
    ) {
      return parts[0];
    }

    return buildError("Invalid control-construct format");

  } catch (error) {
    logger.error(error);
    return buildError("Unable to decode control-construct");
  }
}

function buildError(message) {
  return [ { code: "400", message } ];
}

exports.formatUrlForOdl = function formatUrlForOdl(url, fields) {
  try {
    const segments = url.split("/");
    let newSegments = [];
    // loop over segments
    for (const segment of segments) {
      const parts = segment.split("+");
      if (parts.length > 1) {
        if (parts[0].indexOf(CTR_CONST) != -1) {
          newSegments.push(parts[0]);
        } else {
          newSegments.push(parts[0].split("=")[0] + "=" + parts[1]);
        }
      } else {
        newSegments.push(segment);
      }
    }
    let newUrl = newSegments.join("/");
    if (fields !== undefined) {
      newUrl = newUrl + "?fields=" + fields;
    }
    return newUrl;
  } catch (error) {
    logger.error(error);
  }
}

exports.modifyUUID = function modifyUUID(obj, mountName) {
  if (obj == null || typeof obj !== 'object') {
    return;
  }

  const stack = [obj];

  while (stack.length > 0) {
    const current = stack.pop();

    for (const [key, value] of Object.entries(current)) {
      if (
        (key === 'uuid' || key === 'local-id') &&
        typeof value === 'string'
      ) {
        if (!value.includes('+')) {
          current[key] = `${mountName}+${value}`;
        }
      } else if (value !== null && typeof value === 'object') {
        stack.push(value);
      }
    }
  }
}