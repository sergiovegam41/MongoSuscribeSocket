import {DBNames} from './../db.js';
import {MONGODB_NAME} from './../config.js'
import SessionsController from './SessionsController.js';
import FormulariosModel from '../Models/FormulariosModel.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import ServiceModel from '../Models/ServicesModel.js';
import NotificationsController from './NotificationsController.js';
import {unlink} from 'fs/promises';
import moment from "moment";

class ClientRequestController {


    static async createRequest(MongoClient, req, res) {
        try {
            
            let data = JSON.parse(req.body.data)
            
            let form = JSON.parse(req.body.form)

            let session = await SessionsController.getCurrentSession(MongoClient, req)

            // Si session.location es null, tomar location del req.body
            if (!session.location && req.body.location) {
                console.log("[DEBUG] createRequest - session.location es null, tomando del req.body");
                let locationData = typeof req.body.location === 'string' ? JSON.parse(req.body.location) : req.body.location;
                session.location = locationData;
                console.log("[DEBUG] createRequest - location tomada del req.body:", session.location);
            }

            //validar
            let resultValidate = await this.validateFormRequest({
                body: {
                    data, form
                }
            });

            if (resultValidate.isValid) {

                let images = await this.uploadImages(MongoClient, req);
                for (const key in images) {
                    data[key] = {
                        ...data[key],
                        value: images[key]
                    }
                }

                let main_date_time = this.findItemByType(data, FormulariosModel.main_date_time);
                
                let main_address = this.findItemByType(data, FormulariosModel.main_address);
                
                let payment_method = this.findItemByType(data, FormulariosModel.payment_method);
                
                let priceService = parseInt(form.base_price);
                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        const value = data[key];
                        if (value.type == FormulariosModel.select) {
                            if (value.field.multioptions) {
                                value.value.forEach(option => {
                                    const foundItem = value.field.options.find(item => item.name === option);
                                    try {
                                        if (foundItem.price) {
                                            let price = parseInt(foundItem.price)
                                            priceService += price
                                        }
                                    } catch (error) {
                                    }

                                });

                            } else {
                                const foundItem = value.field.options.find(item => item.name === value.value);
                                if (foundItem.price) {
                                    try {
                                        let price = parseInt(foundItem.price)
                                        priceService += price
                                    } catch (error) {
                                    }
                                }

                            }
                        }

                    }
                }

                var fecha = moment(main_date_time.value.date);
                let servicio = {
                    "scheduled_date": fecha.format("YYYY-MM-DD").toString(),
                    "scheduled_time": main_date_time.value.time,
                    "payment_method": payment_method.value,
                    "client_id": `${session.user_id}`,
                    "profession_id": `${form.professions_id}`,
                    "amount": `${priceService}`,
                    "arl": data?.arl?.value??"No" === 'Si', 
                    "revenue": `${form.revenue}`,
                    "district": `${main_address.value.district}`,
                    "is_public": true,
                    "direccion": `${main_address.value.address}`,
                    "referencia": `${main_address.value.ref}`,
                    "department_id": `${session.location.departament_id}`,
                    "municipality_id": `${session.location.municipality_id}`,
                    "country_id": `${session.location.countri_id}`,
                    "service_title": `${form.name}`,
                    "public_description": `Cliente interesado en servicio de ${form.name}`,
                    "status": `${ServiceModel.CREATED}`,
                    "updated_at": new Date().toISOString(),
                    "created_at": new Date().toISOString(),
                    "technical_id": null,
                    "form_template": form,
                    "filled_form": data,
                    "version": `${form.version}`,
                };

                // guardar
                let service = await MongoClient.collection(DBNames.services).insertOne(servicio)
                
                res.send({
                    success: true,
                    message: "OK",
                    data: service
                })

                const formatoCOP = new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP'
                });
                const cantidadFormateada = formatoCOP.format(priceService);

                await NotificationsController.sendNotifyManyByFilterV2(MongoClient, req, [session.location.municipality_id], [form.professions_id], `Nuevo servicio ${parseInt(priceService) > 0 ? "~ " + cantidadFormateada : ""}`, `Hola $[user_name];, tenemos un Nuevo servicio disponible para ti ${main_address.value.district != "" ? "en " + main_address.value.district : ""}`, "TECNICO", "new_services")


            } else {
                return res.send({
                    success: false,
                    message: "Error de solicitud",
                    data: resultValidate
                })

            }


        } catch (error) {
            return res.send({
                success: false,
                message: "Error del servidor",
                data: error
            })
        }

    }

    static async uploadImages(MongoClient, req) {
        const host = (await MongoClient.collection(DBNames.Config).findOne({name: "webhook"})).value;
        let responsesMap = {}; // Objeto para almacenar las respuestas con clave image.fieldname

        for (const image of req.files) {
            let data = new FormData();
            data.append('image', fs.createReadStream(image.path));
            data.append('folder', 'servicios');

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: host.replaceAll("whatsapp_webhook", "uploadImage"),
                headers: {
                    'Accept': 'application/json',
                    ...data.getHeaders()
                },
                data: data
            };

            try {
                const response = await axios.request(config);
                responsesMap[image.fieldname] = response.data.resp;
                await unlink(image.path);

            } catch (error) {
                responsesMap[image.fieldname] = 'Error';
            }
        }

        return responsesMap; // Devuelve el mapa de respuestas
    }


    static findItemByType(data, targetType) {
        for (const key in data) {

            if (data[key].field.type == targetType) {
                return data[key];
            }
        }
        return null;
    }

    static async validateFormRequest(data) {

        const requiredFieldTypes = [FormulariosModel.main_address, FormulariosModel.payment_method, FormulariosModel.main_date_time];
        let fieldTypes = new Set();

        for (const key in data.body.data) {
            if (data.body.data[key].field.type) {
                if (data.body.data[key].value != null && data.body.data[key].value != "") {

                    fieldTypes.add(data.body.data[key].field.type);

                }
            }
        }

        const missingFields = requiredFieldTypes.filter(type => !fieldTypes.has(type));

        if (missingFields.length > 0) {
            return {
                isValid: false,
                missingFields: missingFields
            };
        }

        return {isValid: true};
    }


}


export default ClientRequestController