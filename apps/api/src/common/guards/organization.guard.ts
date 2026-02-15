import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class OrganizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;

    // Organization ID can come from route params or query
    const orgIdFromParams = request.params['organizationId'];

    if (orgIdFromParams && orgIdFromParams !== user.orgId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not have access to this organization',
      });
    }

    return true;
  }
}
