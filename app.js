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

app.get("/info", (req, res) => {
    runShellCommand();
    KeepAlive();
    res.type("html").send(`
        <html>
        <head>
            <style>
                /* 整体居中布局 */
                body {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                    background-color: #f0f0f0;
                    text-align: center;
                }

                /* 动态文字特效 */
                .dynamic-text {
                    font-size: 36px; /* 增大字体 */
                    font-weight: bold;
                    color: #4CAF50;
                    margin: 20px 0;
                    animation: typing 4s steps(30) 1s infinite normal both,
                               blink 0.75s step-end infinite;
                }

                /* 打字机效果 */
                @keyframes typing {
                    from {
                        width: 0;
                    }
                    to {
                        width: 100%;
                    }
                }

                /* 闪烁效果 */
                @keyframes blink {
                    50% {
                        opacity: 0;
                    }
                }

                /* 固定按钮样式 */
                .fixed-buttons {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    z-index: 9999;
                }

                .copy-btn {
                    padding: 10px 20px;
                    cursor: pointer;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    margin-bottom: 10px;
                    font-size: 16px;
                }

                .copy-btn:hover {
                    background-color: #0056b3;
                }
            </style>
        </head>
        <body>
            <div>
                <pre class="dynamic-text">SingBox 已复活</pre>
                <pre class="dynamic-text">HtmlOnLive 守护中...</pre>
            </div>

            <div class="fixed-buttons">
                <button onclick="window.location.href='/node_info'" class="copy-btn">查看节点信息</button>
                <button onclick="window.location.href='/keepalive'" class="copy-btn">查看实时日志</button>
            </div>
        </body>
        </html>
    `);
});


app.get("/node_info", (req, res) => {
    const filePath = path.join(process.env.HOME, "serv00-play/singbox/list");
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            res.type("html").send(`<pre>无法读取文件: ${err.message}</pre>`);
            return;
        }

        // 提取 vmess, hysteria2 和 proxyip 配置
        const vmessPattern = /vmess:\/\/[^\n]+/g;
        const hysteriaPattern = /hysteria2:\/\/[^\n]+/g;
        const proxyipPattern = /proxyip:\/\/[^\n]+/g;

        const vmessConfigs = data.match(vmessPattern) || [];
        const hysteriaConfigs = data.match(hysteriaPattern) || [];
        const proxyipConfigs = data.match(proxyipPattern) || [];

        // 合并所有配置
        const allConfigs = [...vmessConfigs, ...hysteriaConfigs, ...proxyipConfigs];

        // 生成 HTML
        let htmlContent = `
            <html>
            <head>
                <style>
                    /* 局部可滑动窗口样式 */
                    .config-box {
                        max-height: 400px;  /* 设置最大高度 */
                        overflow-y: auto;   /* 设置垂直滚动 */
                        border: 1px solid #ccc;
                        padding: 10px;
                        background-color: #f4f4f4;
                    }
                    /* 确保 pre 标签内容左对齐 */
                    #configContent {
                        white-space: pre-wrap;  /* 保持空格和换行 */
                        text-align: left;       /* 确保内容左对齐 */
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
                    <h3>配置内容</h3>
                    <!-- 可滑动的配置内容区域 -->
                    <div class="config-box" id="configBox">
                        <pre id="configContent">
        `;

        // 将所有配置内容放入一个 `pre` 标签中
        allConfigs.forEach((config) => {
            htmlContent += `${config}\n`;
        });

        htmlContent += `
                        </pre>
                    </div>
                    <button class="copy-btn" onclick="copyToClipboard('#configContent')">复制所有配置</button>
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
                        alert('所有配置已复制到剪贴板！');
                    }
                </script>
            </body>
            </html>
        `;

        res.type("html").send(htmlContent);
    });
});

// /keepalive：显示最近一条日志和所有的实时进程信息，进程部分为可滑动窗口
app.get("/keepalive", (req, res) => {
    const command = "ps -A"; // 执行 ps aux 命令获取所有的实时进程信息
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
                            max-height: 300px;  /* 设置最大高度 */
                            overflow-y: auto;   /* 设置垂直滚动 */
                            border: 1px solid #ccc;
                            padding: 10px;
                            margin-top: 20px;
                            background-color: #f9f9f9;
                        }
                    </style>
                </head>
                <body>
                    <!-- 显示最近日志 -->
                    <pre><b>最近日志:</b>\n${latestLog}</pre>
                    
                    <!-- 可滑动的进程信息区域 -->
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
