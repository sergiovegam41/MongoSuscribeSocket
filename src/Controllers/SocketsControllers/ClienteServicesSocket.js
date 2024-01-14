
import { DBNames } from "../../db.js";
import { ObjectID } from 'mongodb';
import { ServerApiVersion, ObjectId } from 'mongodb';
import NotifiMyController from "../NotifiMyController.js";


class ClienteServicesSocket {

    static servicesName = "clienteServices"

    static async run(io,clientSocket, MongoClient, userData){   

        // console.log(userData);
        try {
            
        NotifiMyController.searchOrCreateNotifyMeByUserID(MongoClient, {userID:userData.session.user_id,firebase_token:userData.session.firebase_token})

      
        clientSocket.on(`client:${this.servicesName}:search`, async (searchTerm) => {
            try {

                if(searchTerm == ""){
                    clientSocket.emit(`server:${this.servicesName}:searchResults`, null);
                    return;
                }
                
                let fuzzyRegex = createFuzzyRegex(searchTerm);
                let searchQuery = { name: { $regex: fuzzyRegex } };

                let results = await  MongoClient.collection(DBNames.forms_professions).find(searchQuery).toArray();
                console.log(results)
                clientSocket.emit(`server:${this.servicesName}:searchResults`, results);
            } catch (error) {
                console.error('Error during search:', error);
            }
        });

        clientSocket.on(`client:${this.servicesName}:getFormsByCategorieName`, async (categorieName) => {
            clientSocket.emit(`server:${this.servicesName}:setFormsByCategorieName`, await getFormsByCategorieName(categorieName));
        })

        clientSocket.emit(`server:${this.servicesName}:init`, { success: true, code:"",msj:"", initData: { categories: (await MongoClient.collection(DBNames.categories).find({ active: "1" }).toArray()).sort((a, b) => {return parseInt(a.sortin) - parseInt(b.sortin);}) , frecuentes:  await getFormsByCategorieName("AIRE ACONDICIONADO")} })

        clientSocket.on('disconnect', () => {
            
            console.log('Client disconnected');

        });

        async function getFormsByCategorieName(name){
            const { _id: frecuentesId } = await MongoClient.collection(DBNames.categories).findOne({ name: name });
            const detailCategories = await MongoClient.collection(DBNames.detail_categories).find({ categories_id: frecuentesId.toString() }).toArray();
            const frecuentes = (await Promise.all(detailCategories.map(async ({ professions_id }) => 
                MongoClient.collection(DBNames.forms_professions).find({ professions_id: professions_id.toString() }).toArray()
            ))).flat();
            return frecuentes
        }
        } catch (error) {
            console.log("[ERROR EN ClienteServicesSocket.clienteServices]")
            console.log(userData)
            console.log(error)
        }
    }   

}

function createFuzzyRegex(term) {
    // Escapar caracteres especiales de regex que pueden estar en el término de búsqueda
    let escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    // Reemplaza las letras con errores ortográficos comunes y acentos por grupos de regex.
    let fuzzyTerm = escapedTerm
        .replace(/a/gi, '[aá]')
        .replace(/e/gi, '[eé]')
        .replace(/i/gi, '[ií]')
        .replace(/o/gi, '[oó]')
        .replace(/u/gi, '[uú]')
        .replace(/c/gi, '(c|s|z)')
        .replace(/s/gi, '(c|s|z)')
        .replace(/z/gi, '(c|s|z)')
        .replace(/b/gi, '(b|v)')
        .replace(/v/gi, '(b|v)')
        .replace(/h/gi, '(h?)')
        // Asegúrate de que las 'h' eliminadas no formen parte de 'ch'
        .replace(/(c|s|z)\(h\?\)/gi, '(ch|c|s|z)');

    // Retorna una nueva RegExp basada en el término modificado.
    return new RegExp(fuzzyTerm, 'i');
}

export default ClienteServicesSocket 