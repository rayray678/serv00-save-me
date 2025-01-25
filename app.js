require('dotenv').config();
const express = require("express");
const { exec } = require('child_process');
const path = require('path');
const app = express();
app.use(express.json());

// 存储最多5条日志
let logs = [];
let latestStartLog = "";

// 日志记录函数
function logMessage(message) {
    logs.push(message);
    if (logs.length > 5) logs.shift();
}

// 执行通用的 shell 命令
function executeCommand(commandToRun, actionName, isStartLog = false) {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();
    const formattedTime = currentDate.toLocaleTimeString();

    exec(commandToRun, (err, stdout, stderr) => {
        const timestamp = `${formattedDate} ${formattedTime}`;
        if (err) {
            logMessage(`${timestamp} ${actionName} 执行错误: ${err.message}`);
            return;
        }
        if (stderr) {
            if (!stderr.includes("Could not open file msg.json: No such file or directory")) {
                const stderrMsg = `${timestamp} ${actionName} 执行标准错误输出: ${stderr}`;
                logMessage(stderrMsg);
            }
        }
        const successMsg = `${timestamp} ${actionName} 执行成功:\n${stdout}`;
        logMessage(successMsg);

        if (isStartLog) latestStartLog = successMsg;
    });
}

// 执行 start.sh 的 shell 命令
function runShellCommand() {
    const commandToRun = `cd ${process.env.HOME}/serv00-play/singbox/ && bash start.sh`;
    executeCommand(commandToRun, "start.sh", true);
}

// KeepAlive 函数
function KeepAlive() {
    const commandToRun = `cd ${process.env.HOME}/serv00-play/ && bash keepalive.sh`;
    executeCommand(commandToRun, "keepalive.sh", true);
}

// 每隔20秒自动执行 keepalive.sh
setInterval(KeepAlive, 20000);

// /info 执行 start.sh 和 keepalive.sh
app.get("/info", (req, res) => {
    runShellCommand();
    KeepAlive();
    res.type("html").send(`
        <html>
            <head>
                <style>
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                    }
                    .text-container {
                        text-align: center;
                        font-weight: bold;
                        font-size: 18px;
                        color: #333;
                    }
                    .text-container span {
                        display: inline-block;
                        animation: roll 1.5s infinite;
                        letter-spacing: 3px; /* 增加字间距 */
                    }
                    @keyframes roll {
                        0%, 100% {
                            transform: scale(1);
                        }
                        50% {
                            transform: scale(1.5);
                        }
                    }
                    .text-container span:nth-child(1) { animation-delay: 0s; }
                    .text-container span:nth-child(2) { animation-delay: 0.1s; }
                    .text-container span:nth-child(3) { animation-delay: 0.2s; }
                    .text-container span:nth-child(4) { animation-delay: 0.3s; }
                    .text-container span:nth-child(5) { animation-delay: 0.4s; }
                    .text-container span:nth-child(6) { animation-delay: 0.5s; }
                    .text-container span:nth-child(7) { animation-delay: 0.6s; }
                </style>
            </head>
            <body>
                <div class="text-container">
                    <div>
                        ${"SingBox 已复活".split("").map((char, i) => `<span>${char}</span>`).join("")}
                    </div>
                    <div>
                        ${"KeepAlive 进程守护中".split("").map((char, i) => `<span>${char}</span>`).join("")}
                    </div>
                </div>
            </body>
        </html>
    `);
});

// /node_info 显示 start.sh 日志
app.get("/node_info", (req, res) => {
    res.type("html").send("<pre>" + (latestStartLog || "暂无日志") + "</pre>");
});

// /keepalive 显示所有日志
app.get("/keepalive", (req, res) => {
    res.type("html").send("<pre>" + logs.join("\n") + "</pre>");
});

// 404 页面处理
app.use((req, res, next) => {
    if (req.path === '/info' || req.path === '/node_info' || req.path === '/keepalive') {
        return next();
    }
    res.status(404).send("页面未找到");
});

// 启动服务器
app.listen(3000, () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();
    const formattedTime = currentDate.toLocaleTimeString();
    const startMsg = `${formattedDate} ${formattedTime} 服务器已启动，监听端口 3000`;
    logMessage(startMsg);
});