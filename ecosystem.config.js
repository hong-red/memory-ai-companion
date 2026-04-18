// PM2 配置文件
module.exports = {
  apps: [
    {
      name: 'memory-ai-companion',
      script: './server/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // 自动重启
      autorestart: true,
      // 崩溃后重启延迟
      restart_delay: 3000,
      // 最大重启次数
      max_restarts: 10,
      // 最小运行时间
      min_uptime: '10s',
      // 健康检查
      health_check_grace_period: 30000,
      // 监听文件变化（开发环境）
      ignore_watch: ['node_modules', 'logs', 'uploads', 'database.sqlite'],
      //  kill 信号
      kill_timeout: 5000,
      // 监听端口
      listen_timeout: 10000,
      // 优雅关闭
      wait_ready: true
    }
  ]
};
