# Functional Testing of invalid resource paths

## General
These testcase collections are testing MWDI responses for invalid resource paths

### Targets
- All device resource paths services
  - domain=cache excluding link/linkport paths
  - domain=live
  - domain=cache/link* resource paths

### Criteria
ResponseCodes for 
| Num | path category               | case                                     | expected responseCode | comment                                                                                                                 |
|-----|-----------------------------|------------------------------------------|-----------------------|-------------------------------------------------------------------------------------------------------------------------|
| 1a  | cache=domain                | invalid mount-name                       | 460                   | example:   /core-model-1-4:network-control-domain=cache/control-construct={mountName}                                   |
| 1b  | cache=domain                | valid mount-name, invalid path parameter | 470                   | example:   /core-model-1-4:network-control-domain=cache/control-construct={mountName}/equipment={uuid}/actual-equipment |
| 2a  | cache=live                  | invalid mount-name                       | 503                   | same as responseCode of Controller                                                                                      |
| 2b  | cache=live                  | valid mount-name, invalid path parameter | 502                   | same as responseCode of Controller                                                                                      |
| 3a  | cache=domain/link           | invalid linkId                           | 461                   |                                                                                                                         |
| 3b  | cache=domain/link/link-port | invalid parent linkId                    | 461                   |                                                                                                                         |
| 3c  | cache=domain/link/link-port | valid parent linkId, invalid linkPortId  | 471                   |                                                                                                                         |

### Comments  

## MWDI v2.0.1  
- TestCaseCollection for testing is split  
  - [cache](./v2.0.1/cache/)  
  - [live](./v2.0.1/live/)  
  - [cache-enrichment](./v2.0.1/cache-enrichment/)  

![Overview](./mwdi+diagram.invalidResourcePath.png)  


