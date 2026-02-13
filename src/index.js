import express from "express";
import { dbConnection } from "./db/db.js";
import "./db/schema.js";//after dbconnection--->importante

import { matchRouter } from "./routes/matches.routes.js";
const app=express();
const port=8888;
await dbConnection();
app.use(express.json());
app.get("/",(req,res)=>{
    return res.json({date:new Date().toLocaleDateString,msg:"live api"});
});
app.use("/api/v1/matches",matchRouter);

app.listen(port,()=>console.log(`app run on http://localhost:${port}`));