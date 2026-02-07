import express from "express";
import { dbConnection } from "./db/db.js";
import "./db/schema.js";//after dbconnection
const app=express();
const port=8888;
await dbConnection();
app.use(express.json());
app.get("/",(req,res)=>{
    return res.json({date:new Date().toLocaleDateString,msg:"live api"});
})
app.listen(port,()=>console.log("app run on http://localhost:8888"));