
import { DBNames } from "../../db.js";
import { ServerApiVersion, ObjectId } from 'mongodb';
import WorkplaceController from "../WorkplaceController.js";
import NotifiMyController from "../NotifiMyController.js";


class TecnicoServicesSocket {

    static servicesName = "tecnicoServices"

    static async run(io,clientSocket, MongoClient, userData){



        console.log(this.servicesName);
        clientSocket.emit(`server:${this.servicesName}:init`, { success: true, code:"",msj:"", initData: {}})


        clientSocket.on(`client:${this.servicesName}:setNotifyMeOrders`, async (data = {"notifi":notifi??true,"userID":null, "firebase_token":null})=>{
  
          // console.log(data)
  
          let notifyMe = await NotifiMyController.searchOrCreateNotifyMeByUserID(MongoClient, {userID:userData.session.user_id,firebase_token:data['firebase_token']})
         
          if(notifyMe){

            await NotifiMyController.updateNotifiMe(MongoClient, {firebase_token:data['firebase_token'],notifi: data['notifi']})
            let notifyMe = await NotifiMyController.searchOrCreateNotifyMeByUserID(MongoClient, {userID:userData.session.user_id,firebase_token:data['firebase_token']})
  
            clientSocket.emit(`server:${this.servicesName}:setNotifyMeOrders`, notifyMe.notyfyMe)
  
          }
  
        })
  
        clientSocket.on(`client:${this.servicesName}:getData`, async (data = {paginate: {page: 1, perPage: 10, professionIds: null},userID: null,firebase_token:null})=>{
  
          let technical_workplace = await searchOrTechnicalWorkplaceUserID(userData.session.user_id)
          let resp = await getCurrentData(data['paginate'], technical_workplace.municipality_id);
          let notifyMe = await NotifiMyController.searchOrCreateNotifyMeByUserID(MongoClient, {userID:userData.session.user_id,firebase_token:data.firebase_token})
          let starts = await searchStartsByUserID(userData.session.user_id)
          let briefcase = await searchBriefcasesrsByUserID(userData.session.user_id)
  

          
          // console.log(briefcase)
          
          clientSocket.emit(`server:${this.servicesName}:setData`, {orders: resp, notifiMeOrders: notifyMe.notyfyMe, starts: starts,briefcase:briefcase, technical_workplace})
          
        })
  
        clientSocket.on('disconnect', () => {
            
            console.log('Client disconnected');

        });




// let  searchOrCreateNotifyMeByUserID = async function  (userID,firebase_token=null) {
//   return
// }





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

    console.log("searchBriefcasesrsByUserID: ",technical_id)


    const item = await MongoClient.collection(DBNames.briefcases).findOne({ technical_id: `${technical_id}` });

    if (!item) {
      const newBriefcase = {
        technical_id,
        current_amount: 0
      };
      // await MongoClient.collection(DBNames.briefcases).insertOne(newBriefcase);
      return newBriefcase
    }

    return await MongoClient.collection(DBNames.briefcases).findOne({technical_id: `${technical_id}`});

  }

    }

  
     
    

   

}




 




export default TecnicoServicesSocket 