import NotificationsController from '../../Controllers/NotificationsController.js';
import { DBNames } from './../../db.js';
// import axios from 'axios';

class ScheduledNotifications {

    static async run(MongoClient, hour){

        console.log("hour "+hour)
        let scheduled_notifications = await MongoClient.collection(DBNames.scheduled_notifications).find({utc_hour:hour}).toArray()
        
        scheduled_notifications.forEach(element => {

            NotificationsController.sendNotifyManyByFilter(MongoClient,element.title,element.description,"comun",element)
            
        });

    }
 
}

export default ScheduledNotifications 