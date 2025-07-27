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
            console.log("[DEBUG] createRequest - Iniciando función");
            console.log("[DEBUG] createRequest - req.body:", req.body);

            let data = JSON.parse(req.body.data)
            console.log("[DEBUG] createRequest - data parseada:", data);
            
            let form = JSON.parse(req.body.form)
            console.log("[DEBUG] createRequest - form parseada:", form);

            console.log("[DEBUG] createRequest - Obteniendo sesión actual");
            let session = await SessionsController.getCurrentSession(MongoClient, req)
            console.log("[DEBUG] createRequest - session obtenida:", session);

            //validar
            console.log("[DEBUG] createRequest - Validando formulario");
            let resultValidate = await this.validateFormRequest({
                body: {
                    data, form
                }
            });
            console.log("[DEBUG] createRequest - resultado validación:", resultValidate);

            if (resultValidate.isValid) {
                console.log("[DEBUG] createRequest - Validación exitosa, procesando imágenes");

                console.log("[DEBUG] createRequest - Subiendo imágenes, req.files:", req.files);
                let images = await this.uploadImages(MongoClient, req);
                console.log("[DEBUG] createRequest - Imágenes subidas:", images);
                console.log("[DEBUG] createRequest - Integrando imágenes en data");
                for (const key in images) {
                    data[key] = {
                        ...data[key],
                        value: images[key]
                    }
                }
                console.log("[DEBUG] createRequest - Data después de integrar imágenes:", data);

                console.log("[DEBUG] createRequest - Buscando campos principales");
                let main_date_time = this.findItemByType(data, FormulariosModel.main_date_time);
                console.log("[DEBUG] createRequest - main_date_time encontrado:", main_date_time);
                
                let main_address = this.findItemByType(data, FormulariosModel.main_address);
                console.log("[DEBUG] createRequest - main_address encontrado:", main_address);
                
                let payment_method = this.findItemByType(data, FormulariosModel.payment_method);
                console.log("[DEBUG] createRequest - payment_method encontrado:", payment_method);
                
                let priceService = parseInt(form.base_price);
                console.log("[DEBUG] createRequest - precio base inicial:", priceService);

                console.log("[DEBUG] createRequest - Calculando precio adicional por opciones");
                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        const value = data[key];
                        console.log(`[DEBUG] createRequest - Procesando campo: ${key}`, value);
                        if (value.type == FormulariosModel.select) {
                            console.log("[DEBUG] createRequest - Campo tipo select encontrado");
                            console.log("[DEBUG] createRequest - Valor del select:", value.value);
                            if (value.field.multioptions) {
                                console.log("[DEBUG] createRequest - Procesando multioptions");
                                value.value.forEach(option => {
                                    console.log("[DEBUG] createRequest - Procesando opción:", option);
                                    const foundItem = value.field.options.find(item => item.name === option);
                                    console.log("[DEBUG] createRequest - Item encontrado:", foundItem);
                                    try {
                                        if (foundItem.price) {
                                            let price = parseInt(foundItem.price)
                                            console.log("[DEBUG] createRequest - Precio adicional encontrado:", price);
                                            priceService += price
                                            console.log("[DEBUG] createRequest - Precio total actualizado:", priceService);
                                        }
                                    } catch (error) {
                                        console.log("[DEBUG] createRequest - Error procesando precio multiopción:", error);
                                    }

                                });

                            } else {
                                console.log("[DEBUG] createRequest - Procesando opción única");
                                const foundItem = value.field.options.find(item => item.name === value.value);
                                console.log("[DEBUG] createRequest - Item encontrado para opción única:", foundItem);
                                if (foundItem.price) {
                                    try {
                                        let price = parseInt(foundItem.price)
                                        console.log("[DEBUG] createRequest - Precio adicional encontrado:", price);
                                        priceService += price
                                        console.log("[DEBUG] createRequest - Precio total actualizado:", priceService);
                                    } catch (error) {
                                        console.log("[DEBUG] createRequest - Error procesando precio opción única:", error);
                                    }
                                }

                            }
                        }

                    }
                }

                console.log("[DEBUG] createRequest - Precio final calculado:");
                console.log("[DEBUG] createRequest - Precio base:", form.base_price);
                console.log("[DEBUG] createRequest - Precio total:", priceService);

                console.log("[DEBUG] createRequest - Procesando fecha");
                console.log("[DEBUG] createRequest - Fecha raw:", main_date_time.value.date);
                var fecha = moment(main_date_time.value.date);
                console.log("[DEBUG] createRequest - Fecha procesada:", fecha.format("YYYY-MM-DD"));


                console.log("[DEBUG] createRequest - Creando objeto servicio");
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
                console.log("[DEBUG] createRequest - Objeto servicio creado:", servicio);

                // guardar
                console.log("[DEBUG] createRequest - Insertando servicio en MongoDB");
                let service = await MongoClient.collection(DBNames.services).insertOne(servicio)
                console.log("[DEBUG] createRequest - Servicio insertado exitosamente:", service);
                
                res.send({
                    success: true,
                    message: "OK",
                    data: service
                })

                console.log("[DEBUG] createRequest - Preparando notificaciones");
                const formatoCOP = new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP'
                });
                const cantidadFormateada = formatoCOP.format(priceService);
                console.log("[DEBUG] createRequest - Cantidad formateada:", cantidadFormateada);

                console.log("[DEBUG] createRequest - Enviando notificaciones a técnicos");
                await NotificationsController.sendNotifyManyByFilterV2(MongoClient, req, [session.location.municipality_id], [form.professions_id], `Nuevo servicio ${parseInt(priceService) > 0 ? "~ " + cantidadFormateada : ""}`, `Hola $[user_name];, tenemos un Nuevo servicio disponible para ti ${main_address.value.district != "" ? "en " + main_address.value.district : ""}`, "TECNICO", "new_services")
                console.log("[DEBUG] createRequest - Notificaciones enviadas exitosamente");


            } else {
                console.log("[DEBUG] createRequest - Validación falló");
                return res.send({
                    success: false,
                    message: "Error de solicitud",
                    data: resultValidate
                })

            }


        } catch (error) {
            console.log("[DEBUG] createRequest - Error capturado:", error);
            console.log("[DEBUG] createRequest - Stack trace:", error.stack);
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
                console.log(error);
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

        // console.log(data.body)
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