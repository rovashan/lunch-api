import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as clientServiceAccountCredentials from '../lunchpal-6437d-firebase-adminsdk-3r3u4-d3deaf5235.json';

import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from "body-parser";
import { Pay } from './pay';

//lunch-api firestore setup
admin.initializeApp(functions.config().firebase);
const apidb = admin.firestore();

//lunch-pal firestore setup
const clientServiceAccount = clientServiceAccountCredentials as admin.ServiceAccount
const clientApp = admin.initializeApp({
    credential: admin.credential.cert(clientServiceAccount),
    databaseURL: "https://lunchpal-6437d.firebaseio.com"
}, 'clientApp');
const clientdb = clientApp.firestore();

const app = express();
const main = express();

main.use(cors());
main.use('/api', app);
main.use(bodyParser.json());
main.use(bodyParser.urlencoded({ extended: false }));

// webApi is your functions name, and you will pass main as 
// a parameter
export const webApi = functions.https.onRequest(main);

// api functions
app.post('/pay', (req, res) => {
    let pay: Pay = new Pay();
    pay = req.body;

    //log to api db
    apidb.collection('payment_response_logs').add(req.body);

    //get payment
    clientdb.collection("payments").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            console.log(`${doc.id} => ${doc.data()}`);
        });
    });

    //successful payment
    if (pay.TRANSACTION_STATUS === '1' && pay.RESULT_CODE === '990017') {
        //get payment doc from client db

        //update payment

        //create subscription

        //redirect

    }
    else if (pay.TRANSACTION_STATUS === '3' && pay.RESULT_CODE === '990099002817') {
        //user cancelled
        //redirect to home

    } else {
        //error
        //redirect to error page
        //show eror description from response
    }

    res.send('hey');
});

