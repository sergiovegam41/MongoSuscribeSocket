
import { DBNames } from "../../db.js";
import { ServerApiVersion, ObjectId } from 'mongodb';
import WorkplaceController from "../WorkplaceController.js";
import NotifiMyController from "../NotifiMyController.js";


class ClientOffersSocket {

    static servicesName = "ClientOffersSocket"

    static async run(io,clientSocket, MongoClient, userData){



        console.log(this.servicesName);
        clientSocket.emit(`server:${this.servicesName}:init`, { success: true, code:"",msj:"", initData: {}})

        // console.log()

        
        let services = await getFormsByCategorieName(MongoClient, userData);

        clientSocket.emit(`server:${this.servicesName}:init`, { 
            success: true, 
            initData: { 
                "services":services
            }
        })

        clientSocket.on(`client:${this.servicesName}:getOffertsByServicesID`, async (servicesID) => {
            clientSocket.emit(`server:${this.servicesName}:setOffertsByServicesID`, {
                "offerts": await getOffertsByServiceID(MongoClient,servicesID)
            });
        })


    
        clientSocket.on('disconnect', () => {
            
            console.log('Client disconnected');

        });

        async function getFormsByCategorieName(MongoClient,userData ){
            let services = await MongoClient.collection(DBNames.services).find({
                client_id: userData.session.user_id.toString(),
                status: { $in: ["CREATED", "ASSIGNED"] }
            }).toArray();
            return services
        }
     
        async function getOffertsByServiceID(MongoClient, serviceID) {
            let offerts = await MongoClient.collection(DBNames.serviceOffers).find({
                services_id: ObjectId(serviceID)
            }).toArray();
        
            let finalData = [];
            
            for (let offert of offerts) {
                let detailsOffert = await MongoClient.collection(DBNames.serviceOfferDetails).find({
                    service_offer_id: offert._id
                }).toArray();
        
                finalData.push({
                    offert,
                    detailsOffert
                });
            }
        
            console.log(finalData);
            return finalData;
        }
        
         


    }

 
    

   

}




 




export default ClientOffersSocket 