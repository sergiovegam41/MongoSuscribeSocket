import { DBNames } from './../db.js';
import { MONGODB_NAME } from './../config.js'


class StartsController {

  static async rate(MongoClient, req, res) {

    let token = req.body.token||""
    let service_id = req.body.service_id||null
    let value = req.body.value||null
    
    try {
  
      if(! await hasAuthority(token)) return res.send({
        success:false,
        message: "UNAUTHORIZED"
      })

      if( service_id == null ) return res.send({
        success:false,
        message: "service_id IS REQUIRED",
      })

      if( value == null ) return res.send({
        success:false,
        message: "value IS REQUIRED",
      })

      const service =  await MongoClient.collection(DBNames.services).findOne({_id: ObjectID(service_id)});

      if(service){

        await this.rateServices( service_id, service.technical_id,service.client_id,parseInt(value));
        await this.calculateTotalStarts(service.technical_id)

        return res.send({

          success:true,
          message: "OK"
        
        })

      }
        
      return res.send({

        success:false,
        message: "BAD_REQUEST"
        
      })

    } catch (error) {

      return res.send({
        success:false,
        message: error,
      })
        
    }
  }

  

  static async rateServices( service_id, technical_id, client_id, value ) {

    const item = await MongoClient.collection(DBNames.technical_stars_services_detail).findOne({ service_id });
    if (!item) {
      
      const newUser = {

        service_id,
        technical_id,
        client_id,
        value
      
      };

      await MongoClient.collection(DBNames.technical_stars_services_detail).insertOne(newUser);
      return await MongoClient.collection(DBNames.technical_stars_services_detail).findOne({ service_id });

    }

    await MongoClient.collection(DBNames.technical_stars_services_detail).updateOne({ service_id }, { $set: {
      service_id,
      technical_id,
      client_id,
      value
    }});

    return await MongoClient.collection(DBNames.technical_stars_services_detail).findOne({ service_id });

  }

  static async calculateTotalStarts(technical_id){
    let starts = await MongoClient.collection(DBNames.technical_stars_services_detail).find({technical_id}).toArray()

    let total = 0 
    starts.forEach(element => {
      total += parseInt(element.value)
    });

    total =  total / starts.length
    await this.saveStartsByUserID(technical_id,total)

  }


  static async saveStartsByUserID( technical_id, value ) {

    const item = await MongoClient.collection(DBNames.technical_stars).findOne({ technical_id });
    if (!item) {
      const newUser = {
        technical_id,
        value
      };
      await MongoClient.collection(DBNames.technical_stars).insertOne(newUser);
      return await MongoClient.collection(DBNames.technical_stars).findOne({ technical_id });
    }

    await MongoClient.collection(DBNames.technical_stars).updateOne({ technical_id }, { $set: {
      technical_id,
      value
    }});

    return await MongoClient.collection(DBNames.technical_stars).findOne({ technical_id });

  }


       
  static async hasAuthority(token){
    let TokenWebhook = await ConfigCollection.findOne({ name: "TokenWebhook" })
    return !(TokenWebhook.value != token && TokenWebhook.value != null)
  }


}



export default StartsController 