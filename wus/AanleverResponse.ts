export type AanleverResponse = {
    kenmerk: string,
    berichtsoort: string,
    aanleverkenmerk: string,
    tijdstempelAangeleverd: Date,
    identiteitBelanghebbende: {
        nummer: string,
        type: string
    },
    rolBelanghebbende: string,
    identiteitOntvanger: {
        nummer: string,
        type: string
    },
    autorisatieAdres: string
}