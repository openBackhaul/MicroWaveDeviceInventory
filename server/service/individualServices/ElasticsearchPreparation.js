const { elasticsearchService, getIndexAliasAsync, operationalStateEnum } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const logger = require('../LoggingService.js').getLogger();

/**
 * @description Elasticsearch preparation. Checks if ES instance is configured properly.
 * As first step, tries pinging the ES instance. If this doesn't work, ES
 * is considered not reachable or configured with wrong connection parameters.
 *
 * EATL application will still run and allow the operator to properly configure
 * ES connection parameters through REST API.
 *
 * If the ES instance is reachable, as next steps it will try to find existing or
 * configure index-pattern and index-alias, based on index-alias in CONFIG file.
 *
 * @returns {Promise<void>}
 */
module.exports = async function prepareElasticsearch() {
    logger.info("Configuring Elasticsearch...");
    let ping = await elasticsearchService.getElasticsearchClientOperationalStateAsync();
    if (ping === operationalStateEnum.UNAVAILABLE) {
        logger.error(`Elasticsearch unavailable. Skipping Elasticsearch configuration.`);
        return;
    }
    await createIndexTemplate();
    await elasticsearchService.createAlias();
    logger.info('Elasticsearch is properly configured!');
}

/**
 * @description Creates/updates index-template with EATL proprietary mapping.
 *
 * Proprietary mapping is needed for the field 'x-correlator' which is only
 * searchable if it's field is 'keyword'. By default ES denotes string fields
 * as 'text'.
 *
 * This template serves as binding between service policy and index.
 * If index-alias is changed, this index-template will be rewritten to reflect
 * the change, as we do not wish to continue applying service policy on an
 * index-alias that does not exist.
 *
 * Service policy is not set at this point in the index-template.
 * @returns {Promise<void>}
 */
async function createIndexTemplate() {
    let indexAlias = await getIndexAliasAsync();
    let client = await elasticsearchService.getClient(false);
    // disable creation of index, if it's not yet created by the app
    await client.cluster.putSettings({
        body: {
            persistent: {
                "action.auto_create_index": "false"
            }
        }
    });
    let found = await elasticsearchService.getExistingIndexTemplate();
    let iTemplate = found ? found : {
        name: 'mwdi-index-template',
        body: {
            index_patterns: `${indexAlias}-*`,
            template: {
                settings: {
                    'index.lifecycle.rollover_alias': indexAlias
                }
            }
        }
    }
    await client.cluster.putComponentTemplate({
        name: 'mwdi-mappings',
        body: {
            template: {
                settings: {
                    "index": {
                        "mapping": {
                            "total_fields": {
                                "limit": "9000"
                            }
                        },
                        "mapping.ignore_malformed": true
                    }
                },
                mappings: {
                    properties: {
                        'x-correlator': { type: 'keyword' },
                        'trace-indicator': { type: 'text' },
                        'user': { type: 'text' },
                        'originator': { type: 'text' },
                        'application-name': { type: 'text' },
                        'release-number': { type: 'text' },
                        'operation-name': { type: 'text' },
                        'response-code': { type: 'integer' },
                        'timestamp': { type: 'date' },
                        'stringified-body': { type: 'text' },
                        'stringified-response': { type: 'text' },
                        "core-model-1-4:control-construct": {
                            "properties": {
                                "administrative-control": {
                                    "type": "text",
                                    "fields": {
                                        "keyword": {
                                            "type": "keyword",
                                            "ignore_above": 256
                                        }
                                    }
                                },
                                "administrative-state": {
                                    "type": "text",
                                    "fields": {
                                        "keyword": {
                                            "type": "keyword",
                                            "ignore_above": 256
                                        }
                                    }
                                },
                                "alarms-1-0:alarm-pac": {
                                    "properties": {
                                        "alarm-capability": {
                                            "properties": {
                                                "alarm-inventory-list": {
                                                    "properties": {
                                                        "alarm-category": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "alarm-type-id": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "alarm-type-qualifier": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "description": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "probable-cause": {
                                                            "type": "long"
                                                        },
                                                        "probable-cause-string": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "specific-problem": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "will-clear": {
                                                            "type": "boolean"
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "alarm-configuration": {
                                            "properties": {
                                                "severity-configuration-list": {
                                                    "properties": {
                                                        "alarm-type-id": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "alarm-type-qualifier": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "resource-group-description": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "resource-list": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "severity-configuration-identifier": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "severity-level-list": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "alarm-event-records": {
                                            "properties": {
                                                "alarm-event-record-list": {
                                                    "properties": {
                                                        "alarm-event-sequence-number": {
                                                            "type": "long"
                                                        },
                                                        "alarm-severity": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "alarm-type-id": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "alarm-type-qualifier": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "resource": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "timestamp": {
                                                            "type": "date"
                                                        }
                                                    }
                                                },
                                                "number-of-alarm-event-records": {
                                                    "type": "long"
                                                },
                                                "time-of-latest-change": {
                                                    "type": "date"
                                                }
                                            }
                                        },
                                        "current-alarm-list": {
                                            "properties": {
                                                "alarm-severity": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "alarm-type-id": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "alarm-type-qualifier": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "current-alarm-identifier": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "resource": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "timestamp": {
                                                    "type": "date"
                                                }
                                            }
                                        },
                                        "current-alarms": {
                                            "properties": {
                                                "current-alarm-list": {
                                                    "properties": {
                                                        "alarm-severity": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "alarm-type-id": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "alarm-type-qualifier": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "current-alarm-identifier": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "resource": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "timestamp": {
                                                            "type": "date"
                                                        }
                                                    }
                                                },
                                                "number-of-current-alarms": {
                                                    "type": "long"
                                                },
                                                "time-of-latest-change": {
                                                    "type": "date"
                                                }
                                            }
                                        },
                                        "number-of-current-alarms": {
                                            "type": "long"
                                        },
                                        "time-of-latest-change": {
                                            "type": "date"
                                        }
                                    }
                                },
                                "backup-and-restore-1-0:backup-and-restore-pac": {
                                    "properties": {
                                        "backup-and-restore-capability": {
                                            "properties": {
                                                "separate-activation-required": {
                                                    "type": "boolean"
                                                }
                                            }
                                        },
                                        "backup-and-restore-configuration": {
                                            "properties": {
                                                "length-of-confirmation-period": {
                                                    "type": "long"
                                                }
                                            }
                                        },
                                        "backup-and-restore-status": {
                                            "properties": {
                                                "backup-operation-status": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "ready-for-starting-new-operation": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "restore-operation-status": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "equipment": {
                                    "properties": {
                                        "actual-equipment": {
                                            "properties": {
                                                "administrative-control": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "administrative-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "environmental-rating": {
                                                    "properties": {
                                                        "humidity-rating": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "power-rating": {
                                                            "properties": {
                                                                "power-rating-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "power-rating-value": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "thermal-rating": {
                                                            "properties": {
                                                                "maximum-temperature": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "minimum-temperature": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "thermal-rating-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "function-enablers": {
                                                    "properties": {
                                                        "power-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "lifecycle-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "local-id": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "location": {
                                                    "properties": {
                                                        "equipment-location": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "geographical-location": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "manufactured-thing": {
                                                    "properties": {
                                                        "equipment-instance": {
                                                            "properties": {
                                                                "asset-instance-identifier": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "manufacture-date": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "serial-number": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "equipment-type": {
                                                            "properties": {
                                                                "description": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "model-identifier": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "part-type-identifier": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "type-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "version": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "manufacturer-properties": {
                                                            "properties": {
                                                                "manufacturer-identifier": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "manufacturer-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "operator-augmented-equipment-instance": {
                                                            "properties": {
                                                                "asset-instance-identifier": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "operator-augmented-equipment-type": {
                                                            "properties": {
                                                                "asset-type-identifier": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "mechanical-functions": {
                                                    "properties": {
                                                        "rotation-speed": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "name": {
                                                    "properties": {
                                                        "value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "value-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "operational-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "physical-characteristics": {
                                                    "properties": {
                                                        "fire-characteristics": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "materials": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "weight-characeristics": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "physical-properties": {
                                                    "properties": {
                                                        "temperature": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "spatial-properties-of-type": {
                                                    "properties": {
                                                        "height": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "length": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "width": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "structure": {
                                                    "properties": {
                                                        "category": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "swappability": {
                                                    "properties": {
                                                        "is-hot-swappable": {
                                                            "type": "boolean"
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "administrative-control": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "administrative-state": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "connector": {
                                            "properties": {
                                                "administrative-control": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "administrative-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "connector": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "connector-type": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "equipment-augment-1-0:connector-pac": {
                                                    "properties": {
                                                        "connector-kind": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "outside-label": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "sequence-id": {
                                                            "type": "long"
                                                        }
                                                    }
                                                },
                                                "label": {
                                                    "properties": {
                                                        "value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "value-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "lifecycle-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "local-id": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "name": {
                                                    "properties": {
                                                        "value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "value-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "operational-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "orientation": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "pin-layout": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "role": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "contained-holder": {
                                            "properties": {
                                                "actual-holder": {
                                                    "properties": {
                                                        "administrative-control": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "administrative-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "environmental-rating": {
                                                            "properties": {
                                                                "humidity-rating": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "power-rating": {
                                                                    "properties": {
                                                                        "power-rating-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "power-rating-value": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "thermal-rating": {
                                                                    "properties": {
                                                                        "maximum-temperature": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "minimum-temperature": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "thermal-rating-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "extension": {
                                                            "properties": {
                                                                "value": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "value-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "holder-structure": {
                                                            "properties": {
                                                                "holder-category": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "is-captive": {
                                                                    "type": "boolean"
                                                                },
                                                                "is-guided": {
                                                                    "type": "boolean"
                                                                },
                                                                "is-quantised-space": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "label": {
                                                            "properties": {
                                                                "value-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "lifecycle-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "local-id": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "name": {
                                                            "properties": {
                                                                "value": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "value-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "operational-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "position": {
                                                            "properties": {
                                                                "relative-position": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "spatial-properties-of-type": {
                                                            "properties": {
                                                                "height": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "length": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "width": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "administrative-control": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "administrative-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "equipment-augment-1-0:holder-pac": {
                                                    "properties": {
                                                        "outside-label": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "sequence-id": {
                                                            "type": "long"
                                                        },
                                                        "vendor-label": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "expected-holder": {
                                                    "properties": {
                                                        "administrative-control": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "administrative-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "environmental-rating": {
                                                            "properties": {
                                                                "humidity-rating": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "power-rating": {
                                                                    "properties": {
                                                                        "power-rating-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "power-rating-value": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "thermal-rating": {
                                                                    "properties": {
                                                                        "maximum-temperature": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "minimum-temperature": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "thermal-rating-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "extension": {
                                                            "properties": {
                                                                "value-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "holder-structure": {
                                                            "properties": {
                                                                "holder-category": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "is-captive": {
                                                                    "type": "boolean"
                                                                },
                                                                "is-guided": {
                                                                    "type": "boolean"
                                                                },
                                                                "is-quantised-space": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "label": {
                                                            "properties": {
                                                                "value-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "lifecycle-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "local-id": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "name": {
                                                            "properties": {
                                                                "value": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "value-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "operational-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "position": {
                                                            "properties": {
                                                                "relative-position": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "spatial-properties-of-type": {
                                                            "properties": {
                                                                "height": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "length": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "width": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "holder-location": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "lifecycle-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "local-id": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "name": {
                                                    "properties": {
                                                        "value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "value-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "occupying-fru": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "operational-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "equipment-functional-boundary": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "expected-equipment": {
                                            "properties": {
                                                "administrative-control": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "administrative-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "environmental-rating": {
                                                    "properties": {
                                                        "humidity-rating": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "power-rating": {
                                                            "properties": {
                                                                "power-rating-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "power-rating-value": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "thermal-rating": {
                                                            "properties": {
                                                                "maximum-temperature": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "minimum-temperature": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "thermal-rating-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "function-enablers": {
                                                    "properties": {
                                                        "power-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "lifecycle-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "local-id": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "location": {
                                                    "properties": {
                                                        "equipment-location": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "geographical-location": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "manufactured-thing": {
                                                    "properties": {
                                                        "equipment-instance": {
                                                            "properties": {
                                                                "asset-instance-identifier": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "manufacture-date": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "serial-number": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "equipment-type": {
                                                            "properties": {
                                                                "description": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "model-identifier": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "part-type-identifier": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "type-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "version": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "manufacturer-properties": {
                                                            "properties": {
                                                                "manufacturer-identifier": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "manufacturer-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "operator-augmented-equipment-instance": {
                                                            "properties": {
                                                                "asset-instance-identifier": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "operator-augmented-equipment-type": {
                                                            "properties": {
                                                                "asset-type-identifier": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "mechanical-functions": {
                                                    "properties": {
                                                        "rotation-speed": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "name": {
                                                    "properties": {
                                                        "value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "value-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "operational-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "physical-characteristics": {
                                                    "properties": {
                                                        "fire-characteristics": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "materials": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "weight-characeristics": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "physical-properties": {
                                                    "properties": {
                                                        "temperature": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "spatial-properties-of-type": {
                                                    "properties": {
                                                        "height": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "length": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "width": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "structure": {
                                                    "properties": {
                                                        "category": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "swappability": {
                                                    "properties": {
                                                        "is-hot-swappable": {
                                                            "type": "boolean"
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "extension": {
                                            "properties": {
                                                "value-name": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "external-managed-id": {
                                            "properties": {
                                                "external-managed-uuid": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "manager-identifier": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "is-field-replaceable": {
                                            "type": "boolean"
                                        },
                                        "label": {
                                            "properties": {
                                                "value-name": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "lifecycle-state": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "local-id": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "name": {
                                            "properties": {
                                                "value": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "value-name": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "operational-state": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "uuid": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        }
                                    }
                                },
                                "equipment-augment-1-0:control-construct-pac": {
                                    "properties": {
                                        "external-label": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "last-config-change-timestamp": {
                                            "type": "date"
                                        }
                                    }
                                },
                                "equipment-augment-1-0:protocol-collection": {
                                    "properties": {
                                        "protocol": {
                                            "properties": {
                                                "administrative-control": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "administrative-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "lifecycle-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "lldp-1-0:lldp-pac": {
                                                    "properties": {
                                                        "local-system-data": {
                                                            "properties": {
                                                                "chassis-id": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "chassis-id-subtype": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "system-capabilities-enabled": {
                                                                    "properties": {
                                                                        "bridge": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "cvlan-component": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "docsis-cable-device": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "other": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "repeater": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "router": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "station-only": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "svlan-component": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "telephone": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "two-port-mac-relay": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "wlan-access-point": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "system-capabilities-supported": {
                                                                    "properties": {
                                                                        "bridge": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "cvlan-component": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "docsis-cable-device": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "other": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "repeater": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "router": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "station-only": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "svlan-component": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "telephone": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "two-port-mac-relay": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "wlan-access-point": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "system-description": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "system-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "message-fast-tx": {
                                                            "type": "long"
                                                        },
                                                        "message-tx-hold-multiplier": {
                                                            "type": "long"
                                                        },
                                                        "message-tx-interval": {
                                                            "type": "long"
                                                        },
                                                        "notification-interval": {
                                                            "type": "long"
                                                        },
                                                        "reinit-delay": {
                                                            "type": "long"
                                                        },
                                                        "remote-statistics": {
                                                            "properties": {
                                                                "last-change-time": {
                                                                    "type": "date"
                                                                },
                                                                "remote-ageouts": {
                                                                    "type": "long"
                                                                },
                                                                "remote-deletes": {
                                                                    "type": "long"
                                                                },
                                                                "remote-drops": {
                                                                    "type": "long"
                                                                },
                                                                "remote-inserts": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "tx-credit-max": {
                                                            "type": "long"
                                                        },
                                                        "tx-fast-init": {
                                                            "type": "long"
                                                        }
                                                    }
                                                },
                                                "operational-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "protocol-name": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "uuid": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "extension": {
                                    "properties": {
                                        "value": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "value-name": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        }
                                    }
                                },
                                "external-managed-id": {
                                    "properties": {
                                        "external-managed-uuid": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "manager-identifier": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        }
                                    }
                                },
                                "firmware-1-0:firmware-collection": {
                                    "properties": {
                                        "download": {
                                            "properties": {
                                                "download-status": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "download-status-description": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "filename": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "firmware-component-list": {
                                            "properties": {
                                                "administrative-control": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "administrative-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "extension": {
                                                    "properties": {
                                                        "value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "value-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "firmware-component-pac": {
                                                    "properties": {
                                                        "firmware-component-capability": {
                                                            "properties": {
                                                                "firmware-component-class": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "firmware-component-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "firmware-component-version": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "individual-activation-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "related-kinds-of-equipment-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "firmware-component-status": {
                                                            "properties": {
                                                                "firmware-component-activation-date": {
                                                                    "type": "date"
                                                                },
                                                                "firmware-component-status": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "is-active-on-equipment-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "label": {
                                                    "properties": {
                                                        "value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "value-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "lifecycle-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "local-id": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "name": {
                                                    "properties": {
                                                        "value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "value-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "operational-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "subordinate-firmware-component-list": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "forwarding-domain": {
                                    "properties": {
                                        "administrative-control": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "administrative-state": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "external-managed-id": {
                                            "properties": {
                                                "external-managed-uuid": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "manager-identifier": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "fc": {
                                            "properties": {
                                                "administrative-control": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "administrative-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "external-managed-id": {
                                                    "properties": {
                                                        "external-managed-uuid": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "manager-identifier": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "fc-port": {
                                                    "properties": {
                                                        "address": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "administrative-control": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "administrative-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "extension": {
                                                            "properties": {
                                                                "value": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "value-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "fc-port": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "fc-port-direction": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "fc-route-feeds-fc-port-egress": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "is-internal-port": {
                                                            "type": "boolean"
                                                        },
                                                        "is-protection-lock-out": {
                                                            "type": "boolean"
                                                        },
                                                        "label": {
                                                            "properties": {
                                                                "value": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "value-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "lifecycle-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "local-id": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "logical-termination-point": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "name": {
                                                            "properties": {
                                                                "value": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "value-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "operational-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "port-of-internal-fc": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "role": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "selection-priority": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "fc-route": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "fc-switch": {
                                                    "properties": {
                                                        "administrative-control": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "administrative-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "control-parameters": {
                                                            "properties": {
                                                                "synchronization-1-0:current-source-port": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "synchronization-1-0:ssm-enable-status": {
                                                                    "type": "boolean"
                                                                },
                                                                "synchronization-1-0:system-clock-source-priority-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "synchronization-1-0:unk-status": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "lifecycle-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "local-id": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "operational-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "forwarding-direction": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "is-protection-lock-out": {
                                                    "type": "boolean"
                                                },
                                                "layer-protocol-name": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "lifecycle-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "local-id": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "name": {
                                                    "properties": {
                                                        "value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "value-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "operational-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "service-priority": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "supporting-pc": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "uuid": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "vlan-fc-1-0:vlan-fc-pac": {
                                                    "properties": {
                                                        "vlan-fc-capability": {
                                                            "properties": {
                                                                "supported-sub-layer-protocol-name-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "vlan-fc-configuration": {
                                                            "properties": {
                                                                "fc-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "sub-layer-protocol-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "vlan-id": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "layer-protocol-name": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "lifecycle-state": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "local-id": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "logical-termination-point": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "mac-fd-1-0:mac-fd-pac": {
                                            "properties": {
                                                "mac-fd-capability": {
                                                    "properties": {
                                                        "supported-maximum-number-of-entries": {
                                                            "type": "long"
                                                        }
                                                    }
                                                },
                                                "mac-fd-configuration": {
                                                    "properties": {
                                                        "aging-time": {
                                                            "type": "long"
                                                        },
                                                        "fd-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "mac-address": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "maximum-number-of-entries": {
                                                            "type": "long"
                                                        }
                                                    }
                                                },
                                                "mac-fd-status": {
                                                    "properties": {
                                                        "fd-status": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "mac-address-cur": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "number-of-dynamic-entries-cur": {
                                                            "type": "long"
                                                        },
                                                        "number-of-mac-registrations-cur": {
                                                            "type": "long"
                                                        },
                                                        "number-of-static-entries-cur": {
                                                            "type": "long"
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "name": {
                                            "properties": {
                                                "value": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "value-name": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "operational-state": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "uuid": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "vlan-fd-1-0:vlan-fd-pac": {
                                            "properties": {
                                                "vlan-fd-capability": {
                                                    "properties": {
                                                        "component-id": {
                                                            "type": "long"
                                                        },
                                                        "configurable-port-vlan-id-tagging-is-avail": {
                                                            "type": "boolean"
                                                        },
                                                        "extended-filtering-is-avail": {
                                                            "type": "boolean"
                                                        },
                                                        "hybrid-vlan-learning-is-avail": {
                                                            "type": "boolean"
                                                        },
                                                        "independent-vlan-learning-is-avail": {
                                                            "type": "boolean"
                                                        },
                                                        "maximum-number-of-msti": {
                                                            "type": "long"
                                                        },
                                                        "maximum-number-of-vlan-ids": {
                                                            "type": "long"
                                                        },
                                                        "multiple-local-bridges-is-avail": {
                                                            "type": "boolean"
                                                        },
                                                        "overriding-default-port-vlan-id-is-avail": {
                                                            "type": "boolean"
                                                        },
                                                        "port-and-protocol-based-vlan-is-avail": {
                                                            "type": "boolean"
                                                        },
                                                        "priority-to-traffic-class-mapping-is-avail": {
                                                            "type": "boolean"
                                                        },
                                                        "protocol-frame-format": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "shared-vlan-learning-is-avail": {
                                                            "type": "boolean"
                                                        },
                                                        "static-entries-on-individual-ports-is-avail": {
                                                            "type": "boolean"
                                                        },
                                                        "supported-sub-layer-protocol-name-list": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "supported-version": {
                                                            "type": "long"
                                                        },
                                                        "traffic-classes-is-avail": {
                                                            "type": "boolean"
                                                        }
                                                    }
                                                },
                                                "vlan-fd-configuration": {
                                                    "properties": {
                                                        "fd-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "mac-address": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "priority-to-traffic-class-mapping-list": {
                                                            "properties": {
                                                                "priority-value": {
                                                                    "type": "long"
                                                                },
                                                                "traffic-class-value": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "protocol-group-list": {
                                                            "properties": {
                                                                "db-index": {
                                                                    "type": "long"
                                                                },
                                                                "ethertype": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "llc-address-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "protocol-frame-format": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "protocol-group-id": {
                                                                    "type": "long"
                                                                },
                                                                "protocol-id": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "sub-layer-protocol-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "traffic-classes-is-on": {
                                                            "type": "boolean"
                                                        }
                                                    }
                                                },
                                                "vlan-fd-status": {
                                                    "properties": {
                                                        "fd-status": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "mac-address-cur": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "number-of-dynamic-vlan-registrations-cur": {
                                                            "type": "long"
                                                        },
                                                        "number-of-ports-cur": {
                                                            "type": "long"
                                                        },
                                                        "number-of-static-vlan-registrations-cur": {
                                                            "type": "long"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "label": {
                                    "properties": {
                                        "value": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "value-name": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        }
                                    }
                                },
                                "lifecycle-state": {
                                    "type": "text",
                                    "fields": {
                                        "keyword": {
                                            "type": "keyword",
                                            "ignore_above": 256
                                        }
                                    }
                                },
                                "local-id": {
                                    "type": "text",
                                    "fields": {
                                        "keyword": {
                                            "type": "keyword",
                                            "ignore_above": 256
                                        }
                                    }
                                },
                                "logical-termination-point": {
                                    "properties": {
                                        "administrative-control": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "administrative-state": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "client-ltp": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "connected-ltp": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "extension": {
                                            "properties": {
                                                "value": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "value-name": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "external-managed-id": {
                                            "properties": {
                                                "external-managed-uuid": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "manager-identifier": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "label": {
                                            "properties": {
                                                "value": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "value-name": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "layer-protocol": {
                                            "properties": {
                                                "administrative-control": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "administrative-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "air-interface-2-0:air-interface-pac": {
                                                    "properties": {
                                                        "air-interface-capability": {
                                                            "properties": {
                                                                "acm-threshold-cross-alarms-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "adaptive-modulation-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "atpc-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "atpc-range": {
                                                                    "type": "long"
                                                                },
                                                                "auto-freq-select-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "clearing-threshold-cross-alarms-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "direction-of-acm-performance-values": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "duplex-distance-is-freely-configurable": {
                                                                    "type": "boolean"
                                                                },
                                                                "duplex-distance-list": {
                                                                    "type": "long"
                                                                },
                                                                "encryption-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "expected-equals-transmitted-radio-signal-id": {
                                                                    "type": "boolean"
                                                                },
                                                                "maintenance-timer-range": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "performance-monitoring-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "receiver-on-off-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "rx-frequency-max": {
                                                                    "type": "long"
                                                                },
                                                                "rx-frequency-min": {
                                                                    "type": "long"
                                                                },
                                                                "supported-alarm-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-loop-back-kind-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-radio-signal-id-datatype": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-radio-signal-id-length": {
                                                                    "type": "long"
                                                                },
                                                                "transmission-mode-list": {
                                                                    "properties": {
                                                                        "am-downshift-level": {
                                                                            "type": "long"
                                                                        },
                                                                        "am-upshift-level": {
                                                                            "type": "long"
                                                                        },
                                                                        "channel-bandwidth": {
                                                                            "type": "long"
                                                                        },
                                                                        "code-rate": {
                                                                            "type": "long"
                                                                        },
                                                                        "modulation-scheme": {
                                                                            "type": "long"
                                                                        },
                                                                        "modulation-scheme-name-at-lct": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "rx-threshold": {
                                                                            "type": "long"
                                                                        },
                                                                        "supported-as-fixed-configuration": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "symbol-rate-reduction-factor": {
                                                                            "type": "long"
                                                                        },
                                                                        "transmission-mode-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "transmission-mode-rank": {
                                                                            "type": "long"
                                                                        },
                                                                        "tx-power-max": {
                                                                            "type": "long"
                                                                        },
                                                                        "tx-power-min": {
                                                                            "type": "long"
                                                                        },
                                                                        "xpic-is-avail": {
                                                                            "type": "boolean"
                                                                        }
                                                                    }
                                                                },
                                                                "tx-frequency-max": {
                                                                    "type": "long"
                                                                },
                                                                "tx-frequency-min": {
                                                                    "type": "long"
                                                                },
                                                                "type-of-equipment": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "air-interface-configuration": {
                                                            "properties": {
                                                                "acm-threshold-cross-alarm-list": {
                                                                    "properties": {
                                                                        "acm-threshold-cross-alarm-definition-number": {
                                                                            "type": "long"
                                                                        },
                                                                        "amount-of-seconds": {
                                                                            "type": "long"
                                                                        },
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "seconds-for-clearing-alarm": {
                                                                            "type": "long"
                                                                        },
                                                                        "seconds-for-raising-alarm": {
                                                                            "type": "long"
                                                                        },
                                                                        "transmission-mode": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "adaptive-modulation-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "air-interface-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "alic-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "atpc-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "atpc-thresh-lower": {
                                                                    "type": "long"
                                                                },
                                                                "atpc-thresh-upper": {
                                                                    "type": "long"
                                                                },
                                                                "atpc-tx-power-min": {
                                                                    "type": "long"
                                                                },
                                                                "auto-freq-select-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "auto-freq-select-range": {
                                                                    "type": "long"
                                                                },
                                                                "clearing-threshold-cross-alarms-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "cryptographic-key": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "duplex-distance": {
                                                                    "type": "long"
                                                                },
                                                                "encryption-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "expected-radio-signal-id": {
                                                                    "properties": {
                                                                        "alphanumeric-radio-signal-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "numeric-radio-signal-id": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "g-826-threshold-cross-alarm-list": {
                                                                    "properties": {
                                                                        "alarm-clearing-threshold": {
                                                                            "type": "long"
                                                                        },
                                                                        "alarm-raising-threshold": {
                                                                            "type": "long"
                                                                        },
                                                                        "g-826-value-kind": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "loop-back-kind-on": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "maintenance-timer": {
                                                                    "type": "long"
                                                                },
                                                                "mimo-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "modulation-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "performance-monitoring-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "power-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "problem-kind-severity-list": {
                                                                    "properties": {
                                                                        "problem-kind-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "problem-kind-severity": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "receiver-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "remote-air-interface-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "rx-frequency": {
                                                                    "type": "long"
                                                                },
                                                                "transmission-mode-max": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "transmission-mode-min": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "transmitted-radio-signal-id": {
                                                                    "properties": {
                                                                        "alphanumeric-radio-signal-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "numeric-radio-signal-id": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "transmitter-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "tx-frequency": {
                                                                    "type": "long"
                                                                },
                                                                "tx-power": {
                                                                    "type": "long"
                                                                },
                                                                "xlts-threshold-cross-alarm-list": {
                                                                    "properties": {
                                                                        "amount-of-seconds": {
                                                                            "type": "long"
                                                                        },
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "level-threshold-second-kind": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "xlts-level": {
                                                                            "type": "long"
                                                                        },
                                                                        "xlts-threshold-cross-alarm-definition-number": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "xpic-is-on": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "air-interface-current-performance": {
                                                            "properties": {
                                                                "current-performance-data-list": {
                                                                    "properties": {
                                                                        "elapsed-time": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "performance-data": {
                                                                            "properties": {
                                                                                "cses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "defect-blocks-sum": {
                                                                                    "type": "long"
                                                                                },
                                                                                "es": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rf-temp-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rf-temp-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rf-temp-min": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-min": {
                                                                                    "type": "long"
                                                                                },
                                                                                "ses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "snir-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "snir-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "snir-min": {
                                                                                    "type": "long"
                                                                                },
                                                                                "time-period": {
                                                                                    "type": "long"
                                                                                },
                                                                                "time-xstates-list": {
                                                                                    "properties": {
                                                                                        "time": {
                                                                                            "type": "long"
                                                                                        },
                                                                                        "time-xstate-sequence-number": {
                                                                                            "type": "long"
                                                                                        },
                                                                                        "transmission-mode": {
                                                                                            "type": "text",
                                                                                            "fields": {
                                                                                                "keyword": {
                                                                                                    "type": "keyword",
                                                                                                    "ignore_above": 256
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "tx-level-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "tx-level-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "tx-level-min": {
                                                                                    "type": "long"
                                                                                },
                                                                                "unavailability": {
                                                                                    "type": "long"
                                                                                },
                                                                                "xpd-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "xpd-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "xpd-min": {
                                                                                    "type": "long"
                                                                                }
                                                                            }
                                                                        },
                                                                        "scanner-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "suspect-interval-flag": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "timestamp": {
                                                                            "type": "date"
                                                                        }
                                                                    }
                                                                },
                                                                "number-of-current-performance-sets": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "air-interface-historical-performances": {
                                                            "properties": {
                                                                "historical-performance-data-list": {
                                                                    "properties": {
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "history-data-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "performance-data": {
                                                                            "properties": {
                                                                                "cses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "defect-blocks-sum": {
                                                                                    "type": "long"
                                                                                },
                                                                                "es": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rf-temp-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rf-temp-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rf-temp-min": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-min": {
                                                                                    "type": "long"
                                                                                },
                                                                                "ses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "snir-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "snir-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "snir-min": {
                                                                                    "type": "long"
                                                                                },
                                                                                "time-period": {
                                                                                    "type": "long"
                                                                                },
                                                                                "time-xstates-list": {
                                                                                    "properties": {
                                                                                        "time": {
                                                                                            "type": "long"
                                                                                        },
                                                                                        "time-xstate-sequence-number": {
                                                                                            "type": "long"
                                                                                        },
                                                                                        "transmission-mode": {
                                                                                            "type": "text",
                                                                                            "fields": {
                                                                                                "keyword": {
                                                                                                    "type": "keyword",
                                                                                                    "ignore_above": 256
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "tx-level-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "tx-level-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "tx-level-min": {
                                                                                    "type": "long"
                                                                                },
                                                                                "unavailability": {
                                                                                    "type": "long"
                                                                                },
                                                                                "xpd-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "xpd-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "xpd-min": {
                                                                                    "type": "long"
                                                                                }
                                                                            }
                                                                        },
                                                                        "period-end-time": {
                                                                            "type": "date"
                                                                        },
                                                                        "suspect-interval-flag": {
                                                                            "type": "boolean"
                                                                        }
                                                                    }
                                                                },
                                                                "number-of-historical-performance-sets": {
                                                                    "type": "long"
                                                                },
                                                                "time-of-latest-change": {
                                                                    "type": "date"
                                                                }
                                                            }
                                                        },
                                                        "air-interface-status": {
                                                            "properties": {
                                                                "alic-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "atpc-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "auto-freq-select-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "interface-status": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "link-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "local-end-point-id": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "loop-back-kind-up": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "mimo-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "performance-monitoring-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "radio-power-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "received-radio-signal-id": {
                                                                    "properties": {
                                                                        "alphanumeric-radio-signal-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "numeric-radio-signal-id": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "remote-end-point-id": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "rf-temp-cur": {
                                                                    "type": "long"
                                                                },
                                                                "rx-frequency-cur": {
                                                                    "type": "long"
                                                                },
                                                                "rx-level-cur": {
                                                                    "type": "long"
                                                                },
                                                                "snir-cur": {
                                                                    "type": "long"
                                                                },
                                                                "transmission-mode-cur": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "tx-frequency-cur": {
                                                                    "type": "long"
                                                                },
                                                                "tx-level-cur": {
                                                                    "type": "long"
                                                                },
                                                                "xpd-cur": {
                                                                    "type": "long"
                                                                },
                                                                "xpic-is-up": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "alic-is-up": {
                                                            "type": "boolean"
                                                        },
                                                        "atpc-is-up": {
                                                            "type": "boolean"
                                                        },
                                                        "auto-freq-select-is-up": {
                                                            "type": "boolean"
                                                        },
                                                        "interface-status": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "link-is-up": {
                                                            "type": "boolean"
                                                        },
                                                        "local-end-point-id": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "loop-back-kind-up": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "mimo-is-up": {
                                                            "type": "boolean"
                                                        },
                                                        "performance-monitoring-is-up": {
                                                            "type": "boolean"
                                                        },
                                                        "received-radio-signal-id": {
                                                            "properties": {
                                                                "alphanumeric-radio-signal-id": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "numeric-radio-signal-id": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "remote-end-point-id": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "rf-temp-cur": {
                                                            "type": "long"
                                                        },
                                                        "rx-frequency-cur": {
                                                            "type": "long"
                                                        },
                                                        "rx-level-cur": {
                                                            "type": "long"
                                                        },
                                                        "snir-cur": {
                                                            "type": "long"
                                                        },
                                                        "transmission-mode-cur": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "tx-frequency-cur": {
                                                            "type": "long"
                                                        },
                                                        "tx-level-cur": {
                                                            "type": "long"
                                                        },
                                                        "xpd-cur": {
                                                            "type": "long"
                                                        },
                                                        "xpic-is-up": {
                                                            "type": "boolean"
                                                        }
                                                    }
                                                },
                                                "configured-client-capacity": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "ethernet-container-2-0:ethernet-container-pac": {
                                                    "properties": {
                                                        "ethernet-container-capability": {
                                                            "properties": {
                                                                "admin-shut-down-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "available-queue-list": {
                                                                    "properties": {
                                                                        "available-drop-precedence-kind-list": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "available-dropping-behavior-kind-list": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "available-scheduling-kind-list": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "max-queue-depth": {
                                                                            "type": "long"
                                                                        },
                                                                        "queue-depth-configuration-is-avail": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "queue-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "supported-queue-depth-list": {
                                                                            "type": "long"
                                                                        },
                                                                        "wred-profile-per-drop-precedence-is-available": {
                                                                            "type": "boolean"
                                                                        }
                                                                    }
                                                                },
                                                                "bundling-group-size-max": {
                                                                    "type": "long"
                                                                },
                                                                "bundling-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "burst-size-max": {
                                                                    "type": "long"
                                                                },
                                                                "burst-size-min": {
                                                                    "type": "long"
                                                                },
                                                                "dropping-behavior-configuration-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "egress-shaping-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "encryption-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "explicit-congestion-notification-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "fec-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "fec-word-size-max": {
                                                                    "type": "long"
                                                                },
                                                                "information-rate-max": {
                                                                    "type": "long"
                                                                },
                                                                "information-rate-min": {
                                                                    "type": "long"
                                                                },
                                                                "ingress-policing-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "maintenance-timer-range": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "performance-monitoring-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "scheduler-kind-configuration-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "statistics-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "support-of-management-frames-without-preamble-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "supported-alarm-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-fec-interleaver-depth-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-fec-interleaver-kind-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-fec-redundancy-size-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-header-compression-kind-list": {
                                                                    "properties": {
                                                                        "compressed-header-length": {
                                                                            "type": "long"
                                                                        },
                                                                        "compressed-protocol-layer-list": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "header-compression-mode": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "header-compression-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "mpls-payload-kind-list": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "supported-loop-back-kind-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-maximum-burst-size-list": {
                                                                    "type": "long"
                                                                },
                                                                "supported-maximum-information-rate-list": {
                                                                    "type": "long"
                                                                },
                                                                "wred-profile-configuration-is-avail": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "ethernet-container-configuration": {
                                                            "properties": {
                                                                "bundling-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "cryptographic-key": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "egress-shaping-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "encryption-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "explicit-congestion-notification-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "fec-interleaver-depth": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "fec-interleaver-kind": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "fec-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "fec-redundancy-size": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "fec-word-size": {
                                                                    "type": "long"
                                                                },
                                                                "header-compression-kind": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "ingress-policing-profile": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "interface-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "interface-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "loop-back-kind-on": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "maintenance-timer": {
                                                                    "type": "long"
                                                                },
                                                                "maximum-burst-size": {
                                                                    "type": "long"
                                                                },
                                                                "maximum-information-rate": {
                                                                    "type": "long"
                                                                },
                                                                "performance-monitoring-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "problem-kind-severity-list": {
                                                                    "properties": {
                                                                        "problem-kind-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "problem-kind-severity": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "qos-profile": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "queue-behavior-list": {
                                                                    "properties": {
                                                                        "dropping-behavior-kind": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "queue-depth": {
                                                                            "type": "long"
                                                                        },
                                                                        "queue-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "scheduler-kind": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "weighting": {
                                                                            "type": "long"
                                                                        },
                                                                        "wred-behavior-list": {
                                                                            "properties": {
                                                                                "affected-drop-precedence": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "affected-protocol": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "wred-profile": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "scheduler-profile": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "statistics-is-on": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "ethernet-container-current-performance": {
                                                            "properties": {
                                                                "current-performance-data-list": {
                                                                    "properties": {
                                                                        "elapsed-time": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "performance-data": {
                                                                            "properties": {
                                                                                "broadcast-frames-input": {
                                                                                    "type": "long"
                                                                                },
                                                                                "broadcast-frames-output": {
                                                                                    "type": "long"
                                                                                },
                                                                                "dropped-frames-input": {
                                                                                    "type": "long"
                                                                                },
                                                                                "dropped-frames-output": {
                                                                                    "type": "long"
                                                                                },
                                                                                "errored-frames-input": {
                                                                                    "type": "long"
                                                                                },
                                                                                "errored-frames-output": {
                                                                                    "type": "long"
                                                                                },
                                                                                "forwarded-frames-input": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "forwarded-frames-output": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "fragmented-frames-input": {
                                                                                    "type": "long"
                                                                                },
                                                                                "max-bytes-per-second-output": {
                                                                                    "type": "long"
                                                                                },
                                                                                "multicast-frames-input": {
                                                                                    "type": "long"
                                                                                },
                                                                                "multicast-frames-output": {
                                                                                    "type": "long"
                                                                                },
                                                                                "queue-utilization-list": {
                                                                                    "properties": {
                                                                                        "avg-queue-length": {
                                                                                            "type": "long"
                                                                                        },
                                                                                        "max-queue-length": {
                                                                                            "type": "long"
                                                                                        },
                                                                                        "queue-name": {
                                                                                            "type": "text",
                                                                                            "fields": {
                                                                                                "keyword": {
                                                                                                    "type": "keyword",
                                                                                                    "ignore_above": 256
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "time-period": {
                                                                                    "type": "long"
                                                                                },
                                                                                "total-bytes-input": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "total-bytes-output": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "total-frames-input": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "total-frames-output": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "unicast-frames-input": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "unicast-frames-output": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        },
                                                                        "scanner-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "suspect-interval-flag": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "timestamp": {
                                                                            "type": "date"
                                                                        }
                                                                    }
                                                                },
                                                                "number-of-current-performance-sets": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "ethernet-container-historical-performances": {
                                                            "properties": {
                                                                "historical-performance-data-list": {
                                                                    "properties": {
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "history-data-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "performance-data": {
                                                                            "properties": {
                                                                                "broadcast-frames-input": {
                                                                                    "type": "long"
                                                                                },
                                                                                "broadcast-frames-output": {
                                                                                    "type": "long"
                                                                                },
                                                                                "dropped-frames-input": {
                                                                                    "type": "long"
                                                                                },
                                                                                "dropped-frames-output": {
                                                                                    "type": "long"
                                                                                },
                                                                                "errored-frames-input": {
                                                                                    "type": "long"
                                                                                },
                                                                                "errored-frames-output": {
                                                                                    "type": "long"
                                                                                },
                                                                                "forwarded-frames-input": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "forwarded-frames-output": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "fragmented-frames-input": {
                                                                                    "type": "long"
                                                                                },
                                                                                "max-bytes-per-second-output": {
                                                                                    "type": "long"
                                                                                },
                                                                                "multicast-frames-input": {
                                                                                    "type": "long"
                                                                                },
                                                                                "multicast-frames-output": {
                                                                                    "type": "long"
                                                                                },
                                                                                "queue-utilization-list": {
                                                                                    "properties": {
                                                                                        "avg-queue-length": {
                                                                                            "type": "long"
                                                                                        },
                                                                                        "max-queue-length": {
                                                                                            "type": "long"
                                                                                        },
                                                                                        "queue-name": {
                                                                                            "type": "text",
                                                                                            "fields": {
                                                                                                "keyword": {
                                                                                                    "type": "keyword",
                                                                                                    "ignore_above": 256
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "time-period": {
                                                                                    "type": "long"
                                                                                },
                                                                                "total-bytes-input": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "total-bytes-output": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "total-frames-input": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "total-frames-output": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "unicast-frames-input": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "unicast-frames-output": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        },
                                                                        "period-end-time": {
                                                                            "type": "date"
                                                                        },
                                                                        "suspect-interval-flag": {
                                                                            "type": "boolean"
                                                                        }
                                                                    }
                                                                },
                                                                "number-of-historical-performance-sets": {
                                                                    "type": "long"
                                                                },
                                                                "time-of-latest-change": {
                                                                    "type": "date"
                                                                }
                                                            }
                                                        },
                                                        "ethernet-container-status": {
                                                            "properties": {
                                                                "broadcast-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "broadcast-frames-output": {
                                                                    "type": "long"
                                                                },
                                                                "bundling-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "dropped-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "dropped-frames-output": {
                                                                    "type": "long"
                                                                },
                                                                "errored-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "errored-frames-output": {
                                                                    "type": "long"
                                                                },
                                                                "forwarded-bytes-input": {
                                                                    "type": "long"
                                                                },
                                                                "forwarded-bytes-output": {
                                                                    "type": "long"
                                                                },
                                                                "forwarded-frames-input": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "forwarded-frames-output": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "fragmented-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "frames-of-1024-to-1518-byte": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "frames-of-128-to-255-byte": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "frames-of-256-to-511-byte": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "frames-of-512-to-1023-byte": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "frames-of-64-byte": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "frames-of-65-to-127-byte": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "interface-status": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "last-10-sec-data-input-rate": {
                                                                    "type": "long"
                                                                },
                                                                "last-10-sec-data-output-rate": {
                                                                    "type": "long"
                                                                },
                                                                "loop-back-kind-up": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "multicast-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "multicast-frames-output": {
                                                                    "type": "long"
                                                                },
                                                                "performance-monitoring-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "remote-site-is-faulty": {
                                                                    "type": "boolean"
                                                                },
                                                                "statistics-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "timestamp": {
                                                                    "type": "date"
                                                                },
                                                                "total-bytes-input": {
                                                                    "type": "long"
                                                                },
                                                                "total-bytes-output": {
                                                                    "type": "long"
                                                                },
                                                                "total-frames-input": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "total-frames-output": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "unicast-frames-input": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "unicast-frames-output": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "extension": {
                                                    "properties": {
                                                        "value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "value-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "fc-blocks-signal-to-lp": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "hybrid-mw-structure-2-0:hybrid-mw-structure-pac": {
                                                    "properties": {
                                                        "hybrid-mw-structure-capability": {
                                                            "properties": {
                                                                "performance-monitoring-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "supported-alarm-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-tdm-structure-kind-list": {
                                                                    "properties": {
                                                                        "max-number-of-segments-reservable": {
                                                                            "type": "long"
                                                                        },
                                                                        "tdm-segment-size": {
                                                                            "type": "long"
                                                                        },
                                                                        "tdm-structure-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "hybrid-mw-structure-configuration": {
                                                            "properties": {
                                                                "clearing-threshold-cross-alarms-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "g-826-threshold-cross-alarm-list": {
                                                                    "properties": {
                                                                        "alarm-clearing-threshold": {
                                                                            "type": "long"
                                                                        },
                                                                        "alarm-raising-threshold": {
                                                                            "type": "long"
                                                                        },
                                                                        "g-826-value-kind": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "number-of-tdm-segments-to-be-reserved": {
                                                                    "type": "long"
                                                                },
                                                                "performance-monitoring-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "tdm-structure-kind": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "hybrid-mw-structure-current-performance": {
                                                            "properties": {
                                                                "current-performance-data-list": {
                                                                    "properties": {
                                                                        "elapsed-time": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "performance-data": {
                                                                            "properties": {
                                                                                "cses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "es": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-min": {
                                                                                    "type": "long"
                                                                                },
                                                                                "ses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "time-period": {
                                                                                    "type": "long"
                                                                                },
                                                                                "unavailability": {
                                                                                    "type": "long"
                                                                                }
                                                                            }
                                                                        },
                                                                        "scanner-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "suspect-interval-flag": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "timestamp": {
                                                                            "type": "date"
                                                                        }
                                                                    }
                                                                },
                                                                "number-of-current-performance-sets": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "hybrid-mw-structure-historical-performances": {
                                                            "properties": {
                                                                "historical-performance-data-list": {
                                                                    "properties": {
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "history-data-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "performance-data": {
                                                                            "properties": {
                                                                                "cses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "es": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-min": {
                                                                                    "type": "long"
                                                                                },
                                                                                "ses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "time-period": {
                                                                                    "type": "long"
                                                                                },
                                                                                "unavailability": {
                                                                                    "type": "long"
                                                                                }
                                                                            }
                                                                        },
                                                                        "period-end-time": {
                                                                            "type": "date"
                                                                        },
                                                                        "suspect-interval-flag": {
                                                                            "type": "boolean"
                                                                        }
                                                                    }
                                                                },
                                                                "number-of-historical-performance-sets": {
                                                                    "type": "long"
                                                                },
                                                                "time-of-latest-change": {
                                                                    "type": "date"
                                                                }
                                                            }
                                                        },
                                                        "hybrid-mw-structure-status": {
                                                            "properties": {
                                                                "performance-monitoring-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "segment-status-list": {
                                                                    "properties": {
                                                                        "operational-status": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "segment-is-reserved-for-tdm": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "segment-status-type-id": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "ip-interface-1-0:ip-interface-pac": {
                                                    "properties": {
                                                        "ip-interface-capability": {
                                                            "properties": {
                                                                "admin-shut-down-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "arp-proxy-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "burst-size-max": {
                                                                    "type": "long"
                                                                },
                                                                "burst-size-min": {
                                                                    "type": "long"
                                                                },
                                                                "dhcp-client-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "egress-shaping-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "fixed-default-gateway-configuration-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "information-rate-max": {
                                                                    "type": "long"
                                                                },
                                                                "information-rate-min": {
                                                                    "type": "long"
                                                                },
                                                                "ingress-policing-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "ip-v-6-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "maintenance-timer-range": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "maximum-number-of-ip-v-4-addresses": {
                                                                    "type": "long"
                                                                },
                                                                "maximum-transmission-unit-max": {
                                                                    "type": "long"
                                                                },
                                                                "maximum-transmission-unit-min": {
                                                                    "type": "long"
                                                                },
                                                                "statistics-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "supported-loop-back-kind-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "vpn-binding-is-avail": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "ip-interface-configuration": {
                                                            "properties": {
                                                                "arp-proxy": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "dhcp-client-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "egress-shaping-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "fixed-ip-v-4-address-list": {
                                                                    "properties": {
                                                                        "fixed-default-gateway-ip-v-4-address": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "fixed-ip-v-4-address": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "fixed-ip-v-4-address-prefix-length": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "ingress-policing-profile": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "interface-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "interface-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "l-3vpn-profile": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "loop-back-kind-on": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "maintenance-timer": {
                                                                    "type": "long"
                                                                },
                                                                "maximum-burst-size": {
                                                                    "type": "long"
                                                                },
                                                                "maximum-information-rate": {
                                                                    "type": "long"
                                                                },
                                                                "maximum-transmission-unit-ip": {
                                                                    "type": "long"
                                                                },
                                                                "qos-profile": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "statistics-is-on": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "ip-interface-status": {
                                                            "properties": {
                                                                "broadcast-packets-input": {
                                                                    "type": "long"
                                                                },
                                                                "broadcast-packets-output": {
                                                                    "type": "long"
                                                                },
                                                                "data-volume-input": {
                                                                    "type": "long"
                                                                },
                                                                "data-volume-output": {
                                                                    "type": "long"
                                                                },
                                                                "dropped-packets-input": {
                                                                    "type": "long"
                                                                },
                                                                "dropped-packets-output": {
                                                                    "type": "long"
                                                                },
                                                                "errored-packets-input": {
                                                                    "type": "long"
                                                                },
                                                                "errored-packets-output": {
                                                                    "type": "long"
                                                                },
                                                                "forwarded-data-volume-input": {
                                                                    "type": "long"
                                                                },
                                                                "forwarded-data-volume-output": {
                                                                    "type": "long"
                                                                },
                                                                "forwarded-packets-input": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "forwarded-packets-output": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "fragmented-packets-input": {
                                                                    "type": "long"
                                                                },
                                                                "interface-status": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "ip-address-origin": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "ip-v-4-address-cur-list": {
                                                                    "properties": {
                                                                        "fixed-default-gateway-ip-v-4-address": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "fixed-ip-v-4-address": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "fixed-ip-v-4-address-prefix-length": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "last-10-sec-data-input-rate": {
                                                                    "type": "long"
                                                                },
                                                                "last-10-sec-data-output-rate": {
                                                                    "type": "long"
                                                                },
                                                                "last-10-sec-packet-input-rate": {
                                                                    "type": "long"
                                                                },
                                                                "last-10-sec-packet-output-rate": {
                                                                    "type": "long"
                                                                },
                                                                "loop-back-kind-up": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "multicast-packets-input": {
                                                                    "type": "long"
                                                                },
                                                                "multicast-packets-output": {
                                                                    "type": "long"
                                                                },
                                                                "statistics-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "timestamp": {
                                                                    "type": "date"
                                                                },
                                                                "total-packets-input": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "total-packets-output": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "unicast-packets-input": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "unicast-packets-output": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "vpn-binding-is-up": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "is-protection-lock-out": {
                                                    "type": "boolean"
                                                },
                                                "label": {
                                                    "properties": {
                                                        "value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "value-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "layer-protocol-name": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "lifecycle-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "local-id": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "lp-direction": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "mac-interface-1-0:mac-interface-pac": {
                                                    "properties": {
                                                        "mac-interface-capability": {
                                                            "properties": {
                                                                "admin-shut-down-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "broadcast-frame-suppression-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "hardware-mac-address": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "link-loss-forwarding-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "loop-detection-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "loop-port-shut-down-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "mac-address-configuration-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "maintenance-timer-range": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "maximum-frame-size-max": {
                                                                    "type": "long"
                                                                },
                                                                "maximum-frame-size-min": {
                                                                    "type": "long"
                                                                },
                                                                "performance-monitoring-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "statistics-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "supported-alarm-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-flow-control-mode-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-frame-format-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-link-loss-forwarding-delay-list": {
                                                                    "type": "long"
                                                                },
                                                                "supported-loop-back-kind-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-maximum-frame-size-list": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "mac-interface-configuration": {
                                                            "properties": {
                                                                "broadcast-frame-suppression-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "configured-mac-address": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "flow-control-mode": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "fragmentation-allowed": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "interface-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "interface-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "link-loss-forwarding-delay": {
                                                                    "type": "long"
                                                                },
                                                                "link-loss-forwarding-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "loop-back-kind-on": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "loop-detection-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "loop-port-shut-down-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "mac-address-configuration-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "maintenance-timer": {
                                                                    "type": "long"
                                                                },
                                                                "maximum-frame-size": {
                                                                    "type": "long"
                                                                },
                                                                "maximum-share-of-broadcast-frames": {
                                                                    "type": "long"
                                                                },
                                                                "performance-monitoring-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "problem-kind-severity-list": {
                                                                    "properties": {
                                                                        "problem-kind-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "problem-kind-severity": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "statistics-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "transmitted-frame-format": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "mac-interface-current-performance": {
                                                            "properties": {
                                                                "current-performance-data-list": {
                                                                    "properties": {
                                                                        "elapsed-time": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "performance-data": {
                                                                            "properties": {
                                                                                "fragmented-frames-ingress": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "jabber-frames-ingress": {
                                                                                    "type": "long"
                                                                                },
                                                                                "oversized-frames-ingress": {
                                                                                    "type": "long"
                                                                                },
                                                                                "undersized-frames-ingress": {
                                                                                    "type": "long"
                                                                                },
                                                                                "unknown-protocol-frames-input": {
                                                                                    "type": "long"
                                                                                }
                                                                            }
                                                                        },
                                                                        "scanner-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "suspect-interval-flag": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "timestamp": {
                                                                            "type": "date"
                                                                        }
                                                                    }
                                                                },
                                                                "number-of-current-performance-sets": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "mac-interface-historical-performances": {
                                                            "properties": {
                                                                "historical-performance-data-list": {
                                                                    "properties": {
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "history-data-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "performance-data": {
                                                                            "properties": {
                                                                                "fragmented-frames-ingress": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "jabber-frames-ingress": {
                                                                                    "type": "long"
                                                                                },
                                                                                "oversized-frames-ingress": {
                                                                                    "type": "long"
                                                                                },
                                                                                "undersized-frames-ingress": {
                                                                                    "type": "long"
                                                                                },
                                                                                "unknown-protocol-frames-input": {
                                                                                    "type": "long"
                                                                                }
                                                                            }
                                                                        },
                                                                        "period-end-time": {
                                                                            "type": "date"
                                                                        },
                                                                        "suspect-interval-flag": {
                                                                            "type": "boolean"
                                                                        }
                                                                    }
                                                                },
                                                                "number-of-historical-performance-sets": {
                                                                    "type": "long"
                                                                },
                                                                "time-of-latest-change": {
                                                                    "type": "date"
                                                                }
                                                            }
                                                        },
                                                        "mac-interface-status": {
                                                            "properties": {
                                                                "broadcast-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "broadcast-frames-output": {
                                                                    "type": "long"
                                                                },
                                                                "dropped-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "dropped-frames-output": {
                                                                    "type": "long"
                                                                },
                                                                "errored-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "errored-frames-output": {
                                                                    "type": "long"
                                                                },
                                                                "flow-control-mode-cur": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "forwarded-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "forwarded-frames-output": {
                                                                    "type": "long"
                                                                },
                                                                "fragmented-frames-ingress": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "fragmented-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "interface-status": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "jabber-frames-ingress": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "last-10-sec-frame-input-rate": {
                                                                    "type": "long"
                                                                },
                                                                "last-10-sec-frame-output-rate": {
                                                                    "type": "long"
                                                                },
                                                                "loop-back-kind-up": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "loop-detection-result": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "mac-address-cur": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "multicast-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "multicast-frames-output": {
                                                                    "type": "long"
                                                                },
                                                                "oversized-frames-ingress": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "performance-monitoring-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "received-ethernet-frame-format-cur": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "statistics-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "timestamp": {
                                                                    "type": "date"
                                                                },
                                                                "total-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "total-frames-output": {
                                                                    "type": "long"
                                                                },
                                                                "undersized-frames-ingress": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "unicast-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "unicast-frames-output": {
                                                                    "type": "long"
                                                                },
                                                                "unknown-protocol-frames-input": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "name": {
                                                    "properties": {
                                                        "value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "value-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "operational-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "pure-ethernet-structure-2-0:pure-ethernet-structure-pac": {
                                                    "properties": {
                                                        "pure-ethernet-structure-capability": {
                                                            "properties": {
                                                                "performance-monitoring-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "supported-alarm-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "pure-ethernet-structure-configuration": {
                                                            "properties": {
                                                                "clearing-threshold-cross-alarms-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "g-826-threshold-cross-alarm-list": {
                                                                    "properties": {
                                                                        "alarm-clearing-threshold": {
                                                                            "type": "long"
                                                                        },
                                                                        "alarm-raising-threshold": {
                                                                            "type": "long"
                                                                        },
                                                                        "g-826-value-kind": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "performance-monitoring-is-on": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "pure-ethernet-structure-current-performance": {
                                                            "properties": {
                                                                "current-performance-data-list": {
                                                                    "properties": {
                                                                        "elapsed-time": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "performance-data": {
                                                                            "properties": {
                                                                                "cses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "es": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-min": {
                                                                                    "type": "long"
                                                                                },
                                                                                "ses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "time-period": {
                                                                                    "type": "long"
                                                                                },
                                                                                "unavailability": {
                                                                                    "type": "long"
                                                                                }
                                                                            }
                                                                        },
                                                                        "scanner-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "suspect-interval-flag": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "timestamp": {
                                                                            "type": "date"
                                                                        }
                                                                    }
                                                                },
                                                                "number-of-current-performance-sets": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "pure-ethernet-structure-historical-performances": {
                                                            "properties": {
                                                                "historical-performance-data-list": {
                                                                    "properties": {
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "history-data-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "performance-data": {
                                                                            "properties": {
                                                                                "cses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "es": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-avg": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-max": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-level-min": {
                                                                                    "type": "long"
                                                                                },
                                                                                "ses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "time-period": {
                                                                                    "type": "long"
                                                                                },
                                                                                "unavailability": {
                                                                                    "type": "long"
                                                                                }
                                                                            }
                                                                        },
                                                                        "period-end-time": {
                                                                            "type": "date"
                                                                        },
                                                                        "suspect-interval-flag": {
                                                                            "type": "boolean"
                                                                        }
                                                                    }
                                                                },
                                                                "number-of-historical-performance-sets": {
                                                                    "type": "long"
                                                                },
                                                                "time-of-latest-change": {
                                                                    "type": "date"
                                                                }
                                                            }
                                                        },
                                                        "pure-ethernet-structure-status": {
                                                            "properties": {
                                                                "performance-monitoring-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "segment-status-list": {
                                                                    "properties": {
                                                                        "operational-status": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "segment-status-type-id": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "synchronization-1-0:one-pps-plus-tod-pac": {
                                                    "properties": {
                                                        "external-time-port-dataset": {
                                                            "properties": {
                                                                "clock-accuracy": {
                                                                    "type": "long"
                                                                },
                                                                "clock-class": {
                                                                    "type": "long"
                                                                },
                                                                "current-utc-offset": {
                                                                    "type": "long"
                                                                },
                                                                "grand-master-identity": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "offset-scaled-log-variance": {
                                                                    "type": "long"
                                                                },
                                                                "priority-1": {
                                                                    "type": "long"
                                                                },
                                                                "priority-2": {
                                                                    "type": "long"
                                                                },
                                                                "steps-removed": {
                                                                    "type": "long"
                                                                },
                                                                "time-source": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "external-time-port-status": {
                                                            "type": "boolean"
                                                        },
                                                        "ptp-asymmetry-correction": {
                                                            "type": "long"
                                                        }
                                                    }
                                                },
                                                "synchronization-1-0:ptp-in-band-pac": {
                                                    "properties": {
                                                        "is-sf": {
                                                            "type": "boolean"
                                                        },
                                                        "ptp-announce-receipt-timeout": {
                                                            "type": "long"
                                                        },
                                                        "ptp-asymmetry-correction": {
                                                            "type": "long"
                                                        },
                                                        "ptp-asymmetry-correction-is-avail": {
                                                            "type": "boolean"
                                                        },
                                                        "ptp-local-priority": {
                                                            "type": "long"
                                                        },
                                                        "ptp-log-announce-interval": {
                                                            "type": "long"
                                                        },
                                                        "ptp-log-min-delay-req-interval": {
                                                            "type": "long"
                                                        },
                                                        "ptp-log-sync-interval": {
                                                            "type": "long"
                                                        },
                                                        "ptp-mac-egress-configuration": {
                                                            "properties": {
                                                                "destination-mac-address": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "priority": {
                                                                    "type": "long"
                                                                },
                                                                "vlan-id": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "ptp-master-only": {
                                                            "type": "boolean"
                                                        },
                                                        "ptp-port-enable-status": {
                                                            "type": "boolean"
                                                        },
                                                        "ptp-udp-egress-configuration": {
                                                            "properties": {
                                                                "destination-ip-address": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "ip-protocol-type": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "synchronization-1-0:ssm-external-clock-pac": {
                                                    "properties": {
                                                        "bits-type": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "external-port-enable-status": {
                                                            "type": "boolean"
                                                        },
                                                        "ssm-configuration-value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "ssm-information": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "ssm-mode": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "ssm-out-threshold": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "ssm-sa-bit": {
                                                            "type": "long"
                                                        }
                                                    }
                                                },
                                                "synchronization-1-0:ssm-in-band-pac": {
                                                    "properties": {
                                                        "ssm-configuration-value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "ssm-information": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "ssm-mode": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "ssm-output-enable-status": {
                                                            "type": "boolean"
                                                        }
                                                    }
                                                },
                                                "tdm-container-2-0:tdm-container-pac": {
                                                    "properties": {
                                                        "tdm-container-capability": {
                                                            "properties": {
                                                                "admin-shut-down-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "maintenance-timer-range": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "performance-monitoring-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "supported-alarm-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-loop-back-kind-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-tdm-container-kind-list": {
                                                                    "properties": {
                                                                        "tdm-container-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "tdm-container-size": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "tdm-container-configuration": {
                                                            "properties": {
                                                                "interface-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "interface-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "loop-back-kind-on": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "maintenance-timer": {
                                                                    "type": "long"
                                                                },
                                                                "performance-monitoring-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "problem-kind-severity-list": {
                                                                    "properties": {
                                                                        "problem-kind-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "problem-kind-severity": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "segment-number": {
                                                                    "type": "long"
                                                                },
                                                                "tdm-container-kind": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "tdm-container-status": {
                                                            "properties": {
                                                                "interface-status": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "loop-back-kind-up": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "performance-monitoring-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "statistics-is-up": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "termination-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "vlan-interface-1-0:vlan-interface-pac": {
                                                    "properties": {
                                                        "vlan-interface-capability": {
                                                            "properties": {
                                                                "admin-shut-down-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "available-pcp-bits-interpretation-kind-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "configuring-ingress-tag-filtering-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "configuring-pcp-bits-decoding-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "configuring-pcp-bits-encoding-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "configuring-service-access-priority-mapping-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "drop-eligible-indicator-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "egress-vlan-id-translation-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "ingress-vlan-id-filtering-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "max-number-of-protocol-vlan-id-groupings": {
                                                                    "type": "long"
                                                                },
                                                                "number-of-available-priorities": {
                                                                    "type": "long"
                                                                },
                                                                "number-of-available-traffic-classes": {
                                                                    "type": "long"
                                                                },
                                                                "port-and-protocol-based-vlan-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "priority-to-traffic-class-mapping-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "received-priority-overwriting-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "restricted-automated-vlan-registration-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "service-access-priority-tagging-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "statistics-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "supported-interface-kind-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-sub-layer-protocol-name-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "tagging-and-mvrp-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "vlan-id-translation-is-avail": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "vlan-interface-configuration": {
                                                            "properties": {
                                                                "admin-point-to-point": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "default-priority": {
                                                                    "type": "long"
                                                                },
                                                                "default-vlan-id": {
                                                                    "type": "long"
                                                                },
                                                                "drop-eligible-encoding-is-required": {
                                                                    "type": "boolean"
                                                                },
                                                                "drop-eligible-indicator-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "egress-vlan-id-translation-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "external-to-internal-vlan-id-mapping-list": {
                                                                    "properties": {
                                                                        "external-vlan-id": {
                                                                            "type": "long"
                                                                        },
                                                                        "internal-vlan-id": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "forwarded-protocol-vlan-id-grouping-list": {
                                                                    "properties": {
                                                                        "forwarded-protocol-group-id": {
                                                                            "type": "long"
                                                                        },
                                                                        "forwarded-vlan-id-list": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "ingress-tag-filtering": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "ingress-vlan-id-filtering-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "interface-kind": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "interface-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "internal-to-egress-vlan-id-mapping-list": {
                                                                    "properties": {
                                                                        "egress-vlan-id": {
                                                                            "type": "long"
                                                                        },
                                                                        "internal-vlan-id": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "pcp-bit-to-priority-mapping-list": {
                                                                    "properties": {
                                                                        "associated-drop-eligibility": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "associated-priority-value": {
                                                                            "type": "long"
                                                                        },
                                                                        "to-be-decoded-pcp-bits-value": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "pcp-bits-encoding-mapping-list": {
                                                                    "properties": {
                                                                        "associated-pcp-bits-value": {
                                                                            "type": "long"
                                                                        },
                                                                        "to-be-encoded-drop-eligibility": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "to-be-encoded-priority-value": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "pcp-bits-interpretation-kind": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "priority-to-traffic-class-mapping-list": {
                                                                    "properties": {
                                                                        "priority-value": {
                                                                            "type": "long"
                                                                        },
                                                                        "traffic-class-value": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "received-priority-overwriting-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "received-priority-overwriting-list": {
                                                                    "properties": {
                                                                        "new-priority-value": {
                                                                            "type": "long"
                                                                        },
                                                                        "to-be-overwritten-priority-value": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "restricted-automated-vlan-registration-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "service-access-priority-mapping-list": {
                                                                    "properties": {
                                                                        "c-vlan-priority-value": {
                                                                            "type": "long"
                                                                        },
                                                                        "s-vlan-pcp-bits-value": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "service-access-priority-tagging-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "statistics-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "sub-layer-protocol-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "vlan-id-translation-is-on": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "vlan-interface-status": {
                                                            "properties": {
                                                                "interface-status": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "statistics-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "timestamp": {
                                                                    "type": "date"
                                                                },
                                                                "total-bytes-input": {
                                                                    "type": "long"
                                                                },
                                                                "total-bytes-output": {
                                                                    "type": "long"
                                                                },
                                                                "total-frames-input": {
                                                                    "type": "long"
                                                                },
                                                                "total-frames-output": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "wire-interface-2-0:wire-interface-pac": {
                                                    "properties": {
                                                        "wire-interface-capability": {
                                                            "properties": {
                                                                "admin-shut-down-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "auto-negotiation-pmd-selection-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "auto-pmd-negotiation-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "auto-signal-ordering-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "configuration-of-number-of-bip-errors-per-ses-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "configuration-of-rx-sync-preference-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "eee-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "isolation-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "maintenance-timer-range": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "mdi-kind": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "mii-kind": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "performance-monitoring-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "required-medium-kind": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "rxlevel-high-threshold": {
                                                                    "type": "long"
                                                                },
                                                                "rxlevel-low-threshold": {
                                                                    "type": "long"
                                                                },
                                                                "short-reach-mode-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "supported-alarm-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-loop-back-kind-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "supported-pmd-kind-list": {
                                                                    "properties": {
                                                                        "duplex": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "pmd-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "speed": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "supported-signal-ordering-kind-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "temperature-high-threshold": {
                                                                    "type": "long"
                                                                },
                                                                "temperature-low-threshold": {
                                                                    "type": "long"
                                                                },
                                                                "unidirectional-operation-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "wavelength-grid-min": {
                                                                    "type": "long"
                                                                },
                                                                "wavelength-max-list": {
                                                                    "type": "long"
                                                                },
                                                                "wavelength-min-list": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "wire-interface-configuration": {
                                                            "properties": {
                                                                "auto-negotiation-pmd-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "auto-pmd-negotiation-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "auto-signal-ordering-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "eee-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "fixed-pmd-kind": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "fixed-signal-ordering-kind": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "interface-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "interface-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "isolation-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "loop-back-kind-on": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "maintenance-timer": {
                                                                    "type": "long"
                                                                },
                                                                "number-of-bip-errors-per-ses": {
                                                                    "type": "long"
                                                                },
                                                                "performance-monitoring-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "problem-kind-severity-list": {
                                                                    "properties": {
                                                                        "problem-kind-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "problem-kind-severity": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "remote-wire-interface-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "restart-pmd-negotiation-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "rx-sync-preference": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "short-reach-mode-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "transceiver-configuration-list": {
                                                                    "properties": {
                                                                        "transceiver-index": {
                                                                            "type": "long"
                                                                        },
                                                                        "transceiver-is-on": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "wavelength": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "transceiver-is-on-list": {
                                                                    "type": "boolean"
                                                                },
                                                                "unidirectional-operation-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "wavelength-list": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "wire-interface-current-performance": {
                                                            "properties": {
                                                                "current-performance-data-list": {
                                                                    "properties": {
                                                                        "elapsed-time": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "performance-data": {
                                                                            "properties": {
                                                                                "es": {
                                                                                    "type": "long"
                                                                                },
                                                                                "low-power-idle-receiver-ms": {
                                                                                    "type": "long"
                                                                                },
                                                                                "low-power-idle-transmitter-ms": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-collisions": {
                                                                                    "type": "long"
                                                                                },
                                                                                "ses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "symbol-error-during-carrier": {
                                                                                    "type": "long"
                                                                                }
                                                                            }
                                                                        },
                                                                        "scanner-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "suspect-interval-flag": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "timestamp": {
                                                                            "type": "date"
                                                                        }
                                                                    }
                                                                },
                                                                "number-of-current-performance-sets": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "wire-interface-historical-performances": {
                                                            "properties": {
                                                                "historical-performance-data-list": {
                                                                    "properties": {
                                                                        "granularity-period": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "history-data-id": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "performance-data": {
                                                                            "properties": {
                                                                                "es": {
                                                                                    "type": "long"
                                                                                },
                                                                                "low-power-idle-receiver-ms": {
                                                                                    "type": "long"
                                                                                },
                                                                                "low-power-idle-transmitter-ms": {
                                                                                    "type": "long"
                                                                                },
                                                                                "rx-collisions": {
                                                                                    "type": "long"
                                                                                },
                                                                                "ses": {
                                                                                    "type": "long"
                                                                                },
                                                                                "symbol-error-during-carrier": {
                                                                                    "type": "long"
                                                                                }
                                                                            }
                                                                        },
                                                                        "period-end-time": {
                                                                            "type": "date"
                                                                        },
                                                                        "suspect-interval-flag": {
                                                                            "type": "boolean"
                                                                        }
                                                                    }
                                                                },
                                                                "number-of-historical-performance-sets": {
                                                                    "type": "long"
                                                                },
                                                                "time-of-latest-change": {
                                                                    "type": "date"
                                                                }
                                                            }
                                                        },
                                                        "wire-interface-status": {
                                                            "properties": {
                                                                "eee-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "interface-status": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "link-is-idle": {
                                                                    "type": "boolean"
                                                                },
                                                                "link-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "loop-back-kind-up": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "performance-monitoring-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "pmd-is-up": {
                                                                    "type": "boolean"
                                                                },
                                                                "pmd-kind-cur": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "pmd-negotiation-state": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "receive-signal-is-detected-list": {
                                                                    "type": "boolean"
                                                                },
                                                                "receiver-status-list": {
                                                                    "properties": {
                                                                        "receive-signal-is-detected": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "receiver-index": {
                                                                            "type": "long"
                                                                        },
                                                                        "rx-level-cur": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "rx-collisions": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "rx-level-cur-list": {
                                                                    "type": "long"
                                                                },
                                                                "rx-sync-role": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "signal-ordering-kind-cur": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "tx-level-cur": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "lifecycle-state": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "local-id": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "ltp-augment-1-0:ltp-augment-pac": {
                                            "properties": {
                                                "connector": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "equipment": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "external-label": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "ltp-augment-capability": {
                                                    "properties": {
                                                        "connector": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "equipment": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "original-ltp-name": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "ltp-direction": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "ltp-in-other-view": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "name": {
                                            "properties": {
                                                "value": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "value-name": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "operational-state": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "peer-ltp": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "physical-port-reference": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "server-ltp": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "supporting-pc": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "synchronization-1-0:embedded-clock": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "transfer-capacity-pac": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "uuid": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        }
                                    }
                                },
                                "name": {
                                    "properties": {
                                        "value": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "value-name": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        }
                                    }
                                },
                                "operational-state": {
                                    "type": "text",
                                    "fields": {
                                        "keyword": {
                                            "type": "keyword",
                                            "ignore_above": 256
                                        }
                                    }
                                },
                                "profile-collection": {
                                    "properties": {
                                        "profile": {
                                            "properties": {
                                                "administrative-control": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "administrative-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "co-channel-profile-1-0:co-channel-profile-pac": {
                                                    "properties": {
                                                        "co-channel-profile-capability": {
                                                            "properties": {
                                                                "alic-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "mimo-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "number-of-mimo-channels-max": {
                                                                    "type": "long"
                                                                },
                                                                "xpic-is-avail": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "co-channel-profile-configuration": {
                                                            "properties": {
                                                                "kind-of-co-channel-group": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "logical-termination-point-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "profile-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "external-managed-id": {
                                                    "properties": {
                                                        "external-managed-uuid": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "manager-identifier": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "l-3vpn-profile-1-0:l-3vpn-pac": {
                                                    "properties": {
                                                        "l-3vpn-capability": {
                                                            "properties": {
                                                                "l-3vpn-based-on-ip-v-6-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "profile-naming-is-avail": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "l-3vpn-configuration": {
                                                            "properties": {
                                                                "l-3vpn-description": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "profile-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "lifecycle-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "local-id": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "name": {
                                                    "properties": {
                                                        "value": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "value-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "operational-state": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "profile-name": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "qos-profile-1-0:qos-profile-pac": {
                                                    "properties": {
                                                        "qos-profile-capability": {
                                                            "properties": {
                                                                "available-qos-profile-kind-list": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "available-queue-list": {
                                                                    "properties": {
                                                                        "queue-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "supported-queue-depth-list": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "drop-precedence-at-af-queues-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "drop-precedence-at-be-queue-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "drop-precedence-at-prio-queues-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "profile-naming-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "queue-depth-configuration-is-avail": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "qos-profile-configuration": {
                                                            "properties": {
                                                                "egress-per-hop-behavior-to-8021p-mapping-list": {
                                                                    "properties": {
                                                                        "mapping-number": {
                                                                            "type": "long"
                                                                        },
                                                                        "per-hop-behavior": {
                                                                            "properties": {
                                                                                "drop-precedence-inside-queue": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "queue-name": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        },
                                                                        "value-of-priority-bits": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "egress-per-hop-behavior-to-ip-dscp-mapping-list": {
                                                                    "properties": {
                                                                        "mapping-number": {
                                                                            "type": "long"
                                                                        },
                                                                        "per-hop-behavior": {
                                                                            "properties": {
                                                                                "drop-precedence-inside-queue": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "queue-name": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        },
                                                                        "value-of-priority-bits": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "egress-per-hop-behavior-to-mpls-exp-mapping-list": {
                                                                    "properties": {
                                                                        "mapping-number": {
                                                                            "type": "long"
                                                                        },
                                                                        "per-hop-behavior": {
                                                                            "properties": {
                                                                                "drop-precedence-inside-queue": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                },
                                                                                "queue-name": {
                                                                                    "type": "text",
                                                                                    "fields": {
                                                                                        "keyword": {
                                                                                            "type": "keyword",
                                                                                            "ignore_above": 256
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        },
                                                                        "value-of-priority-bits": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                },
                                                                "ingress-8021p-to-per-hop-behavior-mapping-list": {
                                                                    "properties": {
                                                                        "drop-precedence-inside-queue": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "queue-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "ingress-exp-to-per-hop-behavior-mapping-list": {
                                                                    "properties": {
                                                                        "drop-precedence-inside-queue": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "queue-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "ingress-ip-dscp-to-per-hop-behavior-mapping-list": {
                                                                    "properties": {
                                                                        "drop-precedence-inside-queue": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "queue-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "profile-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "qos-profile-kind": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "queue-depth-list": {
                                                                    "properties": {
                                                                        "queue-depth": {
                                                                            "type": "long"
                                                                        },
                                                                        "queue-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "writing-per-hop-behavior-into-8021p-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "writing-per-hop-behavior-into-ip-dscp-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "writing-per-hop-behavior-into-mpls-exp-is-on": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "scheduler-profile-1-0:scheduler-profile-pac": {
                                                    "properties": {
                                                        "scheduler-profile-capability": {
                                                            "properties": {
                                                                "available-queue-list": {
                                                                    "properties": {
                                                                        "available-scheduling-kind-list": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "queue-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                "scheduler-kind-configuration-is-avail": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "scheduler-profile-configuration": {
                                                            "properties": {
                                                                "queue-behavior-list": {
                                                                    "properties": {
                                                                        "queue-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "scheduler-kind": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "weighting": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "uuid": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "wred-profile-1-0:wred-profile-pac": {
                                                    "properties": {
                                                        "wred-profile-capability": {
                                                            "properties": {
                                                                "available-buffer-size": {
                                                                    "type": "long"
                                                                },
                                                                "coloring-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "drop-probability-at-threshold-low-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "gentle-wred-is-avail": {
                                                                    "type": "boolean"
                                                                },
                                                                "sensitivity-setting-is-avail": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "wred-profile-configuration": {
                                                            "properties": {
                                                                "coloring-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "drop-probability-at-threshold-high": {
                                                                    "type": "long"
                                                                },
                                                                "drop-probability-at-threshold-low": {
                                                                    "type": "long"
                                                                },
                                                                "gentle-wred-is-on": {
                                                                    "type": "boolean"
                                                                },
                                                                "profile-name": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "sensitivity": {
                                                                    "type": "long"
                                                                },
                                                                "threshold-gentle": {
                                                                    "type": "long"
                                                                },
                                                                "threshold-high": {
                                                                    "type": "long"
                                                                },
                                                                "threshold-low": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "profile-collection": {
                                            "properties": {
                                                "profile": {
                                                    "properties": {
                                                        "administrative-control": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "administrative-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "co-channel-profile-1-0:co-channel-profile-pac": {
                                                            "properties": {
                                                                "co-channel-profile-capability": {
                                                                    "properties": {
                                                                        "alic-is-avail": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "mimo-is-avail": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "number-of-mimo-channels-max": {
                                                                            "type": "long"
                                                                        },
                                                                        "xpic-is-avail": {
                                                                            "type": "boolean"
                                                                        }
                                                                    }
                                                                },
                                                                "co-channel-profile-configuration": {
                                                                    "properties": {
                                                                        "kind-of-co-channel-group": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "logical-termination-point-list": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "profile-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "external-managed-id": {
                                                            "properties": {
                                                                "external-managed-uuid": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "manager-identifier": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "lifecycle-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "local-id": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "operational-state": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "profile-name": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "uuid": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "wred-profile-1-0:wred-profile-pac": {
                                                            "properties": {
                                                                "wred-profile-capability": {
                                                                    "properties": {
                                                                        "available-buffer-size": {
                                                                            "type": "long"
                                                                        },
                                                                        "coloring-is-avail": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "drop-probability-at-threshold-low-is-avail": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "gentle-wred-is-avail": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "sensitivity-setting-is-avail": {
                                                                            "type": "boolean"
                                                                        }
                                                                    }
                                                                },
                                                                "wred-profile-configuration": {
                                                                    "properties": {
                                                                        "coloring-is-on": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "drop-probability-at-threshold-high": {
                                                                            "type": "long"
                                                                        },
                                                                        "drop-probability-at-threshold-low": {
                                                                            "type": "long"
                                                                        },
                                                                        "gentle-wred-is-on": {
                                                                            "type": "boolean"
                                                                        },
                                                                        "profile-name": {
                                                                            "type": "text",
                                                                            "fields": {
                                                                                "keyword": {
                                                                                    "type": "keyword",
                                                                                    "ignore_above": 256
                                                                                }
                                                                            }
                                                                        },
                                                                        "sensitivity": {
                                                                            "type": "long"
                                                                        },
                                                                        "threshold-gentle": {
                                                                            "type": "long"
                                                                        },
                                                                        "threshold-high": {
                                                                            "type": "long"
                                                                        },
                                                                        "threshold-low": {
                                                                            "type": "long"
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "synchronization-1-0:clock-collection": {
                                    "properties": {
                                        "clock": {
                                            "properties": {
                                                "layer-protocol-name": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "local-id": {
                                                    "type": "text",
                                                    "fields": {
                                                        "keyword": {
                                                            "type": "keyword",
                                                            "ignore_above": 256
                                                        }
                                                    }
                                                },
                                                "phy-layer-frequency-sync-pac": {
                                                    "properties": {
                                                        "internal-clock-ssm": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "run-mode": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "ptp-sync-pac": {
                                                    "properties": {
                                                        "active-profile": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "ptp-default-dataset": {
                                                            "properties": {
                                                                "clock-accuracy": {
                                                                    "type": "long"
                                                                },
                                                                "clock-class": {
                                                                    "type": "long"
                                                                },
                                                                "ieee-1588-protocol-version": {
                                                                    "type": "long"
                                                                },
                                                                "is-sf": {
                                                                    "type": "boolean"
                                                                },
                                                                "local-clock-identity": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "local-priority": {
                                                                    "type": "long"
                                                                },
                                                                "max-steps-removed": {
                                                                    "type": "long"
                                                                },
                                                                "offset-scaled-log-variance": {
                                                                    "type": "long"
                                                                },
                                                                "priority-1": {
                                                                    "type": "long"
                                                                },
                                                                "priority-2": {
                                                                    "type": "long"
                                                                }
                                                            }
                                                        },
                                                        "ptp-device-type": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "ptp-domain-number": {
                                                            "type": "long"
                                                        },
                                                        "ptp-local-clock-identity": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "ptp-profiles-supported": {
                                                            "type": "text",
                                                            "fields": {
                                                                "keyword": {
                                                                    "type": "keyword",
                                                                    "ignore_above": 256
                                                                }
                                                            }
                                                        },
                                                        "ptp-slave-only": {
                                                            "type": "boolean"
                                                        },
                                                        "ptp-source-dataset": {
                                                            "properties": {
                                                                "clock-accuracy": {
                                                                    "type": "long"
                                                                },
                                                                "clock-class": {
                                                                    "type": "long"
                                                                },
                                                                "current-utc-offset": {
                                                                    "type": "long"
                                                                },
                                                                "frequency-traceable": {
                                                                    "type": "boolean"
                                                                },
                                                                "grand-master-identity": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "ieee-1588-protocol-version": {
                                                                    "type": "long"
                                                                },
                                                                "offset-scaled-log-variance": {
                                                                    "type": "long"
                                                                },
                                                                "parent-clock-identity": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "priority-1": {
                                                                    "type": "long"
                                                                },
                                                                "priority-2": {
                                                                    "type": "long"
                                                                },
                                                                "ptp-time-scale": {
                                                                    "type": "boolean"
                                                                },
                                                                "steps-removed": {
                                                                    "type": "long"
                                                                },
                                                                "time-source": {
                                                                    "type": "text",
                                                                    "fields": {
                                                                        "keyword": {
                                                                            "type": "keyword",
                                                                            "ignore_above": 256
                                                                        }
                                                                    }
                                                                },
                                                                "time-traceable": {
                                                                    "type": "boolean"
                                                                }
                                                            }
                                                        },
                                                        "ptp-transparent-clock-default-dataset": {
                                                            "properties": {
                                                                "number-ports" : {
                                                                    "type" : "text"
                                                                },
                                                                "primary-domain" : {
                                                                    "type" : "text"
                                                                },
                                                                "delay-mechanism" : {
                                                                    "type" : "text"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "synchronization-1-0:ne-sync-pac": {
                                    "properties": {
                                        "packet-freq-sync-support-enabled-and-profile-selector": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "sync-support-packet-freq": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "sync-support-physical-freq": {
                                            "type": "boolean"
                                        },
                                        "sync-support-time": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        },
                                        "time-sync-support-enabled-and-profile-selector": {
                                            "type": "text",
                                            "fields": {
                                                "keyword": {
                                                    "type": "keyword",
                                                    "ignore_above": 256
                                                }
                                            }
                                        }
                                    }
                                },
                                "top-level-equipment": {
                                    "type": "text",
                                    "fields": {
                                        "keyword": {
                                            "type": "keyword",
                                            "ignore_above": 256
                                        }
                                    }
                                },
                                "uuid": {
                                    "type": "text",
                                    "fields": {
                                        "keyword": {
                                            "type": "keyword",
                                            "ignore_above": 256
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    iTemplate.body.composed_of = ['mwdi-mappings'];
    await client.indices.putIndexTemplate(iTemplate);
}
