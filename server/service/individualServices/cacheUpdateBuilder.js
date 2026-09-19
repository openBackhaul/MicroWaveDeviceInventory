const createHttpError = require("http-errors");
const logger = require('../LoggingService.js').getLogger();

//////////////////////////////////////////////////////////////////////////////////////
// New Routine
exports.cacheUpdateBuilder = function cacheUpdateBuilder(url, originalJSON, toInsert, hasFilter) {
  if (process.env.WRITE_FAST_ROUTINES &&
    process.env.WRITE_FAST_ROUTINES.toLowerCase() === "true") {
    return cacheUpdateBuilderNew(url, originalJSON, toInsert, hasFilter); // This has to be review
  } else {
    return cacheUpdateBuilderOld(url, originalJSON, toInsert, hasFilter);
  }
}

/**
 * Updates the cached JSON according to the resource addressed by the URL.
 *
 * Operations:
 * - hasFilter === true -> merge partial response into existing object
 * - toInsert === null  -> delete addressed resource
 * - otherwise          -> replace/insert addressed resource
 */
function cacheUpdateBuilderNew(url, originalJSON, toInsert, hasFilter) {
  if (!originalJSON || typeof originalJSON !== 'object') {
    logger.warn(`cacheUpdateBuilder: originalJSON missing/invalid. url=${url}`);
    return originalJSON;
  }

  const rootKey = Object.keys(originalJSON)[0];

  if (!rootKey) {
    logger.warn(`cacheUpdateBuilder: originalJSON is empty. url=${url}`);
    return originalJSON;
  }

  const root = originalJSON[rootKey];

  if (root == null || typeof root !== 'object') {
    logger.warn(`cacheUpdateBuilder: invalid root "${rootKey}". url=${url}`);
    return originalJSON;
  }

  /*
   * Ignore ?fields=... during navigation.
   * hasFilter already tells us whether the response is partial.
   */
  const queryIndex = url.indexOf('?');
  const resourceUrl = queryIndex === -1 ? url : url.slice(0, queryIndex);

  const segments = resourceUrl.split('/').filter(Boolean);

  let current = root;
  let target = {
    parent: originalJSON,
    key: rootKey,
    index: null,
    value: root
  };

  let parsingStarted = false;

  for (const segment of segments) {
    const equalIndex = segment.indexOf('=');

    /*
     * Skip everything until the first addressed URL resource.
     * Example: http://.../control-construct=xxx/...
     */
    if (!parsingStarted) {
      if (equalIndex !== -1) {
        parsingStarted = true;
      }

      continue;
    }

    /*
     * Segment can be:
     *
     * logical-termination-point=123
     *
     * or simply:
     *
     * configuration
     */
    const key = equalIndex === -1 ? segment : segment.slice(0, equalIndex);
    const encodedValue = equalIndex === -1 ? undefined : segment.slice(equalIndex + 1);

    if (current == null || typeof current !== 'object') {
      logger.warn(`cacheUpdateBuilder: cannot navigate "${key}". url=${url}`);
      break;
    }

    /*
     * Property doesn't exist yet.
     * Remember its parent so that it can potentially be inserted.
     */
    if (!Object.hasOwn(current, key)) {
      target = {
        parent: current,
        key,
        index: null,
        value: undefined
      };

      break;
    }

    const child = current[key];

    /*
     * Array resource addressed by uuid/local-id.
     */
    if (Array.isArray(child) && encodedValue !== undefined) {
      const id = safeDecodeURIComponent(encodedValue);

      const index = findResourceIndex(child, id);

      if (index === -1) {
        /*
         * Resource not currently present.
         * Keep reference to the array itself.
         */
        target = {
          parent: current,
          key,
          index: null,
          value: child
        };

        break;
      }

      target = {
        parent: child,
        key: null,
        index,
        value: child[index]
      };

      current = child[index];

      continue;
    }

    /*
     * Normal property.
     */
    target = {
      parent: current,
      key,
      index: null,
      value: child
    };

    current = child;
  }

  updateTarget(target, toInsert, hasFilter);

  return originalJSON;
};


/**
 * Finds an element inside an ONF resource array.
 */
function findResourceIndex(array, id) {
  for (let i = 0; i < array.length; i++) {
    const item = array[i];

    if (item && (item.uuid === id || item['local-id'] === id)) {
      return i;
    }
  }

  return -1;
}


/**
 * Performs the actual cache modification.
 */
function updateTarget(target, newJSON, hasFilter) {
  if (!target || !target.parent) {
    return;
  }

  /*
   * ---------------------------------------------------------
   * FILTERED RESPONSE
   * ---------------------------------------------------------
   *
   * A response generated using ?fields= contains only part of
   * the object.
   *
   * Therefore we must merge it into the cached object instead
   * of replacing the entire object.
   */
  if (hasFilter) {
    if (newJSON == null) {
      return;
    }

    const payload = unwrapRoot(newJSON);

    if (target.value && typeof target.value === 'object' && payload && typeof payload === 'object') {
      mergeJson(target.value, payload);
    }

    return;
  }

  /*
   * ---------------------------------------------------------
   * ARRAY ELEMENT
   * ---------------------------------------------------------
   *
   * Example:
   *
   * logical-termination-point[3]
   */
  if (target.index !== null) {
    const array = target.parent;

    if (!Array.isArray(array)) {
      return;
    }

    if (newJSON === null) {
      array.splice(target.index, 1);
      return;
    }

    let payload = unwrapRoot(newJSON);

    // REST response may wrap a single resource in an array.
    if (Array.isArray(payload)) {
      payload = payload[0];
    }

    array[target.index] = payload;

    return;
  }

  // OBJECT PROPERTY
  const parent = target.parent;
  const key = target.key;

  if (key == null) {
    return;
  }

  // Delete operation.
  if (newJSON === null) {
    if (Array.isArray(parent[key])) {
      parent[key].length = 0;
    } else {
      delete parent[key];
    }

    return;
  }

  const rootKey = getRootKey(newJSON);
  const payload = unwrapRoot(newJSON);

  /*
   * ---------------------------------------------------------
   * PAC special case
   * ---------------------------------------------------------
   *
   * Preserve the behaviour from the original implementation.
   */
  if (rootKey && rootKey.includes(':') && typeof key === 'string' && key.includes('-pac')) {
    const colonIndex = rootKey.indexOf(':');
    const pacKey = rootKey.slice(colonIndex + 1);

    logger.debug('This is PAC configuration');

    parent[pacKey] = payload;

    return;
  }

  //Existing array -> append returned resource(s).
  if (Array.isArray(parent[key])) {
    if (Array.isArray(payload)) {
      parent[key].push(...payload);
    } else {
      parent[key].push(payload);
    }

    return;
  }

  // Standard replacement.
  parent[key] = payload;
}


// Removes the root wrapper from an ONF response.
// Example:
// { "core-model-1-4:logical-termination-point": [...] }
// becomes:
// [...]
function unwrapRoot(json) {
  if (json === null || typeof json !== 'object' || Array.isArray(json)) {
    return json;
  }

  const keys = Object.keys(json);

  if (keys.length === 0) {
    return json;
  }

  return json[keys[0]];
}

// Returns the first/root property name.
function getRootKey(json) {
  if (json === null || typeof json !== 'object' || Array.isArray(json)) {
    return undefined;
  }

  return Object.keys(json)[0];
}

// Avoid cache update failure caused by malformed URL encoding.
function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Merge partial/filtered JSON into the cached object.
// Only properties already present in the target are updated.
function mergeJson(target, source) {
  if (target == null || source == null || typeof target !== 'object' || typeof source !== 'object') {
    return;
  }

  if (Array.isArray(source)) {
    if (!Array.isArray(target)) {
      return;
    }

    const length = Math.min(target.length, source.length);

    for (let i = 0; i < length; i++) {
      mergeJson(target[i], source[i]);
    }

    return;
  }

  for (const key of Object.keys(source)) {
    if (!Object.hasOwn(target, key)) {
      continue;
    }

    const sourceValue = source[key];
    const targetValue = target[key];

    if (sourceValue !== null && typeof sourceValue === 'object') {
      if (targetValue !== null && typeof targetValue === 'object') {
        mergeJson(targetValue, sourceValue);
      }

      continue;
    }

    target[key] = sourceValue;
  }
}

//////////////////////////////////////////////////////////////////////////////////////
// OLD Routine

function cacheUpdateBuilderOld(url, originalJSON, toInsert, hasFilter) {
  if (!originalJSON || typeof originalJSON !== "object") {
    logger.warn(`cacheUpdateBuilder: originalJSON missing/invalid. url=${url}`);
    return originalJSON; // or {} depending on your expected behavior
  }
  const urlParts = url.split("?fields=");
  const myFields = urlParts[1];
  // let hasFilter = filters ? filters : (myFields != "" && myFields != undefined);

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
        const indexToChange = currentJSON[key].findIndex(item => {
          return (item.uuid == uuidToFind || item['local-id'] == uuidToFind)
        }
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

         // logger.warn(`No elements found with UUID: ${uuidToFind}`);
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
      lastKey = lastKey + "." + key;
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
    assignValueToJsonOld(originalJSON, lastKey, toInsert, hasFilter);
  }
};


// What does this function does?
function assignValueToJsonOld(json, path, newJSON, hasFilters) {

  const pathKeys = path.split('.');

  let objJSON = json;

  if (objJSON === undefined || objJSON === null) {
    logger.warn(`assignValueToJsonOld: path not present. path=${path}`);
    return;
  }
  // Unused code
  // let Filters = false;
  // if (filters != "" && filters != undefined) {
  //   Filters = true;
  // }
  let arrayName = "";
  for (let i = 0; i < pathKeys.length; i++) {
    if (i == 0) { // Only for the first item of the loop
      const keyToUse = pathKeys[i];
      const squareBracketOpenIdx = keyToUse.indexOf('[');
      const squareBracketCloseIdx = keyToUse.indexOf(']');
      arrayName = keyToUse.substring(1, squareBracketCloseIdx);
      if (arrayName.indexOf("control-construct") != -1) {
        objJSON = objJSON[arrayName];
      } else {
        let objectKey = Object.keys(objJSON)[0];
        objJSON = objJSON[objectKey];
        // let objectKey1 = Object.keys(objJSON)[0]; // no more used
        objJSON = objJSON[arrayName];
      }
      // If the key doesn't contain square brackets get the object value
      if (i === pathKeys.length - 1) {
        // If this is the last key in the path, assign the new value
        if (hasFilters) {
          let objectKey = Object.keys(newJSON)[0];
          let result = mergeJsonOld(objJSON, newJSON[objectKey]);
        } else {
          if (newJSON === null) {
            objJSON[arrayName].splice(indice, 1); // indice doesn't exists
          } else {
            let objectKey = Object.keys(newJSON)[0];
            objJSON = newJSON[objectKey];
          }
        }
      }
    } else { // From the second element of iteration
      const keyToUse = pathKeys[i];
      const squareBracketOpenIdx = keyToUse.indexOf('[');
      const squareBracketCloseIdx = keyToUse.indexOf(']');

      // This happen when is an array
      if (squareBracketOpenIdx !== -1 && squareBracketCloseIdx !== -1) {
        arrayName = keyToUse.substring(0, squareBracketOpenIdx);
        const index = parseInt(keyToUse.substring(squareBracketOpenIdx + 1, squareBracketCloseIdx), 10);

        if (i === pathKeys.length - 1) {
          // If this is the last key in the path, assign the new value
          if (hasFilters) {
            let objectKey = Object.keys(newJSON)[0];
            let result = mergeJsonOld(objJSON[arrayName][index], newJSON[objectKey]);
          } else {
            if (newJSON === null) {
              objJSON[arrayName].splice(index, 1);
              //delete objJSON[arrayName][index];
            } else {
              let objectKey = Object.keys(newJSON)[0];
              let objectToBeInserted =  newJSON[objectKey];
              if(objectToBeInserted instanceof Array){
                console.log("object is an array");
                objectToBeInserted = objectToBeInserted[0];
                objJSON[arrayName][index] = objectToBeInserted;
              }
              objJSON[arrayName][index] = objectToBeInserted;
            }
          }
        } else {
          // Otherwise go on parsing the object
          objJSON = objJSON[arrayName][index];
        }
      } else { // This is a scalar/object value
        // If the key doesn't contain square brackets get the objet value
        if (i === pathKeys.length - 1) {
          if (pathKeys.length == 2) {
            arrayName = keyToUse;
          }
          // If is the last key on the path, then assign the value
          if (hasFilters) {
            let objectKey = Object.keys(newJSON)[0];
            let result = mergeJsonOld(objJSON[keyToUse], newJSON[objectKey]);
          } else {
            if (newJSON != null) {
              let objectKey = Object.keys(newJSON)[0];
              // if is latest
              if (i == pathKeys.length - 1 && objectKey.includes(":") && arrayName.includes("-pac")) {
                logger.debug("This is PAC configuration");
                let keyLast = objectKey.split(":");
                objJSON[keyLast[1]] = newJSON[objectKey];
              } else {
                logger.debug("This doesn't have pac configuration");
                if (Array.isArray(objJSON[keyToUse])) {
                  if (Array.isArray(newJSON[objectKey])) {
                    newJSON[objectKey].forEach(item => {
                      objJSON[keyToUse].push(item);
                    })
                  } else {
                    objJSON[keyToUse].push(newJSON[objectKey]);
                  }
                } else if (typeof objJSON[keyToUse] == "object") {
                  objJSON[keyToUse] = {...newJSON[objectKey]};
                } else if (pathKeys.length == 2) {
                  objJSON[arrayName] = newJSON[objectKey];
                } else {
                  objJSON[keyToUse] = newJSON[objectKey];
                }
              }
            }
          }
        } else {
          // Otherwise go on parsing the object
          objJSON = objJSON[keyToUse];
          arrayName = keyToUse;
        }
      }
    }
  }
  /*
  if (Filters) {
    let objectKey = Object.keys(newJSON)[0];
    let result = mergeJsonOld(objJSON, newJSON[objectKey]);
  } else {
    if (newJSON !== null) {
      let objectKey = Object.keys(newJSON)[0];
      Object.assign(objJSON ,newJSON[objectKey]);
    }
  }
  */
}

function mergeJsonOld(target, source) {
  if (Array.isArray(source)) {
    for (let i = 0; i < source.length; i++) {
      if (Array.isArray(target)) {
        mergeJsonOld(target[i], source[i]); // Recursive function
      } else {
        mergeJsonOld(target, source[i]); // Recursive function
      }
    }
  } else if (typeof source === 'object') {
    for (const key in source) {
      if (typeof source[key] === 'object') {
        if (target[key] && typeof target[key] === 'object') {
          mergeJsonOld(target[key], source[key]); // Recursive function
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
