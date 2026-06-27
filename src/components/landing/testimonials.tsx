'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Software Engineer at Google',
    initials: 'SM',
    gradient: 'from-blue-500 to-cyan-500',
    quote:
      'CareerLift-ai transformed my resume from a 45 ATS score to 95. Within two weeks of using the optimized version, I got callbacks from Google, Meta, and Amazon. The AI suggestions were incredibly specific and actionable.',
    rating: 5,
  },
  {
    name: 'James K.',
    role: 'Product Manager at Microsoft',
    initials: 'JK',
    gradient: 'from-purple-500 to-pink-500',
    quote:
      'The interview preparation feature is a game-changer. It generated questions so accurate that 3 out of 5 questions in my actual Microsoft interview were almost identical. I felt fully prepared and confident walking in.',
    rating: 5,
  },
  {
    name: 'Priya S.',
    role: 'Data Analyst at Amazon',
    initials: 'PS',
    gradient: 'from-orange-500 to-amber-500',
    quote:
      "After months of rejections, I used CareerLift-ai to completely overhaul my approach. The job matching analysis showed me exactly where I was falling short. Landed my dream role at Amazon within 3 weeks!",
    rating: 5,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      {/* Background accent */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-indigo-500/[0.02] to-transparent" />

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
            Testimonials
          </span>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Loved by{' '}
            <span className="gradient-text">Job Seekers</span>
          </h2>
          <p className="mt-4 text-lg text-[var(--muted-foreground)]">
            Join thousands of professionals who&apos;ve accelerated their career with CareerLift-ai.
          </p>
        </motion.div>

        {/* Testimonial Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={cardVariants}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Hover gradient border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative">
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3 border-t border-[var(--border)] pt-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-bold text-white shadow-sm`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {t.name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
