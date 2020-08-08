/* Envelope.js
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

class Envelope {
	constructor (prefix, utilPrefix) {
		this.prefix = prefix
		this.utilPrefix = utilPrefix
		this.namespaces = {}
	}

	set Body (value) {
		this.body = value
	}

	AddNamespace (prefix, value) {
		this.namespaces[prefix] = value
	}

	toXml () {
		const xml = xmlBuilder.create('Envelope', {
			headless: false,
			version: '1.0',
			encoding: 'UTF-8',
			stringify: {
				name: val => {
					if (val.indexOf(':') > 0) return val
					return `${this.prefix}:${val}`
				}
			}
		})
			.attribute(`xmlns:${this.prefix}`, 'http://schemas.xmlsoap.org/soap/envelope/')

		Object.keys(this.namespaces).forEach(key => {
			if (key && key.length > 1) {
				xml.attribute(`xmlns:${key}`, this.namespaces[key])
			}
		})

		xml.element('Header').up()
			.element('Body')
			.attribute(`${this.utilPrefix}:Id`, 'body_0')
			.raw(this.body)

		return xml.end()
	}
}

module.exports = Envelope
