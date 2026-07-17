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
import { ClipboardModule } from './modules/clipboard/clipboard.module';
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

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // Throttler defaults: 60 req / 60 s / IP. Tunable via THROTTLE_TTL
    // (seconds) and THROTTLE_LIMIT (count). Setting THROTTLE_LIMIT=0
    // raises the ceiling to MAX_SAFE_INTEGER, which effectively disables
    // the limiter — used by the integration suite and k6 load tests.
    // `forRootAsync` (not `forRoot`) so the env vars are read at module
    // instantiation, not at file-evaluation time.
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const ttlSeconds = parsePositiveInt(process.env['THROTTLE_TTL'], 60);
        const limit = parseNonNegativeInt(process.env['THROTTLE_LIMIT'], 60);
        return [
          {
            ttl: ttlSeconds * 1000,
            limit: limit === 0 ? Number.MAX_SAFE_INTEGER : limit,
          },
        ];
      },
    }),
    DatabaseModule, AuthModule, ContractorsModule, EngagementsModule, TimeEntriesModule, InvoicesModule, DocumentsModule, ClassificationModule, OffboardingModule, NotificationsModule, AuditModule, OrganizationsModule, ClipboardModule,
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
