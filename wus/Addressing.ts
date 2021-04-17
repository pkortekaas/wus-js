import xmlbuilder from 'xmlbuilder'
import { v4 as uuidv4 } from 'uuid'
import { namespaces, elementids } from './Constants'

export class Addressing {
    private readonly action: string
    private readonly uri: string
    private readonly prefix = namespaces.addressing_pfx

    constructor(action: string, uri: string) {
        this.action = action
        this.uri = uri
    }

    public toXml(): string {
        const root = 'adr'
        const xml = xmlbuilder.create(root, {
            headless: true
        })

        xml.element(`${this.prefix}:Action`, this.action)
            .attribute(`${namespaces.envelope_pfx}:mustUnderstand`, '1')
            .attribute(`${namespaces.security_utility_pfx}:Id`, elementids.address0).up()
            .element(`${this.prefix}:MessageID`, `urn:uuid:${uuidv4()}`)
            .attribute(`${namespaces.security_utility_pfx}:Id`, elementids.address1).up()
            .element(`${this.prefix}:ReplyTo`)
            .attribute(`${namespaces.security_utility_pfx}:Id`, elementids.address2)
            .element(`${this.prefix}:Address`, `${namespaces.addressing_ns}/anonymous`).up()
            .up()
            .element(`${this.prefix}:To`, this.uri)
            .attribute(`${namespaces.security_utility_pfx}:Id`, elementids.address3)

        // get rid of our root node
        const result = xml.end().substring(root.length + 2)
        return result.substring(0, result.length - root.length - 3)
    }
}