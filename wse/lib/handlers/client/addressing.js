const select = require('../../xpath').SelectNodes
const Dom = require('xmldom').DOMParser
const utils = require('../../utils')
const consts = require('../../consts')

class WsAddressingClientHandler {
	constructor (version, mustUnderstand) {
		this.version = version
		this.mustUnderstand = mustUnderstand
	}

	send (ctx, callback) {
		const doc = new Dom().parseFromString(ctx.request)
		const header = select(doc, "/*[local-name(.)='Envelope']/*[local-name(.)='Header']")[0]
		doc.documentElement.setAttribute('xmlns:' + consts.addressing_pfx, this.version)

		const action = utils.appendElement(doc, header, this.version, consts.addressing_pfx + ':Action', ctx.action)
		if (this.mustUnderstand) {
			action.setAttribute(consts.envelope_pfx + ':mustUnderstand', '1')
		}
		action.setAttribute(consts.security_utility_pfx + ':Id', 'address_0')

		utils.appendElement(doc, header, this.version, consts.addressing_pfx + ':MessageID', 'urn:uuid:' + utils.guid())
			.setAttribute(consts.security_utility_pfx + ':Id', 'address_1')

		const reply = utils.appendElement(doc, header, this.version, consts.addressing_pfx + ':ReplyTo', null)
		reply.setAttribute(consts.security_utility_pfx + ':Id', 'address_2')
		utils.appendElement(doc, reply, this.version, consts.addressing_pfx + ':Address', this.version + '/anonymous')

		utils.appendElement(doc, header, this.version, consts.addressing_pfx + ':To', ctx.url)
			.setAttribute(consts.security_utility_pfx + ':Id', 'address_3')

		ctx.request = doc.toString()
		this.next.send(ctx, ctx => {
			this.receive(ctx, callback)
		})
	}

	receive (ctx, callback) {
		callback(ctx)
	}
}

module.exports.WsAddressingClientHandler = WsAddressingClientHandler
