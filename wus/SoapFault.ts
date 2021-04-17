export class SoapFault extends Error {
    public readonly StatusCode: number
    public readonly FaultCode: string
    public readonly FaultString?: string
    public readonly FaultActor?: string
    public readonly FoutCode: string
    public readonly FoutBeschrijving?: string
    constructor(statusCode: number, fault: any) {
        super()
        Object.setPrototypeOf(this, SoapFault.prototype)
        this.name = this.constructor.name

        this.StatusCode = statusCode
        if (fault.detail) {
            const detail: any = fault.detail.aanleverFault || fault.detail.statusinformatieFault
            this.FaultCode = fault.faultcode
            this.FaultString = fault.faultstring
            this.FaultActor = fault.faultactor
            this.FoutCode = detail.foutcode
            this.FoutBeschrijving = detail.foutbeschrijving
            this.message = detail.foutbeschrijving
        }
        else {
            this.FaultCode = statusCode.toString()
            this.FoutCode = statusCode.toString()
            this.message = fault
        }
    }
}
