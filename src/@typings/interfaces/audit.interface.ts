import { AuditAction, AuditEntityType } from '../enums/audit.enum';
import { UserRole } from '../enums/user.enum';

export interface AuditLog {
  entityId: string;
  entityType: AuditEntityType;
  action: AuditAction;
  performedBy: {
    userId: string;
    role: UserRole;
  };
  timestamp: Date;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AuditSummary {
  totalActions: number;
  actionsByType: Record<AuditAction, number>;
  actionsByEntity: Record<AuditEntityType, number>;
  recentActions: AuditLog[];
}
