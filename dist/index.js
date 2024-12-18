"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_rpc_1 = require("discord-rpc");
const node_http_1 = __importDefault(require("node:http"));
const chalk_1 = __importDefault(require("chalk"));
const SERVER_PORT = 4455;
const CLIENT_ID = "1028311936854675458";
async function login(client) {
    let user;
    try {
        user = (await client.login({
            clientId: CLIENT_ID,
        })).user;
    }
    finally {
        if (!user) {
            console.error(chalk_1.default.red("StudioPresence failed to start (Is Discord open?)"));
        }
        else {
            console.log(chalk_1.default.green("Test/Ver(0.1) started"));
        }
    }
}
(async () => {
    const client = new discord_rpc_1.Client({ transport: "ipc" });
    let lastTesting = 0;
    login(client);
    node_http_1.default
        .createServer((req, res) => {
        let data = "";
        req.on("data", (additionalData) => {
            data += additionalData;
        });
        req.on("end", () => {
            try {
                let passThrough = true;
                try {
                    data = JSON.parse(data).activity;
                }
                catch (ignored) {
                    data = undefined;
                }
                if (!data) {
                    client.clearActivity();
                }
                else {
                    if (data.details === "Testing") {
                        lastTesting = Date.now();
                    }
                    else if (Date.now() - lastTesting < 3000) {
                        // i wish i could just use a return here
                        passThrough = false;
                    }
                    if (passThrough) {
                        client.setActivity({
                            details: data.details,
                            startTimestamp: data.timestamps.start,
                            state: data.state,
                            largeImageText: data.assets.large_text,
                            largeImageKey: data.assets.large_image,
                            smallImageText: data.assets.small_text,
                            smallImageKey: data.assets.small_image,
                        });
                        if (data.updateType === "CLOSE")
                            client.clearActivity().catch(() => null);
                    }
                }
                res.writeHead(200, { "Content-Type": "text/plain" });
                res.end("SET Activity");
            }
            catch (err) {
                console.error(err);
                client
                    .clearActivity()
                    .catch(() => console.error(chalk_1.default.red("Failed to clear activity")));
            }
        });
    })
        .listen(SERVER_PORT);
})();
