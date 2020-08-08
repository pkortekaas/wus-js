// https://github.com/yaronn/ws.js

const select = require('./xpath').SelectNodes
const Dom = require('xmldom').DOMParser
const fs = require('fs')
const utils = require('./utils')

exports.Http = require('./handlers/client/http.js').HttpClientHandler
exports.Addr = require('./handlers/client/addressing.js').WsAddressingClientHandler
exports.Mtom = require('./handlers/client/mtom/mtom.js').MtomClientHandler
exports.Security = require('./handlers/client/security/security.js').SecurityClientHandler
exports.UsernameToken = require('./handlers/client/security/security.js').UsernameToken
exports.X509BinarySecurityToken = require('./handlers/client/security/security.js').X509BinarySecurityToken
exports.Signature = require('./handlers/client/security/signature.js').Signature

exports.send = send
exports.addAttachment = addAttachment
exports.getAttachment = getAttachment

function send (handlers, ctx, callback) {
	ensureHasSoapHeader(ctx)

	for (let i = 0; i < handlers.length - 1; i++)	{
		handlers[i].next = handlers[i + 1]
	}
	handlers[0].send(ctx, ctx => {
		// some handlers may leave response as a buffer so we need to make sure it is string
		if (ctx.response) {
			ctx.response = ctx.response.toString()
		}
		callback(ctx)
	})
}

function ensureHasSoapHeader (ctx) {
	const doc = new Dom().parseFromString(ctx.request)
	const header = select(doc, "/*[local-name(.)='Envelope']/*[local-name(.)='Header']")
	let qname = doc.documentElement.prefix == null ? '' : doc.documentElement.prefix + ':'
	qname += 'Header'
	if (header.length === 0) {
		utils.prependElement(doc, doc.documentElement, doc.documentElement.namespaceURI, qname, null)
	}

	ctx.request = doc.toString()
}

function addAttachment (ctx, property, xpath, file, contentType) {
	const prop = ctx[property]
	const doc = new Dom().parseFromString(prop)
	const elem = select(doc, xpath)[0]
	const content = fs.readFileSync(file).toString('base64')

	utils.setElementValue(doc, elem, content)
	ctx[property] = doc.toString()
	if (!ctx.base64Elements) ctx.base64Elements = []
	ctx.base64Elements.push({ xpath: xpath, contentType: contentType, content: content })
}

function getAttachment (ctx, property, xpath) {
	const prop = ctx[property]
	const doc = new Dom().parseFromString(prop)
	const elem = select(doc, xpath)[0]

	return Buffer.from(elem.firstChild.data, 'base64')
}
