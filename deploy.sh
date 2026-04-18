#!/bin/bash

# 小世界·记忆 - 部署脚本
# 支持：Docker 部署 或 PM2 部署

set -e

echo "🚀 开始部署 Memory AI Companion..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}警告：建议使用 root 用户运行此脚本${NC}"
fi

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${GREEN}工作目录: $SCRIPT_DIR${NC}"

# 检查部署方式
echo ""
echo "请选择部署方式："
echo "1) Docker 部署（推荐，包含 Nginx 反向代理）"
echo "2) PM2 部署（直接使用 Node.js）"
echo "3) 宝塔面板部署"
read -p "请输入选项 (1/2/3): " deploy_choice

case $deploy_choice in
    1)
        echo -e "${GREEN}使用 Docker 部署...${NC}"
        
        # 检查 Docker 是否安装
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}Docker 未安装，请先安装 Docker${NC}"
            echo "安装命令: curl -fsSL https://get.docker.com | sh"
            exit 1
        fi
        
        # 检查 Docker Compose 是否安装
        if ! command -v docker-compose &> /dev/null; then
            echo -e "${RED}Docker Compose 未安装，请先安装 Docker Compose${NC}"
            exit 1
        fi
        
        # 创建必要目录
        mkdir -p data uploads logs ssl
        
        # 设置环境变量
        if [ ! -f .env ]; then
            echo -e "${YELLOW}创建 .env 文件...${NC}"
            cat > .env << EOF
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=3000
EOF
        fi
        
        # 停止旧容器
        echo -e "${YELLOW}停止旧容器...${NC}"
        docker-compose down || true
        
        # 构建并启动
        echo -e "${GREEN}构建并启动容器...${NC}"
        docker-compose up -d --build
        
        # 等待服务启动
        echo -e "${YELLOW}等待服务启动...${NC}"
        sleep 10
        
        # 检查健康状态
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 部署成功！服务运行在 http://localhost:3000${NC}"
        else
            echo -e "${RED}❌ 服务启动失败，请检查日志: docker-compose logs${NC}"
            exit 1
        fi
        
        echo ""
        echo -e "${GREEN}常用命令：${NC}"
        echo "  查看日志: docker-compose logs -f"
        echo "  停止服务: docker-compose down"
        echo "  重启服务: docker-compose restart"
        ;;
        
    2)
        echo -e "${GREEN}使用 PM2 部署...${NC}"
        
        # 检查 Node.js 是否安装
        if ! command -v node &> /dev/null; then
            echo -e "${RED}Node.js 未安装，请先安装 Node.js${NC}"
            exit 1
        fi
        
        # 检查 PM2 是否安装
        if ! command -v pm2 &> /dev/null; then
            echo -e "${YELLOW}安装 PM2...${NC}"
            npm install -g pm2
        fi
        
        # 进入服务器目录
        cd server
        
        # 安装依赖
        echo -e "${YELLOW}安装依赖...${NC}"
        npm ci --only=production
        
        # 创建日志目录
        mkdir -p ../logs
        
        # 初始化数据库
        echo -e "${YELLOW}初始化数据库...${NC}"
        node init-db.js || true
        
        # 停止旧进程
        echo -e "${YELLOW}停止旧进程...${NC}"
        pm2 delete memory-ai-companion 2>/dev/null || true
        
        # 启动服务
        echo -e "${GREEN}启动服务...${NC}"
        cd ..
        pm2 start ecosystem.config.js --env production
        
        # 保存 PM2 配置
        pm2 save
        pm2 startup
        
        echo -e "${GREEN}✅ 部署成功！${NC}"
        echo ""
        echo -e "${GREEN}常用命令：${NC}"
        echo "  查看状态: pm2 status"
        echo "  查看日志: pm2 logs memory-ai-companion"
        echo "  重启服务: pm2 restart memory-ai-companion"
        echo "  停止服务: pm2 stop memory-ai-companion"
        ;;
        
    3)
        echo -e "${GREEN}宝塔面板部署指南：${NC}"
        echo ""
        echo "请按照以下步骤操作："
        echo ""
        echo "1. 上传文件到服务器"
        echo "   将 server 文件夹上传到 /www/wwwroot/memory-ai-companion/server"
        echo ""
        echo "2. 安装 Node.js"
        echo "   宝塔面板 → 软件商店 → 安装 Node.js 版本管理器 → 安装 Node.js v18"
        echo ""
        echo "3. 安装依赖"
        echo "   cd /www/wwwroot/memory-ai-companion/server"
        echo "   npm install"
        echo ""
        echo "4. 初始化数据库"
        echo "   node init-db.js"
        echo ""
        echo "5. 配置环境变量"
        echo "   创建 /www/wwwroot/memory-ai-companion/server/.env 文件："
        cat > /tmp/env_example.txt << 'EOF'
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
EOF
        cat /tmp/env_example.txt
        echo ""
        echo "6. 使用 PM2 启动（推荐）"
        echo "   npm install -g pm2"
        echo "   pm2 start server.js --name memory-ai-companion"
        echo "   pm2 save"
        echo "   pm2 startup"
        echo ""
        echo "7. 配置 Nginx 反向代理"
        echo "   在宝塔面板中添加网站，然后配置反向代理到 127.0.0.1:3000"
        echo ""
        echo "8. 开放防火墙端口"
        echo "   宝塔面板 → 安全 → 放行 3000 端口"
        ;;
        
    *)
        echo -e "${RED}无效选项${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "API 地址: http://81.70.191.44:3000/api"
echo "健康检查: http://81.70.191.44:3000/api/health"
