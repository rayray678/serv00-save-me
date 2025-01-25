require('dotenv').config();
const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(express.json());
let logs = [];
let latestStartLog = "";
function logMessage(message) {
    logs.push(message);
    if (logs.length > 5) logs.shift();
}
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
function runShellCommand() {
    const command = `cd ${process.env.HOME}/serv00-play/singbox/ && bash start.sh`;
    executeCommand(command, "start.sh", true);
}
function KeepAlive() {
    const command = `cd ${process.env.HOME}/serv00-play/ && bash keepalive.sh`;
    executeCommand(command, "keepalive.sh", true);
}
setInterval(KeepAlive, 20000);
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
                    text-align: center;
                }
                .content-container {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    max-width: 600px;
                }
                .dynamic-text {
                    font-size: 30px;
                    font-weight: bold;
                    white-space: nowrap;
                    display: inline-block;
                }
                @keyframes growShrink {
                    0% {
                        transform: scale(1);
                    }
                    25% {
                        transform: scale(1.5);
                    }
                    50% {
                        transform: scale(1);
                    }
                }

                .dynamic-text span {
                    display: inline-block;
                    animation: growShrink 1s infinite;
                    animation-delay: calc(0.1s * var(--char-index));
                }
                .button-container {
                    margin-top: 20px;
                }
                button {
                    padding: 10px 20px;
                    font-size: 16px;
                    cursor: pointer;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    margin: 10px 20px;
                }
                button:hover {
                    background-color: #0056b3;
                }
            </style>
        </head>
        <body>
            <div class="content-container">
                <div class="dynamic-text">
                    <span style="--char-index: 0;">S</span>
                    <span style="--char-index: 1;">i</span>
                    <span style="--char-index: 2;">n</span>
                    <span style="--char-index: 3;">g</span>
                    <span style="--char-index: 4;">B</span>
                    <span style="--char-index: 5;">o</span>
                    <span style="--char-index: 6;">x</span>
                    <span style="--char-index: 7;"> </span>
                    <span style="--char-index: 8;">已</span>
                    <span style="--char-index: 9;">复</span>
                    <span style="--char-index: 10;">活</span>
                </div>
                <div class="dynamic-text" style="margin-top: 20px;">
                    <span style="--char-index: 11;">H</span>
                    <span style="--char-index: 12;">t</span>
                    <span style="--char-index: 13;">m</span>
                    <span style="--char-index: 14;">l</span>
                    <span style="--char-index: 15;">O</span>
                    <span style="--char-index: 16;">n</span>
                    <span style="--char-index: 17;">L</span>
                    <span style="--char-index: 18;">i</span>
                    <span style="--char-index: 19;">v</span>
                    <span style="--char-index: 20;">e</span>
                    <span style="--char-index: 21;"> </span>
                    <span style="--char-index: 22;">守</span>
                    <span style="--char-index: 23;">护</span>
                    <span style="--char-index: 24;">中</span>
                </div>
                <div class="button-container">
                    <button onclick="window.location.href='/node'">节点信息</button>
                    <button onclick="window.location.href='/log'">实时日志</button>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.get("/node", (req, res) => {
    const filePath = path.join(process.env.HOME, "serv00-play/singbox/list");
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            res.type("html").send(`<pre>无法读取文件: ${err.message}</pre>`);
            return;
        }
        const vmessPattern = /vmess:\/\/[^\n]+/g;
        const hysteriaPattern = /hysteria2:\/\/[^\n]+/g;
        const proxyipPattern = /proxyip:\/\/[^\n]+/g;
        const vmessConfigs = data.match(vmessPattern) || [];
        const hysteriaConfigs = data.match(hysteriaPattern) || [];
        const proxyipConfigs = data.match(proxyipPattern) || [];
        const allConfigs = [...vmessConfigs, ...hysteriaConfigs, ...proxyipConfigs];
        let htmlContent = `
            <html>
            <head>
                <style>
                    .config-box {
                        max-height: 400px;  
                        overflow-y: auto;   
                        border: 1px solid #ccc;
                        padding: 10px;
                        background-color: #f4f4f4;
                    }
                    #configContent {
                        white-space: pre-wrap;  
                        text-align: left;       
                    }
                    .copy-btn {
                        padding: 5px 10px;
                        cursor: pointer;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                    }
                    .copy-btn:hover {
                        background-color: #0056b3;
                    }
                </style>
            </head>
            <body>
                <div>
                    <h3>节点信息</h3>
                    <div class="config-box" id="configBox">
                        <pre id="configContent">
        `;
        allConfigs.forEach((config) => {
            htmlContent += `${config}\n`;
        });
        htmlContent += `
                        </pre>
                    </div>
                    <button class="copy-btn" onclick="copyToClipboard('#configContent')">一键复制</button>
                </div>

                <script>
                    function copyToClipboard(id) {
                        var text = document.querySelector(id).textContent;
                        var textarea = document.createElement('textarea');
                        textarea.value = text;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        alert('已复制到剪贴板！');
                    }
                </script>
            </body>
            </html>
        `;
        res.type("html").send(htmlContent);
    });
});
app.get("/log", (req, res) => {
    const command = "ps -A"; 
    exec(command, (err, stdout, stderr) => {
        if (err) {
            return res.type("html").send(`
                <pre><b>最近日志:</b>\n${logs[logs.length - 1] || "暂无日志"}</pre>
                <pre><b>进程详情:</b>\n执行错误: ${err.message}</pre>
            `);
        }
        const processOutput = stdout.trim(); 
        const latestLog = logs[logs.length - 1] || "暂无日志";
        res.type("html").send(`
            <html>
                <head>
                    <style>
                        .scrollable {
                            max-height: 300px;  
                            overflow-y: auto;   
                            border: 1px solid #ccc;
                            padding: 10px;
                            margin-top: 20px;
                            background-color: #f9f9f9;
                        }
                    </style>
                </head>
                <body>
                    <pre><b>最近日志:</b>\n${latestLog}</pre>
                    <div class="scrollable">
                        <pre><b>进程详情:</b>\n${processOutput}</pre>
                    </div>
                </body>
            </html>
        `);
    });
});

// 404 页面处理
app.use((req, res, next) => {
    const validPaths = ["/info", "/node", "/log"];
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
