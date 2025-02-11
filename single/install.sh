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

    if [[ -z "$BOT_TOKEN" || -z "$CHAT_ID" ]]; then
        echo "Bot Token 或 Chat ID 为空，无法进行 Telegram 测试。"
        return 1 # 返回 1 表示测试失败
    fi

    echo "正在测试 Telegram Bot 配置..."
    TEST_MESSAGE="Telegram 通知测试：恭喜！您的 Telegram Bot 配置已成功连接！\n\n您将会在监控的进程异常或恢复时收到通知。" #  修改测试消息内容，更通用
    API_URL="https://api.telegram.org/bot${BOT_TOKEN}/sendMessage"

    # 使用 curl 发送测试消息到 Telegram Bot API
    TEST_RESULT=$(curl -s -X POST "$API_URL" -d "chat_id=$CHAT_ID" -d "text=$TEST_MESSAGE")

    if echo "$TEST_RESULT" | grep -q '"ok":true'; then
        echo "[\033[0;32mOK\033[0m] Telegram Bot 配置测试成功！已发送测试消息到您的 Telegram 机器人。"
        return 0 # 返回 0 表示测试成功
    else
        echo "[\033[0;31mNO\033[0m] Telegram Bot 配置测试失败！请检查您的 Bot Token 和 Chat ID 是否正确。"
        echo "详细错误信息: $TEST_RESULT" #  显示详细错误信息，方便用户排查问题
        return 1 # 返回 1 表示测试失败
    fi
}


# 获取当前用户名并转换为小写，用于域名
U=$(whoami)
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
        echo "Telegram 通知功能已选择启用，Bot Token 和 Chat ID 已记录。" #  已修正：添加了闭合双引号

        #  调用 test_telegram_config 函数进行测试，并获取返回值
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
    DEPENDENCIES_ACCOUNT_SERVICE="body-parser express-session dotenv express socket.io node-cron axios" # 账号服务依赖，不包含 Telegram 通知
    echo "开始进行 账号服务配置 (不包含 Telegram 通知功能)"
else
    echo "无效选择，退出脚本"
    exit 1
fi

echo " ———————————————————————————————————————————————————————————— "

# 删除默认域名
cd && devil www del "$W" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
    X " 删除 默认域名 " 0
else
    X " 默认域名 删除失败 或 不存在" 1
fi

# 删除域名目录
if [[ -d "$A1" ]]; then
    rm -rf "$A1"
fi

# 创建 NodeJS 类型域名
if devil www add "$W" nodejs /usr/local/bin/node22 > /dev/null 2>&1; then
    X " 创建 类型域名 " 0
else
    X " 类型域名 创建失败，请检查环境设置 " 1
    exit 1
fi

# 删除 public 目录
if [[ -d "$B1" ]]; then
    rm -rf "$B1"
fi

# 初始化 npm 并安装依赖 (根据用户的选择安装不同的依赖)
cd "$A2" && npm init -y > /dev/null 2>&1
if [[ "$choice" -eq 1 ]]; then  #  本机保活安装依赖
    DEPENDENCIES_SINGLE="dotenv basic-auth express node-telegram-bot-api" # 本机保活依赖
    if npm install $DEPENDENCIES_SINGLE > /dev/null 2>&1; then
        X " 安装 环境依赖 (包含 Telegram 通知)" 0 #  修改提示信息，更明确包含 Telegram 通知
    else
        X " 环境依赖 安装失败 " 1
        exit 1
    fi

    if [[ "$choice" -eq 1 ]]; then  #  仅针对 本机保活 类型执行此代码段
        echo "—>  正在清理并重新安装 node_modules (本机保活类型)..."
        rm -rf "$A2/node_modules" # 强制删除 node_modules 文件夹
        if npm install $DEPENDENCIES_SINGLE > /dev/null 2>&1; then # 使用 DEPENDENCIES_SINGLE 变量重新安装
            X " 清理并重新安装 node_modules (本机保活类型) - 成功" 0
        else
            X " 清理并重新安装 node_modules (本机保活类型) - 失败" 1
            exit 1
        fi
    fi


elif [[ "$choice" -eq 2 ]]; then # 账号服务安装依赖
    DEPENDENCIES_ACCOUNT_SERVICE="body-parser express-session dotenv express socket.io node-cron axios" # 账号服务依赖
    if npm install $DEPENDENCIES_ACCOUNT_SERVICE > /dev/null 2>&1; then
        X " 安装 账号服务环境依赖 " 0
    else
        X " 账号服务环境依赖 安装失败 " 1
        exit 1
    fi
fi


# 下载配置文件
wget "$A3" -O "$A2/main.zip" 2> "${A2}/wget_error.log" #  移除 > /dev/null 2>&1，添加错误日志
if [[ $? -ne 0 || ! -s "$A2/main.zip" ]]; then
    X " 下载配置文件失败：文件不存在或为空" 1
    cat "${A2}/wget_error.log"  #  新增：打印 wget 错误日志
    exit 1
else
    X " 下载 配置文件 " 0
fi

# 解压配置文件
unzip "$A2/main.zip" -d "$A2" 2> "${A2}/unzip_error.log" # 移除 -q，添加错误日志
if [[ $? -eq 0 ]]; then
    X " 解压 配置文件 " 0
    cat "${A2}/unzip_error.log" # 新增：解压成功也打印 unzip_error.log
else
    X " 解压配置文件失败 " 1
    cat "${A2}/unzip_error.log" # 新增：解压失败时打印错误日志
    exit 1
fi
B1="$A2/serv00-save-me-main"
if [[ -d "$B1" ]]; then
    mv "$B1"/* "$A2/"
    rm -rf "$B1"
fi
rm -f "$A2/README.md"
rm -f "$A2/main.zip"

#  解压后目录结构和 TARGET_FOLDER 变量调试信息
echo "—>  解压后 $A2 目录结构 (tree 命令):"
tree "$A2"
echo "—>  解压后 $A2 目录结构 (ls -R 命令):"
ls -R "$A2"
echo "—>  TARGET_FOLDER 变量的值: $TARGET_FOLDER"


# 复制对应类型的配置
if [[ -d "$A2/$TARGET_FOLDER" ]]; then
    cp -rv "$A2/serv00-save-me-main/$TARGET_FOLDER"/app.js "$A2/" 2>> "${A2}/cp_error.log" #  修改源路径，添加 -rv 和错误日志
    cp -rv "$A2/serv00-save-me-main/$TARGET_FOLDER"/hy2ip.sh "$A2/" 2>> "${A2}/cp_error.log" #  修改源路径，添加 -rv 和错误日志
    cp -rv "$A2/serv00-save-me-main/$TARGET_FOLDER"/install.sh "$A2/" 2>> "${A2}/cp_error.log" #  修改源路径，添加 -rv 和错误日志
    cp -rv "$A2/serv00-save-me-main/$TARGET_FOLDER"/ota.sh "$A2/" 2>> "${A2}/cp_error.log" #  修改源路径，添加 -rv 和错误日志
    cp -rv "$A2/serv00-save-me-main/$TARGET_FOLDER"/.env "$A2/" 2>> "${A2}/cp_error.log" #  修改源路径，添加 -rv 和错误日志
    cp -rv "$A2/serv00-save-me-main/$TARGET_FOLDER"/log.html "$A2/" 2>> "${A2}/cp_error.log" #  修改源路径，添加 -rv 和错误日志
    cp -rv "$A2/serv00-save-me-main/$TARGET_FOLDER"/node.html "$A2/" 2>> "${A2}/cp_error.log" #  修改源路径，添加 -rv 和错误日志
    cp -rv "$A2/serv00-save-me-main/$TARGET_FOLDER"/proxy.conf "$A2/" 2>> "${A2}/cp_error.log" #  修改源路径，添加 -rv 和错误日志
    cp -rv "$A2/serv00-save-me-main/$TARGET_FOLDER"/readme.txt "$A2/" 2>> "${A2}/cp_error.log" #  修改源路径，添加 -rv 和错误日志
    cp -rv "$A2/serv00-save-me-main/$TARGET_FOLDER"/start.sh "$A2/" 2>> "${A2}/cp_error.log" #  修改源路径，添加 -rv 和错误日志
    cp -rv "$A2/serv00-save-me-main/$TARGET_FOLDER"/info.html "$A2/" 2>> "${A2}/cp_error.log" #  修改源路径，添加 -rv 和错误日志
    rm -rf "$A2/$TARGET_FOLDER"
else
    exit 1
fi

# 删除多余目录
if [[ -d "$A2/$DELETE_FOLDER" ]]; then
    rm -rf "$A2/$DELETE_FOLDER"
fi

# 设置执行权限
if [[ "$choice" -eq 1 ]]; then # 本机保活设置权限
    chmod 755 "$A2/app.js" > /dev/null 2>&1
    chmod 755 "$A2/hy2ip.sh" > /dev/null 2>&1
    chmod 755 "$A2/install.sh" > /dev/null 2>&1
    chmod 755 "$A2/ota.sh" > /dev/null 2>&1
    chmod 755 "$A2/start.sh" > /dev/null 2>&1

    echo ""
    echo " 【 恭 喜 】： 本机保活  部署已完成 (包含 Telegram 通知功能) " #  修改完成提示，更明确包含 Telegram 通知
    echo " ———————————————————————————————————————————————————————————— "
    echo ""
    if [[ "$TELEGRAM_CONFIG_TEST_RESULT" -eq 0 ]]; then #  根据测试结果显示不同信息
        echo " |**Telegram 通知: \033[0;32m已启用\033[0m (配置测试 \033[0;32m成功\033[0m)" #  测试成功提示
    else
        echo " |**Telegram 通知: \033[0;31m已启用\033[0m (配置测试 \033[0;31m失败\033[0m，请检查 Token 和 Chat ID)" # 测试失败提示
    fi
    echo " |**保活网页 https://$W/info "
    echo ""
    echo " ———————————————————————————————————————————————————————————— "
    echo ""
else # 账号服务设置权限
    chmod 755 "$A2/app.js" > /dev/null 2>&1
    chmod 755 "$A2/ota.sh" > /dev/null 2>&1
    chmod 755 "$A2/start.sh" > /dev/null 2>&1

    echo ""
    echo " 【 恭 喜 】： 账号服务  部署已完成  "
    echo "  账号服务 只要 部署 1个 多了 无用   "
    echo "  账号服务 无需 保活 不建议 搭节点  "
    echo " ———————————————————————————————————————————————————————————— "
    echo ""
    echo " |**账号服务 https://$W/"
    echo ""
    echo " ———————————————————————————————————————————————————————————— "
    echo ""
fi
