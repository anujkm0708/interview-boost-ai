'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Search,
  Loader2,
  Sparkles,
  ExternalLink,
  X,
  Building2,
  Clock,
  Globe,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

interface Job {
  id: string | number;
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source: string;
  type: string;
  link: string;
  company: string;
  updated: string;
}

/* ── Job Detail Drawer ─────────────────────────────────────────────────── */
function JobDetailDrawer({ job, onClose }: { job: Job; onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Parse snippet into sections — Jooble returns HTML in snippet
  const cleanSnippet = job.snippet
    ? job.snippet
        .replace(/<b>/gi, '<strong>')
        .replace(/<\/b>/gi, '</strong>')
        .replace(/<br\s*\/?>/gi, '<br/>')
    : 'No description available.';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-in Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl bg-[var(--background)] border-l border-border shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
        {/* Drawer Header */}
        <div className="relative flex-shrink-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-b border-border px-6 py-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4 pr-10">
            {/* Company avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-xl font-extrabold shadow-lg shadow-indigo-500/20">
              {(job.company || job.title).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-foreground leading-tight line-clamp-2">
                {job.title}
              </h2>
              <p className="mt-1 text-base font-semibold text-primary">
                {job.company || 'Unknown Company'}
              </p>
            </div>
          </div>

          {/* Meta badges */}
          <div className="mt-5 flex flex-wrap gap-3">
            {job.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {job.location}
              </span>
            )}
            {job.type && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400 capitalize">
                <Clock className="h-3.5 w-3.5" />
                {job.type}
              </span>
            )}
            {job.salary && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <DollarSign className="h-3.5 w-3.5" />
                {job.salary}
              </span>
            )}
            {job.updated && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Posted {formatDate(job.updated)}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* About the Role */}
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-foreground mb-3">
              <Briefcase className="h-4 w-4 text-primary" />
              About the Role
            </h3>
            <div
              className="prose prose-sm prose-invert max-w-none text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: cleanSnippet }}
            />
          </div>

          {/* Source Info */}
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Job Details</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium text-foreground">{job.company || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium text-foreground">{job.location || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium text-foreground capitalize">{job.type || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium text-foreground">{job.salary || 'Not specified'}</span>
              </div>
              {job.source && (
                <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{job.source}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Footer CTA */}
        <div className="flex-shrink-0 border-t border-border bg-card/80 backdrop-blur-md px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-transparent text-sm font-semibold text-foreground transition-all hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </button>
          <a
            href={job.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
          >
            Apply Now
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */
export default function RecentJobsPage() {
  const [keywords, setKeywords] = useState('Software Engineer');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobs = async (pageNum = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/jobs/recent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, location, page: pageNum.toString() }),
      });
      if (!response.ok) throw new Error('Failed to fetch jobs from API');
      const data = await response.json();
      setJobs(data.jobs || []);
      setTotalCount(data.totalCount || 0);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while retrieving jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(1); }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(1);
  };

  const closeDrawer = useCallback(() => setSelectedJob(null), []);

  const formatJobDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Drawer */}
      {selectedJob && (
        <JobDetailDrawer job={selectedJob} onClose={closeDrawer} />
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 h-64 w-64 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 blur-3xl -z-10 animate-pulse-glow" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Live Search Engine Active
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
            Recent Jobs Search
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
            Browse live active job postings. Click any card to view the full job description and role requirements.
          </p>
        </div>
      </div>

      {/* Search Form */}
      <form
        onSubmit={handleSearchSubmit}
        className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-border/80 shadow-md"
      >
        <div className="sm:col-span-5 relative">
          <Briefcase className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Job title, keywords, or company..."
            className="h-11 w-full rounded-xl border border-input bg-background/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="sm:col-span-4 relative">
          <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, state, or 'Remote'..."
            className="h-11 w-full rounded-xl border border-input bg-background/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent font-semibold text-white shadow-lg transition-all hover:shadow-primary/25 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Find Jobs
        </button>
      </form>

      {/* Errors */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-2xl border border-border bg-card/20 p-6 space-y-4">
              <div className="h-6 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-5/6 rounded bg-muted" />
              </div>
              <div className="h-9 w-28 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/40 backdrop-blur-md p-6 text-left transition-all duration-300 hover:shadow-2xl hover:border-primary/40 hover:-translate-y-1 cursor-pointer w-full"
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/5 to-accent/5" />

                <div className="relative">
                  {/* Company avatar */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 text-primary font-bold text-base">
                      {(job.company || job.title).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                        {job.company || 'Unknown Company'}
                      </p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary shrink-0" />
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="flex items-center gap-1 text-emerald-500 font-medium">
                        <DollarSign className="h-3 w-3 shrink-0" />
                        {job.salary}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {formatJobDate(job.updated)}
                    </span>
                  </div>

                  {/* Snippet preview */}
                  <div
                    className="text-xs text-muted-foreground line-clamp-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: job.snippet || '' }}
                  />
                </div>

                {/* Footer */}
                <div className="relative mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground capitalize bg-muted px-2.5 py-1 rounded-full font-medium">
                    {job.type || 'Full-time'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                    View Details
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border/60 pt-6">
            <span className="text-sm text-muted-foreground">
              Page <strong className="text-foreground">{page}</strong> · {totalCount} total matches
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => fetchJobs(page - 1)}
                disabled={page <= 1 || loading}
                className="flex h-10 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground transition-all hover:bg-muted disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchJobs(page + 1)}
                disabled={jobs.length < 12 || loading}
                className="flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-lg shadow-primary/10 transition-all hover:shadow-primary/20 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-border/85 bg-card/30">
          <Briefcase className="h-12 w-12 text-muted-foreground/60 animate-bounce" />
          <p className="text-lg font-bold text-foreground mt-4">No jobs found</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Try different keywords like &apos;Developer&apos;, &apos;Manager&apos;, or &apos;Designer&apos;.
          </p>
        </div>
      )}
    </div>
  );
}
