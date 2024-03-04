import { DBNames } from './../db.js';
import { MONGODB_NAME } from './../config.js'
import SessionsController from './SessionsController.js';
import UserConfigController from './UserConfigController.js';


class NotifiMyController {


  static async updateNotifiMe(MongoClient,req){

    return await MongoClient.collection(DBNames.notifyMeOrders).updateOne({ firebase_token: req.firebase_token }, { $set: {  notyfyMe: req.notifi } });
  }

  static async searchOrCreateNotifyMeByUserID(MongoClient, req, res=null) {

    let userID = parseInt(req.userID)
    let firebase_token= req.firebase_token
    let CurrentUserConfig = await UserConfigController.searchOrCreateByUserID(MongoClient,req.userID) 

    // console.log(userID)
    // console.log(firebase_token)
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

    let resp = { 
      ...(await MongoClient.collection(DBNames.notifyMeOrders).findOne({ firebase_token: firebase_token })),
      ...CurrentUserConfig  
}

    return resp;

  }


  static async getNotifyMe(MongoClient, req, res) {

   let session = await SessionsController.getCurrentSession(MongoClient,  req)

    console.log("getNotifyMe")
    if(session.userApp){
      return res.send({
        success:true,
        message: "OK",
        data: await this.searchOrCreateNotifyMeByUserID(MongoClient,{
          firebase_token: session.firebase_token,
          userID: session.user.id,
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


  console.log( "notyfyMe")
  console.log( notifyMe)
  let a = await MongoClient.collection(DBNames.notifyMeOrders).updateOne({ userID: parseInt(session.user.id) }, { $set: {
    notyfyMe: req.body.notyfyMe
  } });

  await MongoClient.collection(DBNames.UserConfig).updateOne({ userID: parseInt(session.user.id)}, { $set:{

    notyfyMeByWhatsApp: req.body.notyfyMeByWhatsApp,
    notyfyMeByEmail:  req.body.notyfyMeByEmail

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