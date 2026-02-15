import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { type Observable, tap } from 'rxjs';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../database/database.module';

interface AuthenticatedUser {
  sub: string;
  orgId: string;
  role: string;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);
  private readonly auditMethods = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    if (!this.auditMethods.has(request.method)) {
      return next.handle();
    }

    const user = request.user as AuthenticatedUser | undefined;
    const correlationId = request.headers['x-correlation-id'] as string | undefined;

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          this.logAuditEvent(request, user, correlationId, responseBody).catch((err) => {
            this.logger.error('Failed to write audit log', err);
          });
        },
      }),
    );
  }

  private async logAuditEvent(
    request: Request,
    user: AuthenticatedUser | undefined,
    correlationId: string | undefined,
    responseBody: unknown,
  ): Promise<void> {
    if (!user) return;

    const { entityType, entityId } = this.extractEntity(request, responseBody);
    if (!entityType) return;

    const action = this.extractAction(request);
    const ipAddress = request.ip ?? request.socket.remoteAddress ?? null;

    await this.pool.query(
      `INSERT INTO audit_events (organization_id, user_id, entity_type, entity_id, action, new_values, ip_address, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7::inet, $8)`,
      [
        user.orgId,
        user.sub,
        entityType,
        entityId,
        action,
        JSON.stringify(request.body),
        ipAddress,
        correlationId ?? null,
      ],
    );
  }

  private extractEntity(
    request: Request,
    responseBody: unknown,
  ): { entityType: string | null; entityId: string | null } {
    const parts = request.path.replace('/api/v1/', '').split('/');
    const entityType = parts[0] ?? null;

    // Try to get ID from URL params first, then from response body
    const entityId = parts[1] ??
      (responseBody && typeof responseBody === 'object' && 'data' in responseBody
        ? (responseBody as { data: { id?: string } }).data?.id ?? null
        : null);

    return { entityType, entityId };
  }

  private extractAction(request: Request): string {
    const parts = request.path.replace('/api/v1/', '').split('/');
    const lastPart = parts[parts.length - 1];

    // Action endpoints like /invoices/:id/approve
    if (lastPart && !/^[0-9a-f-]+$/i.test(lastPart)) {
      return lastPart;
    }

    const methodMap: Record<string, string> = {
      POST: 'create',
      PATCH: 'update',
      PUT: 'update',
      DELETE: 'delete',
    };

    return methodMap[request.method] ?? request.method.toLowerCase();
  }
}
