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
At configurable time intervals (via integerProfile *qualityMeasurementWaitingTime*), a candidate device is selected for which the quality measurement is carried out.

The process runs in tandem with the regular ControlConstruct update process (slidingWindow), whereby the chosen update strategy ensures that both updating older over newer ControlConstructs is prioritized as well as that both processes work in an aligned fashion. This is achieved by the device selection mechanism described below. 

### Device selection strategy

Instead of selecting a device randomly, the process utilizes the MWDI metadata status service (/v1/provide-device-status-metadata) to identify the next update candidate device. The metadata status services bases its decision on the timestamp values found in metadata status attribute *last-complete-control-construct-update-time*. Note that the quality measurement process only is applied to devices, for which a ControlConstruct is already present inside the cache - i.e. the device is currently in connected state and the last update timestamp is not null.  

Selecting the device, whose cached ControlConstruct was updated the longest time ago, ensures that devices with outdated entries are prioritized for quality assessment. This strategy helps systematically improve the overall cache quality by always targeting the least recently updated devices first.

**Comparison of quality measurement and slidingWindow process:**  
- for both the next update candidate device is selected from the pool of connected devices found in the metadata status table
  - candidate selection is done based on *last-complete-control-construct-update-time*
- a different filter value is provided to the metadata status service:
  - quality measurement: select the device with the oldest timestamp, which is NOT null
  - slidingWindow: select a device with timestamp == null, if none are null, select the one with the oldest timestamp

### Data retrieval
Once a candidate devices has been identified, first its ControlConstruct is retrieved from the MWDI's cache. In the next step, the ControlConstruct is fetched from live (via MWDI live service).

Both ControlConstructs are then compared to determine the differences. After the comparison and scoring has been finished, results are written to ElasticSearch.  

There are no specific presciptions for how the comparison shall be implemented apart from the comparison logic to be applied. An appropriate approach shall be selected by the implementer.  

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
| Missing class           | 5      | Class exists in one of them  but missing in other|     
| Object creation/deletion| 3      | Presence or absence of significant data objects  |

A total weighted score is computed per device and used to quantify the extent of divergence.  

### Sample output
```json
{
  "deviceId": "100250001",
  "timestamp": "2025-04-21T12:03:45Z",
  "attribute-mismatches": 18,
  "missing-classes": 2,
  "new-classes": 1,
  "weighted-score": 31
}
```

## Outlook
For now, the gathered quality statistics will only be made available via a new provider service offered by MWDI.  
In the future it is planned that these statistics will be gathered in a (not yet existing) Performance Management application.  