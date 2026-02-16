import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Capture pool queries for assertion
function createMockPool() {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  return {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(mockClient),
    _client: mockClient,
  };
}

function createMockJwt() {
  return {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };
}

const MOCK_USER_ROW = {
  id: 'user-1',
  organization_id: 'org-1',
  email: 'test@example.com',
  password_hash: 'hashed-password',
  role: 'admin',
  first_name: 'Test',
  last_name: 'User',
  is_active: true,
};

describe('AuthService', () => {
  let service: AuthService;
  let pool: ReturnType<typeof createMockPool>;
  let jwt: ReturnType<typeof createMockJwt>;

  beforeEach(() => {
    pool = createMockPool();
    jwt = createMockJwt();
    service = new AuthService(pool as never, jwt as unknown as JwtService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return auth result for valid credentials', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [MOCK_USER_ROW] }) // user lookup
        .mockResolvedValueOnce({ rows: [] }) // update last_login_at
        .mockResolvedValueOnce({ rows: [] }); // store refresh token

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'test@example.com', password: 'password' });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.orgId).toBe('org-1');
      expect(jwt.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        orgId: 'org-1',
        role: 'admin',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.login({ email: 'noone@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when account is deactivated', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ ...MOCK_USER_ROW, is_active: false }],
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      pool.query.mockResolvedValueOnce({ rows: [MOCK_USER_ROW] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update last_login_at on successful login', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [MOCK_USER_ROW] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login({ email: 'test@example.com', password: 'password' });

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE users SET last_login_at = now() WHERE id = $1',
        ['user-1'],
      );
    });
  });

  describe('refresh', () => {
    it('should return new tokens for valid refresh token', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'rt-1', user_id: 'user-1', expires_at: futureDate }] }) // lookup
        .mockResolvedValueOnce({ rows: [] }) // revoke old
        .mockResolvedValueOnce({ rows: [MOCK_USER_ROW] }) // user lookup
        .mockResolvedValueOnce({ rows: [] }); // store new token

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'rt-1', user_id: 'user-1', expires_at: pastDate }],
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should revoke old token on refresh (rotation)', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'rt-1', user_id: 'user-1', expires_at: futureDate }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [MOCK_USER_ROW] })
        .mockResolvedValueOnce({ rows: [] });

      await service.refresh('valid-token');

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1',
        ['rt-1'],
      );
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await service.logout('some-refresh-token');

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
        [expect.any(String)],
      );
    });
  });

  describe('acceptInvite', () => {
    const MOCK_CONTRACTOR = {
      id: 'contractor-1',
      organization_id: 'org-1',
      email: 'invite@example.com',
      first_name: 'Invited',
      last_name: 'User',
      invite_expires_at: new Date(Date.now() + 86400000).toISOString(),
      user_id: null,
    };

    it('should create user and return auth result', async () => {
      pool.query.mockResolvedValueOnce({ rows: [MOCK_CONTRACTOR] });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

      const newUser = { ...MOCK_USER_ROW, id: 'new-user', role: 'contractor' };
      const client = pool._client;
      client.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [newUser] }) // INSERT user
        .mockResolvedValueOnce({}) // UPDATE contractor
        .mockResolvedValueOnce({}) // INSERT status history
        .mockResolvedValueOnce({}); // COMMIT

      // store refresh token is on pool, not client
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.acceptInvite({
        token: 'valid-token',
        password: 'Password1',
        firstName: 'Invited',
        lastName: 'User',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(client.query).toHaveBeenCalledWith('BEGIN');
      expect(client.query).toHaveBeenCalledWith('COMMIT');
      expect(client.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid token', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.acceptInvite({
          token: 'bad-token',
          password: 'Password1',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when invite already accepted', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ ...MOCK_CONTRACTOR, user_id: 'existing-user' }],
      });

      await expect(
        service.acceptInvite({
          token: 'used-token',
          password: 'Password1',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when invite is expired', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          ...MOCK_CONTRACTOR,
          invite_expires_at: new Date(Date.now() - 86400000).toISOString(),
        }],
      });

      await expect(
        service.acceptInvite({
          token: 'expired-token',
          password: 'Password1',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback transaction on error', async () => {
      pool.query.mockResolvedValueOnce({ rows: [MOCK_CONTRACTOR] });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

      const client = pool._client;
      client.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('DB error')); // INSERT user fails

      await expect(
        service.acceptInvite({
          token: 'valid-token',
          password: 'Password1',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow('DB error');

      expect(client.query).toHaveBeenCalledWith('ROLLBACK');
      expect(client.release).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return user profile', async () => {
      pool.query.mockResolvedValueOnce({ rows: [MOCK_USER_ROW] });

      const result = await service.getMe('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        role: 'admin',
        orgId: 'org-1',
        firstName: 'Test',
        lastName: 'User',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.getMe('nonexistent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateInviteToken', () => {
    const MOCK_CONTRACTOR_ROW = {
      first_name: 'James',
      last_name: 'Wilson',
      email: 'james@example.com',
      invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user_id: null,
    };

    it('should return valid=true with contractor details for valid token', async () => {
      pool.query.mockResolvedValueOnce({ rows: [MOCK_CONTRACTOR_ROW] });

      const result = await service.validateInviteToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.contractor).toEqual({
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james@example.com',
      });
    });

    it('should return valid=false for nonexistent token', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.validateInviteToken('bad-token');

      expect(result.valid).toBe(false);
      expect(result.contractor).toBeUndefined();
    });

    it('should return valid=false for expired token', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          ...MOCK_CONTRACTOR_ROW,
          invite_expires_at: new Date(Date.now() - 1000).toISOString(),
        }],
      });

      const result = await service.validateInviteToken('expired-token');

      expect(result.valid).toBe(false);
    });

    it('should return valid=false for already-accepted token', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ ...MOCK_CONTRACTOR_ROW, user_id: 'some-user-id' }],
      });

      const result = await service.validateInviteToken('used-token');

      expect(result.valid).toBe(false);
    });
  });
});
