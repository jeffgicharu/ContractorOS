module.exports = {
  apps: [
    {
      name: 'contractoros-api',
      cwd: '/REDACTED_PATH/current/apps/api',
      script: 'dist/main.js',
      env_file: '/REDACTED_PATH/.env.api',
      node_args: '--max-old-space-size=512',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'contractoros-web',
      cwd: '/REDACTED_PATH/current/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start --port 3000',
      env_file: '/REDACTED_PATH/.env.web',
      node_args: '--max-old-space-size=768',
      instances: 1,
      autorestart: true,
      max_memory_restart: '600M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
