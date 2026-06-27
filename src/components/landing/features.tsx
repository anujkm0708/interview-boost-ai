'use client';

import { motion } from 'framer-motion';
import {
  FileSearch,
  Target,
  Wand2,
  FileText,
  MessageSquare,
  Briefcase,
} from 'lucide-react';

const features = [
  {
    icon: FileSearch,
    title: 'Resume Analyzer',
    description:
      'Get an instant ATS compatibility score with detailed content analysis, keyword optimization, and formatting feedback.',
    gradient: 'from-blue-500 to-cyan-500',
    shadowColor: 'shadow-blue-500/20',
  },
  {
    icon: Target,
    title: 'Job Match Analysis',
    description:
      'Compare your resume against any job description to see how well you match and what skills gaps to fill.',
    gradient: 'from-orange-500 to-amber-500',
    shadowColor: 'shadow-orange-500/20',
  },
  {
    icon: Wand2,
    title: 'AI Resume Optimizer',
    description:
      'Let AI rewrite and optimize your resume for specific job postings, maximizing your chances of getting noticed.',
    gradient: 'from-indigo-500 to-purple-500',
    shadowColor: 'shadow-indigo-500/20',
  },
  {
    icon: FileText,
    title: 'Cover Letter Generator',
    description:
      'Generate tailored, compelling cover letters that perfectly complement your resume for each application.',
    gradient: 'from-pink-500 to-rose-500',
    shadowColor: 'shadow-pink-500/20',
  },
  {
    icon: MessageSquare,
    title: 'Interview Preparation',
    description:
      'Practice with AI-generated interview questions, get sample answers, and build personalized preparation plans.',
    gradient: 'from-green-500 to-emerald-500',
    shadowColor: 'shadow-green-500/20',
  },
  {
    icon: Briefcase,
    title: 'Recent Jobs Search',
    description:
      'Browse thousands of live, currently active job listings powered by Jooble. Click any job to view the full description and apply instantly.',
    gradient: 'from-violet-500 to-purple-500',
    shadowColor: 'shadow-violet-500/20',
  },
];


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      {/* Subtle background accent */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-r from-indigo-500/5 to-purple-500/5 blur-[100px]" />
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
            Powerful Features
          </span>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Everything You Need{' '}
            <span className="gradient-text">to Succeed</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--muted-foreground)]">
            A comprehensive AI-powered career toolkit designed to help you land your dream job faster than ever before.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/30"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-purple-500/[0.03] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Icon */}
              <div className="relative">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg ${feature.shadowColor} transition-transform duration-300 group-hover:scale-110`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="relative mt-5">
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {feature.description}
                </p>
              </div>

              {/* Bottom accent line */}
              <div className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r ${feature.gradient} transition-all duration-500 group-hover:w-full`} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
