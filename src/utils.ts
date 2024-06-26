import { google } from 'googleapis';
import { ServiceAccount } from './types';

export function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
    return new Promise((resolve, reject) => {
        const jwtClient = new google.auth.JWT(
            serviceAccount.client_email,
            null || "",
            serviceAccount.private_key,
            ['https://www.googleapis.com/auth/firebase.messaging'],
            null || ""
        );

        jwtClient.authorize((err, tokens) => {
            if (err) return reject(err);
            resolve(tokens?.access_token || "");
        });
    });
}
