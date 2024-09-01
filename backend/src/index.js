import dotenv from "dotenv"
import connectDB from "./db/connectDB.js";
import { app } from "./app.js";

dotenv.config({
    path: './.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is Listening on PORT: ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log('MongoDB Connection Failed. ', err)
});