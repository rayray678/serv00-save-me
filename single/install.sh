#!/bin/bash

# 定义一个带动画效果的函数，用于显示脚本执行状态
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
    printf "\r                                \r"
    if [[ $Z -eq 0 ]]; then
        printf "[\033[0;32mOK\033[0m] %s\n" "$Y"
    else
        printf "[\033[0;31mNO\033[0m] %s\n" "$Y"
    fi
}

# 定义 Telegram Bot 配置测试函数 (从最新版本脚本中 *保留*)
test_telegram_config() {
    local BOT_TOKEN=$1
    local CHAT_ID=$2

    if [[ -z "$BOT_TOKEN" || -z "$CHAT_ID" ]]; then
        echo "Bot Token 或 Chat ID 为空，无法进行 Telegram 测试。"
        return 1 # 返回 1 表示测试失败
    fi

    echo "正在测试 Telegram Bot 配置..."
    TEST_MESSAGE="Telegram 通知测试：恭喜！您的 Telegram Bot 配置已成功连接！\n\n您将会在监控的进程异常或恢复时收到通知。" #  修改测试消息内容，更通用
    API_URL="https://api.telegram.org/bot${BOT_TOKEN}/sendMessage"

    # 使用 curl 发送测试消息到 Telegram Bot API (输出重定向到 /dev/null)
    TEST_RESULT=$(curl -s -X POST "$API_URL" -d "chat_id=$CHAT_ID" -d "text=$TEST_MESSAGE" > /dev/null 2>&1)

    if echo "$TEST_RESULT" | grep -q '"ok":true'; then
        echo "[\033[0;32mOK\033[0m] Telegram Bot 配置测试成功！已发送测试消息到您的 Telegram 机器人。"
        return 0 # 返回 0 表示测试成功
    else
        echo "[\033[0;31mNO\033[0m] Telegram Bot 配置测试失败！请检查您的 Bot Token 和 Chat ID 是否正确。"
        echo "详细错误信息: $TEST_RESULT" #  显示详细错误信息，方便用户排查问题
        return 1 # 返回 1 表示测试失败
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
echo "1. 本机保活 (包含 Telegram 通知功能)"  # 修改提示信息，明确包含 Telegram 通知
echo "2. 账号服务 (不包含 Telegram 通知功能)"  # 修改提示信息，明确不包含 Telegram 通知
read -p "请输入选择(1 或 2): " choice

TELEGRAM_CONFIG_TEST_RESULT=0 # 初始化 Telegram 配置测试结果变量 (从最新版本脚本中 *保留*)
TELEGRAM_BOT_TOKEN="" # 初始化 Telegram Bot Token 变量 (从最新版本脚本中 *保留*)
TELEGRAM_CHAT_ID=""  # 初始化 Telegram Chat ID 变量 (从最新版本脚本中 *保留*)


if [[ "$choice" -eq 1 ]]; then
    TARGET_FOLDER="single"
    DELETE_FOLDER="server"
    DEPENDENCIES="dotenv basic-auth express node-telegram-bot-api" # 本机保活依赖，*保留* node-telegram-bot-api 依赖，并使用成功版本脚本的变量名
    echo "开始进行 本机保活配置 (包含 Telegram 通知功能)" # 修改提示信息，明确包含 Telegram 通知

    #  新增：询问是否启用 Telegram 通知 (从最新版本脚本中 *保留*)
    echo ""
    echo "您是否需要启用 Telegram 通知功能？"
    echo "y. 启用 Telegram 通知 (推荐，进程异常时及时通知)"
    echo "n. 不启用 Telegram 通知 (稍后手动配置)"
    read -p "请输入选择 (y 或 n): " telegram_choice


    if [[ "$telegram_choice" == "y" ]]; then
        echo ""
        read -p "请输入您的 Telegram Bot Token: " TELEGRAM_BOT_TOKEN_INPUT
        TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN_INPUT" # 将用户输入赋值给 TELEGRAM_BOT_TOKEN 变量

        echo ""
        read -p "请输入您的 Telegram Chat ID: " TELEGRAM_CHAT_ID_INPUT
        TELEGRAM_CHAT_ID="$TELEGRAM_CHAT_ID_INPUT"   # 将用户输入赋值给 TELEGRAM_CHAT_ID 变量

        echo ""
        echo "Telegram 通知功能已选择启用，Bot Token 和 Chat ID 已记录。" #  已修正：添加了闭合双引号


        #  调用 test_telegram_config 函数进行测试，并获取返回值 (从最新版本脚本中 *保留*)
        if test_telegram_config "$TELEGRAM_BOT_TOKEN" "$TELEGRAM_CHAT_ID"; then
            TELEGRAM_CONFIG_TEST_RESULT=0 #  测试成功
        else
            TELEGRAM_CONFIG_TEST_RESULT=1 #  测试失败
        fi

    elif [[ "$telegram_choice" == "n" ]]; then
        echo ""
        echo "Telegram 通知功能已选择不启用，您可以在之后手动配置。"
        TELEGRAM_CONFIG_TEST_RESULT=0 #  不启用通知，也视为配置测试通过，不影响后续安装
    else
        echo ""
        echo "无效选择，Telegram 通知功能将默认不启用。"
        TELEGRAM_CONFIG_TEST_RESULT=0 #  无效选择，也视为配置测试通过，不影响后续安装
    fi


elif [[ "$choice" -eq 2 ]]; then
    TARGET_FOLDER="server"
    DELETE_FOLDER="single"
    DEPENDENCIES="body-parser express-session dotenv express socket.io node-cron node-telegram-bot-api axios" # 账号服务依赖，*保留* node-telegram-bot-api 依赖，并使用成功版本脚本的变量名
    echo "开始进行 账号服务配置 (不包含 Telegram 通知功能)" # 修改提示信息，明确不包含 Telegram 通知
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
rm -f "$A2/README.md"
rm -f "$A2/main.zip"

if [[ -d "$A2/$TARGET_FOLDER" ]]; then
    cp -r "$A2/$TARGET_FOLDER/." "$A2/"
    rm -rf "$A2/$TARGET_FOLDER"
else
    exit 1
fi

if [[ -d "$A2/$DELETE_FOLDER" ]]; then
    rm -rf "$A2/$DELETE_FOLDER"
fi

if [[ "$choice" -eq 1 ]]; then
    chmod 755 "$A2/app.js" > /dev/null 2>&1
    chmod 755 "$A2/hy2ip.sh" > /dev/null 2>&1
    chmod 755 "$A2/install.sh" > /dev/null 2>&1
    chmod 755 "$A2/ota.sh" > /dev/null 2>&1
    chmod 755 "$A2/start.sh" > /dev/null 2>&1 #  *新增*: 设置 start.sh 执行权限，与最新版本脚本保持一致

    echo ""
    echo " 【 恭 喜 】： 本机保活  部署已完成 " #  移除 “(包含 Telegram 通知功能)” 字样，与成功版本脚本完成提示信息保持一致
    echo " ———————————————————————————————————————————————————————————— "
    echo ""
    if [[ "$TELEGRAM_CONFIG_TEST_RESULT" -eq 0 ]]; then #  根据测试结果显示不同信息 (从最新版本脚本中 *保留*)
        echo " |**Telegram 通知: \033[0;32m已启用\033[0m (配置测试 \033[0;32m成功\033[0m)" #  测试成功提示
    else
        echo " |**Telegram 通知: \033[0;31m已启用\033[0m (配置测试 \033[0;31m失败\033[0m，请检查 Token 和 Chat ID)" # 测试失败提示
    fi
    echo " |**保活网页 https://$W/info "
    echo ""
    echo " ———————————————————————————————————————————————————————————— "
    echo ""
else
    chmod 755 "$A2/app.js" > /dev/null 2>&1
    chmod 755 "$A2/ota.sh" > /dev/null 2>&1
    chmod 755 "$A2/start.sh" > /dev/null 2>&1 #  *新增*: 设置 start.sh 执行权限，与最新版本脚本保持一致

    echo ""
    echo " 【 恭 喜 】： 账号服务  部署已完成  "
    echo "  账号服务 只要 部暑 1个 多了 无用   "
    echo "  账号服务 无需 保活 不建议 搭节点  "
    echo " ———————————————————————————————————————————————————————————— "
    echo ""
    echo " |**账号服务 https://$W/"
    echo ""
    echo " ———————————————————————————————————————————————————————————— "
    echo ""
fi
