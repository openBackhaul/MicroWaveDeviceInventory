exports.cacheUpdateBuilder= function (url, originalJSON, toInsert, filters) {

    // Analizza la URL per estrarre i segmenti
  const urlSegments = url.split('/').filter(segment => segment.trim() !== '');

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
    
    // Verifica se il campo esiste nell'oggetto JSON corrente
    if (currentJSON.hasOwnProperty(key)) {
      if (Array.isArray(currentJSON[key])) {
        // Se il campo è un array, cerca l'elemento con l'UUID corrispondente
        const uuidDaCercare = decodeURIComponent(value);
        const indexDaSostituire = currentJSON[key].findIndex(item => 
          (item.uuid && item.uuid === uuidDaCercare) || 
          (item['local-id'] && item['local-id'] === uuidDaCercare)
        );
        if (indexDaSostituire !== -1) {
          // Sostituisci solo l'elemento nell'array con il nuovo JSON
          if (currentJSON[key]) {
            if (i == 1){
              lastKey = "["+objectKey+"]" + "." +  key + "[" + indexDaSostituire + "]" ;
            } else {
              lastKey = lastKey + "." + key + "[" + indexDaSostituire + "]";
            }
            currentJSON = currentJSON[key][indexDaSostituire];
          } else {
            console.log(`Campo "${key}" non trovato.`);
            break;
          }
          console.log('JSON originale aggiornato:');
          console.log(JSON.stringify(originalJSON, null, 2));
        } else {
          lastKey = lastKey +"."+ key;
          console.log(`Nessun elemento trovato con UUID: ${uuidDaCercare}`);
          break;
        }
      } else {
        // Se il campo non è un array, aggiorna l'ultima chiave
        lastKey = lastKey + key;
      }
    } else {
      console.log(`Campo non trovato: ${key}`);
      break;
    }
    i +=1;
  }

  // Verifica se c'è un'ultima chiave e la sostituisce con il nuovo JSON
  if (lastKey) {
    console.log(originalJSON[lastKey])
    assegnaValoreAJson (originalJSON, lastKey, toInsert, filters);
    //console.log(JSON.stringify(jsonOriginale, null, 2));
  }
};


function assegnaValoreAJson(json, percorso, nuovoValore, filters) {
  // Rimuovi le parentesi quadre iniziali e finali se presenti
 // percorso = percorso.replace(/^\[|\]$/g, '');

  // Dividi il percorso in un array di chiavi utilizzando '.'
  const chiavi = percorso.split('.');

  let oggetto = json;
  let Filters = false;
  if (filters != ""){
    Filters = true;
  }

  for (let i = 0; i < chiavi.length; i++) {
    if (i == 0){
      const chiave = chiavi[i];
      const parentesiQuadraApertaIndex = chiave.indexOf('[');
      const parentesiQuadraChiusaIndex = chiave.indexOf(']');
      const nomeArray = chiave.substring(1, parentesiQuadraChiusaIndex);
      oggetto = oggetto[nomeArray];
    } else {
    const chiave = chiavi[i];
    const parentesiQuadraApertaIndex = chiave.indexOf('[');
    const parentesiQuadraChiusaIndex = chiave.indexOf(']');

    if (parentesiQuadraApertaIndex !== -1 && parentesiQuadraChiusaIndex !== -1) {
      // Se la chiave contiene parentesi quadre per indicare un indice di array
      const nomeArray = chiave.substring(0, parentesiQuadraApertaIndex);
      const indice = parseInt(chiave.substring(parentesiQuadraApertaIndex + 1, parentesiQuadraChiusaIndex), 10);

      if (i === chiavi.length - 1) {
        // Se questa è l'ultima chiave nel percorso, assegna il nuovo valore
        if (Filters){
          let objectKey = Object.keys(nuovoJSON)[0];
          let newJSON = nuovoJSON[objectKey];
          let result = mergeJson(oggetto[nomeArray][indice], newJSON)
        } else {
          oggetto[nomeArray][indice] = nuovoValore;
        }
      } else {
        // Altrimenti, prosegui la navigazione dell'oggetto
        oggetto = oggetto[nomeArray][indice];
      }
    } else {
      // Se la chiave non contiene parentesi quadre, accedi al campo oggetto
      if (i === chiavi.length - 1) {
        // Se questa è l'ultima chiave nel percorso, assegna il nuovo valore
        if (Filters){
          let objectKey = Object.keys(nuovoJSON)[0];
          let newJSON = nuovoJSON[objectKey];
          let result = mergeJson(oggetto[nomeArray], newJSON)
        } else {
          oggetto[chiave] = nuovoValore;
        }
      } else {
        // Altrimenti, prosegui la navigazione dell'oggetto
        oggetto = oggetto[chiave];
      }
    }
  }
  }
}

function mergeJson(target, source) {
  if (Array.isArray(source)) {
    // Se source è un array, assumiamo che sia un array di oggetti
    for (let i = 0; i < source.length; i++) {
      mergeJson(target, source[i]);
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
