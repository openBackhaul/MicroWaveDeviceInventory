Delete this link at the end of the specification process:  
- [Roadmap to Specification](../../issues/1)

# MicroWaveDeviceInventory

### Location
The MicroWaveDeviceInventory is part of the HighPerformanceNetworkInterface.

---
### Description-Updates

**Offered services:**  
The actual services offered by the MWDI can be seen from the serviceList. 
- In general the MWDI should provide the paths for _relevant_ ressources in a similar fashion as on the Controller
- i.e. the ressources will be requested in the same way as they would be requested when talking to the Controller directly to allow for interchangability
- However, the MWDI will only offer GET requests, where the Controller would allowd also other methods like PUT, POST or DELETE on the ressources.
- In addition the MWDI will have some _own_ services, i.e. not ressources, which are only to be used for internal app management, and not called by other apps.

**Filtering:**  
- The MWDI allows for filtering on the ressource paths via the fields filter
  - it allows to filter for certain fields of the returned data
  - complex nesting according to RF8040 will be supported
  - can e.g. be used to return lists, as this is not supported by RESTconf itself
  - it would be possible to restrict the allowed filter expressions for certain requests to a fixed subset of strings (enum), whereas there could be no limitation for other ressource paths 
- If it can be supported there will also be a second filter similar to the fields filter, but which allows to filter the data to be returned for certain attribute values
  - e.g. instead of having `{ressourcePath}?myfilter=equipment-type;equipment-instance` it could be `{ressourcePath}?myfilter=equipment-type;equipment-instance='foo'` which would only return those records, where the equipment instance would have the value 'foo'
- other filters (e.g. `?content=config` or `?content=non-config`) will not be supported


**Historical Performance data:**  
Currently it is forseen that the MWDI retrieves the complete ControlConstruct for the MW devices. This also includes historical performance data.  
If the MWDI should provide the historical PM data in the future, it would need to be ensured that the retrieval intervals would be aligned with the storage periods on the devices.
(E.g. if a device only stores the historical PM data for six hours, then the ControlConstructs retrieval for those devices would need to be aligned with that timeframe. If data would only be retrieved once a day, there would be data loss. However, if the historical data would be stored for 24 hours, retrieving the ControlConstructs less often would suffice.)  
As the current performance data is not included in the historical performance data, a second application would be needed anyways for handling of that PM data. This application could also be in charge of handling the historical PM data. It would need to be discussed if the MWDI should still retrieve the historical PM data and serve it to that other application, or if the other application should not query the controller for both current and historical PM data. (As it needs to do that for the current PM data anyways.)  

**HMDI: Historical ControlConstruct data**  
The MWDI will only store ControlConstructs for devices that are in _connected_ state on the Controller.
- If a device reaches _connected_ state it will be added to the MWDIs internal list of devices (with mount-name as key) and its ControlConstruct will be retrieved shortly thereafter. 
- However, if a device leaves state _connected_ (either the state changes to _connecting_ or the device is removed from the Controller) it will also be deleted from the MWDI together with its cached ControlConstruct data.
- The MWDI internal deviceList will be kept in sync with the Controller by means of
  - notifications: the Controller will send notifications about connection state changes or removal
  - and periodically executed synchronisations (needed as there might be DCN connection issues between MWDI and Controller and therefore missed notifications)

Thus, the MWDI offers no historical ControlConstruct data. However, it might be possible that a device becomes disconnected only because of network connection issues. (E.g. it is still running, but connection to the Controller is lost for a short time.) In such cases it would be beneficial if the ControlConstruct data could still somehow be retrieved. And that is where another application mostly similar to the MWDI will come into play: the **HistoricalMicrowaveDeviceInventory (HMDI)**.  
- It will also retrieve the ControlConstructs of all connected devices (from the MWDI, not from the Controller),
- but if a device becomes disconnected/removed its data will not be purged from the HMDI.
- Of course data will not be kept forever. If there has been no update for some time (retention period/TTL) if will be purged also from the HMDI.  

### Original description
_Copy from Roadmap:_  
This application provides cached device information, including Capability, Configuration, Status and Historical Performance information. The MicroWaveDeviceInventory shall periodically retrieve the entire data tree from the microwave device and update individual attributes based on value change notifications in between. The MicroWaveDeviceInventory shall massively accelerate response time for providing live data and reduce load on device controllers. It is a precondition for many other applications.  
If need would be confirmed: MicroWaveDeviceInventory shall either automatically retrieve the latest historical performance data set as soon as it is available, or the latest ones at a configurable frequency.  
Open Question: Shall the MWDI represent the RESTCONF interface at its API or a service request that receives the RESTCONF path as an attribute?  

_Original Text:_  
- This application provides cached device information, including Capability, Configuration and Historical Performance information.  
- The MicroWaveDeviceInventory shall periodically retrieve the entire data tree from the microwave device and update individual attributes based on value change notifications in between.  
- The MicroWaveDeviceInventory shall massively accelerate response time for providing live data and reduce load on device controllers.  
- It is a precondition for many other applications.

---
### Relevance
The MicroWaveDeviceInventory holds the inventory of the live network at Telefonica Germany.
As such, it is more close to be a component of the controller than of the application layer.

---
### Resources
- [Specification](./spec/)
- [TestSuite](./testing/)
- [Implementation](./server/)

---
### Comments
This application will be specified during [training for ApplicationOwners](https://gist.github.com/openBackhaul/5aabdbc90257b83b9fe7fc4da059d3cd).
