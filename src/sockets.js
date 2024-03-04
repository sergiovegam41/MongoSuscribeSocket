import { MONGODB_URI, MONGODB_NAME } from './config.js'
import { ServerApiVersion, ObjectId } from 'mongodb';
import { DBNames } from './db.js';
import SessionsController from './Controllers/SessionsController.js';
import TecnicoServicesSocket from './Controllers/SocketsControllers/TecnicoServicesSocket.js';
import ClienteServicesSocket from './Controllers/SocketsControllers/ClienteServicesSocket.js';
import ClientOffersSocket from './Controllers/SocketsControllers/ClientOffersSocket.js';


export default (io,MongoClient) => {

    const changeStream = MongoClient.collection(DBNames.services).watch();

    changeStream.on('change', async (change) => {

      try {

        if (change.operationType === 'insert' || change.operationType === 'update' ) {
        
          let service = await MongoClient.collection(DBNames.services).findOne({ _id:change.documentKey._id||"" })
         
          let profesion = await MongoClient.collection(DBNames.professions).findOne({_id: new ObjectId(service.profession_id)})

          io.emit(`server:${TecnicoServicesSocket.servicesName}:refresh:${profesion.slug_name}`, true); 
          
        }
      } catch (error) {

        console.log(error)

      }

    });

    io.on('connection', async (socket) => {

      let init = true;
      let actionsExecuted = [];

      console.log("New conecction")

      socket.on("cliente:tryAutch", async (data) => {

        let validationMiddlewareResp = await validationMiddleware(data);

        if(validationMiddlewareResp == null){

          let session = await SessionsController.getCurrentSession(MongoClient, { headers: { authorization: data.token } })

          console.log(`server:${data.accion.toString()}:init`);
          socket.emit(`server:${data.accion.toString()}:init`, { success: false, code: "banned", msj: session.back_list.reason })
        
        } else if (validationMiddlewareResp == true) {
          console.log("Next");

          if( !actionsExecuted.includes(data.accion.toString())){
            init = true;
          }
          
          if(init){

            init = false;
            actionsExecuted.push(data.accion.toString())

            await start(io, socket, MongoClient, data);
          }
  
        } else {
          console.log(`server:${data.accion.toString()}:init`);
          socket.emit(`server:${data.accion.toString()}:init`, { success: false, code: "unauthorized", msj: "No estas autorizado para realizar esta accion." })
        }

        socket.emit(`server:AutchSuccess`, true)
  
      })
  


    })

    async function validationMiddleware(data) {

      let session = await SessionsController.getCurrentSession(MongoClient, { headers: { authorization: data.token } })
  
      if(session.back_list){
        
        console.log("USUARIO EN BLACK LIST")
        return null;
      }

      if (session) {
  
        return true
      }
  
      return false
  
    }
  
    async function start(io, clientSocket, MongoClient, data) {
  

      console.log("New conection "+data.accion.toString())
      console.log("start")
      let session = null;
      try {
        session = await SessionsController.getCurrentSession(MongoClient, { headers: { authorization: data.token } })
      } catch (error) {
  
      }

  
      if (data.accion.toString() == TecnicoServicesSocket.servicesName) {

        TecnicoServicesSocket.run(io, clientSocket, MongoClient, {session, req: data})
  
      }

      if (data.accion.toString() == ClienteServicesSocket.servicesName) {

        ClienteServicesSocket.run(io, clientSocket, MongoClient, {session, req: data})

      }

      if (data.accion.toString() == ClientOffersSocket.servicesName) {

        ClientOffersSocket.run(io, clientSocket, MongoClient, {session, req: data})

  
      }

    
  
    }
  



 
  
}