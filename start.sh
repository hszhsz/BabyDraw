#!/bin/bash

# BabyDraw 项目启动脚本
# 用于同时启动前端和后端服务

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOGS_DIR="$PROJECT_ROOT/logs"

# 创建日志目录
mkdir -p "$LOGS_DIR"

# 日志文件
BACKEND_LOG="$LOGS_DIR/backend.log"
FRONTEND_LOG="$LOGS_DIR/frontend.log"
START_LOG="$LOGS_DIR/start.log"

# 记录启动日志
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$START_LOG"
}

# 打印带颜色的消息
print_message() {
    echo -e "${2}$1${NC}"
    log_message "$1"
}

# 检查依赖
check_dependencies() {
    print_message "检查依赖..." "$BLUE"
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_message "错误: Node.js 未安装" "$RED"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        print_message "错误: npm 未安装" "$RED"
        exit 1
    fi
    
    # 检查 Python
    if ! command -v python3 &> /dev/null; then
        print_message "错误: Python3 未安装" "$RED"
        exit 1
    fi
    
    # 检查 uv
    if ! command -v uv &> /dev/null; then
        print_message "错误: uv 未安装" "$RED"
        exit 1
    fi
    
    print_message "依赖检查完成" "$GREEN"
}

# 安装依赖
install_dependencies() {
    print_message "安装依赖..." "$BLUE"
    
    # 安装前端依赖
    print_message "安装前端依赖..." "$YELLOW"
    cd "$FRONTEND_DIR"
    npm install >> "$START_LOG" 2>&1
    
    # 安装后端依赖
    print_message "安装后端依赖..." "$YELLOW"
    cd "$BACKEND_DIR"
    uv sync >> "$START_LOG" 2>&1
    
    cd "$PROJECT_ROOT"
    print_message "依赖安装完成" "$GREEN"
}

# 启动后端服务
start_backend() {
    print_message "启动后端服务..." "$BLUE"
    cd "$BACKEND_DIR"
    
    # 创建后端日志目录
    mkdir -p "$BACKEND_DIR/logs"
    
    # 启动后端服务（后台运行）
    nohup uv run python start.py > "$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$LOGS_DIR/backend.pid"
    
    print_message "后端服务已启动 (PID: $BACKEND_PID)" "$GREEN"
    print_message "后端日志: $BACKEND_LOG" "$YELLOW"
    
    # 等待后端启动
    sleep 3
    
    # 检查后端是否启动成功
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_message "后端启动失败" "$RED"
        exit 1
    fi
    
    print_message "后端服务运行在: http://localhost:8000" "$GREEN"
}

# 启动前端服务
start_frontend() {
    print_message "启动前端服务..." "$BLUE"
    cd "$FRONTEND_DIR"
    
    # 创建前端日志目录
    mkdir -p "$FRONTEND_DIR/logs"
    
    # 启动前端服务（后台运行）
    nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$LOGS_DIR/frontend.pid"
    
    print_message "前端服务已启动 (PID: $FRONTEND_PID)" "$GREEN"
    print_message "前端日志: $FRONTEND_LOG" "$YELLOW"
    
    # 等待前端启动
    sleep 5
    
    # 检查前端是否启动成功
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_message "前端启动失败" "$RED"
        exit 1
    fi
    
    print_message "前端服务运行在: http://localhost:3000" "$GREEN"
}

# 停止服务
stop_services() {
    print_message "停止服务..." "$YELLOW"
    
    # 停止后端
    if [ -f "$LOGS_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$LOGS_DIR/backend.pid")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            print_message "后端服务已停止" "$GREEN"
        fi
        rm -f "$LOGS_DIR/backend.pid"
    fi
    
    # 停止前端
    if [ -f "$LOGS_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$LOGS_DIR/frontend.pid")
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            print_message "前端服务已停止" "$GREEN"
        fi
        rm -f "$LOGS_DIR/frontend.pid"
    fi
}

# 显示服务状态
show_status() {
    print_message "服务状态:" "$BLUE"
    
    # 检查后端状态
    if [ -f "$LOGS_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$LOGS_DIR/backend.pid")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_message "后端服务: 运行中 (PID: $BACKEND_PID)" "$GREEN"
        else
            print_message "后端服务: 已停止" "$RED"
        fi
    else
        print_message "后端服务: 未启动" "$RED"
    fi
    
    # 检查前端状态
    if [ -f "$LOGS_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$LOGS_DIR/frontend.pid")
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_message "前端服务: 运行中 (PID: $FRONTEND_PID)" "$GREEN"
        else
            print_message "前端服务: 已停止" "$RED"
        fi
    else
        print_message "前端服务: 未启动" "$RED"
    fi
}

# 显示日志
show_logs() {
    case $1 in
        "backend")
            if [ -f "$BACKEND_LOG" ]; then
                tail -f "$BACKEND_LOG"
            else
                print_message "后端日志文件不存在" "$RED"
            fi
            ;;
        "frontend")
            if [ -f "$FRONTEND_LOG" ]; then
                tail -f "$FRONTEND_LOG"
            else
                print_message "前端日志文件不存在" "$RED"
            fi
            ;;
        "start")
            if [ -f "$START_LOG" ]; then
                tail -f "$START_LOG"
            else
                print_message "启动日志文件不存在" "$RED"
            fi
            ;;
        *)
            print_message "用法: $0 logs [backend|frontend|start]" "$YELLOW"
            ;;
    esac
}

# 信号处理
trap 'stop_services; exit 0' SIGINT SIGTERM

# 主函数
main() {
    case $1 in
        "start")
            print_message "=== BabyDraw 项目启动 ===" "$GREEN"
            check_dependencies
            install_dependencies
            start_backend
            start_frontend
            print_message "=== 所有服务已启动 ===" "$GREEN"
            print_message "前端: http://localhost:3000" "$BLUE"
            print_message "后端: http://localhost:8000" "$BLUE"
            print_message "使用 '$0 stop' 停止服务" "$YELLOW"
            print_message "使用 '$0 status' 查看状态" "$YELLOW"
            print_message "使用 '$0 logs [backend|frontend|start]' 查看日志" "$YELLOW"
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            main start
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs $2
            ;;
        "install")
            check_dependencies
            install_dependencies
            ;;
        *)
            echo "用法: $0 {start|stop|restart|status|logs|install}"
            echo "  start    - 启动前后端服务"
            echo "  stop     - 停止所有服务"
            echo "  restart  - 重启所有服务"
            echo "  status   - 查看服务状态"
            echo "  logs     - 查看日志 [backend|frontend|start]"
            echo "  install  - 仅安装依赖"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"