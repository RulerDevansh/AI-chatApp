import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const ConnectDB = async () => {
    try{
        // in password @ is replaced by %40
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB connected !! DataBase Host: ${connectionInstance.connection.host}`);
    } catch(error){
        console.error("MongoDB COnnection ERROR: ", error);
        process.exit(1);
    }
}

export default ConnectDB;