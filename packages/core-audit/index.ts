import { logger } from '@vorklee2/core-utils';

export interface AuditEvent {
  organizationId: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'restore';
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Record an audit event
 * In a full implementation, this would write to a database or external service
 * For now, we log it and optionally send to an analytics service
 */
export async function recordAudit(event: AuditEvent): Promise<void> {
  try {
    // Log the audit event
    logger.info('Audit Event', {
      orgId: event.organizationId,
      userId: event.userId,
      action: event.action,
      resource: `${event.resourceType}:${event.resourceId}`,
      timestamp: event.timestamp.toISOString(),
    });

    // TODO: In production, send to audit database or service like:
    // - Insert into audit_logs table in Core DB
    // - Send to external audit service (e.g., Panther, Splunk)
    // - Stream to data warehouse for compliance reporting

  } catch (error) {
    logger.error('Failed to record audit event', error);
    // Don't throw error to avoid disrupting main flow
  }
}

/**
 * Helper to create audit event from API request
 */
export function createAuditEvent(
  organizationId: string,
  userId: string,
  action: AuditEvent['action'],
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, any>
): AuditEvent {
  return {
    organizationId,
    userId,
    action,
    resourceType,
    resourceId,
    metadata,
    timestamp: new Date(),
  };
}


