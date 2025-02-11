require('dotenv').config();
const express = require('express');
const basicAuth = require('basic-auth-connect');
const os = require('os');
const fs = require('fs');
const util = require('util');
const child_process = require('child_process');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = 3000;

//  将 monitoredProcesses 修改为 let 变量，初始值为空数组，以便动态更新
let monitoredProcesses = []; //  初始为空数组，后续通过 API 动态添加进程

//  Telegram Bot 配置 (保持不变)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

let telegramBot = null; // 初始化 telegramBot 变量

if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN);
    logMessage("Telegram Bot 已成功初始化。");
} else {
    logMessage("未配置 Telegram Bot Token 或 Chat ID，Telegram 通知功能将不会启用。");
}


//  Basic Auth 配置 (从环境变量读取，如果没有则不启用)
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;
const basicAuthMiddleware = basicAuth(BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD); //  获取 Basic Auth 中间件


if (BASIC_AUTH_USERNAME && BASIC_AUTH_PASSWORD) {
    app.use(basicAuthMiddleware); //  全局启用 Basic Auth
    logMessage("Basic Auth 已启用。");
} else {
    logMessage("Basic Auth 未配置，将不会启用身份验证。");
}


//  日志记录函数 (保持不变)
function logMessage(message) {
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] - ${message}\n`;
    const htmlLogEntry = `<p>[${timestamp}] - ${message}</p>\n`;

    fs.appendFile('runtime.log', logEntry, err => {
        if (err) {
            console.error('写入日志文件失败:', err);
        }
    });
    fs.appendFile('log.html', htmlLogEntry, err => {
        if (err) {
            console.error('写入 HTML 日志文件失败:', err);
        }
    });
    console.log(logEntry.trim());
}

//  执行系统命令函数 (保持不变)
const exec = util.promisify(child_process.exec);

async function executeCommand(command, description, ignoreError, callback) {
    logMessage(`==> 开始执行 ${description}...`);
    logMessage(`==> 执行命令: ${command}`);
    try {
        const { stdout, stderr } = await exec(command);
        if (stderr && !ignoreError) {
            logMessage(`==> ${description} 命令 STDERR: \n${stderr}`);
        }
        if (stdout) {
            logMessage(`==> ${description} 命令 STDOUT: \n${stdout}`);
        }
        logMessage(`==> ${description} 命令执行成功`);
        callback(stdout);
        return stdout;
    } catch (error) {
        logMessage(`==> ${description} 命令执行失败`);
        if (!ignoreError) {
            logMessage(`==> 错误信息: ${error}`);
        }
        callback(null);
        return null;
    }
}


//  发送 Telegram 消息函数 (保持不变)
function sendTelegramMessage(message) {
    if (telegramBot && TELEGRAM_CHAT_ID) {
        telegramBot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' })
            .then(() => {
                logMessage(`Telegram 消息发送成功: ${message}`);
            })
            .catch((error) => {
                logMessage(`Telegram 消息发送失败: ${error.message}`);
                console.error("Telegram 消息发送错误:", error);
            });
    } else {
        logMessage("Telegram Bot 未初始化或 Chat ID 未配置，无法发送消息。");
    }
}


//  检查指定进程是否正在运行函数 (保持不变)
function checkProcess(processName, callback) {
    const command = `pgrep "${processName}"`;
    executeCommand(command, `检查进程 ${processName} 是否运行`, true, (output) => {
        const isRunning = !!output.trim();
        callback(isRunning);
    });
}


//  重新拉起哪吒面板进程函数 (保持不变)
function restartNezhaAgentProcess() {
    const username = process.env.USER.toLowerCase();
    const restartCommand = `nohup /home/${username}/nezha_app/agent/nezha-agent -c /home/${username}/nezha_app/agent/config.yml > /dev/null 2>&1 &`;
    executeCommand(restartCommand, "重启 NZ-Agent 进程", false, (output) => {
        if (output) {
            logMessage("NZ-Agent 进程重启成功。");
            sendTelegramMessage("✅  **通知**：NZ-Agent 进程已自动重启成功并恢复运行。");
        } else {
            logMessage("NZ-Agent 进程重启失败，请检查日志。");
            sendTelegramMessage("❌  **错误**：NZ-Agent 进程重启失败，请检查日志！");
        }
    });
}


//  定时监控所有指定进程函数 (保持不变)
function monitorAllProcesses() {
    monitoredProcesses.forEach(processName => {
        checkProcess(processName, (isRunning) => {
            if (!isRunning) {
                logMessage(`检测到进程 ${processName} 未运行。`);
                sendTelegramMessage(`⚠️  **警告**：检测到进程 **${processName}** 未运行。`);

                if (processName === 'nezha-agent') {
                    logMessage("检测到 NZ-Agent 未运行，尝试自动重启...");
                    sendTelegramMessage(`⚠️  **警告**：检测到 NZ-Agent 进程未运行，尝试自动重启...`);
                    restartNezhaAgentProcess();
                }
            } else {
                logMessage(`进程 ${processName} 正在运行。`);
            }
        });
    });
}


//  HY2_IP 更新接口 (保持不变)
app.get('/hy2ip', basicAuthMiddleware, async (req, res) => {
    logMessage("收到 /hy2ip 请求，开始更新 HY2_IP...");
    executeCommand('/usr/bin/bash /home/octaviojacinta1/hy2ip.sh', "更新 HY2_IP", false, (output) => {
        if (output) {
            res.send({ message: 'HY2_IP 更新成功', output: output.trim() });
        } else {
            res.status(500).send({ message: 'HY2_IP 更新失败，请检查日志', error: 'HY2_IP 更新脚本执行失败' });
        }
    });
});

//  节点信息页面 (保持不变)
app.get('/node', basicAuthMiddleware, (req, res) => {
    fs.readFile('node.html', 'utf8', (err, html) => {
        if (err) {
            console.error('读取 node.html 文件失败:', err);
            return res.status(500).send('Error loading node information page');
        }
        res.send(html);
    });
});

//  日志页面 (保持不变)
app.get('/log', basicAuthMiddleware, (req, res) => {
    fs.readFile('log.html', 'utf8', (err, html) => {
        if (err) {
            console.error('读取 log.html 文件失败:', err);
            return res.status(500).send('Error loading log page');
        }
        res.send(html);
    });
});

//  OTA 更新接口 (保持不变)
app.get('/ota', basicAuthMiddleware, async (req, res) => {
    logMessage("收到 /ota 请求，开始执行 OTA 更新...");
    executeCommand('/usr/bin/bash /home/octaviojacinta1/ota.sh', "OTA 更新", false, (output) => {
        if (output) {
            res.send({ message: 'OTA 更新执行成功，请查看日志', output: output.trim() });
        } else {
            res.status(500).send({ message: 'OTA 更新执行失败，请检查日志', error: 'OTA 更新脚本执行失败' });
        }
    });
});


//  API 接口：获取当前监控进程列表 (需要 Basic Auth 认证)
app.get('/monitored_processes', basicAuthMiddleware, (req, res) => { //  添加 basicAuthMiddleware
    res.json(monitoredProcesses);
});

//  API 接口：添加新的监控进程 (需要 Basic Auth 认证)
app.post('/monitored_processes', basicAuthMiddleware, express.json(), (req, res) => { //  添加 basicAuthMiddleware
    const { processName } = req.body;
    // ... (接口处理逻辑，保持不变)
    if (!processName) {
        return res.status(400).send({ message: '进程名称不能为空' });
    }

    if (monitoredProcesses.includes(processName)) {
        return res.status(409).send({ message: `进程 ${processName} 已在监控列表中，请勿重复添加` });
    }

    monitoredProcesses.push(processName);
    logMessage(`已添加进程 ${processName} 到监控列表`);
    res.send({ message: `成功添加进程 ${processName} 到监控列表` });
});


//  API 接口：删除监控进程 (需要 Basic Auth 认证)
app.delete('/monitored_processes', basicAuthMiddleware, express.json(), (req, res) => { //  添加 basicAuthMiddleware
    const { processName } = req.body;
    // ... (接口处理逻辑，保持不变)
    if (!processName) {
        return res.status(400).send({ message: '进程名称不能为空' });
    }

    const index = monitoredProcesses.indexOf(processName);
    if (index === -1) {
        return res.status(404).send({ message: `进程 ${processName} 不在监控列表中` });
    }

    monitoredProcesses.splice(index, 1);
    logMessage(`已从监控列表移除进程 ${processName}`);
    res.send({ message: `成功从监控列表移除进程 ${processName}` });
});


//  Info 页面 (保持不变)
app.get('/info', basicAuthMiddleware, (req, res) => {
    const uptime = process.uptime();
    const minutes = Math.floor(uptime / 60);
    const seconds = Math.floor(uptime % 60);
    const cpuUsage = process.cpuUsage().user / 1000000;
    const memUsage = process.memoryUsage().rss / (1024 * 1024);

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Serv00 服务状态</title>
        <style>
            body { font-family: sans-serif; }
            .container { width: 80%; margin: 0 auto; padding: 20px; }
            h1, h2 { color: #333; }
            p { line-height: 1.6; }
            .status-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            .status-text { font-weight: bold; }
            .button-container { margin-top: 20px; }
            .button { padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; margin-right: 10px; }
            .button:hover { background-color: #0056b3; }
            .log-link { display: block; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Serv00 服务状态监控页</h1>
            <div class="status-box">
                <h2>服务运行状态</h2>
                <p><span class="status-text">SingBox 状态:</span> <span id="singbox-status">SingBox 已复活</span></p>
                <p><span class="status-text">HtmlOnLive 状态:</span> <span id="htmlonlive-status">HtmlOnLive 守护中</span></p>
                <p><span class="status-text">Uptime:</span> ${minutes} 分 ${seconds} 秒</p>
                <p><span class="status-text">CPU 使用率:</span> ${cpuUsage.toFixed(2)}%</p>
                <p><span class="status-text">内存使用量:</span> ${memUsage.toFixed(2)} MB</p>
            </div>

            <div class="button-container">
                <a href="/hy2ip" class="button">更新 HY2_IP</a>
                <a href="/ota" class="button">OTA 更新</a>
            </div>

            <a href="/log" class="log-link">查看日志</a>
            <a href="/node" class="log-link">节点信息</a>
            <a href="/monitored_processes" class="log-link">监控进程列表</a>`;
});


//  启动 Express 应用 (保持不变)
app.listen(port, () => {
    logMessage(`Serv00 App 运行在端口 ${port}`);
    logMessage(`保活信息页面: https://${os.hostname()}:${port}/info`);
    logMessage(`日志查看页面: https://${os.hostname()}:${port}/log`);
    logMessage(`节点信息页面: https://${os.hostname()}:${port}/node`);
});
