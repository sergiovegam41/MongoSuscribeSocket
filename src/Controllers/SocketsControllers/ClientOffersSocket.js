
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

        async function getFormsByCategorieName(MongoClient,userData ){
            let services = await MongoClient.collection(DBNames.services).find({
                client_id: userData.session.user_id.toString(),
                status: { $in: ["CREATED", "ASSIGNED"] }
            }).sort({
                created_at: -1 
            }).toArray();
            return services
        }
     
        async function getOffertsByServiceID(MongoClient, serviceID) {
            let offerts = await MongoClient.collection(DBNames.serviceOffers).find({
                services_id: ObjectId(serviceID),
                status:1
            }).sort({
                _id: -1 
            }).toArray();
        
            let finalData = [];
            
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
                    offert,
                    detailsOffert,
                    start,
                    ctnServices,
                    user
                });
            }
        
            console.log(finalData);
            return finalData;
        }
        
         


    }

 
    

   

}




 




export default ClientOffersSocket 