import { X509Certificate } from "../Security/X509Certificate";

export type HttpResponse = {
    statusCode: number
    statusMessage?: string
    response: string
}

export interface HttpClient {
    Get(path: string): Promise<HttpResponse>
    Post(path: string, action: string, data: string): Promise<HttpResponse>
    X509Certificate: X509Certificate
}