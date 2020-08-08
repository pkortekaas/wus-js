const select = require('../../../xpath').SelectNodes
const Dom = require('xmldom').DOMParser
const utils = require('../../../utils')
const writer = require('../../../../lib/handlers/client/mtom/mime-writer.js')
const reader = require('../../../../lib/handlers/client/mtom/mime-reader.js')
require('bufferjs')

class MtomClientHandler {
	send (ctx, callback) {
		const boundary = 'my_unique_boundary'
		const parts = [{
			id: 'part0',
			contentType: 'application/xop+xml;charset=utf-8;type="' +
                   ctx.contentType + '"',
			encoding: '8bit'
		}]
		const doc = new Dom().parseFromString(ctx.request)

		for (const i in ctx.base64Elements) {
			const file = ctx.base64Elements[i]
			const elem = select(doc, file.xpath)[0]

			const binary = Buffer.from(file.content, 'base64')
			const id = 'part' + (parseInt(i) + 1)

			parts.push({
				id: id,
				contentType: file.contentType,
				body: binary,
				encoding: 'binary',
				attachment: true
			})

			// put an xml placeholder
			elem.removeChild(elem.firstChild)
			utils.appendElement(doc, elem, 'http://www.w3.org/2004/08/xop/include', 'xop:Include')
			elem.firstChild.setAttribute('xmlns:xop', 'http://www.w3.org/2004/08/xop/include')
			elem.firstChild.setAttribute('href', 'cid:' + id)
		}

		parts[0].body = Buffer.from(doc.toString())
		ctx.contentType = 'multipart/related; type="application/xop+xml";start="<part0>";boundary="' + boundary + '";start-info="' +
    ctx.contentType + '"; action="' + ctx.action + '"'
		ctx.request = writer.build_multipart_body(parts, boundary)

		this.next.send(ctx, ctx => {
			this.receive(ctx, callback)
		})
	}

	receive (ctx, callback) {
		if (!ctx.resp_contentType) {
			console.log('warning: no content type in response')
			callback(ctx)
			return
		}

		const boundary = utils.parseBoundary(ctx.resp_contentType)
		if (!boundary) {
			console.log('warning: no boundary in response')
			callback(ctx)
			return
		}

		// use slice() since in http multipart response the first chars are #13#10 which the parser does not expect
		const parts = reader.parse_multipart(ctx.response.slice(2), boundary)

		if (parts.length === 0) {
			console.log('warning: no mime parts in response')
			callback(ctx)
			return
		}

		const doc = new Dom().parseFromString(parts[0].data.toString())

		for (const i in parts) {
			const p = parts[i]
			const id = utils.extractContentId(p.headers['content-id'])
			const xpath = "//*[@href='cid:" + encodeURIComponent(id) + "']//parent::*"
			const elem = select(doc, xpath)[0]

			if (!elem) continue
			elem.removeChild(elem.firstChild)
			utils.setElementValue(doc, elem, p.data.toString('base64'))
		}
		ctx.response = doc.toString()
		callback(ctx)
	}
}

module.exports.MtomClientHandler = MtomClientHandler
