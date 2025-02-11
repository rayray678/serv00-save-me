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

//  将 monitoredProcesses 修改为 let 变量，初始值为空数组，以便动态更新
let monitoredProcesses = []; //  初始为空数组，后续通过 API 动态添加进程

//  Telegram Bot 配置 (保持不变)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

let telegramBot = null; // 初始化 telegramBot 变量

if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN);
    logMessage("Telegram Bot 已成功初始化。");
} else {
    logMessage("未配置 Telegram Bot Token 或 Chat ID，Telegram 通知功能将不会启用。");
}


//  Basic Auth 配置 (从环境变量读取，如果没有则不启用)
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;
const basicAuthMiddleware = basicAuth(BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD); //  获取 Basic Auth 中间件


if (BASIC_AUTH_USERNAME && BASIC_AUTH_PASSWORD) {
    app.use(basicAuthMiddleware); //  全局启用 Basic Auth
    logMessage("Basic Auth 已启用。");
} else {
    logMessage("Basic Auth 未配置，将不会启用身份验证。");
}


//  日志记录函数 (保持不变)
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
