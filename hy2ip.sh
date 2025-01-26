#!/bin/bash
a() {
    echo -e "\033[32m$1\033[0m"
}
b() {
    echo -e "\033[31m$1\033[0m"
}
c() {
    local d=$(hostname)
    local e=$(echo "$d" | awk -F'[s.]' '{print $2}')
    local f=("cache${e}.serv00.com" "web${e}.serv00.com" "$d")

    for g in "${f[@]}"; do
        local h=$(curl -s --max-time 10 "https://ss.botai.us.kg/api/getip?host=$g")
        if [[ "$h" =~ "not found" ]]; then
            echo "未识别主机 ${g}！"
            continue
        fi

        local i=$(echo "$h" | awk -F "|" '{print $1}')
        local j=$(echo "$h" | awk -F "|" '{print $2}')

        if [[ "$j" == "Accessible" ]]; then
            echo "$i"
            return
        fi
    done

    b "未找到可用的 IP！"
    return 1
}
k() {
    local l="$1"
    local m="$2"
    if [[ ! -f "$l" ]]; then
        b "配置文件 $l 不存在！"
        return 1
    fi
    jq --arg m "$m" '
        (.inbounds[] | select(.tag == "hysteria-in") | .listen) = $m
    ' "$l" > n.json && mv n.json "$l"

    if [[ $? -eq 0 ]]; then
        a "SingBox 配置文件成功更新IP为 $m"
    else
        b "更新配置文件失败！"
        return 1
    fi
}
o() {
    local p="$1"
    local q="$2"
    if [[ ! -f "$p" ]]; then
        b "配置文件 $p 不存在！"
        return 1
    fi
    jq --arg q "$q" '
        .HY2IP = $q
    ' "$p" > n.json && mv n.json "$p"

    if [[ $? -eq 0 ]]; then
        a "Config 配置文件成功更新IP为 $q"
    else
        b "更新配置文件失败！"
        return 1
    fi
}
r() {
    local s="$HOME/serv00-play/singbox/config.json"
    local t="$HOME/serv00-play/singbox/singbox.json"
    local u=$(c)

    if [[ -z "$u" ]]; then
        b "获取可用 IP 失败！"
        return 1
    fi
    k "$s" "$u"
    o "$t" "$u"
    echo "正在重启 sing-box..."
    v
    sleep 3
    w
}
v() {
    cd ~/serv00-play/singbox/ && bash killsing-box.sh
}
w() {
    cd ~/serv00-play/singbox/ && bash start.sh
}
r
