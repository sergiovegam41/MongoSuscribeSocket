import mongoose from 'mongoose';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { MONGODB_URI } from './config.js';

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
    static course_catalog = "course_catalogs";
    static details_technician_courses = "details_technician_courses";
    static social_security_details_technician = "social_security_details_technicians";
    static social_security_entity_catalog = "social_security_entity_catalogs";
    
} 

// Función para MongoClient nativo (mantiene compatibilidad)
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
};