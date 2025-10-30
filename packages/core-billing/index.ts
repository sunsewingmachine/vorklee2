import { logger } from '@core-utils';

export type PlanTier = 'free' | 'pro' | 'business' | 'enterprise';

export interface SubscriptionStatus {
  organizationId: string;
  appCode: string;
  planCode: PlanTier;
  status: 'active' | 'expired' | 'cancelled';
  expiresAt?: Date;
}

/**
 * Check if organization has active subscription for an app
 * In production, this would query the Core DB subscriptions table
 */
export async function checkSubscription(
  organizationId: string,
  appCode: string
): Promise<SubscriptionStatus> {
  try {
    // TODO: Query Core DB subscriptions table
    // For now, return mock active subscription
    logger.info('Checking subscription', { organizationId, appCode });

    return {
      organizationId,
      appCode,
      planCode: 'pro',
      status: 'active',
    };
  } catch (error) {
    logger.error('Failed to check subscription', error);
    throw new Error(`Subscription check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if feature is available for organization's plan
 */
export async function hasFeature(
  organizationId: string,
  appCode: string,
  featureName: string
): Promise<boolean> {
  try {
    const subscription = await checkSubscription(organizationId, appCode);

    if (subscription.status !== 'active') {
      return false;
    }

    // Feature availability matrix
    const featureMatrix: Record<PlanTier, string[]> = {
      free: ['basic_notes', 'basic_search'],
      pro: ['basic_notes', 'basic_search', 'ai_summaries', 'attachments', 'unlimited_notes'],
      business: ['basic_notes', 'basic_search', 'ai_summaries', 'attachments', 'unlimited_notes', 'team_sharing', 'analytics'],
      enterprise: ['basic_notes', 'basic_search', 'ai_summaries', 'attachments', 'unlimited_notes', 'team_sharing', 'analytics', 'custom_branding', 'sso'],
    };

    const availableFeatures = featureMatrix[subscription.planCode] || [];
    return availableFeatures.includes(featureName);
  } catch (error) {
    logger.error('Failed to check feature availability', error);
    return false;
  }
}

/**
 * Get subscription details
 */
export async function getSubscriptionDetails(
  organizationId: string,
  appCode: string
): Promise<SubscriptionStatus> {
  return checkSubscription(organizationId, appCode);
}

