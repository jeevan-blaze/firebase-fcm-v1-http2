import { ClientOptions, Message } from './types';
import { getAccessToken } from './utils';
import { processBatch } from './fcm';

export class Client {
    private config: ClientOptions;
    private static defaultMaxConcurrentConnections = 10;
    private static defaultMaxConcurrentStreamsAllowed = 100;

    constructor(options: ClientOptions) {
        if (!options.serviceAccount) {
            throw new Error('Please provide the service account JSON configuration file.');
        }

        this.config = {
            serviceAccount: options.serviceAccount,
            maxConcurrentConnections: options.maxConcurrentConnections || Client.defaultMaxConcurrentConnections,
            maxConcurrentStreamsAllowed: options.maxConcurrentStreamsAllowed || Client.defaultMaxConcurrentStreamsAllowed
        };
    }

    sendMulticast(message: Message, tokens: string[]): Promise<string[]> {
        return new Promise((resolve, reject) => {
            let batchLimit = Math.ceil(tokens.length / this.config.maxConcurrentConnections!);
            const tokenBatches: string[][] = [];

            if (batchLimit <= this.config.maxConcurrentStreamsAllowed!) {
                batchLimit = this.config.maxConcurrentStreamsAllowed!;
            }

            for (let start = 0; start < tokens.length; start += batchLimit) {
                tokenBatches.push(tokens.slice(start, start + batchLimit));
            }

            const unregisteredTokens: string[] = [];

            const projectId = this.config.serviceAccount.project_id;

            if (!projectId) {
                return reject(new Error('Unable to determine Firebase Project ID from service account file.'));
            }

            getAccessToken(this.config.serviceAccount).then((accessToken) => {
                let done = 0;

                for (const tokenBatch of tokenBatches) {
                    processBatch(message, tokenBatch, projectId, accessToken, this.config.maxConcurrentStreamsAllowed!, this.config.maxConcurrentConnections!)
                        .then((unregisteredTokensList) => {
                            if (unregisteredTokensList.length > 0)
                                unregisteredTokens.push(...unregisteredTokensList);

                            done++;

                            if (done === tokenBatches.length) {
                                resolve(unregisteredTokens);
                            }
                        })
                        .catch((err) => {
                            reject(err);
                        });
                }
            }).catch((err) => {
                reject(err);
            });
        });
    }
}
