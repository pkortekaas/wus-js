const select = require('../../../xpath').SelectNodes
const Dom = require('xmldom').DOMParser
const consts = require('../../../consts')
const SignedXml = require('xml-crypto').SignedXml

class Signature {
	constructor (signingToken, signingOptions) {
		if (!signingToken) {
			throw new Error('SIGFAIL', 'cannot create signature if a signing token is not specified')
		}
		this.signingToken = signingToken
		this.signature = new SignedXml()
		this.keyInfoProvider = new WSSKeyInfo(this.signingToken)
		this.signatureAlgorithm = null
		this.canonicalizationAlgorithm = null
		this.signingOptions = signingOptions
	}

	addReference (xpath, transforms, digestAlgorithm) {
		this.signature.addReference(xpath, transforms, digestAlgorithm)
	}

	applyMe (doc, security) {
		if (this.signatureAlgorithm) {
			this.signature.signatureAlgorithm = this.signatureAlgorithm
		}
		if (this.canonicalizationAlgorithm) {
			this.signature.canonicalizationAlgorithm = this.canonicalizationAlgorithm
		}
		if (this.keyInfoProvider) {
			this.signature.keyInfoProvider = this.keyInfoProvider
		}
		this.signature.signingKey = { key: this.signingToken.getKey(), passphrase: this.signingToken.getPassphrase() }
		this.signature.computeSignature(doc.toString(), this.signingOptions)

		// const attrib = ` xmlns:${consts.security_pfx}="${consts.security_ns}"`
		const sigXml = this.signature.getSignatureXml() // .replace(attrib, '')
		const newSoap = this.signature.getOriginalXmlWithIds()

		const newDoc = new Dom().parseFromString(newSoap)
		const sigDoc = new Dom().parseFromString(sigXml)
		const sigNode = newDoc.importNode(sigDoc.documentElement, true)

		const securityNode = select(newDoc,
			"/*[local-name(.)='Envelope']/*[local-name(.)='Header']/*[local-name(.)='Security']")[0]
		securityNode.appendChild(sigNode)

		return newDoc
	}
}

function WSSKeyInfo (signingToken) {
	this.getKeyInfo = function (key) {
		return '<' + consts.security_pfx + ':SecurityTokenReference>' +
           '<' + consts.security_pfx + ':Reference URI="#' + signingToken.getId() + '" ' +
           'ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" />' +
           '</' + consts.security_pfx + ':SecurityTokenReference>'
	}
}

module.exports.Signature = Signature
