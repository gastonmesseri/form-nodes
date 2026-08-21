import type { SubscriptionLike } from '../validation/validation.type';

export const isSubscriptionLike = (value: unknown): value is SubscriptionLike =>
  typeof value === 'object' && value !== null && typeof (value as SubscriptionLike).unsubscribe === 'function';
