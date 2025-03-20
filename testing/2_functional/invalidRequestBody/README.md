# Functional Testing of Invalid RequestBody Handling


## General

### Targets
- All individual services

### Criteria
- ResponseCode 400 with ResponseBody not according to the definitions in the OAS
- special case: for services without a specified requestBody in the OAS, a provided requestBody can just be ignored instead of returning a 400. I.e. the service then should return a 200 or 204.

### Comments  
- Need for Updates:  
  - Services paths (e.g. /v1/provide-list-of-links) depend on the release of the application  
  - Ressource paths (e.g. /core-model-1-4:network-control-domain=cache/control-construct={mountName}) might depend on the release of the management interface  
- Testing of Ressource Paths:  
  - Controller/mediator/device gets addressed first to prevent the MWDI testing to fail in case the mediator is faulty  
  - Live domain gets addressed next to assure the MWDI to cache the information requested afterwards


## MWDI v1.2.2  
- TestCaseCollection for testing Completeness is split, because of very high number of paths  
  - [Receivers of Notifications](./v1.2.2/Receiver/)  
  - [Providers of Data](./v1.2.2/Dataprovider/)  
  - [Offered Subscriptions](./v1.2.2/Subscriptions/)  
  - not yet existing:
    - [ControlConstruct]  
    - [Alarms]  
    - [Equipment]  
    - [Firmware]  
    - [Profiles]  
    - [Connections]  
    - [Interfaces]  

![Overview](./mwdi+diagram.invalidRequestBody.png)  


