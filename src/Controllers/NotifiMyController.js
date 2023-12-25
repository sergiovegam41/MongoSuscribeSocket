import { DBNames } from './../db.js';
import { MONGODB_NAME } from './../config.js'


class NotifiMyController {


  static async updateNotifiMe(MongoClient,req){

    return await MongoClient.collection(DBNames.notifyMeOrders).updateOne({ firebase_token: req.firebase_token }, { $set: {  notyfyMe: req.notifi } });
  }

  static async searchOrCreateNotifyMeByUserID(MongoClient, req, res=null) {

    let userID = parseInt(req.userID)
    let firebase_token= req.firebase_token
      
    console.log(userID)
    console.log(firebase_token)
    if(firebase_token == null || userID == null){
      return null
    }

    const user = await MongoClient.collection(DBNames.notifyMeOrders).findOne({ firebase_token: firebase_token });
    if (!user) {
      const newUser = {
        userID: userID,
        notyfyMe: true,
        firebase_token
      };
      await MongoClient.collection(DBNames.notifyMeOrders).insertOne(newUser);
    }else{
      if(parseInt(userID) != parseInt(user.userID)){
        await MongoClient.collection(DBNames.notifyMeOrders).updateOne({ _id: user._id }, { $set: { firebase_token, userID } });
      }
    }

    return await MongoClient.collection(DBNames.notifyMeOrders).findOne({ firebase_token: firebase_token });


  }

}



export default NotifiMyController 