import { DBNames } from './../db.js';
import { MONGODB_NAME } from './../config.js'
import SessionsController from './SessionsController.js';


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
        notyfyMeByWhatsApp: true,
        notyfyMeByEmail: false,
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


  static async getNotifyMe(MongoClient, req, res) {

   let session = await SessionsController.getCurrentSession(MongoClient,  req)

    console.log(session)
    if(session.userApp){
      return res.send({
        success:true,
        message: "OK",
        data: await this.searchOrCreateNotifyMeByUserID(MongoClient,{
          firebase_token: session.firebase_token,
          userID: session.user.id
        })
      })
    }

    return res.status(404).send('BAD_REQUEST');

      

  }

  static async setNotifyMe(MongoClient, req, res) {
    let session = await SessionsController.getCurrentSession(MongoClient,  req)
    let notifyMe =  await this.searchOrCreateNotifyMeByUserID(MongoClient,{
      firebase_token: session.firebase_token,
      userID: session.user.id
    })

    await MongoClient.collection(DBNames.notifyMeOrders).updateOne({ _id: notifyMe._id }, { $set: {
      "notyfyMe": req.body.notyfyMe,
      "notyfyMeByPush": req.body.notyfyMeByPush,
      "notyfyMeByWhatsApp": req.body.notyfyMeByWhatsApp,
      "notyfyMeByEmail": req.body.notyfyMeByEmail
  } });


    return res.send({
      success:true,
      message: "OK",
      data: await this.searchOrCreateNotifyMeByUserID(MongoClient,{
        firebase_token: session.firebase_token,
        userID: session.user.id
      })
    })

  }
  

}



export default NotifiMyController 