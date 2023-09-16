import NotificationsController from '../../Controllers/NotificationsController.js';
import { DBNames } from './../../db.js';
// import axios from 'axios';

class ScheduledNotifications {

    static async run(MongoClient, hour){

        console.log("hour: ",hour)

        let countries = await MongoClient.collection(DBNames.countries).find({}).toArray()

        for (let countrie of countries ) {

           let countrieHour = (parseInt(hour) - parseInt(countrie.offset_utc_timezone) + 24) % 24;
            if (countrieHour < 0) {
                countrieHour += 24;
            }

            let scheduled_notifications = await MongoClient.collection(DBNames.scheduled_notifications).find({ hour:countrieHour, country_id:countrie._id.toString() }).toArray();

            
            for (let element of scheduled_notifications ) {

               await NotificationsController.sendNotifyManyByFilter(MongoClient,element.title,element.description,"comun",element)
                
            };
            
        };


        

    }
 
}

export default ScheduledNotifications 