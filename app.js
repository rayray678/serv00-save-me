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

// /keepalive：显示最近一条日志和所有的实时进程信息，进程部分为可滑动窗口
app.get("/keepalive", (req, res) => {
    const command = "ps aux"; // 执行 ps aux 命令获取所有的实时进程信息
    exec(command, (err, stdout, stderr) => {
        if (err) {
            return res.type("html").send(`
                <pre><b>最近日志:</b>\n${logs[logs.length - 1] || "暂无日志"}</pre>
                <pre><b>实时进程信息:</b>\n执行错误: ${err.message}</pre>
            `);
        }

        // 获取所有进程信息
        const processOutput = stdout.trim(); // 去除空白行

        // 获取最近日志
        const latestLog = logs[logs.length - 1] || "暂无日志";

        // 输出结果到网页，并添加可滑动窗口样式
        res.type("html").send(`
            <html>
                <head>
                    <style>
                        /* 可滑动窗口样式 */
                        .scrollable {
                            max-height: 400px;  /* 设置最大高度 */
                            overflow-y: auto;   /* 设置垂直滚动 */
                            border: 1px solid #ccc;
                            padding: 10px;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <pre><b>最近日志:</b>\n${latestLog}</pre>
                    
                    <div class="scrollable">
                        <pre><b>实时进程信息:</b>\n${processOutput}</pre>
                    </div>
                </body>
            </html>
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
