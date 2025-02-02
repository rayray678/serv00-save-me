#!/bin/bash

# **配置**
USER_NAME=$(whoami)
DOMAIN_NAME="${USER_NAME,,}.serv00.net"  # 转换为小写
BASE_DIR="/home/$USER_NAME/domains/$DOMAIN_NAME"
NODEJS_DIR="$BASE_DIR/public_nodejs"
LOCAL_VERSION_FILE="$NODEJS_DIR/version.txt"  # 本地版本文件
REMOTE_VERSION_URL="https://raw.githubusercontent.com/ryty1/serv00-save-me/main/version.txt"  # 远程版本URL
REMOTE_DIR_URL="https://raw.githubusercontent.com/ryty1/serv00-save-me/main/"  # 远程文件目录
REMOTE_FILE_LIST_URL="${REMOTE_DIR_URL}file_list.txt"  # 远程 file_list.txt
LOCAL_FILE_LIST="$NODEJS_DIR/file_list.txt"  # 本地 file_list.txt

# **获取远程版本号**
get_remote_version() {
    curl -s "$REMOTE_VERSION_URL" | tr -d '\r'
}

# **获取本地版本号**
get_local_version() {
    if [ ! -f "$LOCAL_VERSION_FILE" ]; then
        echo "0.0.0"  # 如果没有本地版本文件，则返回默认版本号
    else
        cat "$LOCAL_VERSION_FILE" | tr -d '\r'
    fi
}

# **获取远程 file_list**
get_remote_file_list() {
    curl -s "$REMOTE_FILE_LIST_URL"
}

# **获取本地 file_list**
get_local_file_list() {
    cat "$LOCAL_FILE_LIST"
}

# **下载并覆盖远程文件**
download_file() {
    local file_name=$1
    curl -s -o "$NODEJS_DIR/$file_name" "${REMOTE_DIR_URL}${file_name}"
    echo "✅ ${file_name} 更新完成"
}

# **删除本地无效文件**
delete_local_file() {
    local file_name=$1
    rm -f "$NODEJS_DIR/$file_name"
    echo "❌ ${file_name} 已删除"
}

# **更新本地 file_list.txt**
update_local_file_list() {
    local new_file_list=$1
    echo "$new_file_list" > "$LOCAL_FILE_LIST"
}

# **版本号比较（远程版本高于本地版本）**
is_remote_version_higher() {
    local remote_version=$1
    local local_version=$2

    # 比较版本号：返回 0 表示远程版本高于本地版本，返回 1 表示远程版本不高
    if [[ "$remote_version" > "$local_version" ]]; then
        return 0  # 远程版本高于本地版本
    else
        return 1  # 远程版本不高于本地版本
    fi
}

# **同步文件**
sync_files() {
    local files_updated=false

    # 获取远程和本地的文件列表
    remote_files=$(get_remote_file_list)
    local_files=$(get_local_file_list)

    # 只对存在于远程和本地 file_list 中的文件进行操作
    # 下载远程文件（覆盖本地文件）
    for file in $remote_files; do
        # 如果该文件同时存在于本地 file_list.txt 中，才执行下载
        if echo "$local_files" | grep -q "^$file$"; then
            download_file "$file"
            files_updated=true
        fi
    done

    # 删除本地无效文件（不在远程 file_list 中，且在本地 file_list 中）
    for file in $local_files; do
        # 如果该文件不在远程 file_list 中，才删除
        if ! echo "$remote_files" | grep -q "^$file$"; then
            delete_local_file "$file"
            files_updated=true
        fi
    done

    # 更新本地 file_list.txt
    update_local_file_list "$remote_files"

    # 返回是否有文件更新
    if $files_updated; then
        return 0  # 表示文件更新成功
    else
        return 1  # 表示没有文件更新
    fi
}

# **显示版本号**
display_versions() {
    local remote_version=$(get_remote_version)
    local local_version=$(get_local_version)

    echo "📌 当前版本: $local_version  |  📌 最新版本: $remote_version"
}

# **检查版本号是否需要更新**
check_version_and_sync() {
    local remote_version=$(get_remote_version)
    local local_version=$(get_local_version)

    # 显示当前版本号
    display_versions

    # 检查远程版本是否高于本地版本
    if is_remote_version_higher "$remote_version" "$local_version"; then
        echo "🔄 发现新版本，开始同步文件..."
        if sync_files; then
            # 更新本地版本文件
            echo "$remote_version" > "$LOCAL_VERSION_FILE"
            echo "📢 版本更新完成，新版本号: $remote_version"

            # **清理 Node.js 缓存并重启应用**
            clean_and_restart_nodejs
        else
            echo "❌ 没有需要更新的文件"
        fi
    else
        echo "✅ 己是最版本，无需更新"
    fi
}

# **清理 Node.js 缓存并重启应用**
clean_and_restart_nodejs() {
    # 清理 Node.js 缓存
    echo "正在清理 Node.js 缓存..."
    node -e "Object.keys(require.cache).forEach(function(key) { delete require.cache[key] });"

    # 重启 Node.js 应用
    echo "正在重启 Node.js 应用..."
    devil www restart "${USER_NAME,,}.serv00.net"
    echo "应用已重启，请1分钟后刷新网页"
}

# **执行操作**
check_version_and_sync