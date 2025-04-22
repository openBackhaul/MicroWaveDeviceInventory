create readmes and description markdown documents, see existing README.md files and documents in additionalDescription folder

# Technical Documentation: Cache Quality Measurement Module

## 1. Introduction

The Cache Quality Measurement Module is a monitoring component integrated into the MicroWaveDeviceInventory (MWDI) system. Its purpose is to continuously assess the accuracy and freshness of cached ControlConstruct data by comparing it with the corresponding real-time data retrieved directly from connected devices.

This document provides a comprehensive description of the measurement process, architectural components, comparison strategy, scoring methodology, and integration details.

---

## 2. Objective

The objective of the module is to:
- Periodically or manually evaluate the content of the MWDI cache.
- Compare the cached version of a ControlConstruct with its current live version obtained from the device.
- Identify and categorize differences.
- Compute a weighted score based on the nature and severity of the detected differences.
- Store the result in a persistent log or database for further analysis and reporting.

---

## 3. Measurement Workflow

### 3.1 Triggering

The measurement cycle is initiated by:
- An internal scheduler running periodically (e.g., every minute).
- Optionally, a manual API call to a service endpoint such as `/v1/trigger-cache-quality-measurement`.

### 3.2 Device Selection

One device is selected per cycle using either a round-robin or a randomized strategy from the MWDI-maintained list of connected devices.

### 3.3 Data Retrieval

Two RESTful GET operations are performed:
- Cached data:
  ```
  GET /cache/control-construct={mountName}
  ```
- Live data:
  ```
  GET /live/control-construct={mountName}
  ```

These responses return the ControlConstruct data structures from MWDI's cache and the real-time state of the device respectively.

### 3.4 Comparison Logic

The module performs a structured tree-based comparison:
- Attribute-level differences: mismatches in leaf-node values.
- Missing classes: data classes present in the live structure but absent in the cache.
- Additional classes: data classes present in the cache but not in the live structure.
- Object creations and deletions if derived from structural changes.

### 3.5 Scoring Model

Each type of difference is assigned a configurable weight:

| Difference Type         | Weight | Description                                     |
|-------------------------|--------|-------------------------------------------------|
| Attribute mismatch      | 1      | Value inconsistency in leaf nodes              |
| Missing class           | 5      | Class exists in live but not in cache          |
| New (additional) class  | 5      | Class exists in cache but not in live          |
| Object creation/deletion| 4      | Presence or absence of significant data objects|

A total weighted score is computed per device and used to quantify the extent of divergence.

### 3.6 Result Storage

The results of each measurement are stored in a designated ElasticSearch index or database. Example endpoint:
```
PUT /cache-quality-measurements
```

---

## 4. Sample Output

```json
{
  "deviceId": "mw-node-001",
  "timestamp": "2025-04-21T12:03:45Z",
  "diff_summary": {
    "attribute_mismatches": 18,
    "missing_classes": 2,
    "new_classes": 1
  },
  "weighted_score": 33
}
```

This output includes:
- The unique identifier of the device.
- Timestamp of the comparison.
- A summary of detected differences.
- The total weighted score reflecting the deviation severity.

---

## 5. Integration Points

| Function                 | HTTP Method | Endpoint                                     | Role                         |
|--------------------------|-------------|----------------------------------------------|------------------------------|
| Retrieve cache data      | GET         | `/cache/control-construct={mountName}`       | Internal MWDI resource       |
| Retrieve live data       | GET         | `/live/control-construct={mountName}`        | ODL-based real-time query    |
| Store comparison result  | PUT         | `/cache-quality-measurements`                | ElasticSearch index endpoint |
