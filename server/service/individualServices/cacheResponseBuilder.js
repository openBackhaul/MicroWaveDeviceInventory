exports.cacheResponseBuilder = function (url, currentJSON) {
    let objectKey = Object.keys(currentJSON)[0];
    currentJSON = currentJSON[objectKey];

    const parts = objectKey.split(':');

    let lastkey = null;
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
       
        const [key, value] = segment.split('=');

        // Verify if the field exists in the current JSON
        if (currentJSON.hasOwnProperty(key)) {
            currentJSON = currentJSON[key];
            if (Array.isArray(currentJSON)) {
                // If the field is an Array search for the field with the correct UUID or Local-id
                const uuidDaCercare = decodeURIComponent(value);
                const equipmentCercato = currentJSON.find(key =>
                    (key.uuid && key.uuid === uuidDaCercare) ||
                    (key['local-id'] && key['local-id'] === uuidDaCercare));
                if (equipmentCercato) {
                    if (i != 1){
                        currentJSON = equipmentCercato;
                    } else {
                        currentJSON = [equipmentCercato];
                    }
                } else {
                    console.log(`No elements found with UUID: ${uuidDaCercare}`);
                    return 
                    break;
                }
            }
        } else {
            console.log(`Field not found: ${key}`);
            break;
        }
        lastkey = key;
        i--;
    }
    let topJsonWrapper ="";
    let returnObject = null;
    if (lastkey != null){
        topJsonWrapper = parts[0] + ":" + lastkey;
        returnObject = { [topJsonWrapper]: currentJSON };
    } else {
        topJsonWrapper = parts[0] + ":" + parts[1];
        returnObject = { [topJsonWrapper]: [currentJSON] };
    }
 
   // returnObject[topJsonWrapper] = [currentJSON] + "}"; 
    return returnObject;
}

function notFoundError(message) {
    const myJson = {
      "code": 404,
      "message": message
    };
    return myJson;
  }