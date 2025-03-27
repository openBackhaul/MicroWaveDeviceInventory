# Functional Testing of Unknown RequestBody Input Target Object Handling

## General
With introduction of MWDI_1.2.x, error codes have been harmonized.  
This testcase collection tests whether the tested services reply according to the harmonized prescriptions.  
Input target object can be provided as part of the ressource paths or as parameters in the requestBody.

### Targets
- All individual services

### Criteria
- **Input target objects in the requestBody**:
  - *mountName*: if the mountName is unknown, i.e. not found in the list of connected devices: 460
  - *link*: 461
  - *linkPort*:
    - if the parent link is unknown: 461
    - if the parent link is known: 471
  - special case: received notifications
    - *resource* or *objectPath* with unknown IDs: 470 (TODO: check!)  

### Comments  
- Need for Updates:  
  - Services paths (e.g. /v1/provide-list-of-links) depend on the release of the application  
  - Ressource paths (e.g. /core-model-1-4:network-control-domain=cache/control-construct={mountName}) might depend on the release of the management interface  
- Testing of Ressource Paths:  
  - Controller/mediator/device gets addressed first to prevent the MWDI testing to fail in case the mediator is faulty  
  - Live domain gets addressed next to assure the MWDI to cache the information requested afterwards

### Scope
- This testcase collection only tests if unknown input targets (e.g. mountName, link, linkport) in the requestBody are handled correctly
- Unknown input objects in ressource paths (e.g. combinations of mountName, uuid, localId) are not within the scope of this testcase collection

## MWDI v1.2.2  
- TestCaseCollection for testing invalid or missing requestBody responses is split, because of very high number of paths  
  - [Receivers of Notifications](./v1.2.2/Receiver/)  
  - [Providers of Data](./v1.2.2/Dataprovider/)  
  - [Offered Subscriptions](./v1.2.2/Subscriptions/)  
  - out of scope:
    - [ControlConstruct]  
    - [Alarms]  
    - [Equipment]  
    - [Firmware]  
    - [Profiles]  
    - [Connections]  
    - [Interfaces]  

![Overview](./mwdi+diagram.unknownRequestBodyInputTargetObject.png)  


