# Cyclic process for measuring the cache quality

This page describes the cache quality measurement process, which is a monitoring process integrated into MWDI. 
Its purpose is to continuously assess the accuracy and freshness of cached ControlConstruct data by comparing it with the corresponding real-time data retrieved directly from connected devices (via MWDI live service).

Below a comprehensive description of the measurement process, architectural components, comparison strategy, scoring methodology, and integration details are provided.

## Objective

The objective of the process is to:
- Periodically evaluate the content of the MWDI cache.
- Compare the cached version of a ControlConstruct with its current live version obtained from the device.
- Identify and categorize differences.
- Compute a weighted score based on the nature and severity of the detected differences.
- Store the result in a persistent log or database for further analysis and reporting.

## Measurement workflow

The measurement process is a cyclic process, triggered by the MWDI's internal scheduler.  
At configurable time intervals (via integerProfile *qualityMeasurementUpdatePeriod*), a candidate device is selected for which the quality measurement is carried out.

The process runs in tandem with the regular ControlConstruct update process (slidingWindow), whereby the chosen update strategy ensures that both updating older over newer ControlConstructs is prioritized as well as that both processes work in an aligned fashion. This is achieved by the device selection mechanism described below. 

### Device selection strategy

Instead of selecting a device randomly, the process utilizes the ordering of the deviceMetadataList based on metadata.  
The process directly accesses the deviceMetadataList to determine the next measurement candidate.  

Each time a new candidate device has to be chosen, the process selects the first device found in the deviceMetadataList, ...
- with *connection-status* == connected
- *locked-status* == unlocked
- *exclude-from-qm* == false

Due to the ordering of the deviceMetadataList by priority (*last-complete-control-construct-update-time-attempt* and *connection-status*), the process will always pick the device with the oldest ControlConstruct, which is not yet already processed by the slidingWindow process.  
By selecting the device, whose cached ControlConstruct was updated the longest time ago, it is ensured that devices with outdated entries are prioritized for quality assessment. This strategy helps systematically improve the overall cache quality by always targeting the least recently updated devices first.

This approach tends to result in a more pessimistic measurement result than the quality perceived during normal use (random selection).  

### Data retrieval
Once a candidate devices has been identified, first its ControlConstruct is retrieved from the MWDI's cache. In the next step, the ControlConstruct is fetched from live (via MWDI live service).

Both ControlConstructs are then compared to determine the differences. After the comparison and scoring has been finished, results are written to ElasticSearch.  
Data is kept according to the number of samples configured in integerProfile *qualityMeasurementSampleNumber*.  

There are no specific prescriptions for how the comparison shall be implemented apart from the comparison logic to be applied. An appropriate approach shall be selected by the implementer.  
*First analysis results showed that* deepdiff *could be a suitable candidate for comparing the ControlConstructs (large JSON structures), as it is claimed to be easy to use and to be handling deep comparisons really well (it can detect value changes, missing or new objects, type mismatches etc., and its output potentially can be easily connected with the intended scoring model).*  

## Comparison logic and scoring model

For comparing the two ControlConstructs and scoring the differences the following logic shall be applied.  

### Comparison logic
The module performs a structured tree-based comparison:
- Attribute-level differences: mismatches in leaf-node values.
- Attribute-class mismatches: data classes present in the live structure but absent in the cache or vice versa (missing classes) .


### Scoring model
Each type of difference is assigned a configurable weight:

| Difference Type         | Weight | Description                                      |
|-------------------------|--------|--------------------------------------------------|
| Attribute mismatch      | 1      | Value inconsistency in leaf nodes                |
| Attribute-class mismatch | 5      | Presence or absence of significant data objects (i.e. object creation/deletion)  |

A total weighted score is computed per device and used to quantify the extent of divergence.  

### Output

Each completed comparison will add a new entry into ElasticSearch. The following example shows such an entry:
```json
{
  "mount-name": "100250001",
  "device-type": "AGS20",
  "vendor": "SIAE",
  "timestamp": "2025-04-21T12:03:45Z",
  "attribute-mismatches": 18,
  "attribute-class-mismatches": 2,
  "weighted-score": 31
}
```
Raw samples cannot be retrieved, instead calling the */v1/provide-cache-quality-statistics* service computes the aggregated statistics on demand.  
The number of samples that are consolidated into the aggregated result is configurable (*qualityMeasurementSampleNumber*).  
The default number of samples is 1440, which corresponds to a 24h measurement period.  
E.g., a smaller number of samples allows to see the consequence of changes to the notification handling more quickly.  

If the number of raw statistic records in the database is exceeding the configured number of input values, the eldest sample gets deleted from the database.  
If the number of raw statistic records in the database is lower that the configured number of input values, the */v1/provide-cache-quality-statistics* service is not computing any result, but answering error code 530 (Data invalid. Response data not available, incomplete or corrupted).  

**Please note**
The performance data will be calculated on demand.  
At any time, it will be calculated based on the configurable number of available raw data samples.  
There are no measurement time periods defined.  
Consequently, there are no historical values.  
As every calculation result is bases on the same number of raw data samples, calculation results can easily be compared and aggregated.  

Performance data can be retrieved aggregated over all kinds of devices (default) or aggregated over the individual deviceTypes.  

The service supports MWDI's broader monitoring goals by making the quality status of cached ControlConstructs transparent and accessible for analysis or visualization.  

## Outlook
For now, the gathered quality statistics will only be made available via a new provider service offered by MWDI.  
In the future it is planned that these statistics will be gathered in a (not yet existing) Performance Management application.  