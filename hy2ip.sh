#!/bin/bash

# 混淆后的绿色打印
A() {
    echo -e "\033[32m$1\033[0m"
}

# 混淆后的红色打印
B() {
    echo -e "\033[31m$1\033[0m"
}

# 混淆后的获取有效IP的函数
C() {
    local D=$(hostname)
    local E=$(echo "$D" | awk -F'[s.]' '{print $2}')
    local F=("cache${E}.serv00.com" "web${E}.serv00.com" "$D")

    for G in "${F[@]}"; do
        local H=$(curl -s --max-time 10 "https://ss.botai.us.kg/api/getip?host=$G")
        if [[ "$H" =~ "not found" ]]; then
            echo "未识别主机 ${G}！"
            continue
        fi

        local I=$(echo "$H" | awk -F "|" '{print $1}')
        local J=$(echo "$H" | awk -F "|" '{print $2}')

        if [[ "$J" == "Accessible" ]]; then
            echo "$I"
            return 0
        fi
    done

    echo ""  # 返回空字符串表示未找到有效IP
    return 1  # 返回错误代码
}

# 混淆后的更新 config.json 配置文件
K() {
    local L="$1"
    local M="$2"
    if [[ ! -f "$L" ]]; then
        B "配置文件 $L 不存在！"
        return 1
    fi
    jq --arg N "$M" '
        (.inbounds[] | select(.tag == "hysteria-in") | .listen) = $N
    ' "$L" > temp.json && mv temp.json "$L"

    if [[ $? -eq 0 ]]; then
        A "SingBox 配置文件成功更新IP为 $M"
    else
        B "更新配置文件失败！"
        return 1
    fi
}

# 混淆后的更新 singbox.json 配置文件
O() {
    local P="$1"
    local Q="$2"
    if [[ ! -f "$P" ]]; then
        B "配置文件 $P 不存在！"
        return 1
    fi
    jq --arg R "$Q" '
        .HY2IP = $R
    ' "$P" > temp.json && mv temp.json "$P"

    if [[ $? -eq 0 ]]; then
        A "Config 配置文件成功更新IP为 $Q"
    else
        B "更新配置文件失败！"
        return 1
    fi
}

# 混淆后的修改 IP 地址的主函数
S() {
    local T="$HOME/serv00-play/singbox/config.json"
    local U="$HOME/serv00-play/singbox/singbox.json"
    local V=$(C)

    # 打印获取到的IP
    echo "有效 IP: $V"

    # 如果没有获取到有效 IP，退出函数
    if [[ -z "$V" ]]; then
        B "没有可用 IP！"
        return 1  # 返回并退出，表示未找到有效IP，不做任何更新
    fi

    # 只有在找到有效IP时才更新配置文件
    K "$T" "$V"
    O "$U" "$V"
    
    # 重启 SingBox
    echo "正在重启 sing-box..."
    W
    sleep 3
    X
}

# 混淆后的停止 SingBox
W() {
    cd ~/serv00-play/singbox/ && bash killsing-box.sh
}

# 混淆后的启动 SingBox
X() {
    cd ~/serv00-play/singbox/ && bash start.sh
}

# 调用主函数
S