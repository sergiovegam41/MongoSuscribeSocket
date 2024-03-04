import { DBNames } from './../db.js';
import { MONGODB_NAME } from './../config.js'


class AnunciosController {

  static async getAnuncios(MongoClient, req, res) {

    let anuncios = await MongoClient.collection(DBNames.anuncios).find({}).toArray()

    return res.send({
      success:true,
      message: "OK",
      data: anuncios
    })

  }

}



export default AnunciosController 