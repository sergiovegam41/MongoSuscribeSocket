
import { DBNames } from "../../db.js";

import { ServerApiVersion, ObjectId } from 'mongodb';
import WorkplaceController from "../WorkplaceController.js";


class TecnicoServicesSocket {

  static servicesName = "tecnicoServices"

    static async run(io,clientSocket, MongoClient, data){

        console.log(this.servicesName);
        clientSocket.emit(`server:${this.servicesName}:init`, { success: true, code:"",msj:"", initData: {}})


        clientSocket.on(`client:${this.servicesName}:setNotifyMeOrders`, async (data = {"notifi":notifi??true,"userID":null})=>{
  
          console.log(data)
  
          let notifyMe = await searchOrCreateNotifyMeByUserID(data['userID'])
          if(notifyMe){
            await MongoClient.collection(DBNames.notifyMeOrders).updateOne({ userID: parseInt(data['userID']) },{ $set: {  notyfyMe: data['notifi'] } });
            let notifyMe = await searchOrCreateNotifyMeByUserID(data['userID'])
  
            clientSocket.emit(`server:${this.servicesName}:setNotifyMeOrders`, notifyMe.notyfyMe)
  
          }
  
        })
  
        clientSocket.on(`client:${this.servicesName}:getData`, async (data = {paginate: {page: 1, perPage: 10, professionIds: null},userID: null,firebase_token:null})=>{
  
          let technical_workplace = await searchOrTechnicalWorkplaceUserID(data['userID'])
          let resp = await getCurrentData(data['paginate'], technical_workplace.municipality_id);
          let notifyMe = await searchOrCreateNotifyMeByUserID(data['userID'],data.firebase_token)
          let starts = await searchStartsByUserID(data['userID'])
          let briefcase = await searchBriefcasesrsByUserID(data['userID'])
  
          // console.log(technical_workplace)
          
          clientSocket.emit(`server:${this.servicesName}:setData`, {orders: resp, notifiMeOrders: notifyMe.notyfyMe, starts: starts,briefcase:briefcase, technical_workplace})
          
        })
  
        clientSocket.on('disconnect', () => {
            
            console.log('Client disconnected');

        });



        

let  searchOrCreateNotifyMeByUserID = async function  (userID,firebase_token=null) {
      
    if(userID == null){
      return null
    }

    const user = await MongoClient.collection(DBNames.notifyMeOrders).findOne({ userID: parseInt(userID) });
    if (!user) {
      const newUser = {
        userID: parseInt(userID),
        notyfyMe: true,
        firebase_token
      };
      await MongoClient.collection(DBNames.notifyMeOrders).insertOne(newUser);
    }else{
      if(firebase_token){
        await MongoClient.collection(DBNames.notifyMeOrders).updateOne({ _id: user._id }, { $set: { firebase_token } });
      }
    }

    return await MongoClient.collection(DBNames.notifyMeOrders).findOne({ userID: parseInt(userID) });
  }

  let  searchOrTechnicalWorkplaceUserID = async function  (userID) {
    return await WorkplaceController.searchOrTechnicalWorkplaceUserID(MongoClient, {query: {userID: userID}} )
  }

let getCurrentData = async (data = {page: 1, perPage: 10, professionIds: null}, municipaly_id)=>{

  try {

    const page = data.page; 
    const perPage = data.perPage; 
    const skip = (page - 1) * perPage; 
    const limit = perPage;
    if(data.professionIds == null){
      data.professionIds = [
        "64582a4580fcfe55480ea7c2"
      ]
    }

    // console.log(data.professionIds)

    let resp = await MongoClient.collection(DBNames.services).find({municipality_id:municipaly_id, deleted_at: { $exists: false }, profession_id: { $in: data.professionIds },  status: "CREATED", is_public: true}).sort({ created_at: -1 }).skip(skip).limit(limit).toArray();
    return resp
  } catch (error) {
    console.log(error)
  }
  

}

  

 
  
  async function searchStartsByUserID( technical_id ) {

    // console.log(technical_id)

    const item = await MongoClient.collection(DBNames.technical_stars).findOne({ technical_id });


    // console.log(item)
    if (!item) {
      const newUser = {
        technical_id,
        value: 0
      };
      await MongoClient.collection(DBNames.technical_stars).insertOne(newUser);
      return await MongoClient.collection(DBNames.technical_stars).findOne({ technical_id });
    }

    return await MongoClient.collection(DBNames.technical_stars).findOne({ technical_id });

  }

  async function searchBriefcasesrsByUserID( technical_id ) {


    const item = await MongoClient.collection(DBNames.briefcases).findOne({ technical_id });

    if (!item) {
      const newBriefcase = {
        technical_id,
        current_amount: 0
      };
      // await MongoClient.collection(DBNames.briefcases).insertOne(newBriefcase);
      return newBriefcase
    }

    return await MongoClient.collection(DBNames.briefcases).findOne({ technical_id });

  }

    }

  
     
    

   

}




 




export default TecnicoServicesSocket 