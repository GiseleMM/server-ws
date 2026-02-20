import { WebSocket, WebSocketServer } from "ws";

const MAX_CONNECTIONS_PER_IP = 6;
const connectionsPerIp = new Map();


const matchSubscribers = new Map();

function subscribe(matchId, socket) {
    if (!matchSubscribers.has(matchId)) {
        matchSubscribers.set(matchId, new Set());//only for the first id create set
    }
    matchSubscribers.get(matchId).add(socket);
}
function unSubscribe(matchId, socket) {
    const subscribers = matchSubscribers.get(matchId);
    if (!subscribers) return;

    subscribers.delete(socket);

    if (subscribers.size === 0) matchSubscribers.delete(matchId);

}
function cleanupSubscriptions(socket) {
    for (const matchId of socket.subscriptions) {
        unSubscribe(matchId, socket);

    }
}

function broadcastToMatch(matchId, payload) {
    const subscribers = matchSubscribers.get(matchId);
    if (!subscribers || subscribers.size === 0) return;

    const message = JSON.stringify(payload);

    for (const client of subscribers) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }

}
function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}
function broadcastToAll(wss, payload) {


    // if (client.readyState !== WebSocket.OPEN) return;
    // client.send(JSON.stringify(payload));
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    }


}


function handleMessage(socket, data) {
    let message;

    console.log(data.toString());
    try {
        message = JSON.parse(data.toString());
    } catch (error) {

        console.log(error);
        sendJson(socket, { type: "error", message: "Invalid JSON" });
        return;
    }

    // {"type":"subscribe","matchId":1}
    if (message?.type === "subscribe" && Number.isInteger(message.matchId)) {
        subscribe(message.matchId, socket);
        socket.subscriptions.add(message.matchId);
        sendJson(socket, { type: "subscribed", matchId: message.matchId });
        return
    }


    if (message?.type === "unsubscribe" && Number.isInteger(message.matchId)) {
        unSubscribe(message.matchId, socket);
        socket.subscriptions.delete(message.matchId);
        sendJson(socket, { type: "unsubscribed", matchId: message.matchId });
        return
    }
}
export function attachWebSocketServer(server) {

    const wss = new WebSocketServer({
        maxPayload: 1024 * 1024,
        server,
        path: "/ws",
        verifyClient: (info, done) => {
            const ip = info.req.socket.remoteAddress;
            const current = connectionsPerIp.get(ip) || 0;

            if (current >= MAX_CONNECTIONS_PER_IP) {
                return done(false, 429, "Too Many Connections");
            }

            connectionsPerIp.set(ip, current + 1);
            done(true);
        }
    });

    // const wss = new WebSocketServer({
    //     server,
    //     path: '/ws',
    //     maxPayload: 1024 * 1024
    // });


    wss.on("connection", (socket, req) => {




        const origin = req.headers.origin;
        //todo add sitio 
        // if (origin !== "http://localhost:8888") {
        //     ws.close();
        //     return;
        // }

        const ip = req.socket.remoteAddress;

        console.log("Cliente conectado origin", origin);

        socket.isAlive = true;

        socket.subscriptions = new Set();
        // const current = connectionsPerIp.get(ip) || 0;

        // if (current >= MAX_CONNECTIONS_PER_IP) {
        //     socket.close(1008, "Rate limit exceeded");
        //     return;
        // }

        // connectionsPerIp.set(ip, current + 1);

        socket.on("close", () => {
            const count = connectionsPerIp.get(ip) || 1;
            connectionsPerIp.set(ip, Math.max(count - 1, 0));
            cleanupSubscriptions(socket);


        });


        socket.on("pong", () => { socket.isAlive = true; })

        sendJson(socket, { type: "welcome" });

        socket.on("error", (e) => {
            console.error(e);
            socket.terminate();

        });

        socket.on("message", (data) => handleMessage(socket, data));


    });

    const interval = setInterval(() => {
        wss.clients.forEach(ws => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        })
    }, 30000);

    wss.on("close", () => {

        // const count = connectionsPerIp.get(ip) || 1;
        // connectionsPerIp.set(ip, Math.max(count - 1, 0));
        clearInterval(interval);
    });

    function broadcastMatchCreated(match) {
        broadcastToAll(wss, { type: "match_created", data: match });
    }

    function broadcastCommentary(matchId, commentary) {
        broadcastToMatch(matchId, { type: "commentary", data: commentary })
    }
    return { broadcastMatchCreated, broadcastCommentary };
}