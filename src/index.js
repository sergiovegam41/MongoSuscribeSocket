import app  from './app.js';
import { Server as WebSocketServer } from 'socket.io';
import http from 'http';
import { connectDB } from './db.js';
import sockets from './sockets.js';
import { PORT } from './config.js';

(async ()=>{
    // await connectDB()
    
    const server = http.createServer(app)

   
    
    const httpServer = server.listen(PORT,'0.0.0.0',()=>{
        
        console.log("Server runing in port "+PORT)
        const io = new WebSocketServer(httpServer, {
            cors: {
            origin:"*"
        }})
        sockets(io,app)

    })


 

})();

