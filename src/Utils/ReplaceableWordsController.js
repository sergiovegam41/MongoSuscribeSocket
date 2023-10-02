import moment from "moment";


class ReplaceableWordsController {


    static user_name = "$[user_name];";
    static user_last_name = "$[user_last_name];";
    static user_number_document = "$[user_number_document];";
    static user_email = "$[user_email];";
    static user_country_code = "$[user_country_code];";
    static user_phone = "$[user_phone];";
    static user_birthday =  "$[user_birthday];";
    static dayWeekName =  "$[dayWeekName];";


    static dayNamesColeb = {
        
        0:"Domingo",
        1:"Lunes",
        2:"Martes",
        3:"Miércoles",
        4:"Jueves",
        5:"Viernes",
        6:"Sábado"

    }


    static replaceByUser(msj,user,dayOfWeek = 0,hour=moment().format("HH:mm:ss")){
        if(msj){
            return msj.replaceAll(this.user_name, user.name)
            ?.replaceAll(this.user_last_name, user.last_name)
            ?.replaceAll(this.user_number_document, user.document)
            ?.replaceAll(this.user_email, user.email)
            ?.replaceAll(this.user_country_code, user.country_code)
            ?.replaceAll(this.user_phone, user.phone)
            ?.replaceAll(this.user_birthday,moment(user.birthday)?.format("d MMMM")??"" )
            ?.replaceAll(this.dayWeekName,this.dayNamesColeb[dayOfWeek] )
        }else{
            return ""
        }
     
      
    }

}


export default ReplaceableWordsController 
