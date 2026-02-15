import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { loadJwtConfig } from '../../config/jwt.config';
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
  constructor() {
    const config = loadJwtConfig();

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.secret,
    });
  }

  validate(payload: JwtTokenPayload): JwtPayload {
    if (!payload.sub || !payload.orgId || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      sub: payload.sub,
      orgId: payload.orgId,
      role: payload.role,
    };
  }
}
