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
    res.type("html").send("<pre> singbox 和 KeepAlive 已复活成功！</pre>");
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