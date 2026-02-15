import { Module, Global, Inject, type OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { loadDatabaseConfig } from '../config/database.config';

export const DATABASE_POOL = 'DATABASE_POOL';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: () => {
        const config = loadDatabaseConfig();
        const pool = new Pool(config.pool);
        const logger = new Logger('DatabasePool');

        pool.on('error', (err) => {
          logger.error('Unexpected idle client error', err.message);
        });

        return pool;
      },
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onModuleDestroy() {
    this.logger.log('Closing database pool');
    await this.pool.end();
  }
}
