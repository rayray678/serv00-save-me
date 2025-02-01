#!/bin/bash

# **配置**
U=$(whoami)
V=$(echo "$U" | tr '[:upper:]' '[:lower:]')
W="$V.serv00.net"
A1="/home/$U/domains/$W"
A2="$A1/public_nodejs"
LOCAL_VERSION_FILE="version.txt"  # 本地版本文件
REMOTE_VERSION_URL="https://raw.githubusercontent.com/ryty1/serv00-save-me/main/version.txt"  # 远程版本URL
REMOTE_DIR_URL="https://raw.githubusercontent.com/ryty1/serv00-save-me/main/"  # 远程文件目录
EXCLUDED_DIRS=("public" "tmp")  # 需要保留的目录
DOMAIN_DIR="$A2"  # 本地文件所在的目录

# **获取本地版本号**
get_local_version() {
    if [ ! -f "$LOCAL_VERSION_FILE" ]; then
        echo "0.0.0"
    else
        cat "$LOCAL_VERSION_FILE"
    fi
}

# **获取远程版本号**
get_remote_version() {
    curl -s "$REMOTE_VERSION_URL"
}

# **获取远程文件列表（不下载 file_list.txt，仅解析）**
get_remote_file_list() {
    curl -s "${REMOTE_DIR_URL}file_list.txt"
}

# **获取本地文件列表（排除目录）**
get_local_files() {
    find "$DOMAIN_DIR" -type f | grep -Ev "$(printf "%s\n" "${EXCLUDED_DIRS[@]}" | paste -sd '|')"
}

# **下载并覆盖远程文件**
download_file() {
    local file_name=$1
    curl -s -o "$DOMAIN_DIR/$file_name" "${REMOTE_DIR_URL}${file_name}"
    echo "✅ ${file_name} 更新完成"
}

# **删除本地无效文件**
delete_local_file() {
    local file_name=$1
    rm -f "$file_name"
    echo "🗑️ 删除无效文件: $file_name"
}

# **删除本地无效目录**
delete_local_directory() {
    local dir_name=$1
    rm -rf "$dir_name"
    echo "🗑️ 删除无效目录: $dir_name"
}

# **更新本地版本文件**
update_local_version() {
    local new_version=$1
    echo "$new_version" > "$LOCAL_VERSION_FILE"
    echo "📢 版本更新完成，新版本号: $new_version"
}

# **检查并更新文件**
check_for_updates() {
    local remote_version=$(get_remote_version)
    local local_version=$(get_local_version)

    if [ "$local_version" == "$remote_version" ]; then
        echo "✅ 文件已是最新，无需更新"
        return 0
    fi

    echo "🔄 版本号不同，开始更新..."

    # 获取远程文件列表（不下载 file_list.txt）
    remote_files=$(get_remote_file_list)

    # **防止误删：如果远程文件列表为空，则退出**
    if [ -z "$remote_files" ]; then
        echo "❌ 远程文件列表为空，停止更新以防误删！"
        return 1
    fi

    local_files=$(get_local_files)

    echo "📂 远程文件列表: $remote_files"
    echo "📂 本地文件列表: $local_files"

    # 下载远程文件（覆盖已有文件）
    for file in $remote_files; do
        download_file "$file"
    done

    # 删除本地无效文件（不在远程列表）
    for file in $local_files; do
        base_file=$(basename "$file")
        if ! echo "$remote_files" | grep -q "^$base_file$"; then
            delete_local_file "$file"
        fi
    done

    # 删除本地无效目录（不在 `EXCLUDED_DIRS` 列表中的）
    for dir in $(find "$DOMAIN_DIR" -mindepth 1 -type d); do
        base_dir=$(basename "$dir")
        if ! printf "%s\n" "${EXCLUDED_DIRS[@]}" | grep -q "^$base_dir$"; then
            delete_local_directory "$dir"
        fi
    done

    # 更新本地版本号
    update_local_version "$remote_version"
}

# **显示版本信息**
display_version_and_results() {
    local remote_version=$(get_remote_version)
    local local_version=$(get_local_version)

    echo -e "📌 本地版本: $local_version  |  📌 远程版本: $remote_version"
}

# **执行更新**
display_version_and_results
check_for_updates