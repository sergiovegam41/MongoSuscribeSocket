import TechnicianProfileService from './../../Services/TechnicianProfileService.js';
import { DBNames } from "../../db.js";
import { ObjectId } from 'mongodb';

class SharedServicesSocket {

    static servicesName = "sharedServices"

    static async run(io, clientSocket, MongoClient, userData) {
        try {

            clientSocket.on(`client:${this.servicesName}:getProfile`, async (data) => {
                let fullProfile = TechnicianProfileService.getTechnicianCompleteProfile(data.technicianId, MongoClient);

                fullProfile.then(
                    (profile) => {
                        clientSocket.emit(`server:${this.servicesName}:getProfile`, {
                            success: true,
                            profile: profile
                        });
                    },
                    (error) => {
                        clientSocket.emit(`server:${this.servicesName}:getProfile`, {
                            success: false,
                            error: error.message
                        });
                    }
                );
            });

            clientSocket.on(`client:${this.servicesName}:getActiveServicesOffersCount`, async (data) => {
                try {
                    const offersCount = await getActiveServicesOffersCount(MongoClient, userData);
                    
                    clientSocket.emit(`server:${this.servicesName}:activeServicesOffersCount`, {
                        success: true,
                        count: offersCount
                    });
                } catch (error) {
                    clientSocket.emit(`server:${this.servicesName}:activeServicesOffersCount`, {
                        success: false,
                        error: error.message
                    });
                }
            });

        } catch (error) {
            console.log("[ERROR EN SharedServicesSocket.run]")
            console.log(userData)
            console.log(error)
        }

        async function getActiveServicesOffersCount(MongoClient, userData) {
            const pipeline = [
                {
                    $match: {
                        client_id: userData.session.user_id.toString(),
                        status: "CREATED"
                    }
                },
                {
                    $lookup: {
                        from: DBNames.serviceOffers,
                        localField: "_id",
                        foreignField: "services_id",
                        as: "offers"
                    }
                },
                {
                    $unwind: "$offers"
                },
                {
                    $lookup: {
                        from: DBNames.serviceOfferDetails,
                        localField: "offers._id",
                        foreignField: "service_offer_id",
                        as: "offerDetails"
                    }
                },
                {
                    $unwind: "$offerDetails"
                },
                {
                    $group: {
                        _id: null,
                        totalOffers: { $sum: 1 }
                    }
                }
            ];

            const result = await MongoClient.collection(DBNames.services).aggregate(pipeline).toArray();
            return result.length > 0 ? result[0].totalOffers : 0;
        }
    }

}

export default SharedServicesSocket