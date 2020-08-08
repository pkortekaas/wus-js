const select = require('../../../xpath').SelectNodes
const Dom = require('xmldom').DOMParser
const utils = require('../../../utils')
const consts = require('../../../consts')
const dateFormat = require('dateformat')
const SignedXml = require('xml-crypto').SignedXml

const BEGIN_CERT = '-----BEGIN CERTIFICATE-----'
const END_CERT = '-----END CERTIFICATE-----'

class SecurityClientHandler {
	constructor (options, tokens) {
		this.options = options || {}
		this.options.excludeTimestamp = this.options.excludeTimestamp || false
		this.options.responseKeyInfoProvider = this.options.responseKeyInfoProvider || null
		this.options.validateResponseSignature = this.options.validateResponseSignature || false
		this.options.mustUnderstand = this.options.mustUnderstand || false

		this.tokens = tokens || []
		this.id = 0
	}

	send (ctx, callback) {
		let doc = new Dom().parseFromString(ctx.request)
		this.AddNamespaces(doc)
		const header = select(doc, "/*[local-name(.)='Envelope']/*[local-name(.)='Header']")[0]
		const security = utils.appendElement(doc, header, consts.security_ns, consts.security_pfx + ':Security', null)
		if (this.options.mustUnderstand) {
			security.setAttribute(consts.envelope_pfx + ':mustUnderstand', '1')
		}
		if (!this.options.excludeTimestamp) {
			this.AddTimestamp(doc, security)
		}
		for (var i in this.tokens) {
			doc = this.tokens[i].applyMe(doc, this)
		}
		ctx.request = doc.toString()
		this.next.send(ctx, ctx => {
			this.receive(ctx, callback)
		})
	}

	AddNamespaces (doc) {
		doc.documentElement.setAttribute('xmlns:' + consts.security_utility_pfx, consts.security_utility_ns)
		doc.documentElement.setAttribute('xmlns:' + consts.security_pfx, consts.security_ns)
	}

	AddTimestamp (doc, security) {
		const timestamp = utils.appendElement(doc, security, consts.security_utility_ns, consts.security_utility_pfx + ':Timestamp', null)
		const created = new Date()
		const expires = new Date(created)
		const expiresTimespan = 5
		timestamp.setAttribute(consts.security_utility_pfx + ':Id', 'timestamp_0')
		expires.setMinutes(created.getMinutes() + expiresTimespan)
		utils.appendElement(doc, timestamp, consts.security_utility_ns, consts.security_utility_pfx + ':Created', dateFormat(created, 'isoUtcDateTime'))
		utils.appendElement(doc, timestamp, consts.security_utility_ns, consts.security_utility_pfx + ':Expires', dateFormat(expires, 'isoUtcDateTime'))
	}

	receive (ctx, callback) {
		if (this.options.validateResponseSignature) {
			var sig = new SignatureValidator(this.options.responseKeyInfoProvider)
			sig.validate(ctx.response.toString())
		}

		callback(ctx)
	}

	getNextId () {
		return 'sec_' + this.id++
	}
}

function SignatureValidator (keyInfoProvider) {
	this.keyInfoProvider = keyInfoProvider

	this.validate = function (soap) {
		const doc = new Dom().parseFromString(soap)
		const nodes = select(doc, "//*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']")
		if (nodes.length === 0) { return }
		const signature = nodes[0]

		const sig = new SignedXml()

		sig.keyInfoProvider = this.keyInfoProvider
		sig.loadSignature(signature.toString())
		const res = sig.checkSignature(soap)

		if (!res) {
			throw new Error('SIGFAIL', 'Signature not valid: ' + sig.validationErrors)
		}
	}
}

class UsernameToken {
	constructor (options) {
		this.options = options
	}

	applyMe (doc, security) {
		var securityNode = select(doc,
			"/*[local-name(.)='Envelope']/*[local-name(.)='Header']/*[local-name(.)='Security']")[0]
		const token = utils.appendElement(doc, securityNode, consts.security_ns, consts.security_pfx + ':UsernameToken', null)
		utils.appendElement(doc, token, consts.security_ns, consts.security_pfx + ':Username', this.options.username)
		const password = utils.appendElement(doc, token, consts.security_ns, consts.security_pfx + ':Password', this.options.password)
		password.setAttribute('Type', 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText')
		return doc
	}
}

class X509BinarySecurityToken {
	constructor (options) {
		this.options = options
		if (!this.options.key) {
			throw new Error('TKNFAIL', 'Cannot create an X509Token token without specifying a key in the options')
		}
	}

	getKey () {
		return this.options.key
	}

	getPassphrase () {
		return this.options.passphrase
	}

	getId () {
		return this.id
	}

	extractBase64Key (key) {
		if (key.indexOf(BEGIN_CERT) === -1 || key.indexOf(END_CERT) === -1) {
			throw new Error('PEMFAIL', 'Provided PEM-format key does not contain certificate information! Try appending the certificate to the end of the file.')
		}
		var start = key.indexOf(BEGIN_CERT) + BEGIN_CERT.length
		var end = key.indexOf(END_CERT)
		var res = key.substring(start, end)
		res = res.replace(/(\r\n|\n|\r)/gm, '')
		return res
	}

	applyMe (doc, security) {
		this.id = security.getNextId()
		const base64Key = this.extractBase64Key(this.options.key)
		const securityNode = select(doc,
			"/*[local-name(.)='Envelope']/*[local-name(.)='Header']/*[local-name(.)='Security']")[0]
		const token = utils.appendElement(doc, securityNode, consts.security_ns, consts.security_pfx + ':BinarySecurityToken', base64Key)
		token.setAttribute(consts.security_utility_pfx + ':Id', this.id)
		token.setAttribute('ValueType',
			'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3')
		token.setAttribute('EncodingType',
			'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary')
		// token.setAttribute('xmlns:' + consts.security_utility_pfx, consts.security_utility_ns)
		return doc
	}
}

module.exports.SecurityClientHandler = SecurityClientHandler
module.exports.UsernameToken = UsernameToken
module.exports.X509BinarySecurityToken = X509BinarySecurityToken
