// XmlDSig-test.spec.mjs

import { strictEqual } from 'assert'
import { readFileSync } from 'fs'
import { WusXmlDSig } from '../out/wus/WusXmlDSig.js'

describe('XmlDSig', () => {
    const xmlDSig = new WusXmlDSig()
    const dataRoot = './test/data/'
    describe('VerifySignature', () => {
        it('should return true for a valid signature', () => {
            const xml = readFileSync(dataRoot + 'valid-deliver-response.xml').toString()
            strictEqual(xmlDSig.VerifySignature(xml), true)
        })
        it('should return false for an invalid signature', () => {
            const xml = readFileSync(dataRoot + 'tampered-deliver-response.xml').toString()
            strictEqual(xmlDSig.VerifySignature(xml), false)
        })
    })
})
