const mongoose = require('mongoose');

const connectDb = async ()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Database successfully connected");
        
    } catch (error){
        console.error("error connecting to server", error.message)
    }
}

module.exports = connectDb;