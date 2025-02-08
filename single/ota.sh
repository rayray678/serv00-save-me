#!/bin/bash

USER_NAME=$(whoami)
DOMAIN_NAME="${USER_NAME,,}.serv00.net"
BASE_DIR="/home/$USER_NAME/domains/$DOMAIN_NAME"
NODEJS_DIR="$BASE_DIR/public_nodejs"
LOCAL_FILE_LIST="$NODEJS_DIR/file_list.txt"  
LOCAL_VERSION_FILE="$NODEJS_DIR/version.txt"  

# ✅ 远程文件 URL（修正变量定义顺序）
REMOTE_DIR_URL="https://raw.githubusercontent.com/ryty1/serv00-save-me/main/"
REMOTE_FILE_LIST_URL="${REMOTE_DIR_URL}single/file_list.txt"  
REMOTE_VERSION_URL="${REMOTE_DIR_URL}single/version.txt"  

# ✅ 获取远程版本号（防止 curl 失败）
get_remote_version() {
    local version
    version=$(curl -s "$REMOTE_VERSION_URL" | tr -d '\r')
    if [[ -z "$version" ]]; then
        version=$(wget -qO- "$REMOTE_VERSION_URL" | tr -d '\r')
    fi
    echo "${version:-0.0.0}"  # 如果仍然为空，则返回 0.0.0
}

# ✅ 获取本地版本号（防止文件不存在）
get_local_version() {
    [ -f "$LOCAL_VERSION_FILE" ] && cat "$LOCAL_VERSION_FILE" | tr -d '\r' || echo "0.0.0"
}

# ✅ 获取远程文件列表
get_remote_file_list() {
    curl -s "$REMOTE_FILE_LIST_URL" || wget -qO- "$REMOTE_FILE_LIST_URL"
}

# ✅ 获取本地文件列表（防止文件不存在）
get_local_file_list() {
    [ -f "$LOCAL_FILE_LIST" ] && cat "$LOCAL_FILE_LIST" || echo ""
}

# ✅ 下载文件
download_file() {
    local file_name=$1
    curl -s -o "$NODEJS_DIR/$file_name" "${REMOTE_DIR_URL}${file_name}" || wget -qO "$NODEJS_DIR/$file_name" "${REMOTE_DIR_URL}${file_name}"
    echo "✅ ${file_name} 更新完成"
}

# ✅ 删除本地文件
delete_local_file() {
    local file_name=$1
    rm -f "$NODEJS_DIR/$file_name"
    echo "❌ ${file_name} 已删除"
}

# ✅ 更新本地文件列表
update_local_file_list() {
    echo "$1" > "$LOCAL_FILE_LIST"
}

# ✅ 版本号比较（正确处理 `10.0.0` vs `2.0.0`）
is_remote_version_higher() {
    printf '%s\n%s' "$2" "$1" | sort -V | tail -n1 | grep -q "$1"
}

# ✅ 同步文件
sync_files() {
    local files_updated=false
    local remote_files local_files

    remote_files=$(get_remote_file_list)
    local_files=$(get_local_file_list)

    for file in $remote_files; do
        if ! echo "$local_files" | grep -q "^$file$"; then
            download_file "$file"
            files_updated=true
        fi
    done

    for file in $local_files; do
        if ! echo "$remote_files" | grep -q "^$file$"; then
            delete_local_file "$file"
            files_updated=true
        fi
    done

    update_local_file_list "$remote_files"
    [ "$files_updated" = true ]
}

# ✅ 显示版本信息
display_versions() {
    echo "📌 当前版本: $(get_local_version)  |  📌 最新版本: $(get_remote_version)"
}

# ✅ 检查并同步版本
check_version_and_sync() {
    local remote_version local_version
    remote_version=$(get_remote_version)
    local_version=$(get_local_version)

    display_versions

    if is_remote_version_higher "$remote_version" "$local_version"; then
        echo "🔄 发现新版本，开始同步文件..."
        if sync_files; then
            echo "$remote_version" > "$LOCAL_VERSION_FILE"
            echo "📢 版本更新完成，新版本号: $remote_version"
            clean_and_restart_nodejs
        else
            echo "❌ 没有需要更新的文件"
        fi
    else
        echo "🔝 已是最新版本，无需更新"
    fi
}

# ✅ 重启 Node.js 应用
clean_and_restart_nodejs() {
    node -e "Object.keys(require.cache).forEach(function(key) { delete require.cache[key] });"
    
    if command -v devil >/dev/null 2>&1; then
        devil www restart "${USER_NAME,,}.serv00.net" > /dev/null 2>&1
        echo "🔄 应用已重启，请1分钟后刷新网页"
    else
        echo "⚠️ 找不到 'devil' 命令，无法重启应用"
    fi
}

# ✅ 执行检查更新
check_version_and_sync