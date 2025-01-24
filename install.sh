#!/bin/bash

# 打印实时状态的函数
print_status() {
    local message=$1
    local command=$2
    local animation=("◜" "◝" "◞" "◟")
    
    # 启动命令并将其放到后台执行
    $command &  # 后台执行命令
    local pid=$!
    
    # 启动动画实时显示
    local start_time=$(date +%s)
    while kill -0 $pid 2>/dev/null; do
        local elapsed_time=$(( $(date +%s) - start_time ))
        printf "\r[%s] %s" "${animation[$((elapsed_time % 4))]}" "$message"
        sleep 0.25  # 动画更新的速度
    done

    # 清除行并结束动画
    printf "\r[\033[0;32mOK\033[0m] %s\n" "$message"
}

# 设置变量
U1=$(whoami)
U1_DOMAIN=$(echo "$U1" | tr '[:upper:]' '[:lower:]')
D1="$U1_DOMAIN.serv00.net"
D2="/home/$U1/domains/$D1"
F1="$D2/public_nodejs/app.js"
L1="https://raw.githubusercontent.com/ryty1/sver00-save-me/refs/heads/main/app.js"

# 显示开始信息
echo ""
echo "————————————————————————————————————————————————————————————"
cd && devil www del "$D1" > /dev/null 2>&1 && [[ -d "$D2" ]] && rm -rf "$D2" > /dev/null 2>&1
# 删除默认域名
print_status "正在删除 默认域名" "devil www del $D1"
# 创建类型域名
devil www add "$D1" nodejs /usr/local/bin/node22 > /dev/null 2>&1
print_status "正在创建 类型域名" "devil www add $D1 nodejs /usr/local/bin/node22"

# 安装环境依赖
cd "$D2" && npm init -y > /dev/null 2>&1 && npm install dotenv basic-auth express > /dev/null 2>&1
print_status "正在安装 环境依赖" "cd $D2 && npm init -y && npm install dotenv basic-auth express"

# 下载配置文件
curl -s -o "$F1" "$L1" && chmod 755 "$F1" > /dev/null 2>&1
print_status "正在下载 配置文件" "curl -s -o $F1 $L1"

# 显示结束信息
echo "————————————————————————————————————————————————————————————"
echo ""
echo "【 恭 喜 】：网页保活一键部署已完成"
echo "————————————————————————————————————————————————————————————"
echo " |**保活网页 https://$D1/info "
echo ""
echo " |**查看节点 https://$D1/node_info "
echo ""
echo " |**输出日志 https://$D1/keepalive "
echo "————————————————————————————————————————————————————————————"
echo ""