module.exports = {
  apps: [
    {
      name: 'gatetoweb3',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'mysql://demo:demo@localhost:3306/gatetoweb3',
        JWT_SECRET: 'demo_jwt_secret_key_for_production_12345678',
        VITE_APP_ID: 'gatetoweb3'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      ignore_watch: ['node_modules', 'dist/public', '.git'],
      kill_timeout: 5000
    },
    {
      name: 'codexbiuness',
      script: 'services/codex-business/server.cjs',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3100
      },
      error_file: './logs/codex-business-err.log',
      out_file: './logs/codex-business-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      ignore_watch: ['node_modules', 'dist/public', '.git'],
      kill_timeout: 5000
    }
  ]
};
