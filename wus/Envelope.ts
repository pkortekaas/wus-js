import xmlbuilder from 'xmlbuilder'
import { Dictionary } from './Utils/Generics'
import { Addressing } from './Addressing'
import { namespaces, elementids } from './Constants'
import { Security } from './Security'

export class Envelope {
    private readonly prefix: string = namespaces.envelope_pfx
    private readonly body: string
    private readonly addressing: string
    private readonly security: string
    private namespaces: Dictionary<string> = {}

    constructor(body: string, addressing: Addressing, security: Security) {
        this.body = body
        this.addressing = addressing.toXml()
        this.security = security.toXml()
    }

    public addNamespace(prefix: string, value: string): void {
        this.namespaces[prefix] = value
    }

    public toXml(): string {
        const xml = xmlbuilder.create('Envelope', {
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
            .attribute(`xmlns:${this.prefix}`, namespaces.envelope_ns)
            .attribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
            .attribute('xmlns:xsd', 'http://www.w3.org/2001/XMLSchema')

        Object.keys(this.namespaces).forEach(key => {
            if (key && key.length > 0) {
                xml.attribute(`xmlns:${key}`, this.namespaces[key])
            }
        })

        xml.element('Header')
            .raw(this.addressing)
            .raw(this.security).up()
            .element('Body')
            .attribute(`${namespaces.security_utility_pfx}:Id`, elementids.body)
            .raw(this.body)

        return xml.end()
    }
}