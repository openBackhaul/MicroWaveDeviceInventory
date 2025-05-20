# Metadata Attributes

Below details about the metadata attributes are provided.  
These are stored along with the deviceMetadataList and are used to manage the cache update.  
The following sections describe what attributes are used, provide some information about how these attributes are filled/updated and also how they are used to sort the deviceMetadataList.


## deviceMetadataList with metadata attributes

The table shall contain the following columns:

- **mount-name**:
  - the device name
  - primary key
- **connection-status**: 
  - connection status on the controller
  - connected, connecting or unable-to-connect
- **changed-to-disconnected-time**: 
  - Indicates when the device changed (the last time) from connected state into not being connected anymore
  - Initially null; if a device changes back to connected, the timestamp is again reset to null
- **added-to-device-list-time**: 
  - the time, when the device has been initially added to the MWDI‘s deviceMetadataList
  - If a device goes into connecting or unable-to-connect state, the timestamp is not set to null, as the device shall no longer be removed from the deviceMetadataList
- **last-complete-control-construct-update-time**:
  - the last time, the CC has been updated completely (i.e. periodic or initial retrieval)
  - If the device is no longer connected, the timestamp is set to null, to ensure it gets retrieved again with priority if the device gets connected again
- **last-control-construct-notification-update-time**:
  - the last time, the CC has been updated due to a received notification (object creation/deletion or attribute value change)
  - If the device is no longer connected, the timestamp is set to null
- **number-of-partial-updates-since-last-complete-update**:
  - The number of updates caused by received notifications (object creation/deletion or attribute value change), since the CC has been updated completely the last time (i.e. since timestamp-last-complete-control-construct-update)
  - Once a complete CC update happens, the counter is reset to 0
  - If the device is no longer connected, the counter is also set to 0 
- **schema-cache-directory**:
  - This attribute contains information about the schema cache directory applied to the device at the controller
  - It indicates the device vendor, and partially also the device type.
- **device-type**:
  - this attribute contains the device type extracted from the device ControlConstruct data
  - if no mapping can be found, the value will be set to the default value "unknown"
  - it will be set initially when the device is added to the deviceMetadataList
  - in case the device is revisited due to the periodic deviceMetadataList sync and the value is still "unknown", it again is tried to update it from CC data
- **locked-status**:
  - this attribute is only to be used internally
  - if a device is either added to the slidingWindow or processed by the qualityMeasurement process, it is locked
  - once it has been processed (or if it gets disconnected), the lock is released

---

## Device-type retrieval

The deviceMetadataList stores the device-type of all contained mount-names.
- It is to be set initially when the device is added to the deviceMetadataList:
  - if the MWDI cache does not (yet) contain a retrieved CC for the device, the device-type is to be set to its default value "unknown",
  - otherwise the device-type shall be derived from the CC data
- If the deviceMetadataList is updated through periodic sync, the device-type shall be updated for all devices that are currently connected at the Controller and where the device-type is still "unknown".

**Where to find the information in the CC?**  
The information is to be retrieved from the air-interface-capability/type-of-equipment attribute.  
The used fields filter will not only return data that is needed, but all found ltps; the unneeded information can be ignored. 
Also a CC may contain multiple air-interfaces/type-of-equipment entries (see [issue1156](https://github.com/openBackhaul/MicroWaveDeviceInventory/issues/1156) for examples).

For finding the device-type:
- go over the found type-of-equipment attributes sequentially
- map the value of the current record against the mappings provided in *deviceTypeMapping* RegexPatternMappingProfile.
  - if no mapping other than the default "unknown" is found continue with the next record
  - if a mapping is found assign the mapped device-type, then stop - the other records do not need to be checked further
  - if all records have been checked, but still no device-type has been found the value will remain "unknown"

By providing the mappings in the *deviceTypeMapping* profileInstance, the mappings can easily be modified, e.g. when new device types are added to the network.

---

## Sorting the deviceMetadataList

In order to effiently select the next device for ControlConstruct update by either the slidingWindow or qualityMeasurement process, the deviceMetadataList is sorted by priority.  
The ordering is based on the the *last-complete-control-construct-update-time* timestamp values, with from-oldest-to-newest order, starting with those devices where the timestamp is *null*.
Devices with connection-state not being *connected* are found at the end of the list.

Ordering updates:
- after successful ControlConstruct retrieval...
  - if there are only connected devices in the list: move the device to the end of the list
  - if there are also not-connected devices: move the device right in front of the first not-connected device 
- in case of failed retrievals (after the configured amount of retries):
  - move in the same fashion as for the successful retrieval
  - moving the device in the list ensures that the same device is not selected over and over again in case of failure

![deviceMetadataListOrdering](./pictures/deviceMetadataListOrdering.png)

---

## Updating the metadata attributes
**TODO**: update and include the diagram (see #1204)