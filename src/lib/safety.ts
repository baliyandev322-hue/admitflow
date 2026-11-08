/**
 * Server-Side Communication & Demo Tenant Safety Enforcement Module
 * 
 * Enforces:
 * 1. Strict blocking of outbound communications (email, WhatsApp, calls, Google Calendar invites)
 *    for any tenant classified as UNVERIFIED_DEMO_TENANT or inst-prerna-pilot.
 * 2. Strict blocking of communications directed to RFC 2606 reserved unroutable domains (.invalid)
 *    or non-dialable demo phone numbers (+91-00000...).
 */

import { db } from './db';

export interface CommunicationCheckResult {
  allowed: boolean;
  blocked: boolean;
  reason?: string;
  code?: 'BLOCKED_DEMO_TENANT_COMMUNICATION' | 'BLOCKED_NO_CONSENT' | 'BLOCKED_INVALID_TARGET';
}

export function checkOutboundCommunication(
  instituteId: string, 
  target?: { email?: string; phone?: string; recipientType?: string }
): CommunicationCheckResult {
  // 1. Mandatory check for UNVERIFIED_DEMO_TENANT
  if (instituteId === 'inst-prerna-pilot') {
    return {
      allowed: false,
      blocked: true,
      reason: 'BLOCKED_DEMO_TENANT_COMMUNICATION: Outbound communication (email, WhatsApp, calls, calendar invites) is strictly blocked for UNVERIFIED_DEMO_TENANT.',
      code: 'BLOCKED_DEMO_TENANT_COMMUNICATION'
    };
  }

  const pilotTracking = db.getPilotTracking(instituteId);
  if (pilotTracking?.tenantClassification === 'UNVERIFIED_DEMO_TENANT' || pilotTracking?.isDemoTenant) {
    return {
      allowed: false,
      blocked: true,
      reason: 'BLOCKED_DEMO_TENANT_COMMUNICATION: Outbound communication (email, WhatsApp, calls, calendar invites) is strictly blocked for UNVERIFIED_DEMO_TENANT.',
      code: 'BLOCKED_DEMO_TENANT_COMMUNICATION'
    };
  }

  // 2. Target destination safety check (RFC 2606 reserved domain / dummy phone block)
  if (target?.email) {
    const emailLower = target.email.toLowerCase().trim();
    if (
      emailLower.endsWith('.invalid') || 
      emailLower.endsWith('.example') || 
      emailLower.endsWith('.test') || 
      emailLower.includes('prerna-demo') ||
      emailLower.includes('prernacareer.edu.in')
    ) {
      return {
        allowed: false,
        blocked: true,
        reason: 'BLOCKED_INVALID_TARGET: Target email address is a non-routable demo placeholder or blocked domain. Outbound dispatch denied.',
        code: 'BLOCKED_INVALID_TARGET'
      };
    }
  }

  if (target?.phone) {
    const phoneClean = target.phone.replace(/[\s-]/g, '');
    if (
      phoneClean.includes('000000') || 
      phoneClean.startsWith('+91000') ||
      phoneClean === '+919829011111' ||
      phoneClean === '+919829022222' ||
      phoneClean === '+919829033333' ||
      phoneClean === '+917442509988'
    ) {
      return {
        allowed: false,
        blocked: true,
        reason: 'BLOCKED_INVALID_TARGET: Target phone number is a synthetic/demo placeholder. Outbound dispatch denied.',
        code: 'BLOCKED_INVALID_TARGET'
      };
    }
  }

  return { allowed: true, blocked: false };
}
