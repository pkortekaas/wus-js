/* StatusRequest.js
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

const xmlBuilder = require('xmlbuilder')

class StatusRequest {
	constructor (prefix, all) {
		this.prefix = prefix
		this.autorisatieAdres = 'http://geenausp.nl'
		this.requestName = all ? 'getStatussenProcesRequest' : 'getNieuweStatussenProcesRequest'
		this.kenmerk = null
	}

	set Kenmerk (value) {
		this.kenmerk = value
	}

	set AutorisatieAdres (value) {
		this.autorisatieAdres = value
	}

	get RequestName () {
		return this.requestName
	}

	toXml () {
		const xml = xmlBuilder.create(this.requestName, {
			headless: true,
			stringify: {
				name: val => {
					if (this.prefix && this.prefix.length > 0) {
						return `${this.prefix}:${val}`
					}
					return val
				}
			}
		})

		if (!this.prefix || this.prefix.length < 1) {
			xml.attribute('xmlns', 'http://logius.nl/digipoort/koppelvlakservices/1.2/')
		}
		xml.element('kenmerk', this.kenmerk).up()
			.element('autorisatieAdres', this.autorisatieAdres)

		return xml.end()
	}
}

module.exports = StatusRequest
