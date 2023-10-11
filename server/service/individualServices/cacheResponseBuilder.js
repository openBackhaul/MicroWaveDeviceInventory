exports.cacheResponseBuilder = function (url, currentJSON) {
    let objectKey = Object.keys(currentJSON)[0];
    currentJSON = currentJSON[objectKey];

    const parts = objectKey.split(':');

    let lastkey = null;
    const urlSegments = url.split('/').filter(segment => segment.trim() !== '');
    let startParsing = false;

    for (const segment of urlSegments) {
        if (!startParsing) {
            // Search second simbol "=" to start extraction
            if (segment.includes('=')) {
                startParsing = true;
            }
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
                    currentJSON = equipmentCercato;
                } else {
                    console.log(`No elements found with UUID: ${uuidDaCercare}`);
                    break;
                }
            }
        } else {
            console.log(`Field not found: ${key}`);
            break;
        }
        lastkey = key;
    }
    let topJsonWrapper ="";
    if (lastkey != null){
        topJsonWrapper = parts[0] + ":" + lastkey;
    } else {
        topJsonWrapper = parts[0] + ":" + parts[1];
    }
    //const returnObject = {};
    //const key = 'pippo';

//const resultJSON = { [key]: parsedJSON };
    const returnObject = { [topJsonWrapper]: currentJSON };

   // returnObject[topJsonWrapper] = [currentJSON] + "}"; 
    return returnObject;
}