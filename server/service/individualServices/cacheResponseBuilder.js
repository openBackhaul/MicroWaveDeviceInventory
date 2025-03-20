const net = require('net');
const createHttpError = require('http-errors');
const logger = require('../LoggingService.js').getLogger();

const CONTROLCONST = "control-construct";
const LOCALID = 'local-id';

exports.cacheResponseBuilder = async function (url, currentJSON) {
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