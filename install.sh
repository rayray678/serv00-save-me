A() {
    local a=$1
    local b=$2
    local c=$(date +%s)
    local d=2
    local e=("+")
    while true; do
        local f=$(( $(date +%s) - c ))
        printf "\r[%s] %s" "${e[$((f % 1))]}" "$a"
        if [[ $f -ge 1 ]]; then
            break
        fi
        sleep 0.08
    done
    printf "\r                       \r"
    if [[ $b -eq 0 ]]; then
        printf "[\033[0;32mOK\033[0m] %s\n" "$a"
    else
        printf "[\033[0;31mNO\033[0m] %s\n" "$a"
    fi
}

u=$(whoami)
v=$(echo "$u" | tr '[:upper:]' '[:lower:]')
w="$v.serv00.net"
x="/home/$u/domains/$w"
y="$x/public_nodejs"
z="https://github.com/ryty1/serv00-save-me/archive/refs/heads/main.zip"

echo " ———————————————————————————————————————————————————————————— "

cd && devil www del "$w" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
    A " 删除 默认域名 " 0
else
    A " 默认域名 删除失败 或 不存在" 1
fi

if [[ -d "$x" ]]; then
    rm -rf "$x"
fi

if devil www add "$w" nodejs /usr/local/bin/node22 > /dev/null 2>&1; then
    A " 创建 类型域名 " 0
else
    A "  类型域名 创建失败，请检查环境设置 " 1
    exit 1
fi

if [[ ! -d "$y" ]]; then
    mkdir -p "$y"
fi

cd "$x" && npm init -y > /dev/null 2>&1
if npm install dotenv basic-auth express axios > /dev/null 2>&1; then
    A " 安装 环境依赖 " 0
else
    A "  环境依赖 安装失败 " 1
    exit 1
fi

wget "$z" -O "$y/main.zip" > /dev/null 2>&1

if [[ ! -f "$y/main.zip" ]]; then
    A "下载失败：无法找到 main.zip" 1
    exit 1
else
    A " 下载 配置文件 " 0
fi

unzip -q "$y/main.zip" -d "$y" > /dev/null 2>&1

EXTRACTED="$y/serv00-save-me-main"
if [[ -d "$EXTRACTED" ]]; then
    mv "$EXTRACTED"/* "$y/"
    rm -rf "$EXTRACTED"
fi
rm -f "$y/README.md"
rm -f "$y/file_list.txt"
rm -f "$y/main.zip"

chmod 755 "$y/app.js" > /dev/null 2>&1
chmod 755 "$y/install.sh" > /dev/null 2>&1
chmod 755 "$y/hy2ip.sh" > /dev/null 2>&1

echo ""
echo " 【 恭 喜 】： 网 页 保 活 一 键 部 署 已 完 成  "
echo " ———————————————————————————————————————————————————————————— "
echo ""
echo " |**保活网页 https://$w/info "
echo ""
echo " ———————————————————————————————————————————————————————————— "
echo ""