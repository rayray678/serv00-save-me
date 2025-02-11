#!/bin/bash

# 定义一个带动画效果的函数，用于显示脚本执行状态
X() {
    local Y=$1
    local Z=<span class="math-inline">2
local M\=</span>(date +%s)
    local N=2
    local O=("+")
    while true; do
        local P=$(( <span class="math-inline">\(date \+%s\) \- M \)\)
printf "\\r\[%s\] %s" "</span>{O[$((P % 1))]}" "$Y"
        if [[ $P -ge 1 ]]; then
            break
        fi
        sleep 0.08
    done
    printf "\r                                  \r"
    if [[ $Z -eq 0 ]]; then
        printf "[\033[0;32mOK\033[0m] %s\n" "$Y"
    else
        printf "[\033[0;31mNO\033[0m] %s\n" "$Y"
    fi
}

# 定义 Telegram Bot 配置测试函数
test_telegram_config() {
    local BOT_TOKEN=$1
    local CHAT_ID=$2

    if [[ -z "$BOT_TOKEN" || -z "<span class="math-inline">CHAT\_ID" \]\]; then
echo "Bot Token 或 Chat ID 为空，无法进行 Telegram 测试。"
return 1 \# 返回 1 表示测试失败
fi
echo "正在测试 Telegram Bot 配置\.\.\."
TEST\_MESSAGE\="Telegram 通知测试：恭喜！您的 Telegram Bot 配置已成功连接！\\n\\n您将会在监控的进程异常或恢复时收到通知。" \#  修改测试消息内容，更通用
API\_URL\="https\://api\.telegram\.org/bot</span>{BOT_TOKEN}/sendMessage"

    # 使用 curl 发送测试消息到 Telegram Bot API
    TEST_RESULT=$(curl -s -X POST "$API_URL" -d "chat_id=$CHAT_ID" -d "text=$TEST_MESSAGE")

    if echo "$TEST_RESULT" | grep -q '"ok":true'; then
        echo "[\033[0;32mOK\033[0m] Telegram Bot 配置测试成功！已发送测试消息到您的 Telegram 机器人。"
        return 0 # 返回 0 表示测试成功
    else
        echo "[\033[0;31mNO\033[0m] Telegram Bot 配置测试失败！请检查您的 Bot Token 和 Chat ID 是否正确。"
        echo "详细错误信息: <span class="math-inline">TEST\_RESULT" \#  显示详细错误信息，方便用户排查问题
return 1 \# 返回 1 表示测试失败
fi
\}
\# 获取当前用户名并转换为小写，用于域名
U\=</span>(whoami)
V=$(echo "$U" | tr '[:upper:]' '[:lower:]')
W="$V.serv00.net"
A1="/home/$U/domains/$W"
A2="$A1/public_nodejs"
B1="$A2/public"
A3="https://github.com/RAY1234555555/serv00-save-me/archive/refs/heads/main.zip"

# 提示用户选择保活类型
echo "请选择保活类型："
echo "1. 本机保活 (包含 Telegram 通知功能)"
echo "2. 账号服务 (不包含 Telegram 通知功能)"
read -p "请输入选择(1 或 2): " choice

# 根据用户选择设置不同的变量和依赖
if [[ "$choice" -eq 1 ]]; then
    TARGET_FOLDER="single"
    DELETE_FOLDER="server"
    DEPENDENCIES_SINGLE="dotenv basic-auth express node-telegram-bot-api" # 本机保活依赖，包含 Telegram 通知
    echo "开始进行 本机保活配置 (包含 Telegram 通知功能)"

    #  新增：询问是否启用 Telegram 通知
    echo ""
    echo "您是否需要启用 Telegram 通知功能？"
    echo "y. 启用 Telegram 通知 (推荐，进程异常时及时通知)"
    echo "n. 不启用 Telegram 通知 (稍后手动配置)"
    read -p "请输入选择 (y 或 n): " telegram_choice

    TELEGRAM_BOT_TOKEN="" # 初始化 Telegram Bot Token 变量
    TELEGRAM_CHAT_ID=""  # 初始化 Telegram Chat ID 变量

    if [[ "$telegram_choice" == "y" ]]; then
        echo ""
        read -p "请输入您的 Telegram Bot Token: " TELEGRAM_BOT_TOKEN_INPUT
        TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN_INPUT" # 将用户输入赋值给 TELEGRAM_BOT_TOKEN 变量

        echo ""
        read -p "请输入您的 Telegram Chat ID: " TELEGRAM_CHAT_ID_INPUT
        TELEGRAM_CHAT_ID="$TELEGRAM_CHAT_ID_INPUT"   # 将用户输入赋值给 TELEGRAM_CHAT_ID 变量

        echo ""
        echo "Telegram 通知功能已选择启用，Bot Token 和 Chat ID 已记录"
