import xmlbuilder from 'xmlbuilder'
import { namespaces, elementids } from './Constants'

export class Security {
    private readonly prefix: string = namespaces.security_pfx
    private readonly token: string

    constructor(token: string) {
        this.token = token
    }

    public toXml(): string {
        const xml = xmlbuilder.create(`${this.prefix}:Security`, {
            headless: true,
        })

        const created = new Date()
        const expires = new Date(created)
        expires.setMinutes(created.getMinutes() + 10)

        xml.attribute(`${namespaces.envelope_pfx}:mustUnderstand`, '1')
            .element(`${namespaces.security_utility_pfx}:Timestamp`)
            .attribute(`${namespaces.security_utility_pfx}:Id`, elementids.timestamp)
            .element(`${namespaces.security_utility_pfx}:Created`, this.toISODate(created)).up()
            .element(`${namespaces.security_utility_pfx}:Expires`, this.toISODate(expires)).up()
            .up()
            .element(`${this.prefix}:BinarySecurityToken`, this.token)
            .attribute(`${namespaces.security_utility_pfx}:Id`, elementids.security)
            .attribute('ValueType', namespaces.security_utility_valuetype)
            .attribute('EncodingType', namespaces.security_utility_encodingType)

        return xml.end()
    }

    private toISODate(date: Date): string {
        const isoString = date.toISOString()
        return isoString.substring(0, isoString.length - 5) + 'Z'
    }
}
