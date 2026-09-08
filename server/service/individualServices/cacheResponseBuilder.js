const net = require('net');
const createHttpError = require('http-errors');
const logger = require('../LoggingService.js').getLogger();

const CONTROL_CONSTRUCT = 'control-construct';
const LOCAL_ID = 'local-id';

exports.cacheResponseBuilder = function (url, inputJson) {
  const rootKey = Object.keys(inputJson)[0];

  if (!rootKey) {
    throw new createHttpError(400, 'Invalid JSON: root key not found');
  }

  const rootPrefix = rootKey.split(':')[0];

  let currentJson = inputJson[rootKey];

  const urlSegments = url
    .split('/')
    .filter(segment => segment.trim() !== '');

  currentJson = navigateJson(currentJson, urlSegments);

  const prefix = determinePrefix(urlSegments, rootPrefix);

  return buildResponseWrapper(
    currentJson,
    urlSegments,
    prefix
  );
};


function navigateJson(currentJson, urlSegments) {
  let startParsing = false;

  for (let index = 0; index < urlSegments.length; index++) {
    const segment = urlSegments[index];

    /*
     * Start navigation after the first URL segment containing "=".
     * That first element generally identifies the root object.
     */
    if (!startParsing) {
      if (segment.includes('=')) {
        startParsing = true;
      }

      continue;
    }

    const [key, encodedValue] = splitKeyValue(segment);

    if (!key) {
      continue;
    }

    if (!Object.hasOwn(currentJson, key)) {
      if (key === CONTROL_CONSTRUCT) {
        continue;
      }

      logger.error(`Field not found: ${key}`);
      throw new createHttpError(404, `Field not found: ${key}`);
    }

    currentJson = currentJson[key];

    if (!Array.isArray(currentJson)) {
      continue;
    }

    const valueToFind = decodeURIComponent(encodedValue ?? '');

    const elementFound = currentJson.find(element =>
      element?.uuid === valueToFind ||
      element?.[LOCAL_ID] === valueToFind
    );

    if (!elementFound) {
      logger.trace(`No elements found with UUID/local-id: ${valueToFind}`);

      throw new createHttpError(
        404,
        `No elements found with UUID/local-id: ${valueToFind}`
      );
    }

    const isLastSegment = index === urlSegments.length - 1;

    if (isLastSegment) {
      logger.trace('Element found from Array');
      currentJson = [elementFound];
    } else {
      logger.trace('Element found from Object');
      currentJson = elementFound;
    }
  }

  return currentJson;
}


function determinePrefix(urlSegments, defaultPrefix) {
  for (let index = urlSegments.length - 1; index >= 0; index--) {
    const segment = urlSegments[index];

    if (!segment.includes(':')) {
      continue;
    }

    const prefix = segment.split(':', 1)[0];

    if (isIPAddress(prefix) || prefix === 'localhost') {
      return defaultPrefix;
    }

    return prefix;
  }

  return defaultPrefix;
}


function buildResponseWrapper(currentJson, urlSegments, prefix) {
  if (urlSegments.length === 0) {
    return currentJson;
  }

  const lastSegment = urlSegments.at(-1);

  if (lastSegment.includes('=')) {
    const [key] = splitKeyValue(lastSegment);
    const wrapper = `${prefix}:${key}`;

    if (lastSegment.includes(CONTROL_CONSTRUCT)) {
      return {
        [wrapper]: [currentJson]
      };
    }

    return {
      [wrapper]: [currentJson[0]]
    };
  }

  if (lastSegment.includes(':')) {
    const [, key] = lastSegment.split(':', 2);

    return {
      [`${prefix}:${key}`]: currentJson
    };
  }

  return {
    [`${prefix}:${lastSegment}`]: currentJson
  };
}


function splitKeyValue(segment) {
  const separatorIndex = segment.indexOf('=');

  if (separatorIndex === -1) {
    return [segment, undefined];
  }

  return [
    segment.substring(0, separatorIndex),
    segment.substring(separatorIndex + 1)
  ];
}


function isIPAddress(input) {
  return net.isIP(input) !== 0;
}

// const net = require('net');
// const createHttpError = require('http-errors');
// const logger = require('../LoggingService.js').getLogger();

// const CONTROLCONST = "control-construct";
// const LOCALID = 'local-id';

// exports.cacheResponseBuilder = async function (url, currentJSON) {
//   let objectKey = Object.keys(currentJSON)[0];
//   currentJSON = currentJSON[objectKey];
//   const parts = objectKey.split(':');
//   let lastkey = null;
//   let lastUrlSegment = "";
//   let penultimateUrlSegment = "";
//   const urlSegments = url.split('/').filter(segment => segment.trim() !== '');
//   let startParsing = false;
//   let i = urlSegments.length;
//   for (const segment of urlSegments) {
//     if (!startParsing) {
//       // Search second simbol "=" to start extraction
//       if (segment.includes('=')) {
//         startParsing = true;
//       }
//       i--;
//       continue;
//     }
//     //lastValue = key;
//     const [key, value] = segment.split('=');

//     // Verify if the field exists in the current JSON
//     if (currentJSON.hasOwnProperty(key)) {
//       currentJSON = currentJSON[key];
//       lastValue = key;
//       if (Array.isArray(currentJSON)) {
//         // If the field is an Array search for the field with the correct UUID or Local-id
//         const uuidToFind = decodeURIComponent(value);
//         const equipmentFound = currentJSON.find(key =>
//           (key.uuid && key.uuid === uuidToFind) ||
//           (key[LOCALID] && key[LOCALID] === uuidToFind));
//         if (equipmentFound) {
//           if (i != 1) {
//             logger.trace("equipmentFound from Object");
//             currentJSON = equipmentFound;
//           } else {
//             logger.trace("equipmentFound from Array");
//             currentJSON = [equipmentFound];
//           }
//         } else {
//           logger.trace(`No elements found with UUID: ${uuidToFind}`);
//           throw new createHttpError(404, `No elements found with UUID: ${uuidToFind}`);
//         }
//       }
//     } else {
//       lastValue = key;
//       if (key != CONTROLCONST) {
//         logger.error("Field not found: " + key);
//         throw new createHttpError(404, `Field not found: ${key}`);
//       }
//     }
//     lastkey = key;
//     i--;
//   }

//   let topJsonWrapper = "";
//   let size = urlSegments.length;
//   lastUrlSegment = urlSegments[size - 1];
//   penultimateUrlSegment = urlSegments[size - 2];
//   let targetPartIndex = -1;
//   for (let i = urlSegments.length - 1; i >= 0; i--) {
//     if (urlSegments[i].includes(':')) {
//       targetPartIndex = i;
//       break;
//     }
//   }
//   let prefix = "";
//   if (targetPartIndex == -1) {
//     prefix = parts[0];
//   } else {
//     let fullPrefix = urlSegments[targetPartIndex].split(':');
//     prefix = fullPrefix[0];
//   }

//   if (isIPAddress(prefix) || prefix == "localhost") {
//     prefix = parts[0];
//     if (lastUrlSegment.indexOf("=") != -1) {
//       let parts2 = lastUrlSegment.split("=");
//       topJsonWrapper = prefix + ":" + parts2[0];
//       if (lastUrlSegment.indexOf(CONTROLCONST) != -1) {
//         returnObject = { [topJsonWrapper]: [currentJSON] };
//       } else {
//         returnObject = { [topJsonWrapper]: [currentJSON[0]] };
//       }
//     } else {
//       topJsonWrapper = prefix + ":" + lastUrlSegment;
//       if (lastUrlSegment.indexOf(CONTROLCONST) != -1) {
//         returnObject = { [topJsonWrapper]: [currentJSON] };
//       } else {
//         returnObject = { [topJsonWrapper]: currentJSON };
//       }
//     }
//   } else if (lastUrlSegment.indexOf("=") != -1) {
//     let parts2 = lastUrlSegment.split("=");
//     topJsonWrapper = prefix + ":" + parts2[0];
//     if (lastUrlSegment.indexOf(CONTROLCONST) != -1) {
//       returnObject = { [topJsonWrapper]: [currentJSON] };
//     } else {
//       returnObject = { [topJsonWrapper]: [currentJSON[0]] };
//     }
//   } else if (lastUrlSegment.indexOf(":") != -1) {
//     let parts2 = lastUrlSegment.split(":");
//     topJsonWrapper = prefix + ":" + parts2[1];
//     returnObject = { [topJsonWrapper]: currentJSON };
//   } else {
//     topJsonWrapper = prefix + ":" + lastUrlSegment;
//     returnObject = { [topJsonWrapper]: currentJSON };
//   }

//   return returnObject;
// }

// function isIPAddress(input) {
//   return net.isIP(input) !== 0; // Return 0 if the string is not a valid IP address
// }