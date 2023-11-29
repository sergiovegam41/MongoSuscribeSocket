import { MONGODB_URI, MONGODB_NAME } from './config.js'
import { ServerApiVersion, ObjectId } from 'mongodb';
import { DBNames } from './db.js';
import SessionsController from './Controllers/SessionsController.js';
import TecnicoServicesSocket from './Controllers/SocketsControllers/TecnicoServicesSocket.js';
import ClienteServicesSocket from './Controllers/SocketsControllers/ClienteServicesSocket.js';


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

      console.log("New conecction")

      socket.on("cliente:tryAutch", async (data) => {

        if (await validationMiddleware(data)) {
          console.log("Next")
          start(io, socket, MongoClient, data)
  
        } else {
          io.emit("server:init", { success: false, code: "unauthorized", msj: "No estas autorizado para realizar esta accion." })
        }
  
      })
  


    })

    async function validationMiddleware(data) {
    let session = await SessionsController.getCurrentSession(MongoClient, { headers: { authorization: data.token } })
  
      if (session) {
  
        return true
      }
  
      return false
  
    }
  
    async function start(io, clientSocket, MongoClient, data) {
  
      let session = null;
      try {
        session = await SessionsController.getCurrentSession(MongoClient, { headers: { authorization: data.token } })
      } catch (error) {
  
      }
  
  
      if (data.accion.toString() == TecnicoServicesSocket.servicesName) {

        TecnicoServicesSocket.run(io, clientSocket, MongoClient, data)
  
      }

      if (data.accion.toString() == ClienteServicesSocket.servicesName) {

        ClienteServicesSocket.run(io, clientSocket, MongoClient, data)

  
      }
  
    }
  



 
  
}