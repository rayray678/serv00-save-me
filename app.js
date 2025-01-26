const https = require('https');
require('dotenv').config();
const express = require("express");
const { exec, execSync } = require("child_process");
const os = require('os');
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

// 现有的命令
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

function stopCommand() {
    const command = `cd ${process.env.HOME}/serv00-play/singbox/ && bash killsing-box.sh`;
    executeCommand(command, "killsing-box", true);
}

// 现有的KeepAlive定时器
function KeepAlive() {
    const command = `cd ${process.env.HOME}/serv00-play/ && bash keepalive.sh`;
    executeCommand(command, "keepalive.sh", true);
}

// 获取可用 IP 的函数
function getUnblockIP(hosts) {
    return new Promise((resolve, reject) => {
        let availableIP = null;
        const tableData = [];

        // 递归检查 hosts 列表中的每个主机
        const checkHost = (index) => {
            if (index >= hosts.length) {
                console.table(tableData); // 输出所有主机状态
                return resolve(null); // 没有可用的 IP
            }

            const host = hosts[index];
            const url = `https://ss.botai.us.kg/api/getip?host=${host}`;

            console.log(`正在请求主机: ${host}，请求地址: ${url}`);

            // 发起请求检查当前 host 的 IP 状态
            https.get(url, { timeout: 5000 }, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    console.log(`请求 ${host} 返回的数据: ${data}`);  // 打印出每个请求的返回数据
                    if (data.includes("not found")) {
                        tableData.push({ Host: host, IP: '-', Status: 'not found' });
                        checkHost(index + 1); // 检查下一个主机
                    } else {
                        const [ip, status] = data.split('|');
                        tableData.push({ Host: host, IP: ip.trim(), Status: status.trim() });
                        if (status.trim() === 'unblocked') {
                            availableIP = ip.trim(); // 找到可用的 IP
                            console.table(tableData);
                            return resolve(availableIP); // 返回找到的 IP
                        } else {
                            checkHost(index + 1); // 继续检查下一个主机
                        }
                    }
                });
            }).on('timeout', () => {
                console.error(`请求 ${host} 超时`);
                reject(new Error('请求超时'));
            }).on('error', (err) => {
                console.error(`请求 ${host} 失败: ${err.message}`);
                reject(err); // 请求错误时，拒绝 Promise
            });
        };

        checkHost(0); // 从第一个主机开始检查
    });
}

// 更新配置文件并重启服务
function updateConfigAndRestart(ip) {
    const singboxDir = `${process.env.HOME}/serv00-play/singbox`;
    const singboxConfigPath = `${singboxDir}/singbox.json`;
    const configPath = `${singboxDir}/config.json`;

    // 检查配置文件是否存在
    if (!fs.existsSync(singboxConfigPath) || !fs.existsSync(configPath)) {
        console.error("未安装节点，请先安装!");
        return false;
    }

    try {
        // 更新 singbox 配置文件中的 IP 地址
        const singboxConfig = JSON.parse(fs.readFileSync(singboxConfigPath, 'utf8'));
        singboxConfig.HY2IP = ip;
        fs.writeFileSync(singboxConfigPath, JSON.stringify(singboxConfig, null, 2));

        // 更新 config.json 配置文件中的 listen 字段
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const inbounds = config.inbounds.find((ib) => ib.tag === 'hysteria-in');
        if (inbounds) {
            inbounds.listen = ip;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        }

        console.log(`HY2 更换IP成功，当前IP为 ${ip}`);
        console.log("正在重启sing-box...");

        // 停止并重启服务
        stopCommand();
        setTimeout(() => {
            runShellCommand();  // 3秒后启动
            console.log("sing-box 已重启。");
        }, 3000);  

        return true; // 配置更新并重启成功
    } catch (err) {
        console.error("更新配置文件失败!", err.message);
        return false; // 配置更新失败
    }
}

// 获取并检查可用的 IP，然后更新配置并重启
async function changeHy2IPWithUnblockCheck(req, res) {
    const hostname = os.hostname();
    const hostNumber = hostname.match(/s(\d+)/) ? hostname.match(/s(\d+)/)[1] : '00';
    const hosts = [`cache${hostNumber}.serv00.com`, `web${hostNumber}.serv00.com`, `s${hostNumber}.serv00.com`];

    try {
        const ip = await getUnblockIP(hosts); // 获取可用的 IP
        if (!ip) {
            console.error("很遗憾，未找到可用的IP!");
            return res.type("html").send("未找到可用的IP，请稍后再试。"); // 如果没有找到可用 IP
        }

        const success = updateConfigAndRestart(ip); // 更新配置并重启服务
        if (!success) {
            console.error("操作失败，请检查配置!");
            return res.type("html").send("操作失败，请检查配置文件或联系管理员。"); // 如果操作失败
        }

        res.type("html").send(`<pre>当前 IP 更新成功，新的 IP 为 ${ip}</pre>`); // 成功后反馈更新结果
    } catch (err) {
        console.error("发生错误:", err.message);
        res.type("html").send("<pre>操作失败，请稍后再试。</pre>");
    }
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
                    <button onclick="window.location.href='/hy2ip'">更新IP</button>
                    <button onclick="window.location.href='/node'">节点信息</button>
                    <button onclick="window.location.href='/log'">实时日志</button>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.get("/hy2ip", changeHy2IPWithUnblockCheck);

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
                    <pre><b>进程详情:</b>\n</pre>
                    <div class="scrollable">
                        <pre>${processOutput}</pre>
                    </div>
                </body>
            </html>
        `);
    });
});
app.use((req, res, next) => {
    const validPaths = ["/info", "/hy2ip","/node", "/log"];
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
