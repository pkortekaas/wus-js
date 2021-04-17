export type StatusProcesResponse = {
    kenmerk: string,
    identiteitBelanghebbende: {
        nummer: string,
        type: string
    },
    statuscode: number,
    tijdstempelStatus: Date,
    statusomschrijving: string
}
