const Profile = require('onf-core-model-ap/applicationPattern/onfModel/models/Profile');
const ProfileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
// const { createResultArray } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const logger = require('../LoggingService.js').getLogger();

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

/**
* getTime()
* 
* Returns formatted date/time information Ex: ( 25/11/2023 09:43.14 )
*/

exports.getTime = function () {
  let d = new Date();
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

exports.arraysHaveSameElements = function (array1, array2) {
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
    logger.error(error);
  }

}

/**
 * returns time in milliseconds for given unit
 */
exports.calculateTimeInMilliSeconds = function (value, unit) {
  let timeInMilliseconds = 0;
  const cleanUnit = unit.toLowerCase();
  try {
    if (cleanUnit.includes("day")) {
      timeInMilliseconds = parseInt(value) * 24 * 60 * 60 * 1000;
    } else if (cleanUnit.includes("hour")) {
      timeInMilliseconds = parseInt(value) * 60 * 60 * 1000;
    }else if (cleanUnit.includes("minute")) {
      timeInMilliseconds = parseInt(value) * 60 * 1000;
    } else if (cleanUnit.includes("second")) {
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
    logger.error(error);
    throw error;
  }
}

//////////////////////////////

// TODO @latta-techm To be check with some testcases
function hasAttribute(json, attributeName) {
  const stack = [json];

  while (stack.length > 0) {
    const current = stack.pop();

    if (current === null || typeof current !== 'object') {
      continue;
    }

    if (Object.hasOwn(current, attributeName)) {
      return true;
    }

    stack.push(...Object.values(current));
  }

  return false;
}

// function hasAttribute(json, attributeName) {
//   if (typeof json === 'object' && json !== null) {
//     // Check if the attribute is at this level
//     if (Object.hasOwnProperty.bind(json)(attributeName)) {
//       return true;
//     }
//     // Otherwise loop in the object properties
//     for (let key in json) {
//       if (Object.hasOwnProperty.bind(json)(key)) {
//         if (hasAttribute(json[key], attributeName)) {
//           return true;
//         }
//       }
//     }
//   }
//   // if json is an array, loop over the elements
//   if (Array.isArray(json)) {
//     for (let item of json) {
//       if (hasAttribute(item, attributeName)) {
//         return true;
//       }
//     }
//   }
//   return false;
// }

function decodeURIWithCheck(encodedUri) {
  // Verify if URI contains "%25"
  if (encodedUri.includes("%25")) {
    // if contains "%25", it means that it's double codified
    return decodeURIComponent(decodeURIComponent(encodedUri));
  } else {
    // Otherwise is codified only once
    return decodeURIComponent(encodedUri);
  }
}

function isJsonEmpty(arr) {
  if (arr != undefined) {
    if (Array.isArray(arr)) {
      if (arr.length === 0) {
        return true;
      }
      for (let obj of arr) {
        // Se trovi un oggetto con almeno una chiave, l'array non è vuoto
        if (Object.keys(obj).length > 0) {
          return false;
        }
      }
      return true;
    } else if (Object.keys(arr).length === 0) {
      return true;
    } else {
      return false;
    }
  } else {
    return true;
  }
}