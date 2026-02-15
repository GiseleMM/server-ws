import { WebSocket, WebSocketServer } from "ws";

const MAX_CONNECTIONS_PER_IP = 6;
const connectionsPerIp = new Map();

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}
function broadcast(wss, payload) {
    for (const client of wss.clients) {

        // if (client.readyState !== WebSocket.OPEN) return;
        // client.send(JSON.stringify(payload));
        for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(payload));
            }
        }

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
        // const current = connectionsPerIp.get(ip) || 0;

        // if (current >= MAX_CONNECTIONS_PER_IP) {
        //     socket.close(1008, "Rate limit exceeded");
        //     return;
        // }

        // connectionsPerIp.set(ip, current + 1);

        socket.on("close", () => {
            const count = connectionsPerIp.get(ip) || 1;
            connectionsPerIp.set(ip, Math.max(count - 1, 0));
        });


        console.log("Cliente conectado origin", origin);

        socket.isAlive = true;
        socket.on("pong", () => { socket.isAlive = true; })

        sendJson(socket, { type: "welcome" });

        socket.on("error", console.error);



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
        broadcast(wss, { type: "match_created", data: match });
    }
    return { broadcastMatchCreated };
}