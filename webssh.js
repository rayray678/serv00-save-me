const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const WebSocket = require('ws');
const app = express();
const port = 3000;

const passwordFilePath = path.join(__dirname, 'password.json');

// 读取密码文件
function getPassword() {
    if (fs.existsSync(passwordFilePath)) {
        const passwordData = fs.readFileSync(passwordFilePath);
        const parsedData = JSON.parse(passwordData);
        return parsedData.password;
    }
    return null;
}

// 路由：WebSSH页面
app.get('/webssh', (req, res) => {
    const enteredPassword = req.query.password;
    const storedPassword = getPassword();

    if (!storedPassword) {
        return res.redirect('/webssh?setup=true');  // 若没有设置密码，则强制设置
    }

    if (enteredPassword !== storedPassword) {
        return res.send('Incorrect password. <a href="/webssh?setup=true">Set password</a>');
    }

    res.sendFile(path.join(__dirname, 'webssh.html'));  // 密码验证通过，显示 WebSSH 终端
});

// 路由：设置密码页面
app.get('/webssh?setup=true', (req, res) => {
    res.sendFile(path.join(__dirname, 'webssh.html'));
});

// 路由：保存设置的密码
app.post('/set-password', express.json(), (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).send('Password is required');
    }

    fs.writeFileSync(passwordFilePath, JSON.stringify({ password }));
    res.sendStatus(200);
});

// WebSocket 服务器
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // 监听前端发送的命令
    ws.on('message', (message) => {
        console.log('Received command: ', message);
        
        // 执行命令并返回输出
        exec(message, (error, stdout, stderr) => {
            if (error) {
                ws.send(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                ws.send(`stderr: ${stderr}`);
                return;
            }
            ws.send(stdout);  // 将命令执行结果发送到前端
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// 在 HTTP 服务器上升级 WebSocket连接
app.server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});