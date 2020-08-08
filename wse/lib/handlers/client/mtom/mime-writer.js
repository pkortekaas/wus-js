/* eslint-disable camelcase */
require('bufferjs')

var MimeWriter = {

	build_multipart_body: function (parts, boundary) {
		var body = Buffer.from('')
		for (var i in parts) {
			body = Buffer.concat([body, this.build_part(parts[i], boundary)])
			if (i < parts.length - 1) body = Buffer.concat([body, Buffer.from('\r\n')])
		}
		return Buffer.concat([body, Buffer.from('\r\n' + '--' + boundary + '--')])
	},

	build_part: function (part, boundary) {
		var return_part = '--' + boundary + '\r\n'
		return_part += 'Content-ID: <' + part.id + '>\r\n'
		return_part += 'Content-Transfer-Encoding: ' + part.encoding + '\r\n'
		if (part.attachment) {
			return_part += 'Content-Disposition: attachment; name="' + part.id + '"\r\n'
		}

		return_part += 'Content-Type: ' + part.contentType + '\r\n\r\n'

		return Buffer.concat([Buffer.from(return_part), part.body])
	}
}

exports.build_multipart_body = function (parts, boundary) {
	return MimeWriter.build_multipart_body(parts, boundary)
}
