/* X509Certificate.ts
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
export class X509Certificate {
	private static readonly beginCert: string = '-----BEGIN CERTIFICATE-----'
	private static readonly endCert: string = '-----END CERTIFICATE-----'

	readonly certificate: string
	readonly base64Certificate: string
	readonly privateKey: string
	readonly passphrase: string

	constructor(cert: string, key: string, passphrase: string) {
		this.certificate = cert
		this.base64Certificate = this.getBase64Certificate(cert)
		this.privateKey = key
		this.passphrase = passphrase
	}

	public get signingKey(): Buffer {
		const signingKey: any = {
			key: this.privateKey,
			passphrase: this.passphrase
		}
		return signingKey
	}

	private getBase64Certificate(certificate: string): string {
		if (certificate.indexOf(X509Certificate.beginCert) === -1 || certificate.indexOf(X509Certificate.endCert) === -1) {
			throw new Error('PEMFAIL')
		}

		const start = certificate.indexOf(X509Certificate.beginCert) + X509Certificate.beginCert.length
		const end = certificate.indexOf(X509Certificate.endCert)
		const res = certificate.substring(start, end).replace(/(\r\n|\n|\r)/gm, '')

		return res
	}
}