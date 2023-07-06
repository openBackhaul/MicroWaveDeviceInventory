Delete this link at the end of the specification process:  
- [Roadmap to Specification](../../issues/1)

# MicroWaveDeviceInventory  

### Location  
The MicroWaveDeviceInventory is part of the HighPerformanceNetworkInterface.  

### Description  
The MicroWaveDeviceInventory acts like a cache for the data that can also be read directly from the devices (GET only).  
The task of the MWDI is to shorten the access time and to minimize the number and size of accesses to the device controllers.  
The interface of the MWDI is made in such a way that consuming applications could switch between MWDI and MW SDN Controller NBI without changes to the coding.  

The MicroWaveDeviceInventory covers Capability, Configuration, Historical Performance, Alarm and discrete Status information.  
Continuous measurement values (e.g. instantaneous receive level) and current counter readings (e.g. current dropped frames count) are not provided.  

The information provided by the MicroWaveDeviceInventory is either up-to-date or not available at all.  
This includes e.g. the entire device being deleted from the cache as soon as the connection between controller and device is changing away from connected state.  

MicroWaveDeviceInventory is retrieving the entire data tree from the devices at a configurable periode and continuously updating individual attributes based on value change notifications in between.  

The MWDI initially only supports directly addressing of entire classes.  
Individual attributes or combinations of attributes are indirectly addressed by using the fields filter.  
The RESTCONF interface of the controller could process the same requests, too.  

The MWDI offers subscribing for change notifications.  

### Relevance
The MicroWaveDeviceInventory holds the inventory of the live network at Telefonica Germany.  
As such, it is more close to be a component of the controller than of the application layer.  
It is a precondition for most applications.  

### Resources
- [Specification](./spec/)
- [TestSuite](./testing/)
- [Implementation](./server/)

---
### Comments
This application will be specified during [training for ApplicationOwners](https://gist.github.com/openBackhaul/5aabdbc90257b83b9fe7fc4da059d3cd).
