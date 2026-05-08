import React from 'react';
import { Badge } from './Badge';
import type { BadgeVariant, BadgeSize } from './Badge';

export type StatType = 'severity' | 'status' | 'count' | 'priority';

export interface StatBadgeProps {
  type: StatType;
  value: string;
  size?: BadgeSize;
}

function normalizeSeverity(value: string): BadgeVariant {
  const v = value.toLowerCase().trim();
  if (v === 'critical') return 'critical';
  if (v === 'high') return 'high';
  if (v === 'medium') return 'medium';
  if (v === 'low') return 'low';
  return 'default';
}

function normalizeStatus(value: string): BadgeVariant {
  const v = value.toLowerCase().replace(/\s+/g, '').replace('_', '');
  if (v === 'open') return 'default';
  if (v === 'inprogress') return 'info';
  if (v === 'resolved') return 'success';
  if (v === 'closed') return 'default';
  if (v === 'active') return 'success';
  if (v === 'completed') return 'info';
  if (v === 'archived') return 'default';
  return 'default';
}

function normalizePriority(value: string): BadgeVariant {
  const v = value.toLowerCase().trim();
  if (v === '3' || v === 'critical') return 'critical';
  if (v === '2' || v === 'high') return 'high';
  if (v === '1' || v === 'medium') return 'medium';
  if (v === '0' || v === 'low') return 'low';
  return 'default';
}

export function StatBadge({ type, value, size = 'small' }: StatBadgeProps): JSX.Element {
  const variant: BadgeVariant = ((): BadgeVariant => {
    switch (type) {
      case 'severity':
        return normalizeSeverity(value);
      case 'status':
        return normalizeStatus(value);
      case 'priority':
        return normalizePriority(value);
      case 'count':
      default:
        return 'default';
    }
  })();

  return <Badge title={value} variant={variant} size={size} />;
}
