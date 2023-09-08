import http from 'axios';
import { DBNames } from './../db.js';
import moment from "moment";


class NotificationsController {

    static async sendNotifyManyByFilter(MongoClient, title, body, tipo = "comun", scheduled_notifications ){

        const FIREBASE_TOKEN = (await MongoClient.collection(DBNames.Config).findOne({name:"FIREBASE_TOKEN"})).value;


        const now = moment();
        const dayOfWeek = now.day();
        const formattedDate = now.format("MM/DD/YYYY");

        console.log(scheduled_notifications,scheduled_notifications.unique);
        if(!scheduled_notifications.unique){

            if(scheduled_notifications.dayOfWeek){
                            
                if(scheduled_notifications.dayOfWeek == dayOfWeek){
                    console.log('semanal')
                    await this.notifyAll(MongoClient,scheduled_notifications,FIREBASE_TOKEN, title, body, tipo)
                }

            }else{
                console.log('diario')
                await this.notifyAll(MongoClient,scheduled_notifications,FIREBASE_TOKEN, title, body, tipo )
            }
           

       

        }else{

            console.log(scheduled_notifications)
            console.log(formattedDate)

            if(scheduled_notifications.date == formattedDate){
                console.log('Unique')
                await this.notifyAll(MongoClient,scheduled_notifications,FIREBASE_TOKEN, title, body, tipo )
                await MongoClient.collection(DBNames.scheduled_notifications).deleteOne({_id: scheduled_notifications._id})

            }
            
        }

       



      

    }


    static async notifyAll(MongoClient,scheduled_notifications,FIREBASE_TOKEN, title, body, tipo = "comun",){

        let notifyMeOrders = await MongoClient.collection(DBNames.notifyMeOrders).find().toArray()
        console.log("notifyAll");

        let millisegundos =  ((parseInt(scheduled_notifications.delay??"0") * 60)) * 1000 ;
        console.log(millisegundos);

        if(millisegundos==0){

            await notifyMeOrders.forEach(async element => {
      
                if(element.notyfyMe && element.firebase_token){
    
                    const professions_technical_details = await MongoClient.collection(DBNames.professions_technical_details).find({ technical_id: element.userID, profession_id: { $in: scheduled_notifications.profession_filter } }).toArray();
    
                    
                    if(professions_technical_details.length > 0){
        
                        await this.sendNotify( FIREBASE_TOKEN, element.firebase_token, title, body, tipo  )                
    
                    }
    
                }
    
            });
            
        }else{
            setTimeout( async () => {

                console.log("Delay !",scheduled_notifications.delay);
      
                  await notifyMeOrders.forEach(async element => {
      
                      if(element.notyfyMe && element.firebase_token){
          
                          const professions_technical_details = await MongoClient.collection(DBNames.professions_technical_details).find({ technical_id: element.userID, profession_id: { $in: scheduled_notifications.profession_filter } }).toArray();
          
                          
                          if(professions_technical_details.length > 0){
              
                              await this.sendNotify( FIREBASE_TOKEN, element.firebase_token, title, body, tipo  )                
          
                          }
          
                      }
          
                  });
      
              }, millisegundos );
        }

        

      
    }


    static async sendNotify(FIREBASE_TOKEN, fcmToken, title, body, tipo = "comun" ){

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

        await http.post(`https://fcm.googleapis.com/fcm/send`, data ,{ headers: headers });

    }

}


export default NotificationsController 