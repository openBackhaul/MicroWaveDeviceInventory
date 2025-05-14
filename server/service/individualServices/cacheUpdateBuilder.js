const createHttpError = require("http-errors");
const logger = require('../LoggingService.js').getLogger();

exports.cacheUpdateBuilder = function (url, originalJSON, toInsert, filters) {
  const urlParts = url.split("?fields=");
  const myFields = urlParts[1];
  let hasFilter = filters ? filters : (myFields != "" && myFields != undefined);

  // Analyze URL to extract segments
  const urlSegments = urlParts[0].split('/').filter(segment => segment.trim() !== '');

  let currentJSON = originalJSON;
  let objectKey = Object.keys(currentJSON)[0];
  currentJSON = currentJSON[objectKey];
  let startParsing = false;
  let lastKey = null;
  let i = 1;
  for (const segment of urlSegments) {
    if (!startParsing) {
      // Search second simbol "=" to start extraction
      if (segment.includes('=')) {
        startParsing = true;
      }
      continue;
    }

    const [key, value] = segment.split('=');

    // Verify if the property exists in the current JSON
    if (currentJSON.hasOwnProperty(key)) {
      if (Array.isArray(currentJSON[key])) {
        // If the field is an array try to find the elemnt with the corrispondent UUID
        const uuidToFind = decodeURIComponent(value);
        const indexToChange = currentJSON[key].findIndex(item =>
          (item.uuid && item.uuid === uuidToFind) ||
          (item['local-id'] && item['local-id'] === uuidToFind)
        );
        if (indexToChange !== -1) {
          // Substitute only the element into the array with the new JSON
          if (currentJSON[key]) {
            if (i == 1) {
              lastKey = "[" + objectKey + "]" + "." + key + "[" + indexToChange + "]";
            } else {
              lastKey = lastKey + "." + key + "[" + indexToChange + "]";
            }
            currentJSON = currentJSON[key][indexToChange];
          } else {
            logger.warn(`Field "${key}" not found in cache`);
            break;
          }
          // logger.trace('original JSON updated:');
          // logger.trace(JSON.stringify(originalJSON, null, 2));
        } else {
          lastKey = lastKey + "." + key;
          //throw new createHttpError.NotFound(`Field "${key}"="${value}" not found in cache`);

          logger.warn(`No elements found with UUID: ${uuidToFind}`);
          break;
        }
      } else {
        // If the field is not an array, update last key
        if (lastKey != null) {
          lastKey = lastKey + "." + key;
        } else {
          lastKey = "[" + key + "]";
        }
        currentJSON = currentJSON[key];
      }
    } else {
      // logger.trace(`Field not found: ${key}`);
      break;
    }
    i += 1;
  }

  if (lastKey == null) {
    lastKey = "[" + objectKey + "]";
  }

  // Verify if exists a last key and substitute it with the new JSON
  if (lastKey) { // I think now is unuseful
    // logger.trace(originalJSON[lastKey])
    assignValueToJson(originalJSON, lastKey, toInsert, hasFilter);
  }
};


// What does this function does?
function assignValueToJson(json, path, nuovoJSON, hasFilters) {

  const pathKeys = path.split('.');

  let oggetto = json;
  // Unused code
  // let Filters = false;
  // if (filters != "" && filters != undefined) {
  //   Filters = true;
  // }
  let nomeArray = "";
  for (let i = 0; i < pathKeys.length; i++) {
    if (i == 0) { // Only for the first item of the loop
      const chiave = pathKeys[i];
      const squareBracketOpenIdx = chiave.indexOf('[');
      const squareBracketCloseIdx = chiave.indexOf(']');
      nomeArray = chiave.substring(1, squareBracketCloseIdx);
      if (nomeArray.indexOf("control-construct") != -1) {
        oggetto = oggetto[nomeArray];
      } else {
        let objectKey = Object.keys(oggetto)[0];
        oggetto = oggetto[objectKey];
        // let objectKey1 = Object.keys(oggetto)[0]; // no more used
        oggetto = oggetto[nomeArray];
      }
      // If the key doesn't contain square brackets get the object value
      if (i === pathKeys.length - 1) {
        // If this is the last key in the path, assign the new value
        if (hasFilters) {
          let objectKey = Object.keys(nuovoJSON)[0];
          // let newJSON = nuovoJSON[objectKey]; // Old Code
          let result = mergeJson(oggetto, nuovoJSON[objectKey]);
        } else {
          if (nuovoJSON === null) {
            oggetto[nomeArray].splice(indice, 1);
          } else {
            let objectKey = Object.keys(nuovoJSON)[0];
            // let newJSON = nuovoJSON[objectKey];  // Old code
            //   oggetto[nomeArray] = nuovoJSON[objectKey];
            oggetto = nuovoJSON[objectKey];
          }
        }
      }
    } else { // From the second element of iteration
      const chiave = pathKeys[i];
      const squareBracketOpenIdx = chiave.indexOf('[');
      const squareBracketCloseIdx = chiave.indexOf(']');

      // This happen when is an array
      if (squareBracketOpenIdx !== -1 && squareBracketCloseIdx !== -1) {
        nomeArray = chiave.substring(0, squareBracketOpenIdx);
        const index = parseInt(chiave.substring(squareBracketOpenIdx + 1, squareBracketCloseIdx), 10);

        if (i === pathKeys.length - 1) {
          // If this is the last key in the path, assign the new value
          if (hasFilters) {
            let objectKey = Object.keys(nuovoJSON)[0];
            // let newJSON = nuovoJSON[objectKey]; // Old code
            let result = mergeJson(oggetto[nomeArray][index], nuovoJSON[objectKey]);
          } else {
            if (nuovoJSON === null) {
              oggetto[nomeArray].splice(index, 1);
              //delete oggetto[nomeArray][index];
            } else {
              let objectKey = Object.keys(nuovoJSON)[0];
              // let newJSON = nuovoJSON[objectKey]; // Old code
              oggetto[nomeArray][index] = nuovoJSON[objectKey];
            }
          }
        } else { 
          // Otherwise go on parsing the object
          oggetto = oggetto[nomeArray][index];
        }
      } else { // This is a scalar/object value
        // If the key doesn't contain square brackets get the objet value
        if (i === pathKeys.length - 1) {
          if (pathKeys.length == 2) {
            nomeArray = chiave;
          }
          // If is the last key on the path, then assign the value
          if (hasFilters) {
            let objectKey = Object.keys(nuovoJSON)[0];
            // let newJSON = nuovoJSON[objectKey]; // Old code
            let result = mergeJson(oggetto[chiave], nuovoJSON[objectKey]);
          } else {
            if (nuovoJSON != null) {
              let objectKey = Object.keys(nuovoJSON)[0];
              // let newJSON = nuovoJSON[objectKey][0];  // Issue 1092
              // let newJSON = nuovoJSON[objectKey]; // Old code
              oggetto[nomeArray] = nuovoJSON[objectKey];
            }
          }
        } else {
          // Otherwise go on parsing the object
          oggetto = oggetto[chiave];
          nomeArray = chiave;
        }
      }
    }
  }
  /*
  if (Filters) {
    let objectKey = Object.keys(nuovoJSON)[0];
    let result = mergeJson(oggetto, nuovoJSON[objectKey]);
  } else {
    if (nuovoJSON !== null) {
      let objectKey = Object.keys(nuovoJSON)[0];
      Object.assign(oggetto ,nuovoJSON[objectKey]);
    }
  }
  */
}

function mergeJson(target, source) {
  if (Array.isArray(source)) {
    for (let i = 0; i < source.length; i++) {
      if (Array.isArray(target)) {
        mergeJson(target[i], source[i]); // Recursive function
      } else {
        mergeJson(target, source[i]); // Recursive function
      }
    }
  } else if (typeof source === 'object') {
    for (const key in source) {
      if (typeof source[key] === 'object') {
        if (target[key] && typeof target[key] === 'object') {
          mergeJson(target[key], source[key]); // Recursive function
        }
      } else {
        const sourceValue = source[key];
        if (target[key] !== undefined) {
          target[key] = sourceValue;
        }
      }
    }
  }
}