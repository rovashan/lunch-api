import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as clientServiceAccountCredentials from '../lunchpal-6437d-firebase-adminsdk-3r3u4-d3deaf5235.json';

import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from "body-parser";
import * as request from 'request';

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

//api functions
app.post('/pay', (req, res) => {
    //log to api db
    apidb.collection('payment_response_logs').add(req.body);

    let pay: Pay = new Pay();
    pay = req.body;

    // Calc checksum
    request.post('https://mutex.co.za/api/calcresponse', {
        json: true,
        body: pay
    }, function (err, result, body) {
        
        // console.log('err: ', err);
        // console.log('result: ', result);
        // console.log('body: ', body);


        let payChecked: Pay = new Pay();
        payChecked = body;

        console.log('pay: ', pay);
        console.log('payChecked: ', payChecked);


        if (pay.CHECKSUM === payChecked.CHECKSUM) {
            if (pay.TRANSACTION_STATUS === '1' && pay.RESULT_CODE === '990017') {
                /*successful payment*/
    
                console.log('pay: ', pay);
    
                //update payment
                let paymentDoc = clientdb.collection("payments").doc(pay.REFERENCE);
    
                paymentDoc.get().then(doc => {
    
                    const paymentData = doc.data();
    
                    paymentDoc.update({
                        paymentStatus: "PAID"
                    }).then(() => {
    
                        //create subscription
                        if (paymentData) {
    
                            const subscription = {
                                userAddress: paymentData['userAddress'],
                                userName: paymentData['username'],
                                userId: paymentData['userId'],
                                plan: paymentData['subscribedPlan'],
                                startDate: '2019-02-25',
                                endDate: '2020-02-25',
                                paymentReference: doc.id,
                                status: 'ACTIVE'
                            };
                            clientdb.collection("subscriptions").add(subscription)
                                .then(() => {
                                    //do other stuff remember to redirect after all is done 
                                    //inside the then()
                                    res.redirect('https://lunchpal-6437d.firebaseapp.com/home');
                                    //return true;
                                })
                                .catch(err => console.log(err));
                        }
                    });
    
                });
            }
            else if (pay.TRANSACTION_STATUS === '3' && pay.RESULT_CODE === '990099002817') {
                /*user cancelled*/
    
                //redirect to home
                res.redirect('https://lunchpal-6437d.firebaseapp.com/home');
            } else {
                /*error*/
    
                //redirect to error page
                //show eror description from response
            }
        
        }
        else {
            res.status(400).send('CHECKSUM FAILED')
        }

    });
});
