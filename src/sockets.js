import { MONGODB_URI, MONGODB_NAME } from './config.js'
import { ServerApiVersion, ObjectId } from 'mongodb';
import { DBNames } from './db.js';


export default (io,MongoClient) => {

    const changeStream = MongoClient.collection(DBNames.services).watch();

    changeStream.on('change', async (change) => {

      // console.log("change")

      try {

        if (change.operationType === 'insert' || change.operationType === 'update' ) {
        
          let service = await MongoClient.collection(DBNames.services).findOne({ _id:change.documentKey._id||"" })
         
          let profesion = await MongoClient.collection(DBNames.professions).findOne({_id: new ObjectId(service.profession_id)})
          // console.log(profesion.slug_name);

          io.emit(`server:refresh:${profesion.slug_name}`, true); 
          
        }
      } catch (error) {

        console.log(error)

      }

    });

    io.on('connection', async (socket) => {

      console.log("New conecction")

      let resp = await getCurrentData();
      // console.log(resp)

      socket.emit('server:init', true)

      socket.on("client:setNotifyMeOrders", async (data = {"notifi":notifi??true,"userID":null})=>{

        console.log(data)

        let notifyMe = await searchOrCreateNotifyMeByUserID(data['userID'])
        if(notifyMe){
          await MongoClient.collection(DBNames.notifyMeOrders).updateOne({ userID: parseInt(data['userID']) },{ $set: {  notyfyMe: data['notifi'] } });
          let notifyMe = await searchOrCreateNotifyMeByUserID(data['userID'])

          socket.emit('server:setNotifyMeOrders', notifyMe.notyfyMe)

        }

      })

      socket.on("client:getData", async (data = {paginate: {page: 1, perPage: 10, professionIds: null},userID: null,firebase_token:null})=>{

        let technical_workplace = await searchOrTechnicalWorkplaceUserID(data['userID'])
        let resp = await getCurrentData(data['paginate'], technical_workplace.municipality_id);
        let notifyMe = await searchOrCreateNotifyMeByUserID(data['userID'],data.firebase_token)
        let starts = await searchStartsByUserID(data['userID'])
        let briefcase = await searchBriefcasesrsByUserID(data['userID'])

        // console.log(technical_workplace)
        
        socket.emit('server:setData', {orders: resp, notifiMeOrders: notifyMe.notyfyMe, starts: starts,briefcase:briefcase, technical_workplace})
        
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected');
        // Realizar acciones adicionales si es necesario
      });


    })



   var  searchOrCreateNotifyMeByUserID = async function  (userID,firebase_token=null) {
      
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

  var  searchOrTechnicalWorkplaceUserID = async function  (userID) {
    
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

    return user
  
  }

  var getCurrentData = async (data = {page: 1, perPage: 10, professionIds: null}, municipaly_id)=>{

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