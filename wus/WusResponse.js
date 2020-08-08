/* WusResponse.js
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
'use strict'

const xml2js = require('xml2js')
const processors = require('xml2js').processors
const SoapFault = require('./SoapFault')

class WusResponse {
	constructor (statusCode, response) {
		this.statusCode = statusCode
		this.response = response
		this.result = null
	}

	get StatusCode () {
		return this.statusCode
	}

	get DeliveryResponseReference () {
		if (this.result && this.result.aanleverResponse) {
			return this.result.aanleverResponse.kenmerk
		}
		return null
	}

	get Result () {
		return this.result
	}

	get DeliveryResult () {
		if (this.result) {
			return this.result.aanleverResponse
		}
		return null
	}

	get StatusResult () {
		if (this.result && this.result.getStatussenProcesResponse) {
			return this.result.getStatussenProcesResponse
				.getStatussenProcesReturn.StatusResultaat
		} else if (this.result && this.result.getNieuweStatussenProcesResponse) {
			return this.result.getNieuweStatussenProcesResponse
				.getNieuweStatussenProcesReturn.StatusResultaat
		} else {
			return null
		}
	}

	Parse () {
		return new Promise((resolve, reject) => {
			const parser = new xml2js.Parser({
				explicitArray: false,
				tagNameProcessors: [processors.stripPrefix]
			})
			parser.parseString(this.response, (err, result) => {
				if (err) {
					reject(err)
				} else {
					if (result.Envelope && result.Envelope.Body) {
						this.result = result.Envelope.Body
						if (this.result.Fault) {
							const soapFault = new SoapFault(this.statusCode, this.result.Fault)
							if (soapFault.StatusCode === 200) {
								resolve(soapFault)
							} else {
								reject(soapFault)
							}
						} else {
							resolve(this)
						}
					} else {
						reject(new SoapFault(this.statusCode, 'Unexpected response'))
					}
				}
			})
		})
	}
}

module.exports = WusResponse
