import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Pool } from 'pg';
import { loadJwtConfig } from '../../config/jwt.config';
import { DATABASE_POOL } from '../../database/database.module';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

interface JwtTokenPayload {
  sub: string;
  orgId: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {
    const config = loadJwtConfig();

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.secret,
    });
  }

  async validate(payload: JwtTokenPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.orgId || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Reject tokens issued to users who have since been deactivated.
    // Without this check a still-valid (signed, unexpired) JWT keeps
    // working for up to the access-token lifetime after the user is
    // disabled — a credential-revocation hole.
    const { rows } = await this.pool.query<{ is_active: boolean; organization_id: string }>(
      'SELECT is_active, organization_id FROM users WHERE id = $1',
      [payload.sub],
    );
    const user = rows[0];
    if (!user) {
      throw new UnauthorizedException('Token subject no longer exists');
    }
    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }
    // Defence in depth: org cannot change for a JWT subject.
    if (user.organization_id !== payload.orgId) {
      throw new UnauthorizedException('Token org claim does not match user');
    }

    return {
      sub: payload.sub,
      orgId: payload.orgId,
      role: payload.role,
    };
  }
}
