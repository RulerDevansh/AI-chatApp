import dotenv from 'dotenv'
import http from 'http';
import ConnectDB from "./db/index.js";
import { app } from './app.js';
import { setupSocket } from './socket/index.js';

dotenv.config({
    // path: './env'
})

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

ConnectDB()
.then(() => {
    
    setupSocket(server);

    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error("Error connecting to MongoDB:", error);
});