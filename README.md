# Firebase Cloud Messaging HTTP v1 API Client

## Description

This Node.js library provides a simple interface for sending push notifications using Firebase Cloud Messaging HTTP v1 APIs. It replaces deprecated FCM APIs with the latest HTTP v1 methods, ensuring compatibility and future-proofing for sending notifications.

Send multicast notifications using HTTP/2 multiplexing through the [FCM HTTP v1 API](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send).

## Installation

Install the package via npm:

```sh
npm install firebase-fcm-v1-http2

Supported features:

- [X] HTTP/2 session & stream concurrency
- [X] Token batching support
- [X] Uninstall detection
- [X] Retry mechanism
```

Then, start using the package by importing and instantiating it:

```js
const { FirebaseClient } = require('firebase-fcm-v1-http2');

// Initialize Firebase Client
const firebaseClient = new FirebaseClient({
  serviceAccount: require('./path/to/serviceAccountKey.json'),
  // Add optional configurations here
});

// Send a notification to multiple devices
const message = {
  title: 'Hello from Firebase',
  body: 'This is a test notification.'
};

const tokens = ['device_token_1', 'device_token_2'];

firebaseClient.sendMulticast(message, tokens)
  .then(unregisteredTokens => {
    console.log('Unregistered tokens:', unregisteredTokens);
  })
  .catch(error => {
    console.error('Error sending notification:', error);
  });

```

## Requirements

* Node.js v12 or newer

## License

Apache 2.0
