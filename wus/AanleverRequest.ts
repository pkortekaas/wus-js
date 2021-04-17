import xmlbuilder from 'xmlbuilder'
import { WusMessage } from './WusMessage'
import { namespaces } from "./Constants"

export class AanleverRequest {
    private readonly prefix: string = namespaces.logius_pfx
    private type: string = 'Fi'
    private rolBelanghebbende: string = 'Bedrijf'
    private autorisatieAdres: string = 'http://geenausp.nl'
    private kenmerk: string | undefined
    private berichtsoort: string | undefined
    private aanleverKenmerk: string | undefined
    private nummer: string | undefined
    private wusMessage!: WusMessage
    private attachments: Array<WusMessage> = []

    constructor() {
    }

    public set Kenmerk(value: string) {
        this.kenmerk = value
    }

    public set Berichtsoort(value: string) {
        this.berichtsoort = value
    }

    public set AanleverKenmerk(value: string) {
        this.aanleverKenmerk = value
    }

    public set Nummer(value: string) {
        this.nummer = value
    }

    public set Type(value: string) {
        this.type = value
    }

    public set RolBelanghebbende(value: string) {
        this.rolBelanghebbende = value
    }

    public setMessage(value: WusMessage): void {
        this.wusMessage = value
    }

    public addAttachment(value: WusMessage): void {
        this.attachments.push(value)
    }

    public toXml(): string {
        const xml = xmlbuilder.create('aanleverRequest', {
            headless: true,
            stringify: {
                name: val => {
                    if (this.prefix && this.prefix.length > 0) {
                        return `${this.prefix}:${val}`
                    }
                    return val
                }
            }
        })
        if (!this.prefix || this.prefix.length < 1) {
            xml.attribute('xmlns', 'http://logius.nl/digipoort/koppelvlakservices/1.2/')
        }
        // main message
        xml.element('berichtsoort', this.berichtsoort).up()
            .element('aanleverkenmerk', this.aanleverKenmerk).up()
            .element('identiteitBelanghebbende')
            .element('nummer', this.nummer).up()
            .element('type', this.type).up()
            .up()
            .element('rolBelanghebbende', this.rolBelanghebbende).up()
            .element('berichtInhoud')
            .element('mimeType', this.wusMessage.mimeType).up()
            .element('bestandsnaam', this.wusMessage.bestandsNaam).up()
            .element('inhoud', this.wusMessage.inhoud).up()
            .up()
        // add attachments
        if (this.attachments.length > 0) {
            const atts = xml.element('berichtBijlagen')
            this.attachments.forEach(message => {
                atts.element('bijlage')
                    .element('mimeType', message.mimeType).up()
                    .element('bestandsnaam', message.bestandsNaam).up()
                    .element('inhoud', message.inhoud).up()
                    .up()
            })
        }
        xml.element('autorisatieAdres', this.autorisatieAdres)

        return xml.end()
    }
}