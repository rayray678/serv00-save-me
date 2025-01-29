#!/bin/bash

# 打印绿色字体
green() {
    echo -e "\033[32m$1\033[0m"
}

# 打印红色字体
red() {
    echo -e "\033[31m$1\033[0m"
}

# 获取可用的IP
get_ip() {
    local hostname=$(hostname)
    local host_number=$(echo "$hostname" | awk -F'[s.]' '{print $2}')
    local hosts=("cache${host_number}.serv00.com" "web${host_number}.serv00.com" "$hostname")

    for host in "${hosts[@]}"; do
        local response=$(curl -s --max-time 10 "https://ss.botai.us.kg/api/getip?host=$host")
        if [[ "$response" =~ "not found" ]]; then
            echo "未识别主机 ${host}！"
            continue
        fi

        local ip=$(echo "$response" | awk -F "|" '{print $1}')
        local status=$(echo "$response" | awk -F "|" '{print $2}')

        if [[ "$status" == "Accessible" ]]; then
            echo "$ip"
            return
        fi
    done

    red "未找到可用的 IP！"
    return 1
}

# 更新配置文件中的IP
update_config_json() {
    local configFile="$1"
    local new_ip="$2"
    if [[ ! -f "$configFile" ]]; then
        red "配置文件 $configFile 不存在！"
        return 1
    fi
    jq --arg new_ip "$new_ip" '
        (.inbounds[] | select(.tag == "hysteria-in") | .listen) = $new_ip
    ' "$configFile" > temp.json && mv temp.json "$configFile"

    if [[ $? -eq 0 ]]; then
        green "SingBox 配置文件成功更新IP为 $new_ip"
    else
        red "更新配置文件失败！"
        return 1
    fi
}

# 更新 singbox 配置文件中的HY2IP字段
update_singbox_json() {
    local configFile="$1"
    local new_ip="$2"
    if [[ ! -f "$configFile" ]]; then
        red "配置文件 $configFile 不存在！"
        return 1
    fi
    jq --arg new_ip "$new_ip" '
        .HY2IP = $new_ip
    ' "$configFile" > temp.json && mv temp.json "$configFile"

    if [[ $? -eq 0 ]]; then
        green "Config 配置文件成功更新IP为 $new_ip"
    else
        red "更新配置文件失败！"
        return 1
    fi
}

# 处理更新IP的主函数
changeHy2IP() {
    local configFile1="$HOME/serv00-play/singbox/config.json"
    local configFile2="$HOME/serv00-play/singbox/singbox.json"
    local hy2_ip=$(get_ip)

    # 如果没有获取到有效的 IP，直接返回，不进行配置文件更新
    if [[ -z "$hy2_ip" || "$hy2_ip" == "未找到可用的 IP！" ]]; then
        red "获取可用 IP 失败！"
        return 1
    fi
    
    # 如果获取到了有效的 IP，更新配置文件
    update_config_json "$configFile1" "$hy2_ip"
    update_singbox_json "$configFile2" "$hy2_ip"
    
    # 重启服务
    echo "正在重启 sing-box..."
    stopSingBox
    sleep 3
    startSingBox
}

# 停止 SingBox 服务
stopSingBox() {
    cd ~/serv00-play/singbox/ && bash killsing-box.sh
}

# 启动 SingBox 服务
startSingBox() {
    cd ~/serv00-play/singbox/ && bash start.sh
}

# 执行更新操作
changeHy2IP