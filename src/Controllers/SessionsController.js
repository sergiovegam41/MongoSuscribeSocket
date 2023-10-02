import { DBNames } from './../db.js';


class SessionsController{


    static async getCurrentSession(MongoClient,req){
        let session_token = (req.headers.authorization||"").replace('Bearer ', '');
        let session_tokensCollection = MongoClient.collection(DBNames.sessionTokens);
        let session = await session_tokensCollection.findOne({ session_token });
        return session
    }

}





export default SessionsController 