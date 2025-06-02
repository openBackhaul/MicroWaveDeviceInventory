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
- *exclude_from_qm* == false

Due to the ordering of the deviceMetadataList by priority (*last-complete-control-construct-update-time-attempt* and *connection-status*), the process will always pick the device with the oldest ControlConstruct, which is not yet already processed by the slidingWindow process.  
By selecting the device, whose cached ControlConstruct was updated the longest time ago, it is ensured that devices with outdated entries are prioritized for quality assessment. This strategy helps systematically improve the overall cache quality by always targeting the least recently updated devices first.

### Data retrieval
Once a candidate devices has been identified, first its ControlConstruct is retrieved from the MWDI's cache. In the next step, the ControlConstruct is fetched from live (via MWDI live service).

Both ControlConstructs are then compared to determine the differences. After the comparison and scoring has been finished, results are written to ElasticSearch.  
Data is kept according to the number of samples configured in integerProfile *qualityMeasurementSampleNumber*.  

There are no specific presciptions for how the comparison shall be implemented apart from the comparison logic to be applied. An appropriate approach shall be selected by the implementer.  
*First analysis results showed that* deepdiff *could be a suitable candidate for comparing the ControlConstructs (large JSON structures), as it is claimed to be easy to use and to be handling deep comparisons really well (it can detect value changes, missing or new objects, type mismatches etc., and its output potentially can be easily connected with the intended scoring model).*  

## Comparison logic and scoring model

For comparing the two ControlConstructs and scoring the differences the following logic shall be applied.  

### Comparison logic
The module performs a structured tree-based comparison:
- Attribute-level differences: mismatches in leaf-node values.
- Missing classes: data classes present in the live structure but absent in the cache or vice versa.
- Object creations and deletions if derived from structural changes.

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

Raw statistic records are only kept according to the number of configured samples. Raw samples cannot be retrieved, instead calling service */v1/provide-cache-quality-statistics* always computes the aggregated statistic from the available samples (only if there are not less than *qualityMeasurementSampleNumber* samples, in that case nothing will be computed).  
As the aggregated statistics are only computed on demand, they also will not be kept in the MWDI cache. This means if data is not collected, it will be lost.  

Per default there is just a single aggregation over all samples resulting in a single output record. However, it is also possible to aggregate per deviceType.  
By allowing to adjust the *qualityMeasurementSampleNumber*, MWDI offers flexibility (a possible scenario would be e.g. to set a lower number of samples to see applied changes to notification handling more quickly).  

The service supports MWDI's broader monitoring goals by making the quality status of cached ControlConstructs transparent and accessible for analysis or visualization.

## Outlook
For now, the gathered quality statistics will only be made available via a new provider service offered by MWDI.  
In the future it is planned that these statistics will be gathered in a (not yet existing) Performance Management application.  