// WusDocument-test.spec.mjs

import { strictEqual } from 'assert'
import { readFileSync } from 'fs'
import { X509Certificate } from '../out/wus/Security/X509Certificate.js'
import { WusXmlDSig } from '../out/wus/WusXmlDSig.js'
import { WusLogger } from '../out/wus/WusLogger.js'
import { LogLevel } from "../out/wus/Interfaces/Logger.js"
import { WusDocument } from '../out/wus/WusDocument.js';
import { AanleverRequest } from '../out/wus/AanleverRequest.js';

describe('WusDocument', () => {
    const logger = new WusLogger(LogLevel.Disable)
    const dataRoot = './test/data/'
    function GetAanleverRequest(reference) {
        const aanleverRequest = new AanleverRequest()
        aanleverRequest.Berichtsoort = 'Omzetbelasting'
        aanleverRequest.AanleverKenmerk = reference
        aanleverRequest.Nummer = '001000044B37'
        aanleverRequest.RolBelanghebbende = 'Bedrijf'
        return aanleverRequest
    }
    describe('Create and Verify document', () => {
        it('should return a valid signature when verifying a newly created document', () => {
            const xmlDSig = new WusXmlDSig()
            // use a self signed certificate without passphrase
            const x509Certificate = new X509Certificate(
                readFileSync(dataRoot + 'wus-test.crt').toString(),
                readFileSync(dataRoot + 'wus-test.key').toString(),
                undefined)
            const aanleverRequest = GetAanleverRequest('HappyFlow')
            const wusMessage = {
                bestandsNaam: 'Omzetbelasting.xbrl',
                mimeType: 'text/xml',
                inhoud: 'UnitTest=='
            }
            aanleverRequest.setMessage(wusMessage)
            const wusDocument = new WusDocument(xmlDSig, logger)
            const wusDocumentInfo = {
                body: aanleverRequest.toXml(),
                soapAction: 'http://logius.nl/digipoort/wus/2.0/aanleverservice/1.2/AanleverService/aanleverenRequest',
                uri: 'https://preprod-dgp2.procesinfrastructuur.nl/wus/2.0/aanleverservice/1.2',
                x509Certificate: x509Certificate
            }
            aanleverRequest.setMessage(wusMessage)
            const document = wusDocument.CreateDocument(wusDocumentInfo)
            strictEqual(xmlDSig.VerifySignature(document), true)
        })
    })
})
