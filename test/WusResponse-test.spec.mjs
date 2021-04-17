// WusResponse-test.spec.mjs

import { strictEqual, notStrictEqual, deepStrictEqual, rejects } from 'assert'
import { readFileSync } from 'fs'
import { SoapFault } from '../out/wus/SoapFault.js'
import { WusResponse } from '../out/wus/WusResponse.js'
import { WusXmlDSig } from '../out/wus/WusXmlDSig.js'
import { WusLogger } from '../out/wus/WusLogger.js'
import { LogLevel } from "../out/wus/Interfaces/Logger.js"

describe('WusResponse', () => {
    const xmlDSig = new WusXmlDSig()
    const logger = new WusLogger(LogLevel.Disable)
    const dataRoot = './test/data/'
    describe('Empty WusResponse', () => {
        it('should return undefined for WusResponse.Result', () => {
            const wusResponse = new WusResponse(xmlDSig, logger)
            strictEqual(wusResponse instanceof WusResponse, true)
            strictEqual(wusResponse.Result, undefined)
        })
        it('should return undefined for WusResponse.DeliveryResult', () => {
            const wusResponse = new WusResponse(xmlDSig, logger)
            strictEqual(wusResponse instanceof WusResponse, true)
            strictEqual(wusResponse.DeliveryResult, undefined)
        })
        it('should return an empty StatusProcesResponse for WusResponse.StatusResult', () => {
            const wusResponse = new WusResponse(xmlDSig, logger)
            strictEqual(wusResponse instanceof WusResponse, true)
            deepStrictEqual(wusResponse.StatusResult, [])
        })
    })
    describe('Parse', () => {
        it('should return a WusResponse object from a valid Delivery response', async () => {
            const httpResponse = {
                statusCode: 200,
                statusMessage: '',
                response: readFileSync(dataRoot + 'valid-deliver-response.xml').toString()
            }
            const wusResponse = await new WusResponse(xmlDSig, logger).Parse(httpResponse)
            strictEqual(wusResponse instanceof WusResponse, true)
            notStrictEqual(typeof wusResponse.DeliveryResult, undefined)
        })
        it('should throw a SoapFault with StatusCode 498 from a tampered Delivery response', async () => {
            const expected = 498
            const httpResponse = {
                statusCode: 200,
                statusMessage: '',
                response: readFileSync(dataRoot + 'tampered-deliver-response.xml').toString()
            }
            await rejects(new WusResponse(xmlDSig, logger).Parse(httpResponse, logger), (fault) => {
                strictEqual(fault instanceof SoapFault, true)
                strictEqual(fault.StatusCode, expected)
                return true
            })
        })
        it('should throw a SoapFault with FoutCode ALS100 from a fault Delivery response', async () => {
            const expected = 'ALS100'
            const httpResponse = {
                statusCode: 200,
                statusMessage: '',
                response: readFileSync(dataRoot + 'fault-deliver-response.xml').toString()
            }
            await rejects(new WusResponse(xmlDSig, logger).Parse(httpResponse, logger), (fault) => {
                strictEqual(fault instanceof SoapFault, true)
                strictEqual(fault.FoutCode, expected)
                return true
            })
        })
        it('should return a WusResponse object from a valid Status response', async () => {
            const httpResponse = {
                statusCode: 200,
                statusMessage: '',
                response: readFileSync(dataRoot + 'valid-newstatus-response.xml').toString()
            }
            const wusResponse = await new WusResponse(xmlDSig, logger).Parse(httpResponse)
            strictEqual(wusResponse instanceof WusResponse, true)
            notStrictEqual(typeof wusResponse.StatusResult, undefined)
        })
        it('should throw a SoapFault with FoutCode STS100 from a fault Status response', async () => {
            const expected = 'STS100'
            const httpResponse = {
                statusCode: 200,
                statusMessage: '',
                response: readFileSync(dataRoot + 'fault-newstatus-response.xml').toString()
            }
            await rejects(new WusResponse(xmlDSig, logger).Parse(httpResponse, logger), (fault) => {
                strictEqual(fault instanceof SoapFault, true)
                strictEqual(fault.FoutCode, expected)
                return true
            })
        })
    })
})
