import { DBNames } from './../db.js';
import { MONGODB_NAME } from './../config.js'


class LocationController {

  static async getCountries(MongoClient, req, res) {

    let countries = await MongoClient.collection(DBNames.countries).find({}).toArray()

    return res.send({
      success:true,
      message: "OK",
      data: countries
    })

  }


  static async getDepartamentsByCountrieID(MongoClient, req, res) {

    var id = req.params.id;
    let departaments =  await MongoClient.collection(DBNames.departments).find({countri_id:id}).toArray()

    return res.send({

      success:true,
      message: "OK",
      data: departaments
      
    })

  }

  static async getCitiesByEtateID(MongoClient, req, res) {

    var id = req.params.id;
    let municipalities =  await MongoClient.collection(DBNames.municipalities).find({departament_id:id}).toArray()

    return res.send({
      success:true,
      message: "OK",
      data: municipalities
    })

  }

}



export default LocationController 