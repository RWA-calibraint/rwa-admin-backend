import { Module } from '@nestjs/common';

import { AuditService } from 'src/audit/audit.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
