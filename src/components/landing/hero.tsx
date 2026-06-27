'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Shield, FileSearch, TrendingUp, BarChart3, Zap } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-20 lg:pt-0">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        {/* Primary gradient orb */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4">
          <div className="h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-[120px] animate-pulse-glow" />
        </div>
        {/* Secondary orb left */}
        <div className="absolute -left-32 top-1/3">
          <div className="h-[400px] w-[400px] rounded-full bg-gradient-to-r from-blue-500/15 to-cyan-500/15 blur-[100px] animate-float" />
        </div>
        {/* Secondary orb right */}
        <div className="absolute -right-32 top-1/2">
          <div className="h-[350px] w-[350px] rounded-full bg-gradient-to-l from-pink-500/15 to-rose-500/15 blur-[100px] animate-float-delayed" />
        </div>
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 sm:px-6 lg:flex-row lg:gap-16 lg:px-8">
        {/* Left Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              </span>
              ✨ AI-Powered Career Success
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="mt-8 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Land Your Dream Job
            <br />
            <span className="gradient-text">with AI-Powered</span>
            <br />
            <span className="gradient-text">Intelligence</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted-foreground)] sm:text-xl"
          >
            Optimize your resume for ATS systems, prepare for interviews with AI coaching,
            and track your applications — all in one powerful platform.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="/signup"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/40"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Today
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </a>
          </motion.div>
        </motion.div>

        {/* Right: Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, x: 60, rotateY: -5 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 flex flex-1 items-center justify-center lg:mt-0"
        >
          <div className="relative w-full max-w-lg">
            {/* Glow behind dashboard */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-2xl" />

            {/* Dashboard Card */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
              {/* Top bar */}
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <div className="ml-3 h-5 flex-1 rounded bg-[var(--muted)]" />
              </div>

              {/* Dashboard Content */}
              <div className="p-5 space-y-4">
                {/* ATS Score */}
                <div className="rounded-xl border border-[var(--border)] bg-gradient-to-r from-indigo-500/5 to-purple-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[var(--muted-foreground)]">ATS Score</p>
                      <p className="mt-1 text-3xl font-bold gradient-text">92/100</p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/25">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '92%' }}
                      transition={{ duration: 1.5, delay: 1.2, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                    />
                  </div>
                </div>

                {/* Mini Stat Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                        <BarChart3 className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)]">Keywords</p>
                        <p className="text-sm font-bold">18/20</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                        <Zap className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)]">Impact</p>
                        <p className="text-sm font-bold">Strong</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                        <Shield className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)]">Format</p>
                        <p className="text-sm font-bold">Excellent</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                        <FileSearch className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)]">Sections</p>
                        <p className="text-sm font-bold">8/8</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Match */}
                <div className="rounded-lg border border-[var(--border)] p-3">
                  <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">Top Matched Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['React', 'TypeScript', 'Node.js', 'AWS', 'Python', 'SQL'].map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
    </section>
  );
}
