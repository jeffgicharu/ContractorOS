export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
}

export function loadAppConfig(): AppConfig {
  const port = parseInt(process.env['PORT'] ?? '3001', 10);
  const nodeEnv = process.env['NODE_ENV'] ?? 'development';
  const corsOrigin = process.env['CORS_ORIGIN'] ?? 'http://localhost:3000';

  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env['PORT']}`);
  }

  return { port, nodeEnv, corsOrigin };
}
