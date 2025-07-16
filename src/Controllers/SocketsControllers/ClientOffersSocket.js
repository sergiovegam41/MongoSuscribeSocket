
import { DBNames } from "../../db.js";
import { ServerApiVersion, ObjectId } from 'mongodb';
import WorkplaceController from "../WorkplaceController.js";
import NotifiMyController from "../NotifiMyController.js";


class ClientOffersSocket {

    static servicesName = "ClientOffersSocket"

    static async run(io,clientSocket, MongoClient, userData){
      
        console.log("RUN OFERTAS")
        // console.log(this.servicesName);
        clientSocket.on(`client:${this.servicesName}:init`, async (data) => {

            console.log("el init del ofertas")
            let services = await getFormsByCategorieName(MongoClient, userData);

            clientSocket.emit(`server:${this.servicesName}:init`, { 
                success: true, 
                initData: { 
                    "services":services
                }
            })

        })
        // console.log()

        clientSocket.on(`client:${this.servicesName}:getOffertsByServicesID`, async (servicesID) => {
            clientSocket.emit(`server:${this.servicesName}:setOffertsByServicesID`, {
                "offerts": await getOffertsByServiceID(MongoClient,servicesID)
            });
        })
      
        clientSocket.on(`client:${this.servicesName}:acceptOffert`, async (offert) => {
           
         
        })

        clientSocket.on(`client:${this.servicesName}:dismissOffert`, async (offert) => {

            console.log(offert)

            await MongoClient.collection(DBNames.serviceOffers).updateOne({  _id: ObjectId(offert.offertID)}, { $set: {  status: 0} });

            clientSocket.emit(`server:${this.servicesName}:setOffertsByServicesID`, {
                "offerts": await getOffertsByServiceID(MongoClient,offert.servicesID)
            });

        })


    
        clientSocket.on('disconnect', () => {
            
            console.log('client offerta disconnected');

        });

        async function getFormsByCategorieName(MongoClient, userData) {
            const services = await MongoClient.collection(DBNames.services).aggregate([
                {
                    $match: {
                        client_id: userData.session.user_id.toString(),
                        status: { $in: ["CREATED", "ASSIGNED"] },
                        technical_id: { $ne: null, $ne: "" } // Asegúrate de que technical_id no sea null ni cadena vacía
                    }
                },
                {
                    $sort: {
                        created_at: -1
                    }
                },
                {
                    $lookup: {
                        from: DBNames.UserCopy, // Asume que 'UserCopy' es el nombre de la colección correcta
                        localField: "technical_id", // Campo en la colección de servicios
                        foreignField: "id", // Asume que 'id' es el campo en UserCopy que corresponde a technical_id
                        as: "user_info" // El resultado de la unión se almacena en este campo del documento
                    }
                },
                {
                    $set: {
                        user: { $arrayElemAt: ["$user_info", 0] } // Extrae el primer usuario de la lista (si existe)
                    }
                },
                {
                    $unset: "user_info" // Opcional: elimina el campo user_info para limpiar el documento
                }
            ]).toArray();
        
            console.log(services);
            return services;
        }
        
     
        async function getOffertsByServiceID(MongoClient, serviceID) {
            let offerts = await MongoClient.collection(DBNames.serviceOffers).find({
                services_id: ObjectId(serviceID),
                status:1
            }).sort({
                _id: -1 
            }).toArray();
        
            let finalData = [];
            
            // Get service data to access profession_id
            let service = await MongoClient.collection(DBNames.services).findOne({_id: ObjectId(serviceID)});
            let professionData = null;
            
            if (service && service.profession_id) {
                professionData = await MongoClient.collection(DBNames.professions).findOne({_id: ObjectId(service.profession_id)});
            }
            
            for (let offert of offerts) {

                let detailsOffert = await MongoClient.collection(DBNames.serviceOfferDetails).find({
                    service_offer_id: offert._id,
                }).toArray();

                let user = await MongoClient.collection(DBNames.UserCopy).findOne({id:parseInt(offert.technician_id)})

                let start = await MongoClient.collection(DBNames.technical_stars).findOne({technical_id:offert.technician_id.toString()})
                
                let startsHistory = await MongoClient.collection(DBNames.technical_stars_services_detail).find({technical_id:offert.technician_id.toString()}).toArray()
                let ctnServices = 0;
                
                if( startsHistory != null && startsHistory != []){

                    ctnServices = parseInt( startsHistory.length )
                }
                

                finalData.push({
                    professionData,
                    offert,
                    detailsOffert,
                    start,
                    ctnServices,
                    user,
                });
            }
        
            console.log(finalData);
            return finalData;
        }
        
         


    }

 
    

   

}




 




export default ClientOffersSocket 