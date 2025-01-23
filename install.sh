#!/bin/bash
U1=$(whoami)
U1=$(echo "$U1" | tr '[:upper:]' '[:lower:]')
if [[ -z "$U1" ]]; then
    echo "未能获取当前用户名，退出。"
    exit 1
fi
echo ""
D1="$U1.serv00.net"
P1=3000
R1="/home/$U1/domains"
D2="$R1/$D1"
N1="$D2/public_nodejs"
F1="$N1/app.js"
L1="https://raw.githubusercontent.com/ryty1/sver00-save-me/refs/heads/main/app.js"
echo " ———————————————————————————————————————————————————————————— "
devil www del "$D1" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
    echo " [OK] 默认域名 删除成功 "
else
    echo "默认域名 删除失败 "
fi

if [[ -d "$D2" ]]; then
    rm -rf "$D2"
fi

if devil www add "$D1" nodejs /usr/local/bin/node22 > /dev/null 2>&1; then
    echo " [OK] 类型域名 创建成功 "
else
    echo "域名生成失败，请检查环境设置。"
    exit 1
fi

if [[ ! -d "$N1" ]]; then
    mkdir -p "$N1"
fi

if npm install dotenv basic-auth express > /dev/null 2>&1; then
    echo " [OK] 环境依赖 安装成功"
else
    echo "依赖安装失败，请检查 Node.js 环境。"
    exit 1
fi

if curl -s -o "$F1" "$L1"; then
    echo " [OK] 配置文件 下载成功 "
else
    echo "配置文件下载失败，请检查 URL。"
    exit 1
fi
echo " ———————————————————————————————————————————————————————————— "
echo ""
echo " 【 恭 喜 】： 网 页 保 活 一 键 部 署 已 完 成  "
echo " ———————————————————————————————————————————————————————————— "
echo " |**保活网页 https://$D1/info "
echo ""
echo " |**查看节点 https://$D1/node_info "
echo ""
echo " |**输出日志 https://$D1/keepalive "
echo " ———————————————————————————————————————————————————————————— "
echo ""