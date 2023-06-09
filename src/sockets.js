import { MONGODB_URI, MONGODB_NAME } from './config.js'
import { MongoClient, ServerApiVersion, ObjectID } from 'mongodb';
const DATABASE = MONGODB_NAME


export default (io,app)=>{

    const Mongoclient = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    var ServicesCollection = null
    var professionsCollection = null
    var notifyMeOrdersCollection = null
    var ConfigCollection = null
    var technicalStarsServicesDetailCollection = null
    var technicalStarsCollection = null
    var briefcasesCollection = null
    var countriesCollection = null
    var departmentsCollection = null
    var municipalitiesCollection = null
    var technical_workplaceCollection = null

    Mongoclient.connect(async err => {
      
      console.log("Mongo Conectado a: " + DATABASE);

        ServicesCollection = Mongoclient.db(DATABASE).collection("services");
        professionsCollection = Mongoclient.db(DATABASE).collection("professions");
        notifyMeOrdersCollection = Mongoclient.db(DATABASE).collection("notifyMeOrders");
        ConfigCollection = Mongoclient.db(DATABASE).collection("Config");
        technicalStarsServicesDetailCollection = Mongoclient.db(DATABASE).collection("technical_stars_services_detail");
        technicalStarsCollection = Mongoclient.db(DATABASE).collection("technical_stars");
        briefcasesCollection = Mongoclient.db(DATABASE).collection("briefcases");

        countriesCollection = Mongoclient.db(DATABASE).collection("countries");
        departmentsCollection = Mongoclient.db(DATABASE).collection("departments");
        municipalitiesCollection = Mongoclient.db(DATABASE).collection("municipalities");
        technical_workplaceCollection = Mongoclient.db(DATABASE).collection("technical_workplace");
  
        const changeStream = ServicesCollection.watch();

        changeStream.on('change', async (change) => {

          console.log("change")

          try {

            if (change.operationType === 'insert' || change.operationType === 'update' ) {
            
              let service = await ServicesCollection.findOne({ _id:change.documentKey._id||"" })

             
              let profesion = await professionsCollection.findOne({_id: new ObjectID(service.profession_id)})
              console.log(profesion.slug_name);
    
              io.emit(`server:refresh:${profesion.slug_name}`, true); 
             
            
              
            }
          } catch (error) {

            console.log(error)

          }

        });


        io.on('connection', async (socket)=>{

          console.log("New conecction")
  
          let resp = await getCurrentData();
          console.log(resp)

          socket.emit('server:init', true)

          socket.on("client:setNotifyMeOrders", async (data = {"notifi":notifi??true,"userID":null})=>{

            let notifyMe = await searchOrCreateNotifyMeByUserID(data['userID'])
            if(notifyMe){
              const user = await notifyMeOrdersCollection.updateOne({ userID: data['userID'] },{ $set: {  notyfyMe: data['notifi'] } });
              let notifyMe = await searchOrCreateNotifyMeByUserID(data['userID'])

              socket.emit('server:setNotifyMeOrders', notifyMe.notyfyMe)

            }


          })

          socket.on("client:getData", async (data = {paginate: {page: 1, perPage: 10, professionIds: null},userID: null})=>{

            // console.log(data)
            let technical_workplace =  await searchOrTechnicalWorkplaceUserID(data['userID'])
            let resp = await getCurrentData(data['paginate'], technical_workplace.municipality_id);
            let notifyMe = await searchOrCreateNotifyMeByUserID(data['userID'])
            let starts =  await searchStartsByUserID(data['userID'])
            let briefcase =  await searchBriefcasesrsByUserID(data['userID'])
            console.log(technical_workplace)
            
            socket.emit('server:setData', {orders: resp, notifiMeOrders: notifyMe.notyfyMe, starts: starts,briefcase:briefcase, technical_workplace})
            
            
          })

          socket.on('disconnect', () => {
            console.log('Client disconnected');
            // Realizar acciones adicionales si es necesario
          });

  
        })


        // app.get('/start/:id',  async function(req, res) {
        //   var id = req.params.id;

        //   return res.send({

        //     success:true,
        //     message: "OK",
        //     data: await searchStartsByUserID(id)
        //   })

        app.get('/getCountries',  async function(req, res) {

          let countries = await countriesCollection.find({}).toArray()

          return res.send({

            success:true,
            message: "OK",
            data: countries
          })
        
        })


        app.get('/getDepartamentsByCountriID/:id',  async function(req, res) {

          var id = req.params.id;
          let departaments = await departmentsCollection.find({countri_id:id}).toArray()

          return res.send({

            success:true,
            message: "OK",
            data: departaments
          })
        
        })


        app.get('/getMunicipalysByDepartamentID/:id',  async function(req, res) {

          var id = req.params.id;
          let municipalities = await municipalitiesCollection.find({departament_id:id}).toArray()

          return res.send({

            success:true,
            message: "OK",
            data: municipalities
          })
        
        })
        
      
        
        app.post('/rate-service', async function(req, res) {  

          // console.log("bot-list")
          
  
          
          let token = req.body.token||""
          let service_id = req.body.service_id||null
          let value = req.body.value||null
          
          try {
          
          
          if(! await hasAuthority(token)) return res.send({
              success:false,
              message: "UNAUTHORIZED",
          })

          if( service_id == null ) return res.send({
            success:false,
            message: "service_id IS REQUIRED",
          })

          if( value == null ) return res.send({
            success:false,
            message: "value IS REQUIRED",
          })

            const service = await ServicesCollection.findOne({_id: ObjectID(service_id)});

            if(service){

              await rateServices( service_id, service.technical_id,service.client_id,parseInt(value));
              await calculateTotalStarts(service.technical_id)

              return res.send({

                success:true,
                message: "OK"
              
              })


            }

              
            return res.send({
                success:false,
                message: "BAD_REQUEST",
              
            })
  
          } catch (error) {
   
              return res.send({
                      success:false,
                      message: error,
              })
              
          }
  
      })

       
  
        
    
    
    });



   var  searchOrCreateNotifyMeByUserID = async function  (userID) {
    if(userID == null){
      return null
    }
      const user = await notifyMeOrdersCollection.findOne({ userID });
      if (!user) {
        const newUser = {
          userID,
          notyfyMe: true
        };
        await notifyMeOrdersCollection.insertOne(newUser);
        return await notifyMeOrdersCollection.findOne({ userID });
      }
      return user;
    }

    var  searchOrTechnicalWorkplaceUserID = async function  (userID) {
    if(userID == null){
      return null
    }
      const user = await technical_workplaceCollection.findOne({ user_id:userID });
      if (!user) {
        const newUser = {
          user_id: userID,
          countri_id:null,
          departament_id:null,
          municipality_id:null
        };
        await technical_workplaceCollection.insertOne(newUser);
        return await technical_workplaceCollection.findOne({ user_id:userID });
      }

      if(user.countri_id && user.municipality_id ){
        let coountri = await countriesCollection.findOne({_id: new ObjectID(user.countri_id)})
        let municipaly = await municipalitiesCollection.findOne({_id: new ObjectID(user.municipality_id  )})
  
        return { countrIcon: coountri.icon, municipalyName: municipaly.name, ...user};
      }

      return user
     
    }

   var getCurrentData = async (data = {page: 1, perPage: 10, professionIds: null}, municipaly_id)=>{

      try {

        const page = data.page; 
        const perPage = data.perPage; 
        const skip = (page - 1) * perPage; 
        const limit = perPage;
        if(data.professionIds == null){
          data.professionIds = [
            "64582a4580fcfe55480ea7c2"
          ]
        }
  
        // console.log(data.professionIds)
  
       let resp = await ServicesCollection.find({municipality_id:municipaly_id, deleted_at: { $exists: false }, profession_id: { $in: data.professionIds },  status: "CREATED", is_public: true}).sort({ created_at: -1 }).skip(skip).limit(limit).toArray();
       return resp
      } catch (error) {
        console.log(error)
      }
      

    }

    async function rateServices( service_id, technical_id, client_id, value ) {

      const item = await technicalStarsServicesDetailCollection.findOne({ service_id });
      if (!item) {
        const newUser = {
          service_id,
          technical_id,
          client_id,
          value
        };
        await technicalStarsServicesDetailCollection.insertOne(newUser);
        return await technicalStarsServicesDetailCollection.findOne({ service_id });
      }

      await technicalStarsServicesDetailCollection.updateOne({ service_id }, { $set: {
        service_id,
        technical_id,
        client_id,
        value
      }});

      return await technicalStarsServicesDetailCollection.findOne({ service_id });

    }

    async function calculateTotalStarts(technical_id){
     let starts = await technicalStarsServicesDetailCollection.find({technical_id}).toArray()

    let total = 0 
    starts.forEach(element => {
      total += parseInt(element.value)
    });

    total =  total / starts.length
    await saveStartsByUserID(technical_id,total)

    }


    async function saveStartsByUserID( technical_id, value ) {

      const item = await technicalStarsCollection.findOne({ technical_id });
      if (!item) {
        const newUser = {
          technical_id,
          value
        };
        await technicalStarsCollection.insertOne(newUser);
        return await technicalStarsCollection.findOne({ technical_id });
      }

      await technicalStarsCollection.updateOne({ technical_id }, { $set: {
        technical_id,
        value
      }});

      return await technicalStarsCollection.findOne({ technical_id });

    }
    
    async function searchStartsByUserID( technical_id ) {

      // console.log(technical_id)

      const item = await technicalStarsCollection.findOne({ technical_id });


      // console.log(item)
      if (!item) {
        const newUser = {
          technical_id,
          value: 0
        };
        await technicalStarsCollection.insertOne(newUser);
        return await technicalStarsCollection.findOne({ technical_id });
      }

      return await technicalStarsCollection.findOne({ technical_id });

    }

    async function searchBriefcasesrsByUserID( technical_id ) {


      const item = await briefcasesCollection.findOne({ technical_id });

      if (!item) {
        const newBriefcase = {
          technical_id,
          current_amount: 0
        };
        await briefcasesCollection.insertOne(newBriefcase);
        return await briefcasesCollection.findOne({ technical_id });
      }

      return await briefcasesCollection.findOne({ technical_id });

    }


        
    async function hasAuthority(token){
      let TokenWebhook = await ConfigCollection.findOne({ name: "TokenWebhook" })
      return !(TokenWebhook.value != token && TokenWebhook.value != null)
    }

   

 
  
}