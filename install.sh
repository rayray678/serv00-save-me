#!/bin/bash
U1=$(whoami)
U1_DOMAIN=$(echo "$U1" | tr '[:upper:]' '[:lower:]')
if [[ -z "$U1" ]]; then
    echo "未能获取当前用户名，退出。"
    exit 1
fi
echo ""
D1="$U1_DOMAIN.serv00.net"
P1=3000
D2="/home/$U1/domains/$D1"
F1="$D2/public_nodejs/app.js"
L1="https://raw.githubusercontent.com/ryty1/sver00-save-me/refs/heads/main/app.js"
echo " ———————————————————————————————————————————————————————————— "
cd && devil www del "$D1" > /dev/null 2>&1 &
if [[ $? -eq 0 ]]; then
    echo " [OK] 默认域名 删除成功 "
else
    echo " [NO] 默认域名 删除失败 或 不存在 "
fi

if [[ -d "$D2" ]]; then
    rm -rf "$D2"
fi

if devil www add "$D1" nodejs /usr/local/bin/node22 > /dev/null 2>&1; then
    echo " [OK] 类型域名 创建成功 "
else
    echo " [NO] 类型域名 创建失败，请检查环境设置 "
    exit 1
fi

if [[ ! -d "$D2" ]]; then
    mkdir -p "$D2"
fi

if npm install dotenv basic-auth express > /dev/null 2>&1; then
    echo " [OK] 环境依赖 安装成功 "
else
    echo " [NO] 环境依赖 安装失败 "
    exit 1
fi

if curl -s -o "$F1" "$L1"; then
    echo " [OK] 配置文件 下载成功 "
else
    echo " [NO] 配置文件 下载失败 "
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