const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const WebSocket = require('ws');
const https = require('https');
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
        return res.status(403).send('Password not set. Please set the password first.');
    }

    if (enteredPassword !== storedPassword) {
        return res.send('Incorrect password. <a href="/webssh?setup=true">Set password</a>');
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WebSSH</title>
            <style>
                body {
                    font-family: monospace;
                    background-color: #282c34;
                    color: #f8f8f2;
                    padding: 20px;
                }
                input, button {
                    padding: 10px;
                    margin: 10px;
                }
                #terminal {
                    width: 100%;
                    height: 300px;
                    background-color: #111;
                    color: #fff;
                    padding: 10px;
                    overflow-y: scroll;
                }
                #command {
                    width: 100%;
                    padding: 10px;
                    margin: 5px 0;
                }
            </style>
        </head>
        <body>
            <h1>WebSSH</h1>

            <div id="passwordSetup" style="display: none;">
                <h2>Set a Password</h2>
                <p>Please set a password for the terminal access.</p>
                <input type="password" id="password" placeholder="Enter new password" />
                <button onclick="setPassword()">Set Password</button>
            </div>

            <div id="terminalContainer" style="display: none;">
                <h2>Terminal</h2>
                <div id="terminal"></div>
                <input type="text" id="command" placeholder="Enter command" />
                <button onclick="sendCommand()">Send Command</button>
            </div>

            <script>
                const urlParams = new URLSearchParams(window.location.search);
                const enteredPassword = urlParams.get('password');
                const storedPassword = localStorage.getItem('password');

                if (!storedPassword) {
                    document.getElementById('passwordSetup').style.display = 'block';
                    document.getElementById('terminalContainer').style.display = 'none';
                } else {
                    if (enteredPassword !== storedPassword) {
                        alert('Incorrect password!');
                        window.location.href = '/webssh?setup=true';
                    } else {
                        document.getElementById('passwordSetup').style.display = 'none';
                        document.getElementById('terminalContainer').style.display = 'block';
                        connectWebSocket();
                    }
                }

                function setPassword() {
                    const password = document.getElementById('password').value;

                    if (!password) {
                        alert('Please enter a password!');
                        return;
                    }

                    localStorage.setItem('password', password);

                    fetch('/set-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password })
                    })
                    .then(response => {
                        if (response.ok) {
                            alert('Password set successfully!');
                            window.location.href = '/webssh?password=' + password;
                        } else {
                            alert('Error setting password.');
                        }
                    })
                    .catch(err => {
                        console.error('Error:', err);
                        alert('An error occurred.');
                    });
                }

                let ws;

                function connectWebSocket() {
                    ws = new WebSocket('wss://' + window.location.host + '/webssh');
                    
                    ws.onopen = function () {
                        console.log('WebSocket connected');
                    };

                    ws.onmessage = function (event) {
                        document.getElementById('terminal').innerText += event.data + '\\n';
                        document.getElementById('terminal').scrollTop = document.getElementById('terminal').scrollHeight;
                    };

                    ws.onerror = function (error) {
                        console.log('WebSocket Error: ' + error);
                    };

                    ws.onclose = function () {
                        console.log('WebSocket closed');
                    };
                }

                function sendCommand() {
                    const command = document.getElementById('command').value;
                    
                    if (command) {
                        ws.send(command);
                        document.getElementById('command').value = ''; 
                    }
                }
            </script>
        </body>
        </html>
    `);
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
    
    ws.on('message', (message) => {
        console.log('Received command: ', message);
        
        exec(message, (error, stdout, stderr) => {
            if (error) {
                ws.send(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                ws.send(`stderr: ${stderr}`);
                return;
            }
            ws.send(stdout);  
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// HTTPS 服务器设置
const options = {
    key: fs.readFileSync('server.key'),  // 服务器私钥
    cert: fs.readFileSync('server.cert') // 服务器证书
};

https.createServer(options, app).listen(port, () => {
    console.log(`Server is running on https://localhost:${port}`);
});

app.server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});