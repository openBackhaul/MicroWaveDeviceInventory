
function getCloseParIdOld(str, openParId) {
  var currStr = str.substring(openParId + 1)

  var endId = -1
  var nb = 1
  var id = 0
  var loopNb = 0
  while (endId == -1) {
    loopNb++
    var openId = currStr.indexOf('(')
    var closeId = currStr.indexOf(')')
    if (closeId >= 0 && (openId < 0 || closeId < openId)) {
      nb--
      id = id + closeId + 1
      currStr = currStr.substring(closeId + 1)
    } else if (openId >= 0 && (closeId < 0 || openId < closeId)) {
      nb++
      id = id + openId + 1
      currStr = currStr.substring(openId + 1)
    } else if (loopNb > 100) {
      endId = -2
    } else {
      endId = -2
    }
    if (nb == 0) {
      endId = id
    }
  }

  if (endId >= 0) {
    var currStr = str.substring(openParId + 1, openParId + endId)
    return openParId + endId + 1
  } else {
    return -1
  }
}

function decodeFieldsSubstringOld(inputStr, startId, parentObj) {
  var str = inputStr.substring(startId)

  var openParId = str.indexOf('(')
  var pvId = str.indexOf(';')
  var slashId = str.indexOf('/')
  var ret = 0

  if (openParId >= 0 && (openParId < pvId || pvId < 0) && (openParId < slashId || slashId < 0)) {
    var closeParId = getCloseParIdOld(str, openParId)
    if (closeParId < 0) {
      return -1
    }

    var parentStr = str.substring(0, openParId)
    var currObj = { value: parentStr, children: [] }
    parentObj.children.push(currObj)

    var childStr = str.substring(openParId + 1, closeParId - 1)

    ret = decodeFieldsSubstringOld(childStr, 0, currObj)
    ret = decodeFieldsSubstringOld(inputStr, closeParId, parentObj)
  } else if (pvId >= 0 && (pvId < openParId || openParId < 0) && (pvId < slashId || slashId < 0)) {
    if (pvId > 0) {
      var parentStr = str.substring(0, pvId)
      var currObj = { value: parentStr, children: [] }
      parentObj.children.push(currObj)
    }

    var nextStr = str.substring(pvId + 1)
    ret = decodeFieldsSubstringOld(nextStr, 0, parentObj)
  } else if (slashId >= 0 && (slashId < openParId || openParId < 0) && (slashId < pvId || pvId < 0)) {
    var parentStr = str.substring(0, slashId)
    var currObj = { value: parentStr, children: [] }
    parentObj.children.push(currObj)

    var nextStr = str.substring(slashId + 1)
    pvId = nextStr.indexOf(';')
    openParId = nextStr.indexOf('(')
    var childStr = ""
    if (openParId >= 0 && (openParId < pvId || pvId < 0)) {
      var closeParId = getCloseParIdOld(nextStr, openParId)
      if (closeParId < 0) {
        return -1
      }

      var nextPvId = nextStr.substring(closeParId).indexOf(';')
      if (nextPvId >= 0) {
        pvId = closeParId + nextPvId;
      } else {
        pvId = -1;
      }
    }

    if (pvId >= 0) {
      childStr = nextStr.substring(0, pvId)
      ret = decodeFieldsSubstringOld(childStr, 0, currObj)
      ret = decodeFieldsSubstringOld(nextStr.substring(pvId + 1), 0, parentObj)
    } else {
      childStr = nextStr
      ret = decodeFieldsSubstringOld(childStr, 0, currObj)
    }
  } else if (pvId < 0 && openParId < 0 && slashId < 0 && str.length > 0) {
    var currObj = { value: str, children: [] }
    parentObj.children.push(currObj)
  }
  return 0
}

//  ---- NEW fast routines ---------------------------------------------------

function getCloseParId(str, openParId) {
  if (openParId < 0 || openParId >= str.length || str[openParId] !== '(') {
    return -1;
  }

  let depth = 0;

  for (let i = openParId; i < str.length; i++) {
    if (str[i] === '(') {
      depth++;
    } else if (str[i] === ')') {
      depth--;

      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

function decodeFieldsSubstring(inputStr, startId, parentObj) {
  if (typeof inputStr !== 'string' || !parentObj?.children) {
    return -1;
  }

  let i = startId;
  let tokenStart = i;

  while (i <= inputStr.length) {
    const char = inputStr[i];

    if (char === '(' || char === ')' || char === ';' || char === '/' || i === inputStr.length) {
      // Add the field accumulated before the delimiter
      if (i > tokenStart) {
        const value = inputStr.slice(tokenStart, i);

        const node = { value, children: [] };

        parentObj.children.push(node);

        if (char === '(') {
          const closeParId = getCloseParId(inputStr, i);

          if (closeParId < 0) {
            return -1;
          }

          const childStr = inputStr.slice(i + 1, closeParId);

          if (decodeFieldsSubstring(childStr, 0, node) < 0) {
            return -1;
          }

          i = closeParId;
        }
      }

      tokenStart = i + 1;
    }

    i++;
  }

  return 0;
}

exports.decodeFieldsSubstringExt = function (inputStr, startId, parentObj) {
  if (process.env.FAST_ROUTINES &&
    process.env.FAST_ROUTINES.toLowerCase() === "true") {
    return decodeFieldsSubstring(inputStr, startId, parentObj);
  } else {
    return decodeFieldsSubstringOld(inputStr, startId, parentObj);
  }
}

/* function printTree(objList, level) {
    var parent = null;

    for (var i = 0; i < objList.length; i++) {
    printTree(objList[i].children, "  " + level)
    }

    return parent;
}
 */
/* function loadJsonFile(url) {
    const fs = require('fs');
    const data = fs.readFileSync('/home/devel/SR/Condivisione/MWDI/CC.json', 'utf8')

    // Parsa il JSON in un oggetto JavaScript
    let currentJSON = JSON.parse(data);
    let objectKey = Object.keys(currentJSON)[0];
    var originalJson = currentJSON[objectKey];
    return originalJson

} */

// function getKeysRecursively(obj, level) {
//   let keys = [];

//   for (let key in obj) {
//     if (obj.hasOwnProperty(key)) {
//       keys.push(key);

//       if (typeof obj[key] === 'object' && obj[key] !== null && level < 2) {
//         const nestedKeys = getKeysRecursively(obj[key], level + 1);
//         keys = keys.concat(nestedKeys.map(nestedKey => `${key}.${nestedKey}`));
//       }
//     }
//   }

//   return keys;
// }

function getObjFromFilterOld(jsonObjName, filterObjList) {

  for (var i = 0; i < filterObjList.length; i++) {
    if (filterObjList[i].value === jsonObjName) {
      return filterObjList[i]
    }
  }
  return null
}

function getFilteredJsonOld(jsonObj, filterParentObj) {
  let keys = [];

  if (jsonObj.length > 0) {
    for (var i = 0; i < jsonObj.length; i++) {
      for (let key in jsonObj[i]) {
        if (jsonObj[i].hasOwnProperty(key)) {
          var filterObj = getObjFromFilterOld(key, filterParentObj);
          if (filterObj === null) {
            jsonObj[i][key] = null
            delete jsonObj[i][key]
          } else {
            if (filterObj.children.length !== null && typeof filterObj.children.length !== 'undefined' && filterObj.children.length > 0) {
              getFilteredJsonOld(jsonObj[i][key], filterObj.children)
            }
          }
        }
      }
    }
  } else {
    for (let key in jsonObj) {
      if (jsonObj.hasOwnProperty(key)) {
        var filterObj = getObjFromFilterOld(key, filterParentObj);
        if (filterObj === null) {
          jsonObj[key] = null
          delete jsonObj[key]
        } else {
          if (filterObj.children.length !== null && typeof filterObj.children.length !== 'undefined' && filterObj.children.length > 0) {
            getFilteredJsonOld(jsonObj[key], filterObj.children)
          }
        }
      }
    }
  }
}


// New Fast routines ------------------------------------------------------------

/**
 * Converts the filter structure into nested Maps.
 *
 * This allows O(1) lookup of filter properties instead of
 * scanning filter arrays for every JSON property.
 *
 * @param {Array} filterList - Filter definition.
 * @returns {Map} Compiled filter.
 */
function compileFilter(filterList) {
  const filterMap = new Map();

  if (!Array.isArray(filterList)) {
    return filterMap;
  }

  for (const filter of filterList) {
    if (!filter || filter.value === undefined) {
      continue;
    }

    const childFilter =
      Array.isArray(filter.children) && filter.children.length > 0
        ? compileFilter(filter.children)
        : null;

    filterMap.set(filter.value, childFilter);
  }

  return filterMap;
}


/**
 * Filters a JSON object/array in place according to a compiled filter.
 *
 * Properties not present in the filter are removed.
 * The original JSON object is modified directly.
 *
 * @param {Object|Array} jsonObj - JSON structure to filter.
 * @param {Map} filterMap - Filter generated by compileFilter().
 */
function applyFilter(jsonObj, filterMap) {
  if (jsonObj === null || typeof jsonObj !== 'object') {
    return;
  }

  // If this level contains an array, apply the same filter
  // to every element.
  if (Array.isArray(jsonObj)) {
    for (const item of jsonObj) {
      applyFilter(item, filterMap);
    }

    return;
  }

  // Object.keys() gives us only own enumerable properties,
  // so hasOwnProperty() is not necessary.
  for (const key of Object.keys(jsonObj)) {
    const childFilter = filterMap.get(key);

    // Property is not requested by the filter.
    if (childFilter === undefined) {
      delete jsonObj[key];
      continue;
    }

    // Property has a child filter: process its content.
    if (childFilter !== null) {
      applyFilter(jsonObj[key], childFilter);
    }
  }
}


/**
 * Public function.
 *
 * Keeps the same interface as the original getFilteredJson():
 *
 *     getFilteredJson(jsonObj, filterParentObj);
 *
 * @param {Object|Array} jsonObj - JSON structure to filter.
 * @param {Array} filterParentObj - Filter definition.
 */
function getFilteredJson(jsonObj, filterParentObj) {
  if (jsonObj === null || typeof jsonObj !== 'object' || !Array.isArray(filterParentObj)) {
    return;
  }

  const filterMap = compileFilter(filterParentObj);

  applyFilter(jsonObj, filterMap);
}


exports.getFilteredJsonExt = function (jsonObj, filterParentObj) {
  if (process.env.FAST_ROUTINES &&
    process.env.FAST_ROUTINES.toLowerCase() === "true") {
    return getFilteredJson(jsonObj, filterParentObj);
  } else {
    return getFilteredJsonOld(jsonObj, filterParentObj);
  }

}