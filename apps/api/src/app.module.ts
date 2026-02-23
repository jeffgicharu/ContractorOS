import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
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

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule, AuthModule, ContractorsModule, EngagementsModule, TimeEntriesModule, InvoicesModule, DocumentsModule, ClassificationModule, OffboardingModule, NotificationsModule, AuditModule, OrganizationsModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
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
