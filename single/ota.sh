#!/bin/bash
USER_NAME=$(whoami)
DOMAIN_NAME="${USER_NAME,,}.serv00.net"
BASE_DIR="/home/$USER_NAME/domains/$DOMAIN_NAME"
NODEJS_DIR="$BASE_DIR/public_nodejs"
LOCAL_FILE_LIST="$NODEJS_DIR/file_list.txt"  
LOCAL_VERSION_FILE="$NODEJS_DIR/version.txt"  
REMOTE_FILE_LIST_URL="${REMOTE_DIR_URL}single/file_list.txt"  
REMOTE_VERSION_URL="${REMOTE_DIR_URL}single/version.txt"  
REMOTE_DIR_URL="https://raw.githubusercontent.com/ryty1/serv00-save-me/main/" 
get_remote_version() {
    curl -s "$REMOTE_VERSION_URL" | tr -d '\r'
}
get_local_version() {
    if [ ! -f "$LOCAL_VERSION_FILE" ]; then
        echo "0.0.0"  
    else
        cat "$LOCAL_VERSION_FILE" | tr -d '\r'
    fi
}
get_remote_file_list() {
    curl -s "$REMOTE_FILE_LIST_URL"
}
get_local_file_list() {
    cat "$LOCAL_FILE_LIST"
}
download_file() {
    local file_name=$1
    curl -s -o "$NODEJS_DIR/$file_name" "${REMOTE_DIR_URL}${file_name}"
    echo "✅ ${file_name} 更新完成"
}
delete_local_file() {
    local file_name=$1
    rm -f "$NODEJS_DIR/$file_name"
    echo "❌ ${file_name} 已删除"
}
update_local_file_list() {
    local new_file_list=$1
    echo "$new_file_list" > "$LOCAL_FILE_LIST"
}
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
sync_files() {
    local files_updated=false
    remote_files=$(get_remote_file_list)
    local_files=$(get_local_file_list)
    for file in $remote_files; do
        if echo "$local_files" | grep -q "^$file$"; then
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
    if $files_updated; then
        return 0  
    else
        return 1  
    fi
}
display_versions() {
    local remote_version=$(get_remote_version)
    local local_version=$(get_local_version)
    echo "📌 当前版本: $local_version  |  📌 最新版本: $remote_version"
}
check_version_and_sync() {
    local remote_version=$(get_remote_version)
    local local_version=$(get_local_version)
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
        echo "🔝 己是最版本，无需更新"
    fi
}
clean_and_restart_nodejs() {
    node -e "Object.keys(require.cache).forEach(function(key) { delete require.cache[key] });"
    devil www restart "${USER_NAME,,}.serv00.net" > /dev/null 2>&1
    echo "应用已重启，请1分钟后刷新网页"
}
check_version_and_sync
