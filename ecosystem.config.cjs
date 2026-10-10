module.exports = {
  apps: [
    {
      name: 'calculo-app',
      script: 'server.js',
      instances: 'max', // O '1' si se prefiere modo fork en máquinas con 1 vCPU
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      // Logs gestionados por PM2
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
