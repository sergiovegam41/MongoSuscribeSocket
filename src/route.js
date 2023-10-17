import LocationController from './Controllers/LocationController.js';
import ProfessionsController from './Controllers/ProfessionsController.js';
import StartsController from './Controllers/StartsController.js';
import CronJobs from './Jobs/CronJobs.js';
import moment from "moment";
import cron from 'node-cron';
import SessionsController from './Controllers/SessionsController.js';
import NotificationsController from './Controllers/NotificationsController.js';


export default (app, MongoClient) => {

  app.post('/rate-service', async (req, res) => StartsController.rate(MongoClient,req,res))
  app.get('/getCountries', async (req, res) => LocationController.getCountries(MongoClient,req,res))
  app.get('/professions',  async (req, res) => ProfessionsController.getProfessions(MongoClient,req,res))
  app.post('/createSheduledNotification',validationMiddleware,  async (req, res) => ProfessionsController.createSheduledNotification(MongoClient,req,res))
  app.post('/updateSheduledNotification/:id',validationMiddleware,  async (req, res) => ProfessionsController.updateSheduledNotification(MongoClient,req,res))
  app.post('/sendNotifyMany',  async (req, res) => NotificationsController.sendNotifyMany(MongoClient,req,res))
  app.get('/getDepartamentsByCountriID/:id',  async (req, res) => LocationController.getDepartamentsByCountrieID(MongoClient,req,res))
  app.get('/getMunicipalysByDepartamentID/:id',  async (req, res) => LocationController.getCitiesByEtateID(MongoClient,req,res))
  
  app.get('/ping', async function (req, res) {
    return res.send(true)
  })


  async function validationMiddleware(req, res, next) {

    console.log("validationMiddleware");
    try {
      let session = await SessionsController.getCurrentSession(MongoClient, req)
      if (session) {
        return next()
      }
    } catch (error) {
      return res.status(404).send('BAD_REQUEST');
    }
    return res.status(404).send('BAD_REQUEST');
  }
  let formattedTime = parseInt(moment.utc().startOf('day').local().format('H'))
  let UTCRangeTimeInvert = []

  for ( let i = 0; i <= 23 ; i++ ){

    if(formattedTime > 23){
      formattedTime = 0;
    }

    UTCRangeTimeInvert[i] = {formattedTime,utc_hour:i};
    formattedTime++;

  }


  // console.log(UTCRangeTimeInvert);
  UTCRangeTimeInvert.forEach(function(valor, clave) {
    
    cron.schedule(`0 ${valor.formattedTime} * * *`, () => {

      CronJobs.run(MongoClient,valor.utc_hour)

    });
  });


  async function validationMiddleware(req, res, next) {
    try {
      let session = await SessionsController.getCurrentSession(MongoClient, req)
      if (session) {
        return next()
      }
    } catch (error) {
      return res.status(404).send('BAD_REQUEST');
    }
    return res.status(404).send('BAD_REQUEST');
  }


 
}


