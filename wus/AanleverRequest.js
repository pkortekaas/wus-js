/* AanleverRequest.js
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
const WusMessage = require('./WusMessage')

class AanleverRequest {
	constructor (prefix) {
		this.prefix = prefix
		this.mimeType = 'application/xml'
		this.type = 'Fi'
		this.rolBelanghebbende = 'Bedrijf'
		this.autorisatieAdres = 'http://geenausp.nl'
		this.kenmerk = null
		this.berichtsoort = null
		this.aanleverKenmerk = null
		this.nummer = null
		this.bestandsNaam = null
		this.inhoud = null
		this.wusMessage = null
		this.attachments = []
	}

	set Kenmerk (value) {
		this.kenmerk = value
	}

	set Berichtsoort (value) {
		this.berichtsoort = value
	}

	set AanleverKenmerk (value) {
		this.aanleverKenmerk = value
	}

	set Nummer (value) {
		this.nummer = value
	}

	set Type (value) {
		this.type = value
	}

	set RolBelanghebbende (value) {
		this.rolBelanghebbende = value
	}

	set WusMessage (value) {
		if (value instanceof WusMessage) {
			this.wusMessage = value
		} else {
			throw new Error('TYPFAIL', 'Expected WusMessage type')
		}
	}

	set AutorisatieAdres (value) {
		this.autorisatieAdres = value
	}

	AddAttachment (value) {
		if (value instanceof WusMessage) {
			this.attachments.push(value)
		} else {
			throw new Error('TYPFAIL', 'Expected WusMessage type')
		}
	}

	toXml () {
		const xml = xmlBuilder.create('aanleverRequest', {
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
		// main message
		xml.element('berichtsoort', this.berichtsoort).up()
			.element('aanleverkenmerk', this.aanleverKenmerk).up()
			.element('identiteitBelanghebbende')
			.element('nummer', this.nummer).up()
			.element('type', this.type).up()
			.up()
			.element('rolBelanghebbende', this.rolBelanghebbende).up()
			.element('berichtInhoud')
			.element('mimeType', this.wusMessage.mimeType).up()
			.element('bestandsnaam', this.wusMessage.bestandsNaam).up()
			.element('inhoud', this.wusMessage.inhoud).up()
			.up()
		// add attachments
		if (this.attachments.length > 0) {
			const atts = xml.element('berichtBijlagen')
			this.attachments.forEach(message => {
				atts.element('bijlage')
					.element('mimeType', message.mimeType).up()
					.element('bestandsnaam', message.bestandsNaam).up()
					.element('inhoud', message.inhoud).up()
					.up()
			})
		}
		xml.element('autorisatieAdres', this.autorisatieAdres)

		return xml.end()
	}
}

module.exports = AanleverRequest
