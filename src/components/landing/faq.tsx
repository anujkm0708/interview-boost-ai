'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How does the ATS score work?',
    answer:
      'Our AI analyzes your resume against industry-standard ATS (Applicant Tracking System) criteria. We evaluate keyword optimization, formatting compatibility, section structure, content relevance, and readability. The score ranges from 0-100, with detailed breakdowns and actionable suggestions to improve each category.',
  },
  {
    question: 'Can I upload any resume format?',
    answer:
      'Yes! CareerLift-ai supports PDF, DOCX, DOC, and plain text formats. We recommend PDF for the most accurate analysis, as it preserves your formatting. Our parser handles complex layouts, multi-column designs, and various font styles to ensure a comprehensive analysis regardless of your resume format.',
  },
  {
    question: 'How accurate is the AI analysis?',
    answer:
      "Our AI models are trained on millions of successful resumes and job postings across 50+ industries. Users report a 95% ATS pass rate after implementing our recommendations. The system continuously learns from new data and user feedback to improve accuracy and relevance of suggestions.",
  },
  {
    question: "What's included in the free plan?",
    answer:
      'The free plan includes 3 resume analyses per month, basic ATS scoring with overall score and key highlights, job description matching for one job posting at a time, and access to the application tracker. It\'s perfect for getting started and understanding how your resume performs.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Absolutely! There are no long-term contracts or cancellation fees. You can cancel your Premium subscription at any time from your account settings. Your access continues until the end of your current billing period, and you can always re-subscribe whenever you want.',
  },
  {
    question: 'Is my data secure?',
    answer:
      "Security is our top priority. All data is encrypted at rest and in transit using AES-256 encryption. We never share your personal information or resume data with third parties. Your resumes are processed in isolated environments and you can delete all your data at any time from your account settings. We're SOC 2 Type II compliant.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative py-24 sm:py-32">
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
            FAQ
          </span>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Frequently Asked{' '}
            <span className="gradient-text">Questions</span>
          </h2>
          <p className="mt-4 text-lg text-[var(--muted-foreground)]">
            Got questions? We&apos;ve got answers. Can&apos;t find what you&apos;re looking for? Reach out to our support team.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-16 max-w-3xl space-y-3"
        >
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`overflow-hidden rounded-xl border transition-all duration-300 ${
                openIndex === index
                  ? 'border-indigo-500/30 bg-indigo-500/[0.02] shadow-sm'
                  : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]'
              }`}
            >
              <button
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
                aria-expanded={openIndex === index}
              >
                <span className="pr-4 text-sm font-semibold text-[var(--foreground)] sm:text-base">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="shrink-0"
                >
                  <ChevronDown
                    className={`h-5 w-5 transition-colors ${
                      openIndex === index
                        ? 'text-indigo-500'
                        : 'text-[var(--muted-foreground)]'
                    }`}
                  />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="px-6 pb-5">
                      <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
