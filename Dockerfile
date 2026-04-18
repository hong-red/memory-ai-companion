# 小世界·记忆 - Docker 配置文件
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY server/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制服务器代码
COPY server/ ./

# 创建上传目录
RUN mkdir -p uploads

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动命令
CMD ["node", "server.js"]
