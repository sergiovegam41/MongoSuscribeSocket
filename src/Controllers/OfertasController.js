import { DBNames } from './../db.js';
import {  ObjectId } from 'mongodb';
import SessionsController from './SessionsController.js';
import Utils from '../Utils/Utils.js';
import moment from "moment";
import ServiceModel from '../Models/ServicesModel.js';
import NotificationsController from './NotificationsController.js';

class OfertasController {

  
    static async startNewOffer(MongoClient, req, res) {

      try {
        
        let session = await SessionsController.getCurrentSession(MongoClient, req)

        //calcular precios
        console.log(req.body.services_id)
        if(!req.body.services_id || !req.body.amount  ){
          return res.send({
            success:false,
            message: "MISSING 'services_id' | 'amount' ",
            data: null
            
          })
        }

        let services_id = req.body.services_id
        let amount = req.body.amount
        let user_id = session.user_id.toString()
        
        if(!Utils.isNumeric(amount)){
          return res.send({
            success:false,
            message: "Amount must be numerical",
            data: null
            
          })
        }
        
        let service = await MongoClient.collection(DBNames.services).findOne({ _id:ObjectId(services_id) })
        
            

        if(service){
          

          if(service.status != "CREATED"){

            return res.send({
              success:false,
              message: "Este servicio ya no esta disponible",
              data: null
              
            })


          }

          console.log(session)
          
          if(service.municipality_id != session.location.municipality_id){

            return res.send({
              success:false,
              message: "Este servicio no esta disponible en tu zona",
              data: null
              
            })


          }
          // Uso de la función
          let targetDate = new Date(service.scheduled_date);
          let targetTime = service.scheduled_time;
          let roadmap = await this.getRoadmapByTechnicalID(MongoClient,user_id);
          let isAvailable = this.isTimeSlotAvailable(roadmap, targetDate, targetTime);
          console.log(isAvailable);

          if(isAvailable){


            let serviceOffers = await MongoClient.collection(DBNames.serviceOffers).find({technician_id: user_id,services_id: ObjectId(services_id)}).toArray();
            console.log(serviceOffers)

            if(serviceOffers.length >= 3){

              return res.send({
                success:false,
                message: "Ya has realizado demaciadas ofertas para este servicio",
                data: null
                
              })
            }

            let serviceOffer = await MongoClient.collection(DBNames.serviceOffers).insertOne(
              {
                services_id: ObjectId(services_id),
                client_id: service.client_id,
                technician_id: user_id,
                date: moment().format(),
                status: 1
              }
            );

            if(serviceOffer){

              let serviceOfferDetail = await MongoClient.collection(DBNames.serviceOfferDetails).insertOne(
                {
                  service_offer_id: ObjectId(serviceOffer.insertedId),
                  amount: amount,
                  bidder_id: user_id,
                  status: 1
                }
              );
              
              
              res.send({
                
                success:true,
                message: "OK",
                data: await this.getRoadmapByTechnicalID(MongoClient, user_id)
                
              })

           
              console.log("NOTIFICANDO...");
              console.log(service.client_id);

              let user = await MongoClient.collection(DBNames.UserCopy).findOne({ id: parseInt( service.client_id ) });
              console.log(user);

              try {
                let precioFormateado = this.formatearPrecioCOP(amount.toString());

                
            
                await NotificationsController.notificarByUserApi(MongoClient, {

                  params:{
                    id: service.client_id,
                  },
                  body: {
                    title: `Nueva Oferta`,
                    body: `${session.user.name} quiere realizar tu servicio de ${service.service_title} por ${precioFormateado} COP`, 
                    tipo: "newOffert",
                    data: {
                      serviceID: services_id
                    } 
                  }
                  

                }, null);

              } catch (error) {
                console.log(error)
              }


              return;
            }
          

          }

          return res.send({
            success:false,
            message: "No tienes tienes espacio en tu agenda para tomar este servicio",
            data: null
            
          })

      }

         
        
        return res.send({
          success:false,
          message: "Service not found",
          data: null
          
        })
    
      } catch (error) {

        console.log(error)
        return res.send({
          success:false,
          message: "Error interno",
          data: null
          
        })
      }
    }


static formatearPrecioCOP(precioString) {
  // Convertir el string a un número

  console.log(precioString)
  const precioNumero = Number(precioString.replace(/[^0-9.-]+/g, ""));
  
  // Verificar si el número es válido
  if (isNaN(precioNumero)) {
    return 'El valor ingresado no es un número válido';
  }
  
  // Formatear el número como precio en COP
  const formateador = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0, // Puedes ajustar el número de decimales según necesites
  });
  
  return formateador.format(precioNumero);
}



    static async getRoadmap(MongoClient, req, res) {

      try {
        let session = await SessionsController.getCurrentSession(MongoClient, req)

        let roadmap = await this.getRoadmapByTechnicalID(MongoClient,session.user_id.toString() );

        let resultMap = {};
        roadmap.forEach((value, key) => {
          resultMap[key] = value;
        });

        console.log("getRoadmap")
        console.log(resultMap)
        let resp = {
          success:true,
          message: "Ok",
          data: resultMap
          
        };
        console.log(resp)
        return res.send(resp)
      } catch (error) {

        console.log(error)
        return res.send({
          success:false,
          message: "Error interno",
          data: null
          
        })
      }

    }
   
    static async getRoadmapByTechnicalID(MongoClient, technicalID ) {

      technicalID = technicalID.toString()

      let service = await MongoClient.collection(DBNames.services).find({technical_id:  technicalID, status: ServiceModel.ASSIGNED}).toArray()

       console.log(service)

      return this.organizeDataByDate(service);

      
    }

    static isTimeSlotAvailable(organizedData, targetDate, targetTime) {
      // Obtener la clave de la fecha en el formato adecuado
      const targetDateKey = targetDate.toISOString().split('T')[0];
    
     
      // Verificar si la fecha está en la agenda
      if (organizedData.has(targetDateKey)) {

        const dateArray = organizedData.get(targetDateKey);

    
        // Convertir la hora objetivo a minutos para facilitar la comparación
        const targetMinutes = targetTime.split(':').reduce((total, part) => total * 60 + parseInt(part), 0);
    
        // Verificar si hay al menos 2 horas de espacio entre servicios
        for (const service of dateArray) {

          
          const serviceTime = service.scheduled_time.split(':').reduce((total, part) => total * 60 + parseInt(part), 0);

          if (Math.abs(serviceTime - targetMinutes) < 60) {
            // Menos de 2 horas de espacio, no está disponible
            return false;
          }
        }
    
        // Hay al menos 2 horas de espacio, está disponible
        return true;
      } else {
        // La fecha no está en la agenda, está disponible
        return true;
      }
    }
    

    static organizeDataByDate(dataArray) {
      const resultMap = new Map();
    
      dataArray.forEach((item) => {
        const parsedDate = new Date(item.scheduled_date);
        const dateKey = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
    
        if (!resultMap.has(dateKey)) {
          resultMap.set(dateKey, []);
        }
    
        const dateArray = resultMap.get(dateKey);
    
        // Insertar el objeto en el array
        dateArray.push(item);
      });
    
      // Ordenar cada array de fecha por la propiedad 'scheduled_time'
      resultMap.forEach((dateArray) => {
        dateArray.sort((a, b) => {
          const timeA = a.scheduled_time.split(':').map(Number);
          const timeB = b.scheduled_time.split(':').map(Number);
    
          if (timeA[0] !== timeB[0]) {
            return timeA[0] - timeB[0];
          } else {
            return timeA[1] - timeB[1];
          }
        });
      });
    
      return resultMap;
    }
    

}



export default OfertasController 