const createHttpError = require("http-errors");

exports.cacheUpdateBuilder = function (url, originalJSON, toInsert, filters) {
  const urlParts = url.split("?fields=");
  //TODO @latta-siae better check filters
  const myFields = urlParts[1];
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
            console.warn(`Field "${key}" not found in cache`);
            break;
          }
          //          console.log('JSON originale aggiornato:');
          //          console.log(JSON.stringify(originalJSON, null, 2));
        } else {
          lastKey = lastKey + "." + key;
          //throw new createHttpError.NotFound(`Field "${key}"="${value}" not found in cache`);

          console.warn(`No elements found with UUID: ${uuidToFind}`);
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
      //      console.log(`Campo non trovato: ${key}`);
      break;
    }
    i += 1;
  }

  if (lastKey == null) {
    lastKey = "[" + objectKey + "]";
  }

  // Verify if exists a last key and substitute it with the new JSON
  if (lastKey) { // I think now is unuseful
    //console.log(originalJSON[lastKey])

    assignValueToJson(originalJSON, lastKey, toInsert, myFields);
  }
};


// What does this function does?
function assignValueToJson(json, path, nuovoJSON, filters) {

  const pathKeys = path.split('.');

  let oggetto = json;
  let Filters = false;
  if (filters != "" && filters != undefined) {
    Filters = true;
  }
  let nomeArray = "";
  for (let i = 0; i < pathKeys.length; i++) {
    if (i == 0) {
      const chiave = pathKeys[i];
      const parentesiQuadraApertaIndex = chiave.indexOf('[');
      const parentesiQuadraChiusaIndex = chiave.indexOf(']');
      const nomeArray = chiave.substring(1, parentesiQuadraChiusaIndex);
      if (nomeArray.indexOf("control-construct") != -1) {
        oggetto = oggetto[nomeArray];
      } else {
        let objectKey = Object.keys(oggetto)[0];
        oggetto = oggetto[objectKey];
        let objectKey1 = Object.keys(oggetto)[0];
        oggetto = oggetto[nomeArray];
        // oggetto = oggetto[nomeArray];
      }
      // If the key doesn't contain square brackets get the object value
      if (i === pathKeys.length - 1) {
        // If this is the last key in the path, assign the new value
        if (Filters) {
          let objectKey = Object.keys(nuovoJSON)[0];
          let newJSON = nuovoJSON[objectKey];
          let result = mergeJson(oggetto, newJSON)
        } else {
          if (nuovoJSON === null) {
            oggetto[nomeArray].splice(indice, 1);
          } else {
            let objectKey = Object.keys(nuovoJSON)[0];
            let newJSON = nuovoJSON[objectKey];
            //   oggetto[nomeArray] = newJSON;
            oggetto = newJSON;
          }
        }
      }
    } else {
      const chiave = pathKeys[i];
      const parentesiQuadraApertaIndex = chiave.indexOf('[');
      const parentesiQuadraChiusaIndex = chiave.indexOf(']');

      // This happen when 
      if (parentesiQuadraApertaIndex !== -1 && parentesiQuadraChiusaIndex !== -1) {
        nomeArray = chiave.substring(0, parentesiQuadraApertaIndex);
        const indice = parseInt(chiave.substring(parentesiQuadraApertaIndex + 1, parentesiQuadraChiusaIndex), 10);

        if (i === pathKeys.length - 1) {
          // If this is the last key in the path, assign the new value
          if (Filters) {
            let objectKey = Object.keys(nuovoJSON)[0];
            let newJSON = nuovoJSON[objectKey];
            let result = mergeJson(oggetto[nomeArray][indice], newJSON)
          } else {
            if (nuovoJSON === null) {
              oggetto[nomeArray].splice(indice, 1);
              //delete oggetto[nomeArray][indice];
            } else {
              let objectKey = Object.keys(nuovoJSON)[0];
              let newJSON = nuovoJSON[objectKey][0];
              oggetto[nomeArray][indice] = newJSON;
            }
          }
        } else {
          // Otherwise go on parsing the object
          oggetto = oggetto[nomeArray][indice];
        }
      } else {
        // If the key doesn't contain square brackets get the objet value
        if (i === pathKeys.length - 1) {
          // Se questa è l'ultima chiave nel percorso, assegna il nuovo valore
          if (Filters) {
            let objectKey = Object.keys(nuovoJSON)[0];
            let newJSON = nuovoJSON[objectKey];
            let result = mergeJson(oggetto[nomeArray], newJSON)
          } else {
            if (nuovoJSON != null) {
              let objectKey = Object.keys(nuovoJSON)[0];
              let newJSON = nuovoJSON[objectKey][0];
              oggetto[nomeArray][indice] = newJSON;
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
    let newJSON = nuovoJSON[objectKey];
    let result = mergeJson(oggetto, newJSON)
  } else {
    if (nuovoJSON !== null) {
      let objectKey = Object.keys(nuovoJSON)[0];
      let newJSON = nuovoJSON[objectKey]
      Object.assign(oggetto ,newJSON);
    }
  }
  */
}

function mergeJson(target, source) {
  if (Array.isArray(source)) {
    for (let i = 0; i < source.length; i++) {
      if (Array.isArray(target)) {
        mergeJson(target[i], source[i]);
      } else {
        mergeJson(target, source[i]);
      }
    }
  } else if (typeof source === 'object') {
    for (const key in source) {
      if (typeof source[key] === 'object') {
        if (target[key] && typeof target[key] === 'object') {
          mergeJson(target[key], source[key]);
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
