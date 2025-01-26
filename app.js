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
function executeHy2ipScript(logMessages, callback) {
    const username = process.env.USER.toLowerCase(); // 获取当前用户名并转换为小写

    const command = `cd ${process.env.HOME}/domains/${username}.serv00.net/public_nodejs/ && bash hy2ip.sh`;

    // 执行脚本并捕获输出
    exec(command, (error, stdout, stderr) => {
        callback(error, stdout, stderr);
    });
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
                    <button onclick="window.location.href='/hy2ip'">换HY2_IP</button>
                    <button onclick="window.location.href='/node'">节点信息</button>
                    <button onclick="window.location.href='/log'">查看日志</button>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.get("/hy2ip", (req, res) => {
    try {
        let logMessages = []; // 用于收集日志信息

        // 执行 hy2ip.sh 脚本并捕获输出
        executeHy2ipScript(logMessages, (error, stdout, stderr) => {
            if (error) {
                logMessages.push(`Error: ${error.message}`);
                res.status(500).json({ success: false, message: "hy2ip.sh 执行失败", logs: logMessages });
                return;
            }

            if (stderr) {
                logMessages.push(`stderr: ${stderr}`);
            }

            // 处理标准输出中的信息
            let outputMessages = stdout.split("\n");

            // 获取成功更新的 IP（从输出中提取）
            let updatedIp = "";
            outputMessages.forEach(line => {
                if (line.includes("SingBox 配置文件成功更新IP为")) {
                    updatedIp = line.split("SingBox 配置文件成功更新IP为")[1].trim();
                }
                if (line.includes("Config 配置文件成功更新IP为")) {
                    updatedIp = line.split("Config 配置文件成功更新IP为")[1].trim();
                }
            });

            // 如果找到了更新的 IP，则返回成功信息
            if (updatedIp) {
                logMessages.push("命令 执行成功");
                logMessages.push(`SingBox 配置文件成功更新IP为 ${updatedIp}`);
                logMessages.push(`Config 配置文件成功更新IP为 ${updatedIp}`);
                logMessages.push("sing-box 已重启");

                // 将日志转换为 HTML 格式
                let htmlLogs = logMessages.map(msg => `<p>${msg}</p>`).join("");

                // 返回HTML格式的输出
                res.send(`
                    <html>
                        <head>
                            <title>HY2_IP 更新</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    margin: 0;
                                    padding: 0;
                                    background-color: #f4f4f4;
                                    text-align: left;
                                    padding-left: 30px; /* 左侧留出空白，类似于空5格 */
                                }
                                h1 {
                                    text-align: left;
                                    margin-top: 20px;
                                }
                                h2 {
                                    text-align: left;
                                    margin-top: 20px;
                                }
                                .scrollable {
                                    width: 90%; /* 宽度自适应 */
                                    height: 50vh; /* 高度为视口高度的 50% */
                                    max-height: 500px; /* 最大高度 */
                                    overflow-y: auto;
                                    border: 1px solid #ccc;
                                    padding: 10px;
                                    margin: 20px 0;
                                    background-color: #ffffff;
                                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                                    border-radius: 5px;
                                }
                                @media (max-width: 600px) {
                                    .scrollable {
                                        width: 95%; /* 手机上占屏幕宽度的 95% */
                                        height: 40vh; /* 手机上高度为视口高度的 40% */
                                    }
                                }
                            </style>
                        </head>
                        <body>
                            <h1>IP更新结果</h1>
                            <p><strong>有效IP：</strong> ${updatedIp}</p>
                            <div>
                                <h2>日志:</h2>
                                <div class="scrollable" id="logContainer">
                                    ${htmlLogs}
                                </div>
                            </div>
                        </body>
                    </html>
                `);
            } else {
                logMessages.push("未能获取更新的 IP");

                res.status(500).json({
                    success: false,
                    message: "未能获取更新的 IP",
                    logs: logMessages
                });
            }
        });
    } catch (error) {
        let logMessages = [];
        logMessages.push("Error executing hy2ip.sh script:", error.message);

        res.status(500).json({ success: false, message: error.message, logs: logMessages });
    }
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
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f4f4;
                        padding-left: 30px; /* 左侧留出空白，类似于空5格 */
                    }

                    h3 {
                        text-align: left;
                        margin-top: 20px;
                    }

                    .config-box {
                        max-height: 60vh; /* 设置最大高度为视口高度的 60% */
                        width: 90%; /* 设置宽度为视口宽度的 90% */
                        overflow-y: auto;
                        border: 1px solid #ccc;
                        padding: 10px;
                        background-color: #ffffff;
                        margin: 20px 0;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        border-radius: 5px;
                    }

                    #configContent {
                        white-space: pre-wrap;
                    }

                    .copy-btn {
                        padding: 5px 10px;
                        cursor: pointer;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        margin: 10px 0;
                    }

                    .copy-btn:hover {
                        background-color: #0056b3;
                    }

                    @media (max-width: 600px) {
                        .config-box {
                            width: 95%;  /* 手机屏幕宽度调整为 95% */
                            max-height: 50vh; /* 手机屏幕最大高度设置为视口高度的 50% */
                        }
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
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }

                        .scrollable {
                            max-height: 60vh;  /* 设置最大高度为视口高度的60% */
                            overflow-y: auto;   
                            border: 1px solid #ccc;
                            padding: 10px;
                            margin-top: 20px;
                            background-color: #f9f9f9;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                            border-radius: 5px;
                        }

                        pre {
                            white-space: pre-wrap;  /* 保证文本换行显示 */
                            word-wrap: break-word;
                        }

                        @media (max-width: 600px) {
                            .scrollable {
                                width: 95%;  /* 手机屏幕宽度调整为95% */
                                max-height: 50vh; /* 手机屏幕最大高度设置为视口高度的50% */
                            }
                        }

                        @media (min-width: 601px) {
                            .scrollable {
                                width: 90%;  /* 对于宽屏设备，宽度为90% */
                                max-height: 60vh; /* 高度为视口高度的60% */
                            }
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

app.use((req, res, next) => {
    const validPaths = ["/info", "/hy2ip", "/node", "/log"];
    if (validPaths.includes(req.path)) {
        return next();
    }
    res.status(404).send("页面未找到");
});
app.listen(3000, () => {
    const timestamp = new Date().toLocaleString();
    const startMsg = `${timestamp} 服务器已启动，监听端口 3000`;
    logMessage(startMsg);
    console.log(startMsg);
});
