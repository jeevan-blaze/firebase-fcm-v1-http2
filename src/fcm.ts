import * as http2 from 'http2';
import * as async from 'async';
import { Message, CustomClientHttp2Session } from './types';

const fcmv1Api = 'https://fcm.googleapis.com';

export function processBatch(
    message: Message,
    devices: string[],
    projectId: string,
    accessToken: string,
    maxConcurrentStreamsAllowed: number,
    maxConcurrentConnections: number
): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const client = http2.connect(fcmv1Api, {
            peerMaxConcurrentStreams: maxConcurrentConnections
        }) as CustomClientHttp2Session;

        client.on('error', (err) => reject(err));
        client.on('socketError', (err) => reject(err));

        client.unregisteredTokens = [];

        async.eachLimit(devices, maxConcurrentStreamsAllowed, (device : any, doneCallback : any) => {
            sendRequest(client, device, message, projectId, accessToken, doneCallback, 0, maxConcurrentStreamsAllowed, maxConcurrentConnections);
        }, (err: any) => {
            client.close();
            if (err) return reject(err);
            resolve(client.unregisteredTokens);
        });
    });
}

function sendRequest(
    client: CustomClientHttp2Session,
    device: string,
    message: Message,
    projectId: string,
    accessToken: string,
    doneCallback: (err?: Error) => void,
    tries: number,
    maxConcurrentStreamsAllowed: number,
    maxConcurrentConnections: number
) {
    const request = client.request({
        ':method': 'POST',
        ':scheme': 'https',
        ':path': `/v1/projects/${projectId}/messages:send`,
        Authorization: `Bearer ${accessToken}`,
    });

    request.setEncoding('utf8');

    const clonedMessage = { ...message, token: device };

    request.write(JSON.stringify({ message: clonedMessage }));

    let data = '';

    request.on('data', (chunk) => {
        data += chunk;
    });

    let retrying = false;

    const errorHandler = (err: any) => {
        if (tries <= 3) {
            if (retrying) return;
            retrying = true;
            if (client.destroyed) {
                return processBatch(message, [device], projectId, accessToken, maxConcurrentStreamsAllowed, maxConcurrentConnections)
                    .finally(doneCallback);
            }
            return setTimeout(() => sendRequest(client, device, message, projectId, accessToken, doneCallback, tries + 1, maxConcurrentStreamsAllowed, maxConcurrentConnections), 10000);
        }
        err.data = data;
        doneCallback(err);
    };

    request.on('end', () => {
        try {
            if (data.toLowerCase().includes('server error')) {
                return errorHandler(new Error('Internal Server Error'));
            }
            const response = JSON.parse(data);
            const statusCode = response.statusCode ?? response.status;

            if (statusCode && statusCode >= 500) {
                return errorHandler(new Error(`${statusCode} Internal Server Error`));
            }

            if (response.error) {
                if ((response.error.details && response.error.details[0].errorCode === 'UNREGISTERED') ||
                (response.error.code === 400 && response.error.status === 'INVALID_ARGUMENT')) {
                    client.unregisteredTokens.push(device);
                } else {
                    return doneCallback(response.error);
                }
            }
            doneCallback();
        } catch (err) {
            errorHandler(err);
        }
    });

    request.on('error', errorHandler);

    request.end();
}
