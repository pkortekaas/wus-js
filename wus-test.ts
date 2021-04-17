/* wus-test.ts
MIT License

Copyright (c) 2020 Paul Kortekaas

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */
import { WusHttpClient } from './wus/Network/WusHttpClient'
import { AanleverRequest } from './wus/AanleverRequest'
import { WusMessage } from './wus/WusMessage'
import { readFileSync } from 'fs'
import { X509Certificate } from './wus/Security/X509Certificate'
import { SoapFault } from './wus/SoapFault'
import { StatusRequest } from './wus/StatusRequest'
import { WusLogger } from './wus/WusLogger'
import { LogLevel } from './wus/Interfaces/Logger'
import { WusProcessor } from './wus/WusProcessor'
import { v4 as uuidv4 } from 'uuid'

class Configurator {
    private readonly config

    constructor(configPath: string) {
        this.config = JSON.parse(readFileSync(configPath).toString())
    }

    public get CertificatePath(): string {
        return this.config.certificate
    }
    public get PrivateKeyPath(): string {
        return this.config.privatekey
    }
    public get Passphrase(): string {
        return this.config.passphrase
    }
    public get DeliveryUrl(): string {
        return this.config[this.config.active].delivery_url
    }
    public get StatusUrl(): string {
        return this.config[this.config.active].status_url
    }
    public get CaPath(): string {
        return this.config[this.config.active].ca
    }
    public get Fingerprint(): string {
        return this.config[this.config.active].fingerprint
    }
    public get Reference() {
        return this.config[this.config.active].scenario || uuidv4()
    }
    public get ActiveConfiguration() {
        return this.config.active
    }
}

function GetAanleverRequest(reference: string): AanleverRequest {
    const aanleverRequest = new AanleverRequest()
    aanleverRequest.Berichtsoort = 'Omzetbelasting'
    aanleverRequest.AanleverKenmerk = reference
    aanleverRequest.Nummer = '001000044B37'
    aanleverRequest.RolBelanghebbende = 'Bedrijf'
    return aanleverRequest
}

async function RunWusProcessor() {
    const wusLogger = new WusLogger(LogLevel.Debug)
    wusLogger.Log(LogLevel.Info, 'RunWusProcessor:start')

    const configurator = new Configurator('./config.json')
    wusLogger.Log(LogLevel.Info, `Configuration used: ${configurator.ActiveConfiguration}`)

    // allow reference being passed as an commandline argument
    let reference: string = ''
    if (process.argv.length == 3) {
        reference = process.argv[2]
    }

    const x509Certificate = new X509Certificate(
        readFileSync(configurator.CertificatePath).toString(),
        readFileSync(configurator.PrivateKeyPath).toString(),
        configurator.Passphrase)

    const ca = readFileSync(configurator.CaPath).toString()
    const httpClient = new WusHttpClient(x509Certificate, wusLogger, configurator.Fingerprint, ca)

    try {
        const wusProcessor = new WusProcessor(httpClient, wusLogger)

        if (reference.length === 0) {
            const aanleverRequest = GetAanleverRequest(configurator.Reference)
            const wusMessage: WusMessage = {
                bestandsNaam: 'Omzetbelasting.xbrl',
                mimeType: 'text/xml',
                inhoud: readFileSync('./xbrl/VB-01_bd-rpt-ob-aangifte-2021.xbrl').toString('base64')
            }
            aanleverRequest.setMessage(wusMessage)

            wusLogger.Log(LogLevel.Info, '-------------------- Deliver --------------------')
            const aanleverResponse = await wusProcessor.Deliver(aanleverRequest, configurator.DeliveryUrl)
            reference = aanleverResponse?.kenmerk as string
        }
        wusLogger.Log(LogLevel.Info, `Reference: ${reference}`)

        const statusRequest = new StatusRequest(false)
        statusRequest.Kenmerk = reference

        wusLogger.Log(LogLevel.Info, '------------------- New Status ------------------')
        const statusResponse = await wusProcessor.StatusProcess(statusRequest, configurator.StatusUrl)
        statusResponse.forEach(result => {
            wusLogger.Log(LogLevel.Info, `${result.statuscode} - ${result.statusomschrijving} (${result.tijdstempelStatus})`)
        })

        const allStatusRequest = new StatusRequest(true)
        allStatusRequest.Kenmerk = reference

        wusLogger.Log(LogLevel.Info, '------------------- All Status ------------------')
        const allStatusResponse = await wusProcessor.StatusProcess(allStatusRequest, configurator.StatusUrl)
        allStatusResponse.forEach(result => {
            wusLogger.Log(LogLevel.Info, `${result.statuscode} - ${result.statusomschrijving} (${result.tijdstempelStatus})`)
        })
    }
    catch (fault) {
        if (fault instanceof SoapFault) {
            wusLogger.Log(LogLevel.Error, `${fault.FoutCode} : ${fault.FoutBeschrijving}`)
        }
        else {
            wusLogger.Log(LogLevel.Error, fault.message)
        }
    }

    wusLogger.Log(LogLevel.Info, 'RunWusProcessor:end')
}

function main() {
    RunWusProcessor()
}

if (require.main === module) {
    main()
}
