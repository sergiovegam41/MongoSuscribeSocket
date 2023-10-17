import http from 'axios';
import { DBNames } from './../db.js';
import moment from "moment";
import ReplaceableWordsController from '../Utils/ReplaceableWordsController.js';




class NotificationsController {


    static async sendNotifyMany(MongoClient,req,res){
        res.send({
            success: true,
            message: "OK",
    
        })

        console.log("sendNotifyMany")

        await  this.sendNotifyManyByFilter(MongoClient, req.body.title, req.body.body,req.body.type, { profession_filter: req.body.profession_filter, delay: 0, unique: false, dayOfWeek:false })

    }

    static async sendNotifyManyByFilter(MongoClient, title, body, tipo = "comun", scheduled_notifications) {

        

        console.log('###NOTIFY MANYYY###')
        console.log(scheduled_notifications)

        const FIREBASE_TOKEN = (await MongoClient.collection(DBNames.Config).findOne({ name: "FIREBASE_TOKEN" })).value;

        const now = moment();
        const dayOfWeek = now.day();
        const formattedDate = now.format("MM/DD/YYYY");

        if (!scheduled_notifications.unique) {

            if (scheduled_notifications.dayOfWeek) {

                if (scheduled_notifications.dayOfWeek == dayOfWeek) {

                    await this.notifyAll(MongoClient, scheduled_notifications, FIREBASE_TOKEN, title, body, tipo, dayOfWeek)

                }

            } else {

                await this.notifyAll(MongoClient, scheduled_notifications, FIREBASE_TOKEN, title, body, tipo, dayOfWeek)

            }

        } else {


            if (scheduled_notifications.date == formattedDate) {

                await this.notifyAll(MongoClient, scheduled_notifications, FIREBASE_TOKEN, title, body, tipo, dayOfWeek)
                await MongoClient.collection(DBNames.scheduled_notifications).deleteOne({ _id: scheduled_notifications._id })

            }

        }

    }


    static async notifyAll(MongoClient, scheduled_notifications, FIREBASE_TOKEN, title, body, tipo = "comun", dayOfWeek) {

        console.log(dayOfWeek)
        console.log("notify")
 
        let notifyMeOrders = await MongoClient.collection(DBNames.notifyMeOrders).find({ notyfyMe: true }).toArray()

        let millisegundos = ((parseInt(scheduled_notifications.delay || "0") * 60)) * 1000;

        setTimeout(async () => {

            console.log("setTimeout: ", millisegundos)

            await notifyMeOrders.forEach(async element => {

                let currentUser = await MongoClient.collection(DBNames.UserCopy).findOne({ id: parseInt(element.userID) });

                // console.log(currentUser)
                console.log("userID: ",element.userID)

                if (element.notyfyMe && element.firebase_token && currentUser) {

                    console.log("notificarme, firebase y usuario")
                   console.log("profession_filter: ",scheduled_notifications.profession_filter)


                    if (scheduled_notifications.profession_filter?.length > 0) {

                        console.log("con filtro de profesion")
                        
                        const professions_technical_details = await MongoClient.collection(DBNames.professions_technical_details).find({ technical_id: element.userID.toString(), profession_id: { $in: scheduled_notifications.profession_filter } }).toArray();
                        
                        console.log(professions_technical_details)
                        if (professions_technical_details.length > 0) {
                            console.log("professions_technical_details")
                            await this.sendNotify(FIREBASE_TOKEN, element.firebase_token, ReplaceableWordsController.replaceByUser(title, currentUser, dayOfWeek), ReplaceableWordsController.replaceByUser(body, currentUser, dayOfWeek), tipo)
                        } else {
                            console.log("no pertenece")
                        }

                    } else {
                        console.log("A todos")

                        await this.sendNotify(FIREBASE_TOKEN, element.firebase_token, ReplaceableWordsController.replaceByUser(title, currentUser, dayOfWeek), ReplaceableWordsController.replaceByUser(body, currentUser, dayOfWeek), tipo)

                    }

                } else {

                    console.log("usuario no encontrado")

                }
            });

        }, millisegundos);
    }


    static async sendNotify(FIREBASE_TOKEN, fcmToken, title, body, tipo = "comun") {

        console.log("#SEND"+title)
        const data = {
            rules_version: '2',
            notification: {
                body: body,
                title: title
            },
            priority: 'high',
            data: {
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                body: body,
                title: title,
                data: {},
                tipo: tipo
            },
            to: fcmToken
        };

        const headers = {
            'Authorization': `key=${FIREBASE_TOKEN}`,
            'Content-Type': 'application/json'
        };

        await http.post(`https://fcm.googleapis.com/fcm/send`, data, { headers: headers });

    }

}


export default NotificationsController 