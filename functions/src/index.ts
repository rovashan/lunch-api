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
    
    //successful payment
    if (pay.TRANSACTION_STATUS === '1' && pay.RESULT_CODE === '990017') {

        //get payment doc from client db
        // clientdb.collection("payments").doc("2fonOT09AbVJ7DjggKAB").get().then((querySnapshot) => {
        //     console.log(querySnapshot.data());
        // });

        //update payment
        let paymentDoc = clientdb.collection("payments").doc("XJNMbL90FnfW8eOFEMmp");

        console.log('paymentDoc: ', paymentDoc);

        paymentDoc.update({
           paymentStatus: "PAID"
        }).then(data => {
        //create subscription
        let subscription = {
            userName: 'userName',
            userId: 'userId',
            planName: 'planName',
            planInitDate: 'initDate',
            planExpDate: 'expDate',
            planId: 'planId',
            planCredits: 'planCredits',
            address: 'deliveryAddress'
        };
         clientdb.collection("subscriptions").add(subscription)
        .then(()=> {
            //do other stuff remember to redirect after all is done 
            //inside the then()
            res.redirect('https://lunchpal-6437d.firebaseapp.com/home');
         return true;
        })
        .catch(err => console.log(err));
        });

    }
    else if (pay.TRANSACTION_STATUS === '3' && pay.RESULT_CODE === '990099002817') {
        //user cancelled
        //redirect to home

    } else {
        //error
        //redirect to error page
        //show eror description from response
    }

    //res.send('heya');
});

