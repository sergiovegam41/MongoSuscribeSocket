import ScheduledNotifications from './ScheduledNotifications/ScheduledNotifications.js';

class CronJobs {

    static async run(MongoClient, hour){
      
        ScheduledNotifications.run(MongoClient, hour)

    }

}


export default CronJobs 