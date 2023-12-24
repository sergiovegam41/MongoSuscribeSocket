import { DBNames } from './../db.js';
import { MONGODB_NAME } from './../config.js'
import { ServerApiVersion, ObjectId } from 'mongodb';

class WorkplaceController {


  static async searchOrTechnicalWorkplaceUserID(MongoClient, req, res = null){
    let userID =  req.query.userID;

    if(userID == null){
      return null
    }
  
    const user = await MongoClient.collection(DBNames.technical_workplace).findOne({ user_id:userID });
  
    if (!user) {
      const newUser = {
        user_id: userID,
        countri_id:null,
        departament_id:null,
        municipality_id:null
      };
      await MongoClient.collection(DBNames.technical_workplace).insertOne(newUser);
      return await MongoClient.collection(DBNames.technical_workplace).findOne({ user_id:userID });
    }
  
    if(user.countri_id && user.municipality_id ){
  
      let coountri = await MongoClient.collection(DBNames.countries).findOne({_id: new ObjectId(user.countri_id)})
      let municipaly =await MongoClient.collection(DBNames.municipalities).findOne({_id: new ObjectId(user.municipality_id  )})
  
      return { countrIcon: coountri.icon, countriName: coountri.name??"", municipalyName: municipaly.name, ...user };
    }

    if(res != null){
      return res.send({

        success:true,
        message: "OK",
        data: user
        
      })
    }
  
    return user
  
  }

 

}



export default WorkplaceController 