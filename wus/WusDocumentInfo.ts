import { X509Certificate } from './Security/X509Certificate'

export type WusDocumenInfo = {
    body: string,
    soapAction: string,
    uri: string,
    x509Certificate: X509Certificate
}