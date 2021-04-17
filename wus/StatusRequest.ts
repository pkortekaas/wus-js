import xmlbuilder from 'xmlbuilder'
import { namespaces } from './Constants'

export class StatusRequest {
    private readonly prefix: string = namespaces.logius_pfx
    private readonly requestName: string
    private readonly autorisatieAdres: string
    private kenmerk: string

    constructor(all: boolean) {
        this.autorisatieAdres = 'http://geenausp.nl'
        this.requestName = all ? 'getStatussenProcesRequest' : 'getNieuweStatussenProcesRequest'
        this.kenmerk = ''
    }

    set Kenmerk(value: string) {
        this.kenmerk = value
    }

    get RequestName() {
        return this.requestName
    }

    toXml() {
        const xml = xmlbuilder.create(this.requestName, {
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
        xml.element('kenmerk', this.kenmerk).up()
            .element('autorisatieAdres', this.autorisatieAdres)

        return xml.end()
    }

}