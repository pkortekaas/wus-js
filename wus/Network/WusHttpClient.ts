/* WusHttpClient.ts
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
import { request } from 'https'
import tls from 'tls'
import { HttpClient, HttpResponse } from "../Interfaces/HttpClient"
import { Logger, LogLevel } from '../Interfaces/Logger';
import { X509Certificate } from '../Security/X509Certificate';

type HttpOptions = {
    host: string
    port: number
    path: string
    cert?: string
    key?: string
    passphrase?: string
    method: string
    timeout: number
    rejectUnauthorized?: boolean
    ca?: string
    headers?: { [key: string]: string | number }
    checkServerIdentity: (host: string, cert: tls.PeerCertificate) => Error | undefined
}

export class HttpError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, HttpError.prototype)
        this.name = this.constructor.name
    }
}
/**
 * WusHttpClient
 *
 * Uses the build-in https/tls modules to setup a client connection using both server and client certificates.
 *
 * Server certificate validation can be done bij providing the sha1 thumbprint of the expected certificate
 *
 * Note that the checkServerIdentity callback will only be called when the chain of the server certificate
 * can be validated. This means the chain has to be known within the operating system, or it can be provided
 * using the ca parameter.
  */
export class WusHttpClient implements HttpClient {
    private readonly thumbPrint?: string
    private readonly ca?: string
    private readonly rejectUnauthorized?: boolean
    private readonly x509Certificate: X509Certificate
    private readonly logger: Logger
    private timeout: number = 30000
    private readonly regex = /^(?<proto>http|https)?(?:\:{1}\/{2})?(?<host>[a-z0-9.-]*)(?::(?<port>[0-9]+))?(?<path>\/[^?#]*)?(?:\?(?<params>[^#]*))?(?:#(.*))?$/i

    constructor(x509Certificate: X509Certificate, logger: Logger, thumbPrint?: string, ca?: string) {
        logger.Log(LogLevel.Debug, 'WusHttpClient:ctor start')
        this.x509Certificate = x509Certificate
        this.logger = logger
        this.thumbPrint = thumbPrint?.toLowerCase().replace(/:/g, '')
        if (ca) {
            this.ca = ca
            this.rejectUnauthorized = true
        }
        this.logger.Log(LogLevel.Debug, 'WusHttpClient:ctor start')
    }

    public get X509Certificate(): X509Certificate {
        return this.x509Certificate
    }

    public async Get(url: string): Promise<HttpResponse> {
        this.logger.Log(LogLevel.Debug, 'WusHttpClient:Get')

        const match: RegExpMatchArray | null = url.match(this.regex)
        const path = match?.groups?.path ? match.groups.path : '/'
        const port: number = match?.groups?.port ? +match.groups.port : match?.groups?.proto === 'http' ? 80 : 443

        const options: HttpOptions = {
            host: match?.groups?.host as string,
            port: port,
            path: path,
            timeout: this.timeout,
            method: "GET",
            checkServerIdentity: (host: string, cert: tls.PeerCertificate): Error | undefined => {
                this.logger.Log(LogLevel.Debug, `WusHttpClient:checkServerIdentity fingerprint: ${cert.fingerprint}`)
                if (this.thumbPrint) {
                    const error = tls.checkServerIdentity(host, cert)
                    if (error) {
                        return error
                    }
                    if (this.thumbPrint !== cert.fingerprint.toLowerCase().replace(/:/g, '')) {
                        return new Error('Fingerprint mismatch')
                    }
                }
            }
        }

        return new Promise<HttpResponse>((resolve, reject) => {
            const req = request(options, res => {
                const body: any[] = []
                res.on('data', chunk => body.push(chunk))
                res.on('end', () => {
                    const result: HttpResponse = {
                        statusCode: res.statusCode || 500,
                        statusMessage: res.statusMessage,
                        response: body.join('')
                    }
                    resolve(result)
                })
                res.on('error', error => {
                    if (error) reject(new HttpError(error.message))
                })
            })

            req.end()
        })


    }

    public async Post(url: string, action: string, data: string): Promise<HttpResponse> {
        this.logger.Log(LogLevel.Debug, 'WusHttpClient:Post')

        const match: RegExpMatchArray | null = url.match(this.regex)
        const path = match?.groups?.path ? match.groups.path : '/'
        const port: number = match?.groups?.port ? +match.groups.port : match?.groups?.proto === 'http' ? 80 : 443

        const options: HttpOptions = {
            host: match?.groups?.host as string,
            port: port,
            path: path,
            timeout: this.timeout,
            cert: this.x509Certificate.certificate,
            key: this.x509Certificate.privateKey,
            passphrase: this.x509Certificate.passphrase,
            rejectUnauthorized: this.rejectUnauthorized,
            ca: this.ca,
            method: "POST",
            headers: {
                SOAPAction: action,
                'Content-Type': 'text/xml; charset=UTF-8',
                'Content-Length': Buffer.byteLength(data)
            },
            checkServerIdentity: (host: string, cert: tls.PeerCertificate): Error | undefined => {
                this.logger.Log(LogLevel.Debug, `WusHttpClient:checkServerIdentity: ${cert.fingerprint}`)
                if (this.thumbPrint) {
                    const error = tls.checkServerIdentity(host, cert)
                    if (error) {
                        return error
                    }
                    if (this.thumbPrint !== cert.fingerprint.toLowerCase().replace(/:/g, '')) {
                        return new Error('Fingerprint mismatch')
                    }
                }
            }
        }

        return new Promise<HttpResponse>((resolve, reject) => {
            const req = request(options, res => {
                const body: any[] = []
                res.on('data', chunk => body.push(chunk))
                res.on('end', () => {
                    const result: HttpResponse = {
                        statusCode: res.statusCode || 500,
                        statusMessage: res.statusMessage,
                        response: body.join('')
                    }
                    resolve(result)
                })
                res.on('error', error => {
                    if (error) reject(new HttpError(error.message))
                })
            })

            req.write(data, error => {
                if (error) reject(error)
            })

            req.end()
        })
    }
}
