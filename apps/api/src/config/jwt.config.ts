export interface JwtConfig {
  secret: string;
  accessExpiry: string;
  refreshExpiry: string;
}

export function loadJwtConfig(): JwtConfig {
  const secret = process.env['JWT_SECRET'];

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return {
    secret,
    accessExpiry: process.env['JWT_ACCESS_EXPIRY'] ?? '15m',
    refreshExpiry: process.env['JWT_REFRESH_EXPIRY'] ?? '7d',
  };
}
