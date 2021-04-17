export enum namespaces {
    security_ns = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd',
    security_pfx = 'o',
    security_utility_ns = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd',
    security_utility_pfx = 'u',
    security_utility_valuetype = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3',
    security_utility_encodingType = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary',
    addressing_ns = 'http://www.w3.org/2005/08/addressing',
    addressing_pfx = 'a',
    envelope_ns = 'http://schemas.xmlsoap.org/soap/envelope/',
    envelope_pfx = 's',
    logius_ns = 'http://logius.nl/digipoort/koppelvlakservices/1.2/',
    logius_pfx = '',
    signature_pfx = ''
}

export enum elementids {
    body = 'body_0',
    address0 = 'address_0',
    address1 = 'address_1',
    address2 = 'address_2',
    address3 = 'address_3',
    timestamp = 'timestamp_0',
    security = 'sec_0'
}
