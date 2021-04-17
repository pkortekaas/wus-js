import { X509Certificate } from "../Security/X509Certificate";

export interface XmlDSig {
    CreateSignature(xml: string, x509Certificate: X509Certificate, elements: string[]): string
    VerifySignature(xml: string): boolean
}