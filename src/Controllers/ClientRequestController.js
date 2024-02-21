import { DBNames } from './../db.js';
import { MONGODB_NAME } from './../config.js'
import SessionsController from './SessionsController.js';
import FormulariosModel from '../Models/FormulariosModel.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import ServiceModel from '../Models/ServicesModel.js';
import NotificationsController from './NotificationsController.js';
import { unlink } from 'fs/promises';

class ClientRequestController {


  static async createRequest(MongoClient, req, res) {
    try {

      let data = JSON.parse(req.body.data)
      let form = JSON.parse(req.body.form)

      let session = await SessionsController.getCurrentSession(MongoClient, req)

      //validar
      let resultValidate = await this.validateFormRequest({
        body: {
          data, form
        }
      });


      if(resultValidate.isValid){

        


        let images = await this.uploadImages(MongoClient, req);
        for (const key in images) {
          data[key] = {
            ...data[key],
            value: images[key]
          }
        }
        
        // console.log(data)
        
        // console.log("findItemByType")
        let main_date_time = this.findItemByType(data, FormulariosModel.main_date_time);
        let main_address = this.findItemByType(data, FormulariosModel.main_address);
        let payment_method = this.findItemByType(data, FormulariosModel.payment_method);
        let priceService = parseInt(form.base_price);

      //  console.log(data)

       for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const value = data[key];
          console.log(`Key: ${key}`);
          if(value.type == FormulariosModel.select){
            console.log("Select")
            console.log(value.value)
            if(value.field.multioptions){
              console.log("multioptions")
              value.value.forEach(option => {
                const foundItem = value.field.options.find(item => item.name === option);
                try {
                  if(foundItem.price){
                    let price = parseInt(foundItem.price)
                    priceService += price
                  }
                } catch (error) {
                  
                }

              });
           
            }else{
              const foundItem = value.field.options.find(item => item.name === value.value);
              if(foundItem.price){
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
      

      console.log(form.base_price)
      console.log(priceService)
        let servicio = {
          "scheduled_date": main_date_time.value.date,
          "scheduled_time": main_date_time.value.time,
          "payment_method": payment_method.value,
          "client_id": `${session.user_id}`,
          "profession_id":`${form.professions_id}`,
          "amount": `${priceService}`,
          "revenue": `${form.revenue}`,
          "district": `${main_address.value.district}`,
          "is_public": true,
          "direccion": `${main_address.value.address}`,
          "referencia":  `${main_address.value.ref}`,
          "department_id":`${session.location.departament_id}`,
          "municipality_id": `${session.location.municipality_id}`,
          "country_id": `${session.location.countri_id}`,
          "service_title": `${form.name}`,
          "public_description": `Cliente interesado en servicio de ${form.name}`,
          "status": `${ServiceModel.CREATED}`,
          "updated_at":  new Date().toISOString(),
          "created_at":new Date().toISOString() ,
          "technical_id": null,
          "form_template":form,
          "filled_form":data,
          "version":`${form.version}`,
        };

        // guardar
        let service = await MongoClient.collection(DBNames.services).insertOne(servicio)
        res.send({
          success:true,
          message: "OK",
          data: service
        })

        const formatoCOP = new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP'
        });
        const cantidadFormateada = formatoCOP.format(priceService);


        await NotificationsController.sendNotifyManyByFilterV2(MongoClient,[session.location.municipality_id],[form.professions_id],`Nuevo servicio ~ ${cantidadFormateada}`, `Hola $[user_name];, tenemos un Nuevo servicio disponible para ti en ${main_address.value.district}`, "TECNICO","new_services")



      }else{

        return res.send({
          success:false,
          message: "Error de solicitud",
          data: resultValidate
        })

      }
 


  
    } catch (error) {
      console.log(error)
      return res.send({
        success:false,
        message: "Error del servidor",
        data: error
      })
    }

  }

  static async uploadImages(MongoClient, req) {
    const host = (await MongoClient.collection(DBNames.Config).findOne({ name: "webhook" })).value;
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
    const requiredFieldTypes = [ FormulariosModel.main_address, FormulariosModel.payment_method, FormulariosModel.main_date_time ];
    let fieldTypes = new Set();
  
    for (const key in data.body.data) {
      if (data.body.data[key].field.type) {
        if(data.body.data[key].value != null && data.body.data[key].value != ""){

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
  
    return { isValid: true };
  }





}



export default ClientRequestController 