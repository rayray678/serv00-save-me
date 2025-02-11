require('dotenv').config(); // 引入 dotenv 库并加载 .env 文件，用于读取环境变量

const express = require('express'); // 引入 express 框架
const basicAuth = require('basic-auth-connect'); // 引入 basic-auth-connect 中间件，用于HTTP基本认证
const path = require('path'); // 引入 path 模块，用于处理文件路径
const fs = require('fs'); // 引入 fs 模块，用于文件系统操作
const { exec } = require('child_process'); // 引入 child_process 模块的 exec 函数，用于执行系统命令
const TelegramBot = require('node-telegram-bot-api'); // 引入 node-telegram-bot-api 库，用于 Telegram Bot 功能

const app = express(); // 创建 express 应用实例
const port = 80; // 定义服务器监听端口为 80

//  从 .env 文件中读取 Telegram Bot Token 和 Chat ID 环境变量
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

// 初始化 Telegram Bot 实例
let bot;
if (telegramBotToken && telegramChatId) { // 检查是否配置了 Bot Token 和 Chat ID
    bot = new TelegramBot(telegramBotToken); // 如果配置了，则初始化 Telegram Bot
    console.log("Telegram Bot 初始化成功"); // 打印日志，表示 Telegram Bot 初始化成功
} else {
    console.log("未配置 Telegram Bot Token 或 Chat ID，Telegram 通知功能将不可用。"); // 打印警告日志，提示 Telegram 通知功能将不可用
}

// 日志记录函数：将日志信息写入文件和控制台
function logMessage(message) {
    const timestamp = new Date().toLocaleString(); // 获取当前时间戳
    const logEntry = `[${timestamp}] ${message}\n`; // 构建日志条目，包含时间戳和消息内容
    fs.appendFile('app.log', logEntry, err => { // 将日志条目追加写入到 app.log 文件
        if (err) console.error('日志记录失败:', err); // 如果写入失败，则打印错误日志到控制台
    });
    console.log(logEntry.trim()); // 将日志消息打印到控制台 (去除尾部空格和换行符)
}

// 执行系统命令函数：封装 exec 函数，并记录命令输出和错误
function executeCommand(command, scriptName, logOutput = true) {
    return new Promise((resolve, reject) => { // 返回 Promise 对象，以便异步处理命令执行结果
        exec(command, (err, stdout, stderr) => { // 执行系统命令
            if (logOutput && stdout) logMessage(`[${scriptName}] STDOUT: ${stdout.trim()}`); // 如果需要记录输出且有标准输出，则记录标准输出
            if (stderr) logMessage(`[${scriptName}] STDERR: ${stderr.trim()}`); // 如果有标准错误输出，则记录标准错误输出
            if (err) { // 如果命令执行出错
                logMessage(`[${scriptName}] 执行错误: ${err}`); // 记录错误日志
                reject(err); // Reject Promise，传递错误信息
            } else { // 如果命令执行成功
                resolve(stdout); // Resolve Promise，传递标准输出
            }
        });
    });
}


// 获取当前运行的所有进程名 (动态进程列表)
async function getMonitoredProcesses() {
    try {
        const stdout = await executeCommand('ps ax -o comm=', 'getProcesses', false); // 执行 `ps ax -o comm=` 命令，只获取进程名，不记录详细输出
        const processes = stdout.trim().split('\n').filter(line => line.trim() !== '' && !line.includes('getProcesses') && !line.includes('app.js') && !line.includes('node')); // 过滤掉空行，自身脚本进程，和 node 进程 (避免监控自身和node父进程)
        const uniqueProcesses = [...new Set(processes)]; // 使用 Set 去重，只监控唯一的进程名
        return uniqueProcesses; // 返回去重后的进程名数组
    } catch (error) {
        logMessage('获取进程列表失败: ' + error); // 记录错误日志
        return []; // 返回空数组，表示获取进程列表失败
    }
}


// 检查指定进程是否正在运行
async function checkProcess(processName) {
    try {
        const stdout = await executeCommand(`pgrep "${processName}"`, `checkProcess_${processName}`, false); // 执行 `pgrep` 命令检查进程是否存在，不记录详细输出
        return !!stdout.trim(); // 如果 `pgrep` 返回结果 (即有输出)，则进程正在运行，返回 true，否则返回 false
    } catch (error) {
        // pgrep 如果找不到进程会返回错误，这里捕获错误并返回 false
        return false; // 捕获错误，表示进程未运行
    }
}

// 发送 Telegram 消息函数
async function sendTelegramMessage(message) {
    if (bot) { // 检查 Telegram Bot 实例是否已初始化
        try {
            await bot.sendMessage(telegramChatId, message); // 使用 Telegram Bot API 发送消息到指定 Chat ID
            logMessage(`Telegram Message sent: ${message}`); // 记录 Telegram 消息发送日志
        } catch (error) {
            logMessage(`Error sending Telegram message: ${error}`); // 记录 Telegram 消息发送错误日志
        }
    } else {
        logMessage("Telegram Bot 未初始化，无法发送消息。"); // 如果 Telegram Bot 未初始化，则记录警告日志
    }
}


let processStatus = {}; //  进程状态记录对象，用于存储每个进程的上一次运行状态，key: 进程名, value: { running: boolean, lastCheck: Date }

// 监控所有进程状态函数 (核心监控逻辑)
async function monitorProcesses() {
    const processesToMonitor = await getMonitoredProcesses(); // 获取当前正在运行的所有进程名
    logMessage('当前监控进程列表: ' + processesToMonitor.join(', ')); // 记录当前监控的进程列表

    for (const processName of processesToMonitor) { // 遍历每个需要监控的进程名
        const isRunning = await checkProcess(processName); // 检查当前进程是否正在运行
        const lastStatus = processStatus[processName]; // 获取该进程的上一次状态

        if (isRunning) { // 如果进程当前正在运行
            if (!lastStatus || !lastStatus.running) { // 如果上次状态记录不存在，或者上次记录为进程未运行
                logMessage(`进程 ${processName} 已恢复运行`); // 记录进程恢复运行日志
                sendTelegramMessage(`✅ 进程 ${processName} 已恢复运行！`); // 发送 Telegram 通知：进程已恢复运行
            }
            processStatus[processName] = { running: true, lastCheck: new Date() }; // 更新进程状态记录为正在运行，并更新上次检查时间
        } else { // 如果进程当前未运行
            if (lastStatus && lastStatus.running) { // 如果上次状态记录存在，且上次记录为进程正在运行
                logMessage(`进程 ${processName} 已被杀掉`); // 记录进程被杀掉日志
                sendTelegramMessage(`❌ 进程 ${processName} 已被杀掉！`); // 发送 Telegram 通知：进程已被杀掉
            }
            processStatus[processName] = { running: false, lastCheck: new Date() }; // 更新进程状态记录为未运行，并更新上次检查时间
        }
    }
}


// 设置每 5 分钟 (300000 毫秒) 执行一次进程状态监控
setInterval(monitorProcesses, 300000);
monitorProcesses(); // 立即执行一次进程监控，以便在服务启动时立即获取进程状态并开始监控


//  HY2IP 更新路由 (保留原有功能)
app.get('/hy2ip', async (req, res) => {
    const username = process.env.USER.toLowerCase(); // 获取当前用户名并转换为小写
    const scriptPath = path.join(__dirname, 'hy2ip.sh'); // 构建 hy2ip.sh 脚本的完整路径

    try {
        const stdout = await executeCommand(`/bin/bash ${scriptPath}`, 'hy2ip.sh'); // 执行 hy2ip.sh 脚本
        let current_ip = 'N/A'; // 初始化当前 IP 地址为 N/A
        const ipMatch1 = stdout.match(/SingBox 配置文件成功更新IP为: (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/); // 使用正则匹配 SingBox 配置更新 IP 的输出
        const ipMatch2 = stdout.match(/Config 配置文件成功更新IP为: (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/); // 使用正则匹配 Config 配置更新 IP 的输出

        if (ipMatch1) {
            current_ip = ipMatch1[1]; // 从匹配结果中提取 IP 地址 (SingBox)
        } else if (ipMatch2) {
            current_ip = ipMatch2[1]; // 从匹配结果中提取 IP 地址 (Config)
        }

        res.type("html").send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>HY2IP 更新</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { width: 80%; margin: auto; padding-top: 20px; }
                    .output { margin-top: 20px; padding: 15px; border: 1px solid #ccc; background-color: #f9f9f9; white-space: pre-wrap; word-wrap: break-word; }
                    .button { padding: 10px 20px; background-color: #007bff; color: white; border: none; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>HY2IP 更新</h1>
                    <p>执行 hy2ip.sh 脚本以更新 HY2IP 地址。</p>
                    <button class="button" onclick="window.location.reload();">重新更新 HY2IP</button>
                    <div class="output">
                        <p><strong>执行结果:</strong></p>
                        <pre>${stdout}</pre>
                        <p><strong>当前 IP 地址:</strong> ${current_ip}</p>
                    </div>
                </div>
            </body>
            </html>
        `); // 返回包含执行结果和当前 IP 地址的 HTML 页面
    } catch (error) {
        res.type("html").send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>HY2IP 更新失败</title>
                <style>
                    body { font-family: Arial, sans-serif; color: red; }
                    .container { width: 80%; margin: auto; padding-top: 20px; }
                    .output { margin-top: 20px; padding: 15px; border: 1px solid red; background-color: #f9f9f9; white-space: pre-wrap; word-wrap: break-word; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>HY2IP 更新失败</h1>
                    <p>执行 hy2ip.sh 脚本时发生错误，请检查日志。</p>
                    <div class="output">
                        <p><strong>错误信息:</strong></p>
                        <pre>${error}</pre>
                    </div>
                </div>
            </body>
            </html>
        `); // 返回包含错误信息的 HTML 页面
    }
});


// Sing-box 状态路由 (保留原有功能)
app.get('/singbox', async (req, res) => {
    const filePath = path.join(process.env.HOME, "serv00-play/singbox/list"); // 构建 singbox 节点列表文件路径

    fs.readFile(filePath, 'utf8', (err, data) => { // 读取 singbox 节点列表文件
        if (err) {
            return res.status(500).send('无法读取 Sing-box 节点信息'); // 如果读取失败，返回 500 错误
        }

        const lines = data.trim().split('\n'); // 将文件内容按行分割
        const formattedOutput = lines.map(line => `<p>${line}</p>`).join(''); // 将每行内容包裹在 <p> 标签中

        res.type("html").send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Sing-box 节点信息</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { width: 80%; margin: auto; padding-top: 20px; }
                    .output { margin-top: 20px; padding: 15px; border: 1px solid #ccc; background-color: #f9f9f9; white-space: pre-wrap; word-wrap: break-word; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Sing-box 节点信息</h1>
                    <div class="output">
                        ${formattedOutput}
                    </div>
                </div>
            </body>
            </html>
        `); // 返回包含格式化节点信息的 HTML 页面
    });
});

// 日志查看路由 (保留原有功能)
app.get('/logs', async (req, res) => {
    fs.readFile('app.log', 'utf8', (err, data) => { // 读取 app.log 日志文件
        if (err) {
            return res.status(500).send('无法读取日志文件'); // 如果读取失败，返回 500 错误
        }
        res.type("html").send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>App Logs</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { width: 80%; margin: auto; padding-top: 20px; }
                    .output { margin-top: 20px; padding: 15px; border: 1px solid #ccc; background-color: #f9f9f9; white-space: pre-wrap; word-wrap: break-word; height: 600px; overflow-y: scroll; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>App Logs</h1>
                    <div class="output">
                        <pre>${data}</pre>
                    </div>
                </div>
            </body>
            </html>
        `); // 返回包含日志内容的 HTML 页面，并设置高度和滚动条
    });
});

// OTA 更新路由 (保留原有功能)
app.get('/ota', async (req, res) => {
    const otaScriptPath = path.join(__dirname, 'ota.sh'); // 构建 ota.sh 脚本路径

    try {
        const stdout = await executeCommand(`/bin/bash ${otaScriptPath}`, 'ota.sh'); // 执行 ota.sh 脚本
        res.type("html").send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>OTA 更新</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { width: 80%; margin: auto; padding-top: 20px; }
                    .output { margin-top: 20px; padding: 15px; border: 1px solid #ccc; background-color: #f9f9f9; white-space: pre-wrap; word-wrap: break-word; }
                    .button { padding: 10px 20px; background-color: #007bff; color: white; border: none; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>OTA 更新</h1>
                    <p>执行 ota.sh 脚本进行 OTA (Over-The-Air) 更新。</p>
                    <button class="button" onclick="window.location.reload();">重新执行 OTA 更新</button>
                    <div class="output">
                        <p><strong>执行结果:</strong></p>
                        <pre>${stdout}</pre>
                    </div>
                </div>
            </body>
            </html>
        `); // 返回包含 OTA 更新执行结果的 HTML 页面
    } catch (error) {
        res.type("html").send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>OTA 更新失败</title>
                <style>
                    body { font-family: Arial, sans-serif; color: red; }
                    .container { width: 80%; margin: auto; padding-top: 20px; }
                    .output { margin-top: 20px; padding: 15px; border: 1px solid red; background-color: #f9f9f9; white-space: pre-wrap; word-wrap: break-word; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>OTA 更新失败</h1>
                    <p>执行 ota.sh 脚本时发生错误，请检查日志。</p>
                    <div class="output">
                        <p><strong>错误信息:</strong></p>
                        <pre>${error}</pre>
                    </div>
                </div>
            </body>
            </html>
        `); // 返回包含 OTA 更新失败错误信息的 HTML 页面
    }
});

// 信息页面路由 (保留原有功能)
app.get('/info', basicAuth({ //  信息页面需要 basicAuth 认证才能访问
    users: { 'admin': 'password' }, //  请更改为更安全的认证方式
    unauthorizedResponse: (req) => { //  自定义未授权响应
        return `<h1>Authentication required</h1><p>Please use "admin" as username and "password" as password to access this page.</p>`; //  返回 HTML 格式的未授权提示信息
    }
}), async (req, res) => { //  信息页面路由处理函数
    const uptimeStdout = await executeCommand('uptime', 'uptime', false); // 执行 uptime 命令，获取系统运行时间，不记录详细输出
    const freeStdout = await executeCommand('free -m', 'freemem', false); // 执行 free -m 命令，获取内存使用情况，不记录详细输出
    const dfStdout = await executeCommand('df -h', 'diskspace', false); // 执行 df -h 命令，获取磁盘空间使用情况，不记录详细输出
    const processesStdout = await executeCommand('ps aux', 'processes', false); // 执行 ps aux 命令，获取所有进程列表，不记录详细输出

    res.type("html").send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>服务信息</title>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { width: 80%; margin: auto; padding-top: 20px; }
                .output { margin-top: 20px; padding: 15px; border: 1px solid #ccc; background-color: #f9f9f9; white-space: pre-wrap; word-wrap: break-word; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>服务信息</h1>
                <div class="output">
                    <h2>系统运行时间</h2>
                    <pre>${uptimeStdout}</pre>
                </div>
                <div class="output">
                    <h2>内存使用情况</h2>
                    <pre>${freeStdout}</pre>
                </div>
                <div class="output">
                    <h2>磁盘空间使用情况</h2>
                    <pre>${dfStdout}</pre>
                </div>
                <div class="output">
                    <h2>当前进程列表 (Top Processes)</h2>
                    <pre>${processesStdout}</pre>
                </div>
            </div>
        </body>
        </html>
    `); // 返回包含系统运行时间、内存使用情况、磁盘空间使用情况和进程列表的 HTML 页面
});


// 首页路由 - 需要 Basic Authentication 认证 (保留原有认证)
app.get('/', basicAuth({
    users: { 'admin': 'password' }, //  默认用户名密码，请务必更改为更安全的认证方式
    unauthorizedResponse: (req) => { // 自定义未授权时的响应
        return `<h1>Authentication required</h1><p>Please use "admin" as username and "password" as password to access this page.</p>`; //  返回 HTML 格式的认证提示信息
    }
}), (req, res) => { //  首页路由处理函数，需要通过 Basic Authentication 才能访问
    res.type("html").send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>保活服务控制面板</title>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { width: 80%; margin: auto; padding-top: 20px; }
                .button-container { margin-top: 20px; }
                .button { padding: 10px 20px; margin-right: 10px; background-color: #007bff; color: white; border: none; cursor: pointer; }
                .output { margin-top: 20px; padding: 15px; border: 1px solid #ccc; background-color: #f9f9f9; white-space: pre-wrap; word-wrap: break-word; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>保活服务控制面板</h1>
                <p>欢迎使用保活服务控制面板，您可以在这里管理和监控服务状态。</p>

                <div class="button-container">
                    <button class="button" onclick="location.href='/hy2ip'">更新 HY2IP</button>
                    <button class="button" onclick="location.href='/singbox'">Sing-box 节点</button>
                    <button class="button" onclick="location.href='/logs'">查看日志</button>
                    <button class="button" onclick="location.href='/ota'">OTA 更新</button>
                    <button class="button" onclick="location.href='/info'">服务信息</button>
                </div>

                <div class="output">
                    <p><strong>服务状态:</strong> 运行中</p>
                    <p><strong>监控状态:</strong> 进程监控已启用，每 5 分钟检测一次。</p>
                    <p><strong>Telegram 通知:</strong> ${bot ? '\033[0;32m已启用\033[0m' : '\033[0;31m未启用\033[0m'} (请检查日志确认)</p>
                </div>
            </div>
        </body>
        </html>
    `); // 返回包含控制面板和基本服务状态信息的 HTML 页面，并根据 Telegram Bot 初始化状态显示启用/未启用信息
});


// 启动 Express 服务器
app.listen(port, () => {
    logMessage(`Server listening on port ${port}`); // 记录服务器启动日志
    if (bot) { // 检查 Telegram Bot 是否初始化成功
        sendTelegramMessage("🎉 保活服务已启动并开始监控进程..."); // 如果初始化成功，发送 Telegram 启动通知
    }
});
