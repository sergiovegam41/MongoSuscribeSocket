import TechnicianProfileService from './../../Services/TechnicianProfileService.js';

class SharedServicesSocket {

    static servicesName = "sharedServices"

    static async run(io, clientSocket, MongoClient, userData) {
        try {

            clientSocket.on(`client:${this.servicesName}:getProfile`, async (data) => {
                let fullProfile = TechnicianProfileService.getTechnicianCompleteProfile(data.technicianId, MongoClient);

                fullProfile.then(
                    (profile) => {
                        clientSocket.emit(`server:${this.servicesName}:getProfile`, {
                            success: true,
                            profile: profile
                        });
                    },
                    (error) => {
                        clientSocket.emit(`server:${this.servicesName}:getProfile`, {
                            success: false,
                            error: error.message
                        });
                    }
                );
            });

        } catch (error) {
            console.log("[ERROR EN SharedServicesSocket.run]")
            console.log(userData)
            console.log(error)
        }
    }

}

export default SharedServicesSocket