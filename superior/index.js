const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const connectDb = require('./config/db');
const institutionRoutes = require("./routes/institutionRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const studentRoutes = require("./routes/studentRoutes");
const authRoutes = require("./routes/authRoutes");



const app = express();

//connecting to database
connectDb();

//middleware
app.use(cors())
app.use(express.json())
app.use("/api/institutions", institutionRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes);


app.get('/', (req, res)=>{
    res.json({
        message: "CGPA TRACKER API IS RUNNING"
    })
})


const PORT = process.env.PORT || 9001;


app.listen(PORT, ()=>{
console.log(`server is running ${PORT}`);

})