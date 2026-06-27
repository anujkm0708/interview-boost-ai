import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-05-27.dahlia',
  typescript: true,
});

export const STRIPE_CONFIG = {
  premiumMonthlyPriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
  premiumYearlyPriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
} as const;
