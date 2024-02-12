import { DBNames } from './../db.js';

class SessionsController{

    static async getCurrentSession(MongoClient,req){
       try {
        let session_token = (req.headers.authorization||"").replace('Bearer ', '');
        
        let session_tokensCollection = MongoClient.collection(DBNames.sessionTokens);
        let session = await session_tokensCollection.findOne({ session_token });
        
        if(session){
            if(session.userApp){
                return {
                    ...session,
                    user: await MongoClient.collection(DBNames.UserCopy).findOne({ id: session.user_id }),
                    location: await MongoClient.collection(DBNames.technical_workplace).findOne({ user_id: session.user_id }),
                }
            }
            return {
                ...session,
                user: null,
                location: null,
            }
        }

        return  false
       } catch (error) {
        return  false

       }
    }

}

export default SessionsController 