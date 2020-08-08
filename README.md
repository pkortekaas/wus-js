# wus-js

**wus-js** is a Javascript Node example on how to communicate with Digipoort, the Dutch government gateway for exchanging xbrl data. The Digipoort API interface uses SOAP based webservices following the *WUS 2.0* protocol. This example assumes you are familiar with Digipoort and its purpose.

An existing WS-* module called [ws.js](https://www.npmjs.com/package/ws.js) takes care of all the heavy lifting for Addressing, Security and Digital signatures. Combined with some additional xml modules, the actual implementation became mostly a matter of filling in the blanks.

### ws-* protocols ###
As already mentioned the WS-* implementation is all done through the [ws.js](https://www.npmjs.com/package/ws.js) module written by Yaron Naveh. However, instead of just using this module as a reference, the source code files have been included within this project in order to make some minor changes to them:
- Converting the prototype objects to ES6 classes
- Using fixed id attributes for the elements to be signed
- More flexible use of namespace prefixes
- Rewrote the http handler to use the native http(s) modules instead of the request module

### Requirements
- node v12.x
- PKIo X.509 (test) certificate for identification and signing

**Note:** All development and testing has been done under Linux.

### Usage
- Get a copy of this example using: `git clone https://github.com/pkortekaas/wus-js`
- Do a `npm install` to get all the dependency modules
- Copy the `config.json.example` file to `config.json` and set the certificate, privatekey and passphrase keys to their proper values.
- You should be all set to run: `node wus.js`
- The sample code runs again the Digipoort conformance or preprod environment


### Remarks
- If you run into certificate chain validation issues, make sure all the required intermediate CA certifiates are installed. This is different on the various operating systems.
- Of the various status requests, only the (New)StatusProcess requests are implemented
- If your X.509 certificate and private key are stored in a pfx or p12 container, you can extract them using:

`openssl pkcs12 -in <pfx file> -out <txt file>`

### Sample output
#### Deliver result
```
Delivering to conformance
Reference: Happyflow
200
{
  '$': { xmlns: 'http://logius.nl/digipoort/koppelvlakservices/1.2/' },
  kenmerk: 'c0f9e133-53ae-429e-af41-acd6e0abc570',
  berichtsoort: 'Omzetbelasting',
  aanleverkenmerk: 'Happyflow',
  tijdstempelAangeleverd: '2020-20-20T22:32:48.530Z',
  identiteitBelanghebbende: { nummer: '001000044B37', type: 'Fi' },
  rolBelanghebbende: 'Bedrijf',
  identiteitOntvanger: { nummer: '00000002003214394002', type: 'OIN' },
  autorisatieAdres: 'http://geenausp.nl'
}
```

#### Status result
```json
Status from conformance
200
[
  {
    kenmerk: 'c0f9e133-53ae-429e-af41-acd6e0abc570',
    identiteitBelanghebbende: { nummer: '001000044B37', type: 'Fi' },
    statuscode: '105',
    tijdstempelStatus: '2020-20-20T22:32:48.530Z',
    statusomschrijving: 'Aanleverproces gestart.'
  },
  ...
  {
    kenmerk: 'c0f9e133-53ae-429e-af41-acd6e0abc570',
    identiteitBelanghebbende: { nummer: '001000044B37', type: 'Fi' },
    statuscode: '400',
    tijdstempelStatus: '2020-20-20T22:32:48.600Z',
    statusomschrijving: 'Afleveren uitvragende partij gelukt.'
  }
]
```

### References
[Digipoort](https://www.logius.nl/diensten/digipoort)

[Koppelvlak WUS voor bedrijven](https://www.logius.nl/diensten/digipoort/koppelvlakken/wus-voor-bedrijven)

[Aansluit Suite Digipoort](https://aansluiten.procesinfrastructuur.nl/)