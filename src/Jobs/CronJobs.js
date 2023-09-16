import ScheduledNotifications from './ScheduledNotifications/ScheduledNotifications.js';

class CronJobs {

    static async run(MongoClient, hour){
      
       try {
        ScheduledNotifications.run(MongoClient, hour)
       } catch (error) {
        console.log("[ERROR ScheduledNotifications]")
        // console.log(error)
       }

    }

}


export default CronJobs 