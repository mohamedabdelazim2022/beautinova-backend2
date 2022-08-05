import * as admin from 'firebase-admin';
import User from '../models/user/user.model';
const serviceAccount = require('../service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

 
export async function sendPushNotification(notifi, title) { 

    let user = await User.findById(notifi.targetUser);
    let tokens = user.token;
    console.log(tokens);
    const payload = {
        notification: {
            title: notifi.text,
            sound: 'default',
            itemID: notifi.subject.toString(),
            body: notifi.subjectType,
            info:notifi.info?notifi.info:"",
            priority:'high'
        },
    }
    /*const payload = {
        notification: {
            title,
            body: notifi.text,
            sound: 'default'
        },
        data: {
            subjectId: notifi.subject.toString(), subjectType: notifi.subjectType
        }
    }
*/
    console.log(payload);

    if (tokens && tokens.length >= 1) {
        console.log('TOKENS : ', tokens);

        admin.messaging().sendToDevice(tokens, payload)
            .then(response => {
                console.log('Successfully sent a message')//, response);
            })
            .catch(error => {
                console.log('Error sending a message:', error);
            });
    }

}