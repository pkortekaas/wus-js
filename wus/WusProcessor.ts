/* WusProcessor.ts
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
import { HttpClient } from './Interfaces/HttpClient'
import { Logger, LogLevel } from './Interfaces/Logger'
import { AanleverRequest } from './AanleverRequest'
import { AanleverResponse } from './AanleverResponse'
import { WusResponse } from './WusResponse'
import { WusXmlDSig } from './WusXmlDSig'
import { WusDocumenInfo } from './WusDocumentInfo'
import { WusDocument } from './WusDocument';
import { StatusProcesResponse } from './StatusProcesResponse'
import { StatusRequest } from './StatusRequest'
import { XmlDSig } from './Interfaces/XmlDSig'

export class WusProcessor {

    static readonly deliverAction = 'http://logius.nl/digipoort/wus/2.0/aanleverservice/1.2/AanleverService/aanleverenRequest'
    static readonly StatusAction = 'http://logius.nl/digipoort/wus/2.0/statusinformatieservice/1.2/StatusinformatieService'

    private readonly httpClient: HttpClient
    private readonly logger: Logger
    private readonly xmlDSig: XmlDSig
    private readonly wusResponse: WusResponse
    private readonly wusDocument: WusDocument

    constructor(httpClient: HttpClient, logger: Logger) {
        logger.Log(LogLevel.Debug, 'WusProcessor:ctor start')
        this.httpClient = httpClient
        this.logger = logger

        this.xmlDSig = new WusXmlDSig()
        this.wusResponse = new WusResponse(this.xmlDSig, this.logger)
        this.wusDocument = new WusDocument(this.xmlDSig, this.logger)
        this.logger.Log(LogLevel.Debug, 'WusProcessor:ctor end')
    }

    public async Deliver(aanleverRequest: AanleverRequest, uri: string): Promise<AanleverResponse | undefined> {
        this.logger.Log(LogLevel.Debug, 'WusProcessor:Deliver start')

        const wusDocumentInfo: WusDocumenInfo = {
            body: aanleverRequest.toXml(),
            soapAction: WusProcessor.deliverAction,
            uri: uri,
            x509Certificate: this.httpClient.X509Certificate
        }

        const document = this.wusDocument.CreateDocument(wusDocumentInfo)
        const response = await this.httpClient.Post(wusDocumentInfo.uri, wusDocumentInfo.soapAction, document)
        const result = (await this.wusResponse.Parse(response)).DeliveryResult

        this.logger.Log(LogLevel.Debug, 'WusProcessor:Deliver end')
        return result
    }

    public async StatusProcess(statusRequest: StatusRequest, uri: string): Promise<StatusProcesResponse[]> {
        this.logger.Log(LogLevel.Debug, 'WusProcessor:StatusProcess start')

        const wusDocumentInfo: WusDocumenInfo = {
            body: statusRequest.toXml(),
            soapAction: `${WusProcessor.StatusAction}/${statusRequest.RequestName}`,
            uri: uri,
            x509Certificate: this.httpClient.X509Certificate
        }

        const document = this.wusDocument.CreateDocument(wusDocumentInfo)
        const response = await this.httpClient.Post(wusDocumentInfo.uri, wusDocumentInfo.soapAction, document)
        const result = (await this.wusResponse.Parse(response)).StatusResult

        this.logger.Log(LogLevel.Debug, 'WusProcessor:StatusProcess end')
        return result
    }
}