// import Note from './models/Note.js';

import { MONGODB_URI, MONGODB_NAME } from './config.js'
import { MongoClient, ServerApiVersion, ObjectID } from 'mongodb';
const DATABASE = MONGODB_NAME


export default (io)=>{

    const Mongoclient = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    var ServicesCollection = null
    var professionsCollection = null

    Mongoclient.connect(async err => {
      
      console.log("Mongo Conectado a: " + DATABASE);

        ServicesCollection = Mongoclient.db(DATABASE).collection("services");
        professionsCollection = Mongoclient.db(DATABASE).collection("professions");
  
        const changeStream = ServicesCollection.watch();

        changeStream.on('change', async (change) => {

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

          socket.on("client:getData", async (data = {page: 1, perPage: 10, professionIds: null})=>{

            let resp = await getCurrentData(data);
            console.log(resp)
            socket.emit('server:setData', resp)
            
          })

          socket.on('disconnect', () => {
            console.log('Client disconnected');
            // Realizar acciones adicionales si es necesario
          });

  
        })

       
  
        
    
    
    });

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
  
       let resp = await ServicesCollection.find({ deleted_at: { $exists: false }, profession_id: { $in: data.professionIds } }).sort({ created_at: -1 }).skip(skip).limit(limit).toArray();
       return resp
      } catch (error) {
        console.log(error)
      }
      

    }

 
  
}