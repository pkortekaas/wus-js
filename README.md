# wus-js

**wus-js** is a TypeScript Node example on how to communicate with Digipoort, the Dutch government gateway for exchanging xbrl data. The Digipoort API interface uses SOAP based webservices following the *WUS 2.0* protocol. This example assumes you are familiar with Digipoort and its purpose.

### Requirements
- Node.js v14.x
- TypeScript 4.x
- PKIo X.509 (test) certificate for identification and signing

**Note:** All development and testing has been done under Linux.

### Usage
- make sure TypeScript is installed as a (global) package: `tsc --version`
- If TypeScript is not installed, do that first: `npm install -g typescript`
- Get a copy of this example using: `git clone https://github.com/pkortekaas/wus-js`
- Do a `npm install` to get all the dependency modules
- Copy the `config.json.example` file to `config.json` and set the certificate, privatekey and passphrase keys to their proper values.
- Compile the TypeScript code to Javacript: `tsc`
- Some basic unit tests should now succeed running: `npm test`
- You should be all set to run: `node out/wus-test.js`


### Remarks
- The sample code runs again the Digipoort conformance or preprod environment
- If you run into certificate chain validation issues, make sure all the required intermediate CA certifiates are installed. This is different on the various operating systems. For more information see the WusHttpClient.ts file
- Of the various status requests, only the (New)StatusProcess requests are implemented
- Server certificates changes may require new thumbprints and ca chains
- If your X.509 certificate and private key are stored in a pfx or p12 container, you can extract them using:

`openssl pkcs12 -in <pfx file> -out <txt file>`

### Sample output
#### Unit test
````
> mocha

  WusDocument
    Create and Verify document
      ✓ should return a valid signature when verifying a newly created document (68ms)

  WusResponse
    Empty WusResponse
      ✓ should return undefined for WusResponse.Result
      ✓ should return undefined for WusResponse.DeliveryResult
      ✓ should return an empty StatusProcesResponse for WusResponse.StatusResult
    Parse
      ✓ should return a WusResponse object from a valid Delivery response
      ✓ should throw a SoapFault with StatusCode 498 from a tampered Delivery response
      ✓ should throw a SoapFault with FoutCode ALS100 from a fault Delivery response
      ✓ should return a WusResponse object from a valid Status response (39ms)
      ✓ should throw a SoapFault with FoutCode STS100 from a fault Status response

  XmlDSig
    VerifySignature
      ✓ should return true for a valid signature
      ✓ should return false for an invalid signature


  11 passing (230ms)
````

#### Deliver and Status result
```
[09:10:17.67 INF] RunWusProcessor:start
[09:10:17.67 INF] -------------------- Deliver --------------------
[09:10:17.95 INF] Reference: 67f52c82-0a50-40d4-9efa-df3b4186225c
[09:10:17.95 INF] ------------------- New Status ------------------
[09:10:18.15 INF] 105 - Aanleverproces gestart. (2021-04-17T07:10:17.847Z)
[09:10:18.15 INF] 100 - Aanleveren gelukt. (2021-04-17T07:10:17.857Z)
[09:10:18.15 INF] 110 - Aanleverproces wordt aangeboden. (2021-04-17T07:10:17.867Z)
[09:10:18.15 INF] 200 - Authenticatie gelukt. (2021-04-17T07:10:17.877Z)
[09:10:18.15 INF] 301 - Validatie gelukt. (2021-04-17T07:10:17.887Z)
[09:10:18.15 INF] 301 - Validatie gelukt. (2021-04-17T07:10:17.897Z)
[09:10:18.15 INF] 405 - Afleveren naar uitvragende partij bezig... (2021-04-17T07:10:17.907Z)
[09:10:18.15 INF] 400 - Afleveren uitvragende partij gelukt. (2021-04-17T07:10:17.917Z)
[09:10:18.15 INF] 500 - Validatie bij de uitvragende partij gelukt. (2021-04-17T07:10:17.927Z)
[09:10:18.15 INF] ------------------- All Status ------------------
[09:10:18.36 INF] 105 - Aanleverproces gestart. (2021-04-17T07:10:17.847Z)
[09:10:18.36 INF] 100 - Aanleveren gelukt. (2021-04-17T07:10:17.857Z)
[09:10:18.36 INF] 110 - Aanleverproces wordt aangeboden. (2021-04-17T07:10:17.867Z)
[09:10:18.36 INF] 200 - Authenticatie gelukt. (2021-04-17T07:10:17.877Z)
[09:10:18.36 INF] 301 - Validatie gelukt. (2021-04-17T07:10:17.887Z)
[09:10:18.36 INF] 301 - Validatie gelukt. (2021-04-17T07:10:17.897Z)
[09:10:18.36 INF] 405 - Afleveren naar uitvragende partij bezig... (2021-04-17T07:10:17.907Z)
[09:10:18.36 INF] 400 - Afleveren uitvragende partij gelukt. (2021-04-17T07:10:17.917Z)
[09:10:18.36 INF] 500 - Validatie bij de uitvragende partij gelukt. (2021-04-17T07:10:17.927Z)
[09:10:18.36 INF] RunWusProcessor:end
```

### References
[Digipoort](https://www.logius.nl/diensten/digipoort)

[Koppelvlak WUS voor bedrijven](https://www.logius.nl/diensten/digipoort/koppelvlakken/wus-voor-bedrijven)

[Aansluit Suite Digipoort](https://aansluiten.procesinfrastructuur.nl/)