/* wus.js
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

const ws = require('./wse')
const wsConsts = require('./wse/lib/consts')
const fs = require('fs')
const AanleverRequest = require('./wus/AanleverRequest')
const StatusRequest = require('./wus/StatusRequest')
const Envelope = require('./wus/Envelope')
const WusResponse = require('./wus/WusResponse')
const SoapFault = require('./wus/SoapFault')
const WusMessage = require('./wus/WusMessage')

const { guid } = require('./wse/lib/utils')
const { FileKeyInfo } = require('xml-crypto')

function status (handlers, envelope, ctx, all) {
	const statusRequest = new StatusRequest(wsConsts.logius_pfx, all)
	statusRequest.kenmerk = ctx.wusOptions.kenmerk

	envelope.Body = statusRequest.toXml()
	ctx.request = envelope.toXml()
	ctx.action = 'http://logius.nl/digipoort/wus/2.0/' +
					`statusinformatieservice/1.2/StatusinformatieService/${statusRequest.RequestName}`

	return new Promise(resolve => {
		ws.send(handlers, ctx, ctx => {
			resolve(new WusResponse(ctx.statusCode, ctx.response).Parse())
		})
	})
}

function deliver (handlers, envelope, ctx) {
	const aanleverRequest = new AanleverRequest(wsConsts.logius_pfx)
	const wusMessage = new WusMessage()
	aanleverRequest.Berichtsoort = 'Omzetbelasting'
	aanleverRequest.AanleverKenmerk = ctx.wusOptions.aanleverKenmerk
	aanleverRequest.Nummer = '001000044B37'
	aanleverRequest.RolBelanghebbende = 'Bedrijf'

	wusMessage.BestandsNaam = 'Omzetbelasting.xbrl'
	wusMessage.Inhoud = fs.readFileSync('./xbrl/VB-01_bd-rpt-ob-aangifte-2020.xbrl').toString('base64')
	aanleverRequest.WusMessage = wusMessage

	envelope.Body = aanleverRequest.toXml()
	ctx.request = envelope.toXml()
	ctx.action = 'http://logius.nl/digipoort/wus/2.0/aanleverservice/1.2/AanleverService/aanleverenRequest'

	return new Promise(resolve => {
		ws.send(handlers, ctx, ctx => {
			resolve(new WusResponse(ctx.statusCode, ctx.response).Parse())
		})
	})
}

async function main () {
	// ------------------------- Setup -------------------------
	// Read config file and load certificate + key
	const config = JSON.parse(fs.readFileSync('./config.json'))
	const key = fs.readFileSync(config.privatekey).toString()
	const cert = fs.readFileSync(config.certificate).toString()

	const x509 = new ws.X509BinarySecurityToken({ key: key + '\n' + cert, passphrase: config.passphrase })
	const signingOptions = {
		prefix: wsConsts.signature_pfx,
		existingPrefixes: {
			[wsConsts.security_pfx]: wsConsts.security_ns
		}
	}
	const signature = new ws.Signature(x509, signingOptions)
	// Define the elements to be signed
	signature.addReference("//*[local-name(.)='Body']")
	signature.addReference("//*[local-name(.)='Timestamp']")
	signature.addReference("//*[local-name(.)='Action']")
	signature.addReference("//*[local-name(.)='MessageID']")
	signature.addReference("//*[local-name(.)='ReplyTo']")
	signature.addReference("//*[local-name(.)='To']")

	// Setup security. If the server certificate is defined, signature validation will be done
	const wse = new ws.Security({
		mustUnderstand: true,
		validateResponseSignature: Boolean(config[config.active].certificate)
	}, [x509, signature])

	if (wse.options.validateResponseSignature) {
		wse.options.responseKeyInfoProvider = new FileKeyInfo(config[config.active].certificate)
	}

	// Read the server certificate CA chain. If defined, the connection wil verify the chain
	const ca = config[config.active].ca ? fs.readFileSync(config[config.active].ca) : null

	const handlers = [
		new ws.Addr('http://www.w3.org/2005/08/addressing', true),
		wse,
		new ws.Http(config.tracefile, ca)
	]

	// Create soap envelope
	const envelope = new Envelope(wsConsts.envelope_pfx, wsConsts.security_utility_pfx)
	envelope.AddNamespace('xsi', 'http://www.w3.org/2001/XMLSchema-instance')
	envelope.AddNamespace('xsd', 'http://www.w3.org/2001/XMLSchema')
	envelope.AddNamespace(wsConsts.logius_pfx, 'http://logius.nl/digipoort/koppelvlakservices/1.2/')

	// Context object with all parameters
	const ctx = {
		request: null,
		timeout: config.timeout,
		url: null,
		action: null,
		statusCode: null,
		contentType: 'text/xml; charset=UTF-8',
		agentOptions: {
			cert: cert,
			key: key,
			passphrase: config.passphrase,
			securityOptions: 'SSL_OP_NO_SSLv3'
		},
		wusOptions: {
			kenmerk: null,
			aanleverKenmerk: null
		}
	}

	// ------------------------- Deliver -------------------------
	console.log(`Delivering to ${config.active}`)
	ctx.wusOptions.aanleverKenmerk = config[config.active].scenario || guid()
	ctx.url = config[config.active].delivery_url
	console.log(`Reference: ${ctx.wusOptions.aanleverKenmerk}`)
	let reference
	try {
		const response = await deliver(handlers, envelope, ctx)
		if (response) {
			if (response instanceof SoapFault) {
				throw response
			}
			reference = response.DeliveryResponseReference
			console.log(response.StatusCode)
			console.log(response.DeliveryResult)
		}
	} catch (e) {
		console.log(e.toString())
		process.exit(1)
	}

	// ------------------------- Status -------------------------
	console.log(`Status from ${config.active}`)
	ctx.wusOptions.kenmerk = reference
	ctx.url = config[config.active].status_url
	try {
		const response = await status(handlers, envelope, ctx, false)
		if (response) {
			if (response instanceof SoapFault) {
				throw response
			}
			console.log(response.StatusCode)
			console.log(response.StatusResult)
		}
	} catch (e) {
		console.log(e.toString())
	}
}

if (require.main === module) {
	main()
}
