import express from "express";
import http from "node:http";
import { limiter } from "./utils/rateLimiter.js";
import helmet from "helmet";

import { attachWebSocketServer } from "./ws/server.js"

import { dbConnection } from "./db/db.js";
import "./db/schema.js";//after dbconnection--->importante

import { matchRouter } from "./routes/matches.routes.js";
import { commentaryRouter } from "./routes/commentary.routes.js";

await dbConnection();


const app = express();
const port = Number(process.env.PORT || 8888);
const host = process.env.HOST || '0.0.0.0';

//protected 
app.set("trust proxy", 1);
app.use(limiter);
app.use(helmet());

app.use(express.json());

app.get("/", (req, res) => {
    return res.json({ date: new Date().toLocaleDateString, msg: "live api" });
});

app.use("/api/v1/matches", matchRouter);
app.use("/api/v1/matches/:id/commentary", commentaryRouter);


const server = http.createServer(app);
const { broadcastMatchCreated, broadcastCommentary } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary; 

server.listen(port, host, () => {

    const baseUrl = host === '0.0.0.0' ? `http://localhost:${port}` : `http://${host}:${port}`;
    console.log(` Server is running on ${baseUrl}`);
    console.log(`Web socket server is running on ${baseUrl.replace("http", "ws")}/ws`);

});