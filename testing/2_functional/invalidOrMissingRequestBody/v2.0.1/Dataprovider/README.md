# Functional Testing of Invalid or Missing RequestBody Handling of the Providers of Data  

![Overview](./mwdi+diagram.invalidOrMissingRequestBody.dataprovider.png)  

Not all of the tested services require a requestBody.  
The tested services can be categorized into three groups:
- (1) services, where the requestBody is mandatory and must be provided according to the schema from the OAS.
    - for these services two test will be performed: a) an invalid requestBody is provided and b) no requestBody is provided
  - in both cases a 400 shall be returned
- (2) services, where the requestBody is optional: if provided, it must match the OAS
  - these services will be tested with an invalid requestBody
  - a 400 shall be returned
- (3) services, where no requestBody is specified.
  - these services will be tested with a dummy requestBody (as none is specified, any requestBody will do)
  - a 200 shall be returned  

---
The respective services per category are:  
| <br>requestBody category | <br>Services | <br>Tests, expected results |
|---|---|---|
| <br>(1) mandatory |/v1/provide-list-of-device-interfaces <br>/v1/provide-list-of-actual-device-equipment <br>/v1/provide-list-of-parallel-links <br>/v1/provide-device-status-metadata <br> | <br>Invalid requestBody, no requestBody <br>400 |
| <br>(2) optional | <br> /v1/provide-list-of-links <br> /v1/provide-data-of-all-links | <br>Invalid requestBody, <br>400 |
| <br>(3) none | <br> /v1/provide-list-of-connected-devices <br> /v1/provide-list-of-link-ports <br> /v1/provide-data-of-all-link-ports | <br>Dummy requestBody <br>200 |