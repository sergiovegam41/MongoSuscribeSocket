import {DBNames} from "../../db.js";
import {ObjectID} from 'mongodb';
import {ServerApiVersion, ObjectId} from 'mongodb';
import NotifiMyController from "../NotifiMyController.js";
import StartsController from "../StartsController.js";


class ClienteServicesSocket {

    static servicesName = "clienteServices"

    static async run(io, clientSocket, MongoClient, userData) {
        // console.log(userData);
        try {

            NotifiMyController.searchOrCreateNotifyMeByUserID(MongoClient, {
                userID: userData.session.user_id,
                firebase_token: userData.session.firebase_token
            })


            console.log("RUN HOME CLIENTE")
            // console.log(this.servicesName);
            clientSocket.on(`client:${this.servicesName}:init`, async (data) => {

                console.log("el init de cliente home")

                clientSocket.on(`client:${this.servicesName}:rateService`, async (req) => {
                    console.log("RATE SERVICE")
                     await StartsController.rate(MongoClient, req, clientSocket)

                })

                clientSocket.emit(`server:${this.servicesName}:init`, {
                    success: true,
                    code: "",
                    msj: "",
                    initData: {
                        categories: (await MongoClient.collection(DBNames.categories).find({active: "1"}).toArray()).sort((a, b) => {
                            return parseInt(a.sortin) - parseInt(b.sortin);
                        }),
                        frecuentes: await getFormsByCategorieName("AIRE ACONDICIONADO"),
                        unrated_service: await getUnratedService(userData),
                    }
                })

            })

            clientSocket.on(`client:${this.servicesName}:search`, async (searchTerm) => {
                try {

                    if (searchTerm == "") {
                        clientSocket.emit(`server:${this.servicesName}:searchResults`, null);
                        return;
                    }

                    let fuzzyRegex = createFuzzyRegex(searchTerm);
                    let searchQuery = {name: {$regex: fuzzyRegex}};

                    let results = await MongoClient.collection(DBNames.forms_professions).find(searchQuery).toArray();
                    console.log(results)
                    clientSocket.emit(`server:${this.servicesName}:searchResults`, results);
                } catch (error) {
                    console.error('Error during search:', error);
                }
            });

            clientSocket.on(`client:${this.servicesName}:getFormsByCategorieName`, async (categorieName) => {
                clientSocket.emit(`server:${this.servicesName}:setFormsByCategorieName`, await getFormsByCategorieName(categorieName));
            })



            clientSocket.on('disconnect', () => {

                console.log('Client home disconnected');

            });

            async function getFormsByCategorieName(name) {
                const {_id: frecuentesId} = await MongoClient.collection(DBNames.categories).findOne({name: name});
                const detailCategories = await MongoClient.collection(DBNames.detail_categories).find({categories_id: frecuentesId.toString()}).toArray();
                const frecuentes = (await Promise.all(detailCategories.map(async ({professions_id}) =>
                    MongoClient.collection(DBNames.forms_professions).find({professions_id: professions_id.toString()}).toArray()
                ))).flat();
                return frecuentes
            }

            async function getUnratedService(client) {

                const pipeline = [
                    {
                        $match: {
                            client_id: client.session.user_id.toString(),
                            status: "FINISHED"
                        }
                    },
                    {
                        $addFields: {
                            service_id_string: {$toString: "$_id"}
                        }
                    },
                    {
                        $lookup: {
                            from: "technical_stars_services_detail",
                            localField: "service_id_string",
                            foreignField: "service_id",
                            as: "detalles"
                        }
                    },
                    {
                        $match: {
                            detalles: {$eq: []}
                        }
                    },
                    {
                        $sort: {_id: -1}
                    },
                    {
                        $addFields: {
                            technical_id_int: {
                                $toInt: "$technical_id"
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "UserCopy",
                            localField: "technical_id_int",
                            foreignField: "id",
                            as: "result_user"
                        }
                    },
                    {
                        $limit: 1
                    },
                    {
                        $project: {
                            _id: 0,
                            last_service_id_no_rating: {
                                $toString: "$_id"
                            },
                            name: {
                                $arrayElemAt: ["$result_user.name", 0]
                            },
                            last_name: {
                                $arrayElemAt: [
                                    "$result_user.last_name",
                                    0
                                ]
                            },
                            photo_profile: {
                                $arrayElemAt: ["$result_user.photo_profile", 0]
                            },
                            service_title: 1,
                            scheduled_date: 1
                        }
                    }
                ];

                const result = await MongoClient.collection(DBNames.services).aggregate(pipeline).toArray();
                if (result.length > 0) {
                    console.log(client);
                    return {
                        last_service_id_no_rating: result[0].last_service_id_no_rating,
                        name: result[0].name,
                        last_name: result[0].last_name,
                        photo_profile: result[0].photo_profile,
                        scheduled_date: result[0].scheduled_date,
                        service_title: result[0].service_title

                    };
                }
                return null;
            }
        } catch (error) {
            console.log("[ERROR EN ClienteServicesSocket.clienteServices]")
            console.log(userData)
            console.log(error)
        }
    }

}

function createFuzzyRegex(term) {
    // Escapar caracteres especiales de regex que pueden estar en el término de búsqueda
    let escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    // Reemplaza las letras con errores ortográficos comunes y acentos por grupos de regex.
    let fuzzyTerm = escapedTerm
        .replace(/a/gi, '[aá]')
        .replace(/e/gi, '[eé]')
        .replace(/i/gi, '[ií]')
        .replace(/o/gi, '[oó]')
        .replace(/u/gi, '[uú]')
        .replace(/c/gi, '(c|s|z)')
        .replace(/s/gi, '(c|s|z)')
        .replace(/z/gi, '(c|s|z)')
        .replace(/b/gi, '(b|v)')
        .replace(/v/gi, '(b|v)')
        .replace(/h/gi, '(h?)')
        // Asegúrate de que las 'h' eliminadas no formen parte de 'ch'
        .replace(/(c|s|z)\(h\?\)/gi, '(ch|c|s|z)');

    // Retorna una nueva RegExp basada en el término modificado.
    return new RegExp(fuzzyTerm, 'i');
}

export default ClienteServicesSocket 