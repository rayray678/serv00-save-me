#!/bin/bash

# **配置**
LOCAL_VERSION_FILE="version.txt"  # 本地版本文件
REMOTE_VERSION_URL="https://raw.githubusercontent.com/ryty1/serv00-save-me/main/version.txt"  # 远程版本URL
REMOTE_DIR_URL="https://raw.githubusercontent.com/ryty1/serv00-save-me/main/"  # 远程文件目录
EXCLUDED_FILES=("README.md")  # 排除的文件
EXCLUDED_DIRS=("public" "tmp")  # 排除的目录
DOMAIN_DIR="."  # 文件所在的目录

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

# **获取远程文件列表**
get_remote_file_list() {
    curl -s "${REMOTE_DIR_URL}file_list.txt" | grep -vE "$(IFS=\|; echo "${EXCLUDED_FILES[*]}")"
}

# **获取本地文件列表**
get_local_files() {
    find "$DOMAIN_DIR" -type f | grep -vE "$(IFS=\|; echo "${EXCLUDED_DIRS[*]}")"
}

# **下载远程文件**
download_file() {
    local file_name=$1
    curl -s -O "${REMOTE_DIR_URL}${file_name}"
    echo "✅ ${file_name} 下载成功"
}

# **删除本地多余文件**
delete_local_file() {
    local file_name=$1
    rm -f "$file_name"
    echo "🗑️ 删除多余文件: $file_name"
}

# **更新本地版本文件**
update_local_version() {
    local new_version=$1
    echo "$new_version" > "$LOCAL_VERSION_FILE"
    echo "📢 版本更新完成，新版本号: $new_version"
}

# **主程序：检查并更新**
check_for_updates() {
    local remote_version=$(get_remote_version)
    local local_version=$(get_local_version)

    if [ "$local_version" == "$remote_version" ]; then
        echo "✅ 文件已是最新，无需更新"
        return 0
    fi

    echo "🔄 版本号不同，开始更新..."

    # 获取远程文件列表
    remote_files=$(get_remote_file_list)
    local_files=$(get_local_files)

    # 下载远程文件
    for file in $remote_files; do
        download_file "$file"
    done

    # 删除本地多余文件
    for file in $local_files; do
        if ! echo "$remote_files" | grep -q "$file"; then
            delete_local_file "$file"
        fi
    done

    # 更新本地版本号
    update_local_version "$remote_version"
}

# **显示版本和更新结果**
display_version_and_results() {
    local remote_version=$(get_remote_version)
    local local_version=$(get_local_version)

    echo -e "📌 本地版本: $local_version  |  📌 远程版本: $remote_version"
}

# **执行更新**
display_version_and_results
check_for_updates