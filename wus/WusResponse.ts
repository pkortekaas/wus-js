/* WusResponse.ts
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
import { Parser, processors } from 'xml2js'
import { HttpResponse } from './Interfaces/HttpClient'
import { Logger, LogLevel } from './Interfaces/Logger'
import { XmlDSig } from './Interfaces/XmlDSig'
import { AanleverResponse } from './AanleverResponse'
import { SoapFault } from './SoapFault'
import { StatusProcesResponse } from './StatusProcesResponse'

export type Response = AanleverResponse | StatusProcesResponse[] | undefined

export class WusResponse {
    private readonly xmlDSig: XmlDSig
    private readonly logger: Logger

    private result: any
    constructor(xmlDSig: XmlDSig, logger: Logger) {
        logger.Log(LogLevel.Debug, 'WusResponse:ctor start')
        this.xmlDSig = xmlDSig
        this.logger = logger
        this.logger.Log(LogLevel.Debug, 'WusResponse:ctor end')
    }

    public get Result(): any {
        return this.result
    }

    public get DeliveryResult(): AanleverResponse | undefined {
        this.logger.Log(LogLevel.Debug, 'WusResponse:DeliveryResult')
        if (this.result) {
            return this.result.aanleverResponse
        }
        return undefined
    }

    public get StatusResult(): StatusProcesResponse[] {
        this.logger.Log(LogLevel.Debug, 'WusResponse:StatusResult')
        if (this.result) {
            if (this.result.getStatussenProcesResponse) {
                return this.result.getStatussenProcesResponse
                    .getStatussenProcesReturn.StatusResultaat || []
            }
            else if (this.result.getNieuweStatussenProcesResponse) {
                return this.result.getNieuweStatussenProcesResponse
                    .getNieuweStatussenProcesReturn.StatusResultaat || []
            }
        }
        return []
    }

    public Parse(httpResponse: HttpResponse): Promise<WusResponse> {
        this.logger.Log(LogLevel.Debug, 'WusResponse:Parse')
        return new Promise((resolve, reject) => {
            const parser = new Parser({
                explicitArray: false,
                tagNameProcessors: [processors.stripPrefix]
            })
            parser.parseString(httpResponse.response, (err: string, result: any) => {
                if (err) {
                    reject(new SoapFault(httpResponse.statusCode, err))
                } else {
                    if (result.Envelope && result.Envelope.Body) {
                        this.result = result.Envelope.Body
                        if (this.result.Fault) {
                            reject(new SoapFault(httpResponse.statusCode, this.result.Fault))
                        }
                        else {
                            if (!this.xmlDSig.VerifySignature(httpResponse.response)) {
                                reject(new SoapFault(498, 'XmlDSig signature verification failed'))
                            }
                            else {
                                resolve(this)
                            }
                        }
                    } else {
                        reject(new SoapFault(httpResponse.statusCode, 'Unexpected response'))
                    }
                }
            })
        })
    }

}