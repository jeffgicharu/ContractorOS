import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContractorsModule } from './modules/contractors/contractors.module';
import { EngagementsModule } from './modules/engagements/engagements.module';
import { TimeEntriesModule } from './modules/time-entries/time-entries.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ClassificationModule } from './modules/classification/classification.module';
import { OffboardingModule } from './modules/offboarding/offboarding.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { HealthController } from './health.controller';

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseNonNegativeInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// Defaults: 60 req/min/IP. Tunable via THROTTLE_TTL (seconds) and
// THROTTLE_LIMIT (request count). Disabling entirely is supported via
// THROTTLE_LIMIT=0 — useful for k6 load tests and for the integration
// suite that fires hundreds of requests in tight loops.
const THROTTLE_TTL_SECONDS = parsePositiveInt(process.env['THROTTLE_TTL'], 60);
const THROTTLE_LIMIT = parseNonNegativeInt(process.env['THROTTLE_LIMIT'], 60);

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // THROTTLE_LIMIT=0 effectively disables the limiter by raising the
    // ceiling far above any plausible per-IP traffic; the integration
    // suite and k6 load tests rely on this.
    ThrottlerModule.forRoot([
      {
        ttl: THROTTLE_TTL_SECONDS * 1000,
        limit: THROTTLE_LIMIT === 0 ? Number.MAX_SAFE_INTEGER : THROTTLE_LIMIT,
      },
    ]),
    DatabaseModule, AuthModule, ContractorsModule, EngagementsModule, TimeEntriesModule, InvoicesModule, DocumentsModule, ClassificationModule, OffboardingModule, NotificationsModule, AuditModule, OrganizationsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
