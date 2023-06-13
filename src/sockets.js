import { MONGODB_URI, MONGODB_NAME } from './config.js'
import { MongoClient, ServerApiVersion, ObjectID } from 'mongodb';
const DATABASE = MONGODB_NAME


export default (io)=>{

    const Mongoclient = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    var ServicesCollection = null
    var professionsCollection = null
    var notifyMeOrdersCollection = null

    Mongoclient.connect(async err => {
      
      console.log("Mongo Conectado a: " + DATABASE);

        ServicesCollection = Mongoclient.db(DATABASE).collection("services");
        professionsCollection = Mongoclient.db(DATABASE).collection("professions");
        notifyMeOrdersCollection = Mongoclient.db(DATABASE).collection("notifyMeOrders");
  
        const changeStream = ServicesCollection.watch();

        changeStream.on('change', async (change) => {

          console.log("change")

          try {

            if (change.operationType === 'insert' || change.operationType === 'update' ) {
            
              let service = await ServicesCollection.findOne({ _id:change.documentKey._id||"" })

             
              let profesion = await professionsCollection.findOne({_id: new ObjectID(service.profession_id)})
              console.log(profesion.slug_name);
    
              io.emit(`server:refresh:${profesion.slug_name}`, true); 
             
            
              
            }
          } catch (error) {

            console.log(error)

          }

        });


        io.on('connection', async (socket)=>{

          console.log("New conecction")
  
          let resp = await getCurrentData();
          console.log(resp)

          socket.emit('server:init', true)

          socket.on("client:setNotifyMeOrders", async (data = {"notifi":notifi??true,"userID":null})=>{

            let notifyMe = await searchOrCreateNotifyMeByUserID(data['userID'])
            if(notifyMe){
              const user = await notifyMeOrdersCollection.updateOne({ userID: data['userID'] },{ $set: {  notyfyMe: data['notifi'] } });
              let notifyMe = await searchOrCreateNotifyMeByUserID(data['userID'])

              socket.emit('server:setNotifyMeOrders', notifyMe.notyfyMe)

            }


          })

          socket.on("client:getData", async (data = {paginate: {page: 1, perPage: 10, professionIds: null},userID: null})=>{

            // console.log(data)
            let resp = await getCurrentData(data['paginate']);
            let notifyMe = await searchOrCreateNotifyMeByUserID(data['userID'])
            // console.log(notifyMe)

            if(notifyMe){
              
              socket.emit('server:setData', {orders: resp, notifiMeOrders: notifyMe.notyfyMe})
            }
            
          })

          socket.on('disconnect', () => {
            console.log('Client disconnected');
            // Realizar acciones adicionales si es necesario
          });

  
        })

       
  
        
    
    
    });

   var  searchOrCreateNotifyMeByUserID = async function  (userID) {
    if(userID == null){
      return null
    }
      const user = await notifyMeOrdersCollection.findOne({ userID });
      if (!user) {
        const newUser = {
          userID,
          notyfyMe: true
        };
        await notifyMeOrdersCollection.insertOne(newUser);
        return await notifyMeOrdersCollection.findOne({ userID });
      }
      return user;
    }

   var getCurrentData = async (data = {page: 1, perPage: 10, professionIds: null})=>{

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
  
        console.log(data.professionIds)
  
       let resp = await ServicesCollection.find({ deleted_at: { $exists: false }, profession_id: { $in: data.professionIds },  status: "CREATED", is_public: true}).sort({ created_at: -1 }).skip(skip).limit(limit).toArray();
       return resp
      } catch (error) {
        console.log(error)
      }
      

    }

 
  
}