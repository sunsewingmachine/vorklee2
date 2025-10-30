import { logger } from '@core-utils';

export interface AnalyticsEvent {
  organizationId: string;
  userId?: string;
  eventName: string;
  eventType: 'pageview' | 'action' | 'feature_usage' | 'error';
  properties?: Record<string, any>;
  timestamp: Date;
}

/**
 * Log an analytics event
 * In production, this would send to PostHog, Mixpanel, or similar
 */
export async function logEvent(event: AnalyticsEvent): Promise<void> {
  try {
    logger.info('Analytics Event', {
      orgId: event.organizationId,
      userId: event.userId,
      event: event.eventName,
      type: event.eventType,
      timestamp: event.timestamp.toISOString(),
    });

    // TODO: In production, integrate with analytics service:
    // - PostHog
    // - Mixpanel
    // - Segment
    // - Google Analytics 4

  } catch (error) {
    logger.error('Failed to log analytics event', error);
  }
}

/**
 * Track feature usage
 */
export async function trackFeatureUsage(
  organizationId: string,
  userId: string,
  featureName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logEvent({
    organizationId,
    userId,
    eventName: `feature_used:${featureName}`,
    eventType: 'feature_usage',
    properties: metadata,
    timestamp: new Date(),
  });
}

/**
 * Track page view
 */
export async function trackPageView(
  organizationId: string,
  userId: string,
  pagePath: string
): Promise<void> {
  await logEvent({
    organizationId,
    userId,
    eventName: 'page_view',
    eventType: 'pageview',
    properties: { path: pagePath },
    timestamp: new Date(),
  });
}

