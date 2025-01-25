require('dotenv').config();
const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
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
function executeCommand(command, actionName, isStartLog = false, callback) {
    exec(command, (err, stdout, stderr) => {
        const timestamp = new Date().toLocaleString();
        if (err) {
            logMessage(`${actionName} 执行失败: ${err.message}`);
            if (callback) callback(err.message);
            return;
        }
        if (stderr) {
            logMessage(`${actionName} 执行标准错误输出: ${stderr}`);
        }
        const successMsg = `${actionName} 执行成功:\n${stdout}`;
        logMessage(successMsg);
        if (isStartLog) latestStartLog = successMsg;
        if (callback) callback(stdout);
    });
}

// 执行 start.sh 的 shell 命令
function runShellCommand() {
    const command = `cd ${process.env.HOME}/serv00-play/singbox/ && bash start.sh`;
    executeCommand(command, "start.sh", true);
}

// KeepAlive 函数
function KeepAlive() {
    const command = `cd ${process.env.HOME}/serv00-play/ && bash keepalive.sh`;
    executeCommand(command, "keepalive.sh", true);
}

// 每隔20秒自动执行 keepalive.sh
setInterval(KeepAlive, 20000);

// /info 页面：增加跳转按钮
app.get("/info", (req, res) => {
    runShellCommand();
    KeepAlive();
    res.type("html").send(`
        <pre>singbox 和 KeepAlive 已复活成功！</pre>
        <button onclick="window.location.href='/node_info'">查看节点信息</button>
        <button onclick="window.location.href='/keepalive'">查看实时日志</button>
    `);
});

// /node_info：读取文件内容并显示
app.get("/node_info", (req, res) => {
    const filePath = path.join(process.env.HOME, "serv00-play/singbox/list");
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            res.type("html").send(`<pre>无法读取文件: ${err.message}</pre>`);
            return;
        }
        res.type("html").send(`<pre>${data || "文件内容为空"}</pre>`);
    });
});

// /keepalive：显示最近一条日志和实时进程信息中的最后一条
app.get("/keepalive", (req, res) => {
    const command = "ps aux"; // 获取实时进程信息
    executeCommand(command, "实时进程信息", false, (processOutput) => {
        const latestLog = logs[logs.length - 1] || "暂无日志";

        // 提取实时进程信息的最后一行
        const processLines = processOutput.trim().split("\n");
        const lastProcessLine = processLines[processLines.length - 1] || "暂无实时进程信息";

        res.type("html").send(`
            <pre><b>最近日志:</b>\n${latestLog}</pre>
            <pre><b>最后一个进程信息:</b>\n${lastProcessLine}</pre>
        `);
    });
});


// 404 页面处理
app.use((req, res, next) => {
    const validPaths = ["/info", "/node_info", "/keepalive"];
    if (validPaths.includes(req.path)) {
        return next();
    }
    res.status(404).send("页面未找到");
});

// 启动服务器
app.listen(3000, () => {
    const timestamp = new Date().toLocaleString();
    const startMsg = `${timestamp} 服务器已启动，监听端口 3000`;
    logMessage(startMsg);
    console.log(startMsg);
});
