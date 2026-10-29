module.exports = {
  apps: [
    {
      name: 'calculo-app',
      script: 'server.js',
      instances: 1,           // 1 instancia en modo fork para no saturar la CPU
      exec_mode: 'fork',      // Modo fork (estable y ligero)
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',       // Evita bucles de reinicio rápido
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: 3005,           // Puerto 3005 (para no colisionar con Next.js en el 3000)
        BASE_PATH: '/calculo2'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3005,
        BASE_PATH: '/calculo2'
      },
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
