module.exports = {
  apps: [
    {
      name: 'contractoros-api',
      cwd: '/REDACTED_PATH/current/apps/api',
      script: 'dist/main.js',
      node_args: '--max-old-space-size=512',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'contractoros-web',
      cwd: '/REDACTED_PATH/current/apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3002',
      node_args: '--max-old-space-size=768',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '600M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
