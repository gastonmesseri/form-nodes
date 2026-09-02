import type { SubscriptionLike } from '../types/observable-like.type';

export const isSubscriptionLike = (value: unknown): value is SubscriptionLike =>
  typeof value === 'object' && value !== null && typeof (value as SubscriptionLike).unsubscribe === 'function';
