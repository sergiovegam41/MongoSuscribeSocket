import { DBNames } from './../db.js';
import { MONGODB_NAME } from './../config.js'
import { ObjectId } from 'mongodb';


class ProfessionsController {

  static async getProfessions(MongoClient, req, res) {

    let professions = await MongoClient.collection(DBNames.professions).find({}).toArray()

    return res.send({
      success: true,
      message: "OK",
      data: professions
    })

  }

  static async createSheduledNotification(MongoClient, req, res) {

    try {
      console.log(req.body)

      await MongoClient.collection(DBNames.scheduled_notifications).insertOne({
        title: req.body.title,
        description: req.body.description,
        profession_filter: req.body.profession_filter,
        delay: parseInt(req.body.delay),
        dayOfWeek: req.body.dayOfWeek,
        unique: req.body.unique == true ? true : false,
        hour: parseInt(req.body.hour),
        country_id: req.body.country_id,
        date: req.body.date.replaceAll('-', '/'),
        role: req.body.role,
      });

      return res.send({
        success: true,
        message: "OK",

      })
    } catch (error) {
      return res.send({
        success: false,
        message: "ERROR"
      })
    }


  }

  static async updateSheduledNotification(MongoClient, req, res) {
    try {

      var id = req.params.id;

      console.log(req.body)
      await MongoClient.collection(DBNames.scheduled_notifications).updateOne({ _id: ObjectId(id) },
        {
          $set: {
            title: req.body.title,
            description: req.body.description,
            profession_filter: req.body.profession_filter,
            delay: parseInt(req.body.delay),
            dayOfWeek: req.body.dayOfWeek,
            unique: req.body.unique == true ? true : false,
            hour: parseInt(req.body.hour),
            country_id: req.body.country_id,
            date: req.body.date.replaceAll('-', '/'),
            role: req.body.role,
          }
        }
      );

      return res.send({
        success: true,
        message: "OK",

      })


    } catch (error) {

      return res.send({
        success: false,
        message: "ERROR"
      })

    }
  }


}



export default ProfessionsController 