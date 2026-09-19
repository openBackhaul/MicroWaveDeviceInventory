const net = require('net');
const createHttpError = require('http-errors');
const logger = require('../LoggingService.js').getLogger();

const CONTROLCONST = "control-construct";
const LOCALID = 'local-id';

exports.cacheResponseBuilder = function (url, currentJSON) {
  if (process.env.FAST_ROUTINES &&
    process.env.FAST_ROUTINES.toLowerCase() === "true") {
    return cacheResponseBuilderNew(url, currentJSON); // This has to be review
  } else {
    return cacheResponseBuilderOld(url, currentJSON);
  }
}

// New Routine
function cacheResponseBuilderNew(url, currentJSON) {
  if (!url || !currentJSON || typeof currentJSON !== 'object') {
    throw createHttpError(400, 'Invalid input');
  }

  const objectKey = Object.keys(currentJSON)[0];

  if (!objectKey) {
    throw createHttpError(404, 'Empty JSON object');
  }

  const rootPrefix = objectKey.split(':')[0];
  let current = currentJSON[objectKey];

  const urlSegments = url
    .split('/')
    .filter(Boolean);

  let startParsing = false;

  // ------------------------------------------------------------
  // Navigate through the JSON according to the URL
  // ------------------------------------------------------------
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

    const separatorIndex = segment.indexOf('=');

    const key =
      separatorIndex === -1
        ? segment
        : segment.substring(0, separatorIndex);

    const value =
      separatorIndex === -1
        ? undefined
        : segment.substring(separatorIndex + 1);

    if (!Object.prototype.hasOwnProperty.call(current, key)) {
      // control-construct is allowed to be absent because it can
      // already be represented by the root object
      if (key !== CONTROLCONST) {
        logger.error(`Field not found: ${key}`);
        throw createHttpError(404, `Field not found: ${key}`);
      }

      continue;
    }

    current = current[key];

    // ----------------------------------------------------------
    // Select the requested list element
    // ----------------------------------------------------------
    if (Array.isArray(current) && value !== undefined) {
      const valueToFind = decodeURIComponent(value);

      const elementFound = current.find(item =>
        item?.uuid === valueToFind ||
        item?.[LOCALID] === valueToFind
      );

      if (!elementFound) {
        logger.trace(`No elements found with UUID/local-id: ${valueToFind}`);

        throw createHttpError(
          404,
          `No elements found with UUID/local-id: ${valueToFind}`
        );
      }

      const isLastSegment = index === urlSegments.length - 1;

      current = isLastSegment
        ? [elementFound]
        : elementFound;
    }
  }

  // ------------------------------------------------------------
  // Determine namespace prefix
  // ------------------------------------------------------------
  let prefix = rootPrefix;

  for (let index = urlSegments.length - 1; index >= 0; index--) {
    if (urlSegments[index].includes(':')) {
      prefix = urlSegments[index].split(':')[0];
      break;
    }
  }

  if (isIPAddress(prefix) || prefix === 'localhost') {
    prefix = rootPrefix;
  }

  // ------------------------------------------------------------
  // Build response wrapper
  // ------------------------------------------------------------
  const lastSegment = urlSegments.at(-1);

  if (!lastSegment) {
    throw createHttpError(400, 'Invalid URL');
  }

  if (lastSegment.includes('=')) {
    const key = lastSegment.split('=', 1)[0];
    const wrapper = `${prefix}:${key}`;

    if (key === CONTROLCONST) {
      return {
        [wrapper]: [current]
      };
    }

    return {
      [wrapper]: [Array.isArray(current) ? current[0] : current]
    };
  }

  if (lastSegment.includes(':')) {
    const [, key] = lastSegment.split(':');

    return {
      [`${prefix}:${key}`]: current
    };
  }

  return {
    [`${prefix}:${lastSegment}`]: current
  };
}



// -- Old Routine
function cacheResponseBuilderOld (url, currentJSON) {
  let objectKey = Object.keys(currentJSON)[0];
  currentJSON = currentJSON[objectKey];
  const parts = objectKey.split(':');
  let lastkey = null;
  let lastUrlSegment = "";
  let penultimateUrlSegment = "";
  const urlSegments = url.split('/').filter(segment => segment.trim() !== '');
  let startParsing = false;
  let i = urlSegments.length;
  for (const segment of urlSegments) {
    if (!startParsing) {
      // Search second simbol "=" to start extraction
      if (segment.includes('=')) {
        startParsing = true;
      }
      i--;
      continue;
    }
    //lastValue = key;
    const [key, value] = segment.split('=');

    // Verify if the field exists in the current JSON
    if (currentJSON.hasOwnProperty(key)) {
      currentJSON = currentJSON[key];
      lastValue = key;
      if (Array.isArray(currentJSON)) {
        // If the field is an Array search for the field with the correct UUID or Local-id
        const uuidToFind = decodeURIComponent(value);
        const equipmentFound = currentJSON.find(key =>
          (key.uuid && key.uuid === uuidToFind) ||
          (key[LOCALID] && key[LOCALID] === uuidToFind));
        if (equipmentFound) {
          if (i != 1) {
            logger.trace("equipmentFound from Object");
            currentJSON = equipmentFound;
          } else {
            logger.trace("equipmentFound from Array");
            currentJSON = [equipmentFound];
          }
        } else {
          logger.trace(`No elements found with UUID: ${uuidToFind}`);
          throw new createHttpError(404, `No elements found with UUID: ${uuidToFind}`);
        }
      }
    } else {
      lastValue = key;
      if (key != CONTROLCONST) {
        logger.error("Field not found: " + key);
        throw new createHttpError(404, `Field not found: ${key}`);
      }
    }
    lastkey = key;
    i--;
  }

  let topJsonWrapper = "";
  let size = urlSegments.length;
  lastUrlSegment = urlSegments[size - 1];
  penultimateUrlSegment = urlSegments[size - 2];
  let targetPartIndex = -1;
  for (let i = urlSegments.length - 1; i >= 0; i--) {
    if (urlSegments[i].includes(':')) {
      targetPartIndex = i;
      break;
    }
  }
  let prefix = "";
  if (targetPartIndex == -1) {
    prefix = parts[0];
  } else {
    let fullPrefix = urlSegments[targetPartIndex].split(':');
    prefix = fullPrefix[0];
  }

  if (isIPAddress(prefix) || prefix == "localhost") {
    prefix = parts[0];
    if (lastUrlSegment.indexOf("=") != -1) {
      let parts2 = lastUrlSegment.split("=");
      topJsonWrapper = prefix + ":" + parts2[0];
      if (lastUrlSegment.indexOf(CONTROLCONST) != -1) {
        returnObject = { [topJsonWrapper]: [currentJSON] };
      } else {
        returnObject = { [topJsonWrapper]: [currentJSON[0]] };
      }
    } else {
      topJsonWrapper = prefix + ":" + lastUrlSegment;
      if (lastUrlSegment.indexOf(CONTROLCONST) != -1) {
        returnObject = { [topJsonWrapper]: [currentJSON] };
      } else {
        returnObject = { [topJsonWrapper]: currentJSON };
      }
    }
  } else if (lastUrlSegment.indexOf("=") != -1) {
    let parts2 = lastUrlSegment.split("=");
    topJsonWrapper = prefix + ":" + parts2[0];
    if (lastUrlSegment.indexOf(CONTROLCONST) != -1) {
      returnObject = { [topJsonWrapper]: [currentJSON] };
    } else {
      returnObject = { [topJsonWrapper]: [currentJSON[0]] };
    }
  } else if (lastUrlSegment.indexOf(":") != -1) {
    let parts2 = lastUrlSegment.split(":");
    topJsonWrapper = prefix + ":" + parts2[1];
    returnObject = { [topJsonWrapper]: currentJSON };
  } else {
    topJsonWrapper = prefix + ":" + lastUrlSegment;
    returnObject = { [topJsonWrapper]: currentJSON };
  }
  /*
      if (penultimateUrlSegment.indexOf(":") != -1 && lastUrlSegment.indexOf("control-construct") == -1) {
          const parts1 = penultimateUrlSegment.split(':');
          if (lastUrlSegment.indexOf("+") != -1){
              const parts = lastUrlSegment.split('=');
              lastUrlSegment = parts[0];
          }
          topJsonWrapper = parts1[0] + ":" + lastUrlSegment;
          returnObject = { [topJsonWrapper]: currentJSON };
      } else if (lastUrlSegment.indexOf(":") != -1){
          if (lastUrlSegment.indexOf("+") != -1){
              const parts = lastUrlSegment.split('+');
              lastUrlSegment = parts[1];
          }
          topJsonWrapper =  lastUrlSegment;
          returnObject = { [topJsonWrapper]: currentJSON };
      } else if (lastUrlSegment.indexOf("=") != -1) {
          let parts2 = lastUrlSegment.split("=");
          topJsonWrapper = parts[0] + ":" + parts2[0];
          if (lastUrlSegment.indexOf("control-construct") != -1){
              returnObject = { [topJsonWrapper]: [currentJSON] };
          } else {
              returnObject = { [topJsonWrapper]: [currentJSON[0]] };
          }
      } else {
          if (isIPAddress(prefix) || prefix == "localhost"){
              prefix = parts[0];
          }
          topJsonWrapper = prefix + ":" + lastUrlSegment;
          returnObject = { [topJsonWrapper]: currentJSON };
      }
  */
  return returnObject;
}

function notFoundError(message) {
  const myJson = {
    "code": 404,
    "message": message
  };
  return myJson;
}

function isIPAddress(input) {
  return net.isIP(input) !== 0; // Return 0 if the string is not a valid IP address
}

