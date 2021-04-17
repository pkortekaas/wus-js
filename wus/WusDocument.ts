/* WusDocument.ts
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
import { DOMParser as Dom, XMLSerializer } from 'xmldom'
import { select1 } from 'xpath'
import { Logger, LogLevel } from './Interfaces/Logger'
import { XmlDSig } from './Interfaces/XmlDSig'
import { X509Certificate } from './Security/X509Certificate'
import { Addressing } from './Addressing'
import { namespaces } from './Constants'
import { Envelope } from './Envelope'
import { Security } from './Security'
import { WusDocumenInfo } from './WusDocumentInfo'

export class WusDocument {

    private readonly logger: Logger
    private readonly xmlDSig: XmlDSig

    public constructor(xmlDSig: XmlDSig, logger: Logger) {
        logger.Log(LogLevel.Debug, 'WusDocument:ctor start')
        this.xmlDSig = xmlDSig
        this.logger = logger
        this.logger.Log(LogLevel.Debug, 'WusDocument:ctor end')
    }

    public CreateDocument(info: WusDocumenInfo): string {
        this.logger.Log(LogLevel.Debug, 'WusDocument:CreateDocument start')

        // setup addressing, security and put with with a body in an envelope
        const addressing = new Addressing(info.soapAction, info.uri)
        const security = new Security(info.x509Certificate.base64Certificate)
        const envelope = new Envelope(info.body, addressing, security)

        envelope.addNamespace(namespaces.security_utility_pfx, namespaces.security_utility_ns)
        envelope.addNamespace(namespaces.addressing_pfx, namespaces.addressing_ns)
        envelope.addNamespace(namespaces.security_pfx, namespaces.security_ns)
        envelope.addNamespace(namespaces.logius_pfx, namespaces.security_ns)

        const xml = envelope.toXml()
        const signedXml = this.SignXml(xml, info.x509Certificate)

        this.logger.Log(LogLevel.Debug, 'WusDocument:CreateDocument end')
        return signedXml
    }

    private SignXml(xml: string, x509Certificate: X509Certificate): string {
        this.logger.Log(LogLevel.Debug, 'WusDocument:SignXml start')

        // create signature with references to the elements specified
        const elements: string[] = ['Body', 'Timestamp', 'Action', 'MessageID', 'ReplyTo', 'To']
        const signatureXml = this.xmlDSig.CreateSignature(xml, x509Certificate, elements)

        // original xml document, where signature will be appended to security node
        const signedDocument = new Dom().parseFromString(xml)
        const securityNode = select1(
            "/*[local-name()='Envelope']/*[local-name()='Header']/*[local-name()='Security']",
            signedDocument) as Node
        // get signature node
        const signatureDocument = new Dom().parseFromString(signatureXml)
        const signatureNode = signedDocument.importNode(signatureDocument.documentElement, true)
        // append it to original document security node
        securityNode.appendChild(signatureNode)

        this.logger.Log(LogLevel.Debug, 'WusDocument:SignXml end')
        return new XMLSerializer().serializeToString(signedDocument)
    }
}