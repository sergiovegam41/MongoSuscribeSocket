import { DBNames } from './../db.js';
import { MONGODB_NAME } from './../config.js'
import { ServerApiVersion, ObjectId } from 'mongodb';

class UserConfigController {

  static async searchOrCreateByUserIDApi(MongoClient, req,res){

    try {
     res.send({
       success: true,
       message: "OK",
       data: await this.searchOrCreateByUserID(MongoClient, req.body.userID)
     })
    } catch (error) {
     res.send({
       success: false,
       message: "ERROR: "+error,
       data: null
     })
    }
 
    return
     
   }

  static async searchOrCreateByUserID(MongoClient, userID){


    if(userID == null){
      return null
    }
  
    userID = parseInt(userID)
    const user = await MongoClient.collection(DBNames.UserConfig).findOne({ userID:userID });
  
    if (!user) {
      const newUser = {
        userID: userID,
        notyfyMeByWhatsApp: false,
        notyfyMeByEmail: false

      };
      await MongoClient.collection(DBNames.UserConfig).insertOne(newUser);
    }
    
    return await MongoClient.collection(DBNames.UserConfig).findOne({ userID:userID });
    
  
  }

 

}



export default UserConfigController 