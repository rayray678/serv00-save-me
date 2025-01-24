#!/bin/bash

print_status() {
    local message=$1
    local success=$2

    # 动画字符定义
    animation=("▖" "▘" "▝" "▗")
    for i in {1..8}; do
        printf "\r[%s] %s" "${animation[$((i % 4))]}" "$message"
        sleep 0.1
    done

    if [[ $success -eq 0 ]]; then
        printf "\r[\033[0;32mOK\033[0m] %s\n" "$message" # 成功绿色OK
    else
        printf "\r[\033[0;31mNO\033[0m] %s\n" "$message" # 失败红色NO
    fi
}

U1=$(whoami)
U1_DOMAIN=$(echo "$U1" | tr '[:upper:]' '[:lower:]')
D1="$U1_DOMAIN.serv00.net"
D2="/home/$U1/domains/$D1"
F1="$D2/public_nodejs/app.js"
L1="https://raw.githubusercontent.com/ryty1/sver00-save-me/refs/heads/main/app.js"

echo ""
echo " ———————————————————————————————————————————————————————————— "

# 删除默认域名
print_status "正在删除 默认域名" 2
cd && devil www del "$D1" > /dev/null 2>&1 && [[ -d "$D2" ]] && rm -rf "$D2" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
    print_status "默认域名 删除成功" 0
else
    print_status "默认域名 删除失败 或 不存在" 1
fi

# 创建类型域名
print_status "正在创建 类型域名" 2
devil www add "$D1" nodejs /usr/local/bin/node22 > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
    print_status "类型域名 创建成功" 0
else
    print_status "类型域名 创建失败，请检查环境设置" 1
    exit 1
fi

# 安装环境依赖
print_status "正在安装 环境依赖" 2
cd "$D2" && npm init -y > /dev/null 2>&1 && npm install dotenv basic-auth express > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
    print_status "环境依赖 安装成功" 0
else
    print_status "环境依赖 安装失败" 1
    exit 1
fi

# 下载配置文件
print_status "正在下载 配置文件" 2
curl -s -o "$F1" "$L1" && chmod 755 "$F1" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
    print_status "配置文件 下载成功" 0
else
    print_status "配置文件 下载失败" 1
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