import http from 'axios';
import { DBNames } from './../db.js';
import moment from "moment";
import ReplaceableWordsController from '../Utils/ReplaceableWordsController.js';
import nodemailer from "nodemailer";
import EmailsController from './EmailsController.js';
import WhatsAppController from './WhatsAppController.js';
import UserConfigController from './UserConfigController.js';
import { ObjectId } from 'mongodb';

class NotificationsController {

    static async sendNotifyManyByFilterV2(MongoClient, cities = ["649a034560043e9f434a94fe"], professions = ["64c553e73abc6c0ec50e1dc3"], title = "Hola! $[user_name];! bienvenido a Dservices ", body="Dservices te desea un feliz $[dayWeekName];!", role = "TECNICO", tipo="comun"){

        
        const FIREBASE_TOKEN = (await MongoClient.collection(DBNames.Config).findOne({ name: "FIREBASE_TOKEN" })).value;
        const TokenWebhook = (await MongoClient.collection(DBNames.Config).findOne({ name: "TokenWebhook" })).value;
        const HostBotWhatsApp = (await MongoClient.collection(DBNames.Config).findOne({ name: "HostBotWhatsApp" })).value;
        const cityObjectIds = cities.map(id => ObjectId(id));

        let citiesDocs = null

        if(cityObjectIds.length > 0){
            citiesDocs = await MongoClient.collection(DBNames.municipalities).find({
                _id: { $in: cityObjectIds }
            }).toArray();
        }else{
            citiesDocs = await MongoClient.collection(DBNames.municipalities).find({ }).toArray();
        }
        
        if(!citiesDocs){
            return false; 
        }
        
        citiesDocs.forEach( async citie => {
            
            
            let users = await MongoClient.collection(DBNames.technical_workplace).find({ municipality_id: citie._id.toString() }).toArray();

            if(!users){
                return false;
            }

            users.forEach( async user => {

                const professions_technical_details = await MongoClient.collection(DBNames.professions_technical_details).find({ technical_id: user.user_id.toString(), profession_id: { $in: professions??[] } }).toArray();
    
                if (professions_technical_details.length > 0) {

                    let currentUser = await MongoClient.collection(DBNames.UserCopy).findOne({ id: parseInt(user.user_id) });
                    
                    if(currentUser ){
                        if(currentUser.current_role == role){

                            this.notificarByUser(MongoClient,FIREBASE_TOKEN, HostBotWhatsApp, TokenWebhook, currentUser, title, body,tipo );

                        }
                    }
                   

                } 
            })
        });



    }


    static async sendNotifyMany(MongoClient,req,res){
        res.send({
            success: true,
            message: "OK"
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

            notifyMeOrders.forEach(async element => {

               try {
                let currentUser = await MongoClient.collection(DBNames.UserCopy).findOne({ id: parseInt(element.userID) });

                // console.log(currentUser)
                console.log("userID: ",element.userID)

                if (element.notyfyMe && element.firebase_token && currentUser) {

                   console.log("notificarme, firebase y usuario")
                   console.log("profession_filter: ",scheduled_notifications.profession_filter)


                    if (scheduled_notifications.profession_filter?.length > 0) {

                        console.log("con filtro de profesion")
                        
                        const professions_technical_details = await MongoClient.collection(DBNames.professions_technical_details).find({ technical_id: element.userID.toString(), profession_id: { $in: scheduled_notifications.profession_filter } }).toArray();
                        
                        console.log("professions_technical_details: ",professions_technical_details)
                        if (professions_technical_details.length > 0) {
                            console.log("professions_technical_details DEL USUARIO:",element.userID)
                            await this.sendNotify(MongoClient, FIREBASE_TOKEN, element.firebase_token, ReplaceableWordsController.replaceByUser(title, currentUser, dayOfWeek), ReplaceableWordsController.replaceByUser(body, currentUser, dayOfWeek), tipo)
                        } else {
                            console.log("no pertenece")
                        }

                    } else {
                        console.log("A todos")

                        await this.sendNotify(MongoClient, FIREBASE_TOKEN, element.firebase_token, ReplaceableWordsController.replaceByUser(title, currentUser, dayOfWeek), ReplaceableWordsController.replaceByUser(body, currentUser, dayOfWeek), tipo)

                    }

                } else {

                    console.log("usuario no encontrado")
 
                }
               } catch (error) {
                console.log("#####ERROR NOTIFICANDO####");
                console.log(error);
                console.log("##########################");
               }
            });

        }, millisegundos);
    }


    static async notificarByUser(MongoClient,FIREBASE_TOKEN, HostBotWhatsApp, TokenWebhook, currentUser, title, body, tipo = "comun"){

        
        
        if(!currentUser){
            return;
        }
        
        let userID = currentUser.id
        console.log("Notificando usuario: ",currentUser)

        try {
            
            const now = moment();
            const dayOfWeek = now.day();
            
            let topic =  ReplaceableWordsController.replaceByUser(title, currentUser, dayOfWeek);
            let msj = ReplaceableWordsController.replaceByUser(body, currentUser, dayOfWeek);

            let dispositivos = await MongoClient.collection(DBNames.notifyMeOrders).find({ notyfyMe: true,userID:  parseInt(userID) }).toArray()
            dispositivos.forEach(async dispositivo => {

                if(dispositivo.notyfyMe){
                try {
                    this.sendNotify(MongoClient,FIREBASE_TOKEN, dispositivo.firebase_token, topic, msj, tipo );
                } catch (error) {
                    
                }
                }

            })

            let CurrentUserConfig = await UserConfigController.searchOrCreateByUserID(MongoClient,parseInt(userID)) 


            if(CurrentUserConfig.notyfyMeByWhatsApp){
                WhatsAppController.sendMessageByPhone(HostBotWhatsApp,TokenWebhook,`${currentUser.country_code}${currentUser.phone}`, `*${topic.trim()}*\n${msj}` )
            }
            if(CurrentUserConfig.notyfyMeByEmail){
                EmailsController.sendMailNotiFy(currentUser.email_aux,topic,msj);
            }

        
        } catch (error) {
            

            console.log("[ERROR EN NotificationsController.notificarByUserID]")
            console.log(userID)
            console.log(FIREBASE_TOKEN)
            console.log(HostBotWhatsApp)
            console.log(TokenWebhook)
            console.log(title)
            console.log(body)
            console.log(tipo)
            console.log(error)
        }

    }

    // static async notifyByEmail(){

    // }

    
    static async sendNotify(MongoClient,FIREBASE_TOKEN, fcmToken, title, body, tipo = "comun") {

        console.log(`Enviando notificacion a ${fcmToken}, mensaje: ${title}`)

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

        let resp = await http.post(`https://fcm.googleapis.com/fcm/send`, data, { headers: headers })

        let statusCode = resp.status;
        let responseBody = resp.data; 

        // Now you can use these variables as needed
        console.log(statusCode, responseBody.success);
        if(resp.data.success != 1){
            console.log(responseBody)
            await MongoClient.collection(DBNames.notifyMeOrders).deleteOne({ firebase_token: fcmToken })


        }

    }

}


export default NotificationsController 