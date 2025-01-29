#!/bin/bash
A() {
    local B=$1
    local C=$2
    local D=$(date +%s)
    local E=2
    local F=("+")
    while true; do
        local G=$(( $(date +%s) - D ))
        printf "\r[%s] %s" "${F[$((G % 1))]}" "$B"
        if [[ $G -ge 1 ]]; then
            break
        fi
        sleep 0.08
    done
    printf "\r                       \r"
    if [[ $C -eq 0 ]]; then
        printf "[\033[0;32mOK\033[0m] %s\n" "$B"
    else
        printf "[\033[0;31mNO\033[0m] %s\n" "$B"
    fi
}

H1=$(whoami)
H2=$(echo "$H1" | tr '[:upper:]' '[:lower:]')
I1="$H2.serv00.net"
I2="/home/$H1/domains/$I1"
J1="$I2/public_nodejs/app.js"
J2="$I2/public_nodejs/hy2ip.sh"
K1="https://raw.githubusercontent.com/ryty1/sver00-save-me/refs/heads/main/app.js"
K2="https://raw.githubusercontent.com/ryty1/sver00-save-me/refs/heads/main/hy2ip.sh"
echo ""
echo " ———————————————————————————————————————————————————————————— "
cd && devil www del "$I1" > /dev/null 2>&1 && [[ -d "$I2" ]] && rm -rf "$I2" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
    A "正在删除 默认域名" 0
else
    A "默认域名 删除失败 或 不存在" 1
fi
sleep 1
devil www add "$I1" nodejs /usr/local/bin/node22 > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
    A "正在创建 类型域名" 0
else
    A "类型域名 创建失败，请检查环境设置" 1
    exit 1
fi
sleep 1
cd "$I2" && npm init -y > /dev/null 2>&1 && npm install dotenv basic-auth express > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
    A "正在安装 环境依赖" 0
else
    A "环境依赖 安装失败" 1
    exit 1
fi
sleep 1
curl -s -o "$J1" "$K1" && chmod 755 "$J1" > /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    A "配置文件 1 下载失败" 1
    exit 1
fi
curl -s -o "$J2" "$K2" && chmod 755 "$J2" > /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    A "配置文件 2 下载失败" 1
    exit 1
fi

A "正在下载 配置文件" 0

echo " ———————————————————————————————————————————————————————————— "
echo ""
echo " 【 恭 喜 】： 网 页 保 活 一 键 部 署 已 完 成  "
echo " ———————————————————————————————————————————————————————————— "
echo ""
echo " |**保活网页 https://$I1/info "
echo ""
echo " ———————————————————————————————————————————————————————————— "
echo ""