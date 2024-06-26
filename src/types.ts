import * as http2 from 'http2';

export interface ServiceAccount {
    project_id: string;
    client_email: string;
    private_key: string;
}

export interface ClientOptions {
    serviceAccount: ServiceAccount;
    maxConcurrentConnections?: number;
    maxConcurrentStreamsAllowed?: number;
}

export interface Message {
    token: string;
    [key: string]: any;
}

export interface CustomClientHttp2Session extends http2.ClientHttp2Session {
    unregisteredTokens: string[];
}
