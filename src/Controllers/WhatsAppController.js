import { DBNames } from './../db.js';
import http from 'axios';

class WhatsAppController{

    static async sendMessageByPhone(HostBotWhatsApp,TokenWebhook,phone,message){

       try {
        console.log(`Enviando whatsApp a ${phone}, mensaje: ${message}`)
        const headers = {
            'Content-Type': 'application/json'
        };

        let resp = await http.post(`${HostBotWhatsApp}/send`, {
            "token": TokenWebhook,
            "phone":phone,
            "message":message
        }, { headrs: headers })
        
        let statusCode = resp.status;
        let responseBody = resp.data; 


        console.log(responseBody)
        return {
            success: responseBody.success,
            code: statusCode
        };
       } catch (error) {
        console.log("[ERROR EN WhatsAppController.sendMessageByPhone]")
        console.log(HostBotWhatsApp)
        console.log(TokenWebhook)
        console.log(phone)
        console.log(message)
        console.log(error)
       }

    }

}

export default WhatsAppController 