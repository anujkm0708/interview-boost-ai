'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

const plans = {
  free: {
    name: 'Free',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '3 resume analyses per month',
      'Basic ATS resume scoring',
      'Job description matching',
      'Application tracker',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  premium: {
    name: 'Premium',
    description: 'Everything you need to land your dream job',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    features: [
      'Unlimited resume analyses',
      'AI Resume Optimizer',
      'Cover Letter Generator',
      'Interview Preparation',
      'AI Career Coach',
      'Priority support',
    ],
    cta: 'Start Premium',
    highlighted: true,
  },
};

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      {/* Background accent */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[600px] w-[600px] rounded-full bg-gradient-to-r from-indigo-500/5 to-purple-500/5 blur-[120px]" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            Pricing
          </span>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Simple, Transparent{' '}
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="mt-4 text-lg text-[var(--muted-foreground)]">
            Start free and upgrade when you&apos;re ready. No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <span
              className={`text-sm font-medium transition-colors ${
                !isYearly ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                isYearly
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  : 'bg-[var(--border)]'
              }`}
              aria-label="Toggle billing period"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors ${
                isYearly ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
              }`}
            >
              Yearly
            </span>
            {isYearly && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400"
              >
                Save 17%
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mt-12 mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
          {(Object.entries(plans) as [string, typeof plans.free][]).map(
            ([key, plan], idx) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className={`relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 ${
                  plan.highlighted
                    ? 'border-indigo-500/50 bg-[var(--card)] shadow-xl shadow-indigo-500/10'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]'
                }`}
              >
                {/* Popular badge */}
                {plan.highlighted && (
                  <div className="absolute -right-12 top-6 rotate-45 bg-gradient-to-r from-indigo-500 to-purple-500 px-12 py-1 text-xs font-semibold text-white shadow-sm">
                    Most Popular
                  </div>
                )}

                {/* Glow behind premium card */}
                {plan.highlighted && (
                  <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-sm" />
                )}

                <div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold tracking-tight text-[var(--foreground)]">
                      ${isYearly && plan.yearlyPrice > 0
                        ? Math.round(plan.yearlyPrice / 12)
                        : plan.monthlyPrice === 0
                          ? '0'
                          : plan.monthlyPrice}
                    </span>
                    <span className="text-[var(--muted-foreground)]">
                      /month
                    </span>
                  </div>
                  {isYearly && plan.yearlyPrice > 0 && (
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Billed ${plan.yearlyPrice}/year
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          plan.highlighted
                            ? 'bg-indigo-500/10 text-indigo-500'
                            : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-8">
                  {plan.highlighted ? (
                    <a
                      href="/signup"
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/30"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        {plan.cta}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <a
                      href="/signup"
                      className="flex w-full items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-all duration-300 hover:border-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    >
                      {plan.cta}
                    </a>
                  )}
                </div>
              </motion.div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
