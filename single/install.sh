#!/bin/bash

X() {
    local Y=$1
    local Z=$2
    local M=$(date +%s)
    local N=2
    local O=("+")
    while true; do
        local P=$(( $(date +%s) - M ))
        printf "\r[%s] %s" "${O[$((P % 1))]}" "$Y"
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

test_telegram_config() {
    local BOT_TOKEN=$1
    local CHAT_ID=$2

    if [[ -z "$BOT_TOKEN" || -z "$CHAT_ID" ]]; then
        echo "Bot Token 或 Chat ID 为空，无法进行 Telegram 测试。"
        return 1
    fi

    echo "正在测试 Telegram Bot 配置..."
    TEST_MESSAGE="Telegram 通知测试：恭喜！您的 Telegram Bot 配置已成功连接！\n\n您将会在监控的进程异常或恢复时收到通知。"
    API_URL="https://api.telegram.org/bot${BOT_TOKEN}/sendMessage"

    TEST_RESULT=$(curl -s -X POST "$API_URL" -d "chat_id=$CHAT_ID" -d "text=$TEST_MESSAGE")
    HTTP_CODE=$(echo "$TEST_RESULT" |  grep -oP 'HTTP Code: \K\d+')

    if command -v jq >/dev/null 2>&1 ; then
        OK_VALUE=$(echo "$TEST_RESULT" | jq '.ok')

        if [[ "$HTTP_CODE" == "200" ]] && [[ "$OK_VALUE" == "true" ]]; then
            echo "[\033[0;32mOK\033[0m] Telegram Bot 配置测试成功！已发送测试消息到您的 Telegram 机器人。"
            return 0
        else
            echo "[\033[0;31mNO\033[0m] Telegram Bot 配置测试失败！请检查您的 Bot Token 和 Chat ID 是否正确。"
            echo "HTTP 状态码: $HTTP_CODE"
            echo "详细错误信息 (JSON 'ok' 字段): $OK_VALUE"
            echo "完整 API 响应内容: $TEST_RESULT"
            return 1
        fi
    else
        if echo "$TEST_RESULT" | grep -q '"ok":true'; then
            echo "[\033[0;32mOK\033[0m] Telegram Bot 配置测试成功！已发送测试消息到您的 Telegram 机器人。(未安装 jq，使用简易判断)"
            return 0
        else
            echo "[\033[0;31mNO\033[0m] Telegram Bot 配置测试失败！请检查您的 Bot Token 和 Chat ID 是否正确。(未安装 jq，使用简易判断)"
            echo "详细错误信息: $TEST_RESULT"
            return 1
        fi
    fi
}


U=$(whoami)
V=$(echo "$U" | tr '[:upper:]' '[:lower:]')
W="$V.serv00.net"
A1="/home/$U/domains/$W"
A2="$A1/public_nodejs"
B1="$A2/public"
A3="https://github.com/RAY1234555555/serv00-save-me/archive/refs/heads/main.zip"

echo "请选择保活类型："
echo "1. 本机保活 (包含 Telegram 通知功能)"
echo "2. 账号服务 (包含 Telegram 通知功能 - 配置将保存到 .env 文件)"
read -p "请输入选择(1 或 2): " choice

TELEGRAM_CONFIG_TEST_RESULT=0
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""


if [[ "$choice" -eq 1 ]]; then
    TARGET_FOLDER="single"
    DELETE_FOLDER="server"
    DEPENDENCIES="dotenv basic-auth express node-telegram-bot-api"
    echo "开始进行 本机保活配置 (包含 Telegram 通知功能)"

    echo ""
    echo "您是否需要启用 Telegram 通知功能？"
    echo "y. 启用 Telegram 通知 (推荐，进程异常时及时通知)"
    echo "n. 不启用 Telegram 通知 (稍后手动配置)"
    read -p "请输入选择 (y 或 n): " telegram_choice


    if [[ "$telegram_choice" == "y" ]]; then
        echo ""
        read -p "请输入您的 Telegram Bot Token: " TELEGRAM_BOT_TOKEN_INPUT
        TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN_INPUT"

        echo ""
        read -p "请输入您的 Telegram Chat ID: " TELEGRAM_CHAT_ID_INPUT
        TELEGRAM_CHAT_ID="$TELEGRAM_CHAT_ID_INPUT"

        echo ""
        echo "Telegram 通知功能已选择启用，Bot Token 和 Chat ID 已记录。"


        if test_telegram_config "$TELEGRAM_BOT_TOKEN" "$TELEGRAM_CHAT_ID"; then
            TELEGRAM_CONFIG_TEST_RESULT=0
        else
            TELEGRAM_CONFIG_TEST_RESULT=1
        fi


    elif [[ "$telegram_choice" == "n" ]]; then
        echo ""
        echo "Telegram 通知功能已选择不启用，您可以在之后手动配置。"
        TELEGRAM_CONFIG_TEST_RESULT=0
    else
        echo ""
        echo "无效选择，Telegram 通知功能将默认不启用。"
        TELEGRAM_CONFIG_TEST_RESULT=0
    fi


elif [[ "$choice" -eq 2 ]]; then
    TARGET_FOLDER="server"
    DELETE_FOLDER="single"
    DEPENDENCIES="body-parser express-session dotenv express socket.io node-cron node-telegram-bot-api axios"
    echo "开始进行 账号服务配置 (包含 Telegram 通知功能 - 配置将保存到 .env 文件)"

    echo ""
    echo "您是否需要启用 Telegram 通知功能？"
    echo "y. 启用 Telegram 通知 (推荐，进程异常时及时通知)"
    echo "n. 不启用 Telegram 通知 (稍后手动配置 .env 文件)"
    read -p "请输入选择 (y 或 n): " telegram_choice


    if [[ "$telegram_choice" == "y" ]]; then
        echo ""
        read -p "请输入您的 Telegram Bot Token: " TELEGRAM_BOT_TOKEN_INPUT
        TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN_INPUT"

        echo ""
        read -p "请输入您的 Telegram Chat ID: " TELEGRAM_CHAT_ID_INPUT
        TELEGRAM_CHAT_ID="$TELEGRAM_CHAT_ID_INPUT"

        echo ""
        echo "Telegram 通知功能已选择启用，Bot Token 和 Chat ID 已记录。"

        if test_telegram_config "$TELEGRAM_BOT_TOKEN" "$TELEGRAM_CHAT_ID"; then
            TELEGRAM_CONFIG_TEST_RESULT=0
        else
            TELEGRAM_CONFIG_TEST_RESULT=1
        fi

        echo "TELEGRAM_BOT_TOKEN=\"$TELEGRAM_BOT_TOKEN\"" >> "$A2/.env"
        echo "TELEGRAM_CHAT_ID=\"$TELEGRAM_CHAT_ID\"" >> "$A2/.env"
        X " 保存 Telegram 配置到 .env 文件" 0


    elif [[ "$telegram_choice" == "n" ]]; then
        echo ""
        echo "Telegram 通知功能已选择不启用，您可以在之后手动配置 .env 文件。"
        TELEGRAM_CONFIG_TEST_RESULT=0
    else
        echo ""
        echo "无效选择，Telegram 通知功能将默认不启用。"
        TELEGRAM_CONFIG_TEST_RESULT=0
    fi


else
    echo "无效选择，退出脚本"
    exit 1
fi

echo " ———————————————————————————————————————————————————————————— "
cd && devil www del "$W" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
    X " 删除 默认域名 " 0
else
    X " 默认域名 删除失败 或 不存在" 1
fi
if [[ -d "$A1" ]]; then
    rm -rf "$A1"
fi
if devil www add "$W" nodejs /usr/local/bin/node22 > /dev/null 2>&1; then
    X " 创建 类型域名 " 0
else
    X " 类型域名 创建失败，请检查环境设置 " 1
    exit 1
fi
if [[ -d "$B1" ]]; then
    rm -rf "$B1"
fi

cd "$A2" && npm init -y > /dev/null 2>&1
if npm install $DEPENDENCIES > /dev/null 2>&1; then
    X " 安装 环境依赖 " 0
else
    X " 环境依赖 安装失败 " 1
    exit 1
fi

wget "$A3" -O "$A2/main.zip" > /dev/null 2>&1
if [[ $? -ne 0 || ! -s "$A2/main.zip" ]]; then
    X " 下载失败：文件不存在或为空" 1
    exit 1
else
    X " 下载 配置文件 " 0
fi
unzip -q "$A2/main.zip" -d "$A2" > /dev/null 2>&1
B1="$A2/serv00-save-me-main"
if [[ -d "$B1" ]]; then
    mv "$B1"/* "$A2/"
    rm -rf "$B1"
fi
rm -f "$A2/README.md" > /dev/null 2>&1
rm -f "$A2/main.zip" > /dev/null 2>&1

if [[ -d "$A2/$TARGET_FOLDER" ]]; then
    cp -r "$A2/$TARGET_FOLDER/." "$A2/"
    rm -rf "$A2/$TARGET_FOLDER" > /dev/null 2>&1
else
    exit 1
fi

if [[ -d "$A2/$DELETE_FOLDER" ]]; then
    rm -rf "$A2/$DELETE_FOLDER" > /dev/null 2>&1
fi

if [[ "$choice" -eq 1 ]]; then
    chmod 755 "$A2/app.js" > /dev/null 2>&1
    chmod 755 "$A2/hy2ip.sh" > /dev/null 2>&1
    chmod 755 "$A2/install.sh" > /dev/null 2>&1
    chmod 755 "$A2/ota.sh" > /dev/null 2>&1
    chmod 755 "$A2/start.sh" > /dev/null 2>&1

    echo ""
    echo " 【 恭 喜 】： 本机保活  部署已完成 "
    echo " ———————————————————————————————————————————————————————————— "
    echo ""
    if [[ "$TELEGRAM_CONFIG_TEST_RESULT" -eq 0 ]]; then
        echo " |**Telegram 通知: \033[0;32m已启用\033[0m (配置测试 \033[0;32m成功\033[0m)"
    else
        echo " |**Telegram 通知: \033[0;31m已启用\033[0m (配置测试 \033[0;31m失败\033[0m，请检查 Token 和 Chat ID)"
    fi
    echo " |**保活网页 https://$W/info "
    echo ""
    echo " ———————————————————————————————————————————————————————————— "
    echo ""
else
    chmod 755 "$A2/app.js" > /dev/null 2>&1
    chmod 755 "$A2/ota.sh" > /dev/null 2>&1
    chmod 755 "$A2/start.sh" > /dev/null 2>&1

    echo ""
    echo " 【 恭 喜 】： 账号服务  部署已完成  "
    echo "  账号服务 只要 部署 1个 多了 无用    "
    echo "  账号服务 无需 保活 不建议 搭节点  "
    echo " ———————————————————————————————————————————————————————————— "
    echo ""
    echo " |**账号服务 https://$W/"
    echo ""
    echo " ———————————————————————————————————————————————————————————— "
    echo ""
fi
