/* WusXmlDSig.ts
MIT License

Copyright (c) 2020 Paul Kortekaas

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */
import { FileKeyInfo, SignedXml } from 'xml-crypto'
import { DOMParser as Dom } from 'xmldom'
import { select1 } from 'xpath'
import { elementids, namespaces } from './Constants'
import { X509Certificate } from './Security/X509Certificate'
import { XmlDSig } from './Interfaces/XmlDSig'

export class WusXmlDSig implements XmlDSig {
    public CreateSignature(xml: string, x509Certificate: X509Certificate, elements: string[]): string {

        const options: { [key: string]: any; } = {
            existingPrefixes: {
                o: namespaces.security_ns
            }
        }
        const signature = new SignedXml()
        const fileKeyInfo = new FileKeyInfo()
        fileKeyInfo.getKeyInfo = function (_key?: string, _prefix?: string): string {
            return `<${namespaces.security_pfx}:SecurityTokenReference><${namespaces.security_pfx}:Reference URI="#${elementids.security}" ` +
                `ValueType="${namespaces.security_utility_valuetype}" /></${namespaces.security_pfx}:SecurityTokenReference>`
        }

        signature.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
        signature.canonicalizationAlgorithm = 'http://www.w3.org/2001/10/xml-exc-c14n#'

        elements.forEach(element => {
            signature.addReference(`//*[local-name()='${element}']`)
        })

        signature.keyInfoProvider = fileKeyInfo;
        signature.signingKey = x509Certificate.signingKey
        signature.computeSignature(xml, options)

        return signature.getSignatureXml()
    }

    public VerifySignature(xml: string): boolean {

        const xmlDocument = new Dom().parseFromString(xml)
        const tokenNode = select1("//*[local-name()='BinarySecurityToken']", xmlDocument) as Node
        const signatureNode = select1("//*[local-name()='Signature' and namespace-uri()='http://www.w3.org/2000/09/xmldsig#']", xmlDocument) as Node

        if (tokenNode && signatureNode) {
            const fileKeyInfo = new FileKeyInfo()
            fileKeyInfo.getKey = function (keyInfo?: Node): Buffer {
                return Buffer.from(`-----BEGIN CERTIFICATE-----\n${tokenNode.textContent}\n-----END CERTIFICATE-----\n`)
            }
            const signature = new SignedXml()
            signature.keyInfoProvider = fileKeyInfo
            signature.loadSignature(signatureNode)
            return signature.checkSignature(xml)
        }

        return false
    }
}
