import {
  DBNames
} from "../../db.js";
import {
  ServerApiVersion,
  ObjectId
} from 'mongodb';
import WorkplaceController from "../WorkplaceController.js";
import NotifiMyController from "../NotifiMyController.js";
import moment from "moment";


class TecnicoServicesSocket {

  static servicesName = "tecnicoServices"

  static async run(io, clientSocket, MongoClient, userData) {



    console.log("RUN TECNICO")
    // console.log(this.servicesName);
    clientSocket.on(`client:${this.servicesName}:init`, async (data) => {

      console.log("el init del tecnico")

      clientSocket.emit(`server:${this.servicesName}:init`, {
        success: true,
        code: "",
        msj: "",
        initData: {}
      })

    })


    clientSocket.on(`client:${this.servicesName}:getData`, async (data = {
      paginate: {
        page: 1,
        perPage: 10,
        professionIds: null
      },
      userID: null,
      firebase_token: null
    }) => {


      // console.log("getData");

      let technical_workplace = await searchOrTechnicalWorkplaceUserID(userData.session.user_id)
      let resp = await getCurrentData(data['paginate'], technical_workplace.municipality_id);
      let notifyMe = await NotifiMyController.searchOrCreateNotifyMeByUserID(MongoClient, {
        userID: userData.session.user_id,
        firebase_token: data.firebase_token
      })
      let starts = await searchStartsByUserID(userData.session.user_id)
      let briefcase = await searchBriefcasesrsByUserID(userData.session.user_id)

      clientSocket.emit(`server:${this.servicesName}:setData`, {

        orders: resp,
        notifiMeOrders: notifyMe.notyfyMe,
        starts: starts,
        briefcase: briefcase,
        technical_workplace
        
      })

    })

    clientSocket.on('disconnect', () => {

      console.log('client Tecnico disconnected');

    });

    async function searchOrTechnicalWorkplaceUserID(userID) {
      return await WorkplaceController.searchOrTechnicalWorkplaceUserID(MongoClient, {
        query: {
          userID: userID
        }
      })
    }

    async function getCurrentData(data = {
      page: 1,
      perPage: 10,
      professionIds: null
    }, municipaly_id) {

      try {

        const page = data.page;
        const perPage = data.perPage;
        const skip = (page - 1) * perPage;
        const limit = perPage;
        if (data.professionIds == null) {
          data.professionIds = [
            "64582a4580fcfe55480ea7c2"
          ]
        }

              
        let startOfDay = moment().startOf('day').toDate(); // Inicio del día actual
        let endOfDay = moment().endOf('day').toDate(); // Fin del día actual

        let resp = await MongoClient.collection(DBNames.services).aggregate([
            {
                $match: {
                    municipality_id: municipaly_id,
                    deleted_at: { $exists: false },
                    profession_id: { $in: data.professionIds },
                    status: "CREATED",
                    is_public: true,
                    created_at: { $gte: startOfDay, $lte: endOfDay } // Añadido para filtrar solo los de hoy
                }
            },
            { $sort: { created_at: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]).toArray();

                
        return resp
      } catch (error) {
        console.log(error)
      }


    }





    async function searchStartsByUserID(technical_id) {

      technical_id = technical_id.toString()

      // console.log(technical_id)

      const item = await MongoClient.collection(DBNames.technical_stars).findOne({
        technical_id
      });


      // console.log(item)
      if (!item) {
        const newUser = {
          technical_id,
          value: 0
        };
        await MongoClient.collection(DBNames.technical_stars).insertOne(newUser);
        return await MongoClient.collection(DBNames.technical_stars).findOne({
          technical_id
        });
      }

      return await MongoClient.collection(DBNames.technical_stars).findOne({
        technical_id
      });

    }

    async function searchBriefcasesrsByUserID(technical_id) {

      // console.log("searchBriefcasesrsByUserID: ",technical_id)


      const item = await MongoClient.collection(DBNames.briefcases).findOne({
        technical_id: `${technical_id}`
      });

      if (!item) {
        const newBriefcase = {
          technical_id,
          current_amount: 0
        };
        // await MongoClient.collection(DBNames.briefcases).insertOne(newBriefcase);
        return newBriefcase
      }

      return await MongoClient.collection(DBNames.briefcases).findOne({
        technical_id: `${technical_id}`
      });

    }

  }







}









export default TecnicoServicesSocket