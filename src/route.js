import LocationController from './Controllers/LocationController.js';
import StartsController from './Controllers/StartsController.js';
import CronJobs from './Jobs/CronJobs.js';
import moment from "moment";
import cron from 'node-cron';

export default (app, MongoClient) => {

  app.post('/rate-service', async (req, res) => StartsController.rate(MongoClient,req,res))
  app.get('/getCountries',  async (req, res) => LocationController.getCountries(MongoClient,req,res))
  app.get('/getDepartamentsByCountriID/:id',  async (req, res) => LocationController.getDepartamentsByCountrieID(MongoClient,req,res))
  app.get('/getMunicipalysByDepartamentID/:id',  async (req, res) => LocationController.getCitiesByEtateID(MongoClient,req,res))
  
  app.get('/ping', async function (req, res) {
    return res.send(true)
  })

  let formattedTime = parseInt(moment.utc().startOf('day').local().format('H'))
  let UTCRangeTimeInvert = []

  for ( let i = 0; i <= 23 ; i++ ){

    if(formattedTime > 23){
      formattedTime = 0;
    }

    UTCRangeTimeInvert[i] = {formattedTime,utc_hour:i};
    formattedTime++;

  }

  UTCRangeTimeInvert.forEach(function(valor, clave) {
    
    cron.schedule(`0 ${valor.formattedTime} * * *`, () => {

      CronJobs.run(MongoClient,valor.utc_hour)

    });
  });


  async function validationMiddleware(req, res, next) {

    try {

    //   if (session) {

        return next()

    //   }

    } catch (error) {
      
      console.log(error)

    }

    return res.status(404).send('BAD_REQUEST');

  }
}


