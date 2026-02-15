import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Pool } from 'pg';
import type { LoginInput, InviteAcceptInput } from '@contractor-os/shared';
import { DATABASE_POOL } from '../../database/database.module';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 64;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

interface UserRow {
  id: string;
  organization_id: string;
  email: string;
  password_hash: string;
  role: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    orgId: string;
    firstName: string;
    lastName: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginInput): Promise<AuthResult> {
    const { rows } = await this.pool.query<UserRow>(
      `SELECT id, organization_id, email, password_hash, role, first_name, last_name, is_active
       FROM users WHERE email = $1`,
      [input.email],
    );

    const user = rows[0];
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(input.password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.pool.query(
      'UPDATE users SET last_login_at = now() WHERE id = $1',
      [user.id],
    );

    return this.generateAuthResult(user);
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = this.hashToken(refreshToken);

    const { rows } = await this.pool.query<{
      id: string;
      user_id: string;
      expires_at: string;
    }>(
      `SELECT id, user_id, expires_at FROM refresh_tokens
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash],
    );

    const storedToken = rows[0];
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke old token (rotation)
    await this.pool.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1',
      [storedToken.id],
    );

    // Fetch user for new tokens
    const { rows: userRows } = await this.pool.query<UserRow>(
      `SELECT id, organization_id, email, password_hash, role, first_name, last_name, is_active
       FROM users WHERE id = $1`,
      [storedToken.user_id],
    );

    const user = userRows[0];
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    const newRefreshToken = this.generateRefreshToken();
    await this.storeRefreshToken(user.id, newRefreshToken);

    const payload: JwtPayload = {
      sub: user.id,
      orgId: user.organization_id,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    await this.pool.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
      [tokenHash],
    );
  }

  async acceptInvite(input: InviteAcceptInput): Promise<AuthResult> {
    // Find contractor by invite token
    const { rows: contractorRows } = await this.pool.query<{
      id: string;
      organization_id: string;
      email: string;
      first_name: string;
      last_name: string;
      invite_expires_at: string;
      user_id: string | null;
    }>(
      `SELECT id, organization_id, email, first_name, last_name, invite_expires_at, user_id
       FROM contractors WHERE invite_token = $1`,
      [input.token],
    );

    const contractor = contractorRows[0];
    if (!contractor) {
      throw new BadRequestException('Invalid or expired invite token');
    }

    if (contractor.user_id) {
      throw new BadRequestException('Invite has already been accepted');
    }

    if (new Date(contractor.invite_expires_at) < new Date()) {
      throw new BadRequestException('Invite token has expired');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    // Create user and link to contractor in a transaction
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create user record
      const { rows: newUserRows } = await client.query<UserRow>(
        `INSERT INTO users (organization_id, email, password_hash, role, first_name, last_name)
         VALUES ($1, $2, $3, 'contractor', $4, $5)
         RETURNING id, organization_id, email, password_hash, role, first_name, last_name, is_active`,
        [
          contractor.organization_id,
          contractor.email,
          passwordHash,
          input.firstName,
          input.lastName,
        ],
      );

      const newUser = newUserRows[0]!;

      // Link user to contractor and advance status
      await client.query(
        `UPDATE contractors
         SET user_id = $1, status = 'tax_form_pending', invite_token = NULL, updated_at = now()
         WHERE id = $2`,
        [newUser.id, contractor.id],
      );

      // Record status change in history
      await client.query(
        `INSERT INTO contractor_status_history (contractor_id, status, changed_by)
         VALUES ($1, 'tax_form_pending', $2)`,
        [contractor.id, newUser.id],
      );

      await client.query('COMMIT');

      return this.generateAuthResult(newUser);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getMe(userId: string): Promise<{
    id: string;
    email: string;
    role: string;
    orgId: string;
    firstName: string;
    lastName: string;
  }> {
    const { rows } = await this.pool.query<UserRow>(
      `SELECT id, organization_id, email, password_hash, role, first_name, last_name, is_active
       FROM users WHERE id = $1`,
      [userId],
    );

    const user = rows[0];
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.organization_id,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  }

  private async generateAuthResult(user: UserRow): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      orgId: user.organization_id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken();

    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.organization_id,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    };
  }

  private generateRefreshToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt.toISOString()],
    );
  }
}
