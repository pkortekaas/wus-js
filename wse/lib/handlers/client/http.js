const fs = require('fs')

class HttpClientHandler {
	constructor (traceFile, ca) {
		this.traceFile = traceFile
		if (ca) {
			this.ca = ca
			this.rejectUnauthorized = true
		}
	}

	send (ctx, callback) {
		if (this.traceFile) {
			const dt = new Date().toISOString()
			fs.writeFileSync(this.traceFile, `\n<request ts:"${dt}"/>\n${ctx.request}`, { flag: 'a' })
		}
		const m = ctx.url.match(/^(http|https)?(?:[:/]*)([a-z0-9.-]*)(?::([0-9]+))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/i)
		const lib = m[1] === 'http' ? require('http') : require('https')
		const path = m[4] ? m[4] : '/'
		const port = m[3] ? m[3] : m[1] === 'http' ? 80 : 443
		const postOptions = {
			host: m[2],
			port: port,
			path: path,
			method: 'POST',
			timeout: ctx.timeout,
			cert: ctx.agentOptions.cert,
			key: ctx.agentOptions.key,
			passphrase: ctx.agentOptions.passphrase,
			rejectUnauthorized: this.rejectUnauthorized,
			ca: this.ca,
			headers: {
				SOAPAction: ctx.action,
				'Content-Type': ctx.contentType,
				'Content-Length': Buffer.byteLength(ctx.request)
			}
		}
		const postRequest = lib.request(postOptions, res => {
			const body = []
			res.on('data', chunk => body.push(chunk))
			res.on('end', () => {
				ctx.response = body.join('')
				ctx.resp_headers = res.headers
				ctx.resp_contentType = res.headers['content-type']
				ctx.statusCode = res.statusCode
				ctx.error = res.error
				if (this.traceFile) {
					const dt = new Date().toISOString()
					fs.writeFileSync(this.traceFile, `\n<response ts:"${dt}"/>\n${ctx.response}`, { flag: 'a' })
				}
				callback(ctx)
			})
			res.on('error', error => {
				if (error) throw error
			})
		})

		postRequest.write(ctx.request, error => {
			if (error) throw error
		})
		postRequest.end()
	}
}

module.exports.HttpClientHandler = HttpClientHandler
