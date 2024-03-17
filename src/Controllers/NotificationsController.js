import http from 'axios';
import { DBNames } from './../db.js';
import moment from "moment";
import ReplaceableWordsController from '../Utils/ReplaceableWordsController.js';
import nodemailer from "nodemailer";

import { ObjectId } from 'mongodb';
import SessionsController from './SessionsController.js';

class NotificationsController {

    static async sendNotifyToManyV2(MongoClient, req,res){

        res.send({
            success: true,
            message: "OK"
        })

        console.log( req.body.municipalities )
        await NotificationsController.sendNotifyManyByFilterV2(MongoClient,req, req.body.municipalities,req.body.professions,req.body.title, req.body.body, req.body.role,req.body.type??"comun")

    }

    static async sendNotifyManyByFilterV2(MongoClient, req, cities = ["649a034560043e9f434a94fe"], professions = ["64c553e73abc6c0ec50e1dc3"], title = "Hola! $[user_name];! bienvenido a Dservices ", body="Dservices te desea un feliz $[dayWeekName];!", role = "TECNICO", tipo="comun"){

        
        let session = await SessionsController.getCurrentSession(MongoClient, req)

        const NOTIFICATIONS_HOST = (await MongoClient.collection(DBNames.Config).findOne({ name: "NOTIFICATIONS_HOST" })).value;


        try {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+session.session_token
            };
    
            let resp = await http.post(`${NOTIFICATIONS_HOST}/sendNotifyToManyV2`, {

                "type":tipo,
                "role":role,
                "body":body,
                "title":title,
                "professions":professions,
                "municipalities":cities

            }, { headers: headers })
            
            let statusCode = resp.status;
            let responseBody = resp.data; 
    
    
            console.log(responseBody)
            return {
                success: responseBody.success,
                code: statusCode
            };
           } catch (error) {

            console.log(error)
          
           }
        console.log(session.session_token)


    }


    static async sendNotifyMany(MongoClient,req,res){
        res.send({
            success: true,
            message: "OK"
        })

        let session = await SessionsController.getCurrentSession(MongoClient, req)

        const NOTIFICATIONS_HOST = (await MongoClient.collection(DBNames.Config).findOne({ name: "NOTIFICATIONS_HOST" })).value;


        try {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+session.session_token
            };
    
            let resp = await http.post(`${NOTIFICATIONS_HOST}/sendNotifyMany`, {

                "title":req.body.title,
                "body":req.body.body,
                "type":req.body.type,
                "profession_filter":req.body.profession_filter,
                "type":req.body.type,
                "delay":0,
                "unique":false,
                "dayOfWeek":false


            }, { headers: headers })
            
            let statusCode = resp.status;
            let responseBody = resp.data; 
    
    
            console.log(responseBody)
            return {
                success: responseBody.success,
                code: statusCode
            };
           } catch (error) {

            console.log(error)
          
           }
        // console.log("sendNotifyMany")

        // await  this.sendNotifyManyByFilter(MongoClient, req.body.title, req.body.body,req.body.type, { profession_filter: req.body.profession_filter, delay: 0, unique: false, dayOfWeek:false })

    }

    // static async notificarByUser(MongoClient,FIREBASE_TOKEN, HostBotWhatsApp, TokenWebhook, currentUser, title, body, tipo = "comun", dataNotify = {}){
    
    // }



    static async notificarByUserApi(MongoClient, req, res){

        let userID = req.params.id;
        let title = req.body.title
        let body = req.body.body
        let tipo = req.body.tipo
        let data = req.body.data
        
        
        
        if( res != null){

            if(userID == "" || userID == null){
                return res.send({
                    success:fasle,
                    message: "BAD REQUEST",
                    data: null
                })
            }

            res.send({
                success:true,
                message: "OK",
                data: null
            })

        }
        
        
        let session = await SessionsController.getCurrentSession(MongoClient, req)

        const NOTIFICATIONS_HOST = (await MongoClient.collection(DBNames.Config).findOne({ name: "NOTIFICATIONS_HOST" })).value;


        try {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+session.session_token
            };
    
            let resp = await http.post(`${NOTIFICATIONS_HOST}/notifyByUserID/${userID}`, {

                userID,
                title,
                body,
                tipo,
                data

            }, { headers: headers })
            
            let statusCode = resp.status;
            let responseBody = resp.data; 
    
    
            console.log(responseBody)
            return {
                success: responseBody.success,
                code: statusCode
            };
           } catch (error) {

            console.log(error)
          
           }

        //    console.log(session.session_token)
      
       

    }   

    

}


export default NotificationsController 