import mongoose from "mongoose"
import {DB_Name} from "../constants.js"

const connectDB = async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`);
    }catch(err){
        console.log('ERROR: ', err)
        process.exit(1)
    }
}

export default connectDB;