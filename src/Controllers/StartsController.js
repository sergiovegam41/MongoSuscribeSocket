import {DBNames} from './../db.js';
import {ObjectId} from 'mongodb';
import ClienteServicesSocket from "./SocketsControllers/ClienteServicesSocket.js";

class StartsController {

    static async rate(MongoClient, req, clientSocket) {
        let service_id = req.serviceId || null
        let value = req.rating || null
        let description = req.description || null
        console.log(`RATE SERVICE: ${service_id} - ${value} - ${description}`)
        try {
            if (value == null) {
                clientSocket.emit(`server:${ClienteServicesSocket.servicesName}:rateService`, {
                    success: false,
                    message: "INVALID_RATING_VALUE",
                });
                return null;
            }
            const service = await MongoClient.collection(DBNames.services).findOne({_id: ObjectId(service_id)});

            if (service && value) {
                console.log(`RATE SERVICE: ${service_id} - ${service.technical_id} - ${service.client_id} - ${value} - ${description}`)
                await this.rateServices(service_id, service.technical_id, service.client_id, parseInt(value),description, MongoClient);
                await this.calculateTotalStarts(service.technical_id, MongoClient)

                clientSocket.emit(`server:${ClienteServicesSocket.servicesName}:rateService`, {
                    success: true,
                    message: "OK",
                });
            }else{
                clientSocket.emit(`server:${ClienteServicesSocket.servicesName}:rateService`, {
                    success: false,
                    message: "BAD_REQUEST",
                });
                return null;
            }

        } catch (error) {
            clientSocket.emit(`server:${ClienteServicesSocket.servicesName}:rateService`, {
                success: false,
                message: "ERROR INTERNO",
            });

        }

    }


    static async rateServices(service_id, technical_id, client_id, value, description, MongoClient) {
        console.log(`RATE SERVICE: INSERT`)
         const ratingData = {
            service_id,
            technical_id,
            client_id,
            value,
            description
        };

        await MongoClient.collection(DBNames.technical_stars_services_detail).updateOne(
            { service_id },
            { $set: ratingData },
            { upsert: true }
        );

        return null;
    }

    static async calculateTotalStarts(technical_id, MongoClient) {
        let starts = await MongoClient.collection(DBNames.technical_stars_services_detail).find({technical_id}).toArray()

        let total = 0
        starts.forEach(element => {
            total += parseInt(element.value)
        });

        total = total / starts.length
        await this.saveStartsByUserID(technical_id, total, MongoClient)

    }


    static async saveStartsByUserID(technical_id, value, MongoClient) {

        const item = await MongoClient.collection(DBNames.technical_stars).findOne({technical_id});
        if (!item) {
            const newUser = {
                technical_id,
                value
            };
            await MongoClient.collection(DBNames.technical_stars).insertOne(newUser);
            return await MongoClient.collection(DBNames.technical_stars).findOne({technical_id});
        }

        await MongoClient.collection(DBNames.technical_stars).updateOne({technical_id}, {
            $set: {
                technical_id,
                value
            }
        });

        return await MongoClient.collection(DBNames.technical_stars).findOne({technical_id});

    }


    static async hasAuthority(token, MongoClient) {
        let TokenWebhook = await MongoClient.collection(DBNames.Config).findOne({name: "TokenWebhook"})
        return !(TokenWebhook.value != token && TokenWebhook.value != null)
    }


}


export default StartsController