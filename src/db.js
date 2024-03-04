// import {  connect } from 'mongoose';
import { MONGODB_URI } from './config.js'
import { MongoClient, ServerApiVersion } from 'mongodb';


export class DBNames {

    static services = "services";
    static professions = "professions";
    static notifyMeOrders = "notifyMeOrders";
    static Config = "Config";
    static technical_stars_services_detail = "technical_stars_services_detail";
    static technical_stars = "technical_stars";
    static briefcases = "briefcases";
    static countries = "countries";
    static departments = "departments";
    static municipalities = "municipalities";
    static technical_workplace = "technical_workplace";
    static scheduled_notifications = "scheduled_notifications";
    static professions_technical_details = "professions_technical_details";
    static UserCopy = "UserCopy";
    static UserConfig = "UserConfig";
    static sessionTokens = "session_tokens";
    static forms_professions = "forms_professions";
    static categories = "categories";
    static detail_categories = "detail_categories";
    static anuncios = "anuncios";
    static serviceOffers = "serviceOffers";
    static serviceOfferDetails = "serviceOfferDetails";
    static BackList = "BackList";
    
} 

export const connectDB = async ( onConnect ) => {


    try {

        const Mongoclient = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

        return Mongoclient.connect(async err => {
           
            if(onConnect){
                onConnect(Mongoclient)
            }
            
        })
        
        
    } catch (error) {

        console.log(error)
        
    }

}