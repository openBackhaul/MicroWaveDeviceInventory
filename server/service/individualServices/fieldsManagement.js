
function getCloseParId(str, openParId) {
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

function decodeFieldsSubstring(inputStr, startId, parentObj){
    var str = inputStr.substring(startId)

    var openParId = str.indexOf('(')
    var pvId = str.indexOf(';')
    var slashId = str.indexOf('/')
    var ret = 0

    if (openParId >= 0 && (openParId < pvId || pvId < 0) && (openParId < slashId || slashId < 0)) {
        var closeParId = getCloseParId(str, openParId)
        if (closeParId < 0) {
            return -1
        }

        var parentStr = str.substring(0, openParId)
        var currObj = { value: parentStr, children: [] }
        parentObj.children.push(currObj)

        var childStr = str.substring(openParId + 1, closeParId - 1)

        ret = decodeFieldsSubstring(childStr, 0, currObj)
        ret = decodeFieldsSubstring(inputStr, closeParId, parentObj)
    } else if (pvId >= 0 && (pvId < openParId || openParId < 0) && (pvId < slashId || slashId < 0)) {
        if (pvId > 0) {
            var parentStr = str.substring(0, pvId)
            var currObj = { value: parentStr, children: [] }
            parentObj.children.push(currObj)
        }

        var nextStr = str.substring(pvId + 1)
        ret = decodeFieldsSubstring(nextStr, 0, parentObj)
    } else if (slashId >= 0 && (slashId < openParId || openParId < 0) && (slashId < pvId || pvId < 0)) {
        var parentStr = str.substring(0, slashId)
        var currObj = { value: parentStr, children: [] }
        parentObj.children.push(currObj)

        var nextStr = str.substring(slashId + 1)
        pvId = nextStr.indexOf(';')
        openParId = nextStr.indexOf('(')
        var childStr = ""
        if (openParId >= 0 && (openParId < pvId || pvId < 0)) {
            var closeParId = getCloseParId(nextStr, openParId)
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
            ret = decodeFieldsSubstring(childStr, 0, currObj)
            ret = decodeFieldsSubstring(nextStr.substring(pvId + 1), 0, parentObj)
        } else {
            childStr = nextStr
            ret = decodeFieldsSubstring(childStr, 0, currObj)
        }
    } else if (pvId < 0 && openParId < 0 && slashId < 0 && str.length > 0) {
        var currObj = { value: str, children: [] }
        parentObj.children.push(currObj)
    }
    return 0
}

exports.decodeFieldsSubstringExt = function(inputStr, startId, parentObj) {
     return  decodeFieldsSubstring(inputStr, startId, parentObj);
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

function getKeysRecursively(obj, level) {
    let keys = [];

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);

            if (typeof obj[key] === 'object' && obj[key] !== null && level < 2) {
                const nestedKeys = getKeysRecursively(obj[key], level + 1);
                keys = keys.concat(nestedKeys.map(nestedKey => `${key}.${nestedKey}`));
            }
        }
    }

    return keys;
}

function getObjFromFilter(jsonObjName, filterObjList) {

    for (var i = 0; i < filterObjList.length; i++) {
        if (filterObjList[i].value === jsonObjName ) {
            return filterObjList[i]
        }
    }
    return null
}

function getFilteredJson (jsonObj, filterParentObj) {
    let keys = [];

    if (jsonObj.length > 0) {
        for (var i = 0; i < jsonObj.length; i++) {
            for (let key in jsonObj[i]) {
                if (jsonObj[i].hasOwnProperty(key)) {
                    var filterObj = getObjFromFilter(key, filterParentObj);
                    if (filterObj === null) {
                        jsonObj[i][key] = null
                        delete jsonObj[i][key]
                    } else {
                        if (filterObj.children.length !== null && typeof filterObj.children.length !== 'undefined' && filterObj.children.length > 0) {
                            getFilteredJson(jsonObj[i][key], filterObj.children)
                        }
                    }
                }
            }
        }
    } else {
        for (let key in jsonObj) {
            if (jsonObj.hasOwnProperty(key)) {
                var filterObj = getObjFromFilter(key, filterParentObj);
                if (filterObj === null) {
                    jsonObj[key] = null
                    delete jsonObj[key]
                } else {
                    if (filterObj.children.length !== null && typeof filterObj.children.length !== 'undefined' && filterObj.children.length > 0) {
                        getFilteredJson(jsonObj[key], filterObj.children)
                    }
                }
            }
        }
    }
}

exports.getFilteredJsonExt = function (jsonObj, filterParentObj) {
    return getFilteredJson (jsonObj, filterParentObj);
}