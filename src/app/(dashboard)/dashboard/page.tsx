'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  FileSearch,
  Target,
  Wand2,
  FileText,
  MessageSquare,
  Briefcase,
  Bot,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';

interface StatsData {
  resumeScore: number;
  atsScore: number;
  applicationsCount: number;
  interviewPrepCount: number;
}

const quickActions = [
  { href: '/dashboard/resume-analyzer', icon: FileSearch, label: 'Analyze Resume', color: 'from-blue-500 to-cyan-500' },
  { href: '/dashboard/job-analyzer', icon: Target, label: 'Match Job', color: 'from-violet-500 to-purple-500' },
  { href: '/dashboard/resume-optimizer', icon: Wand2, label: 'Optimize Resume', color: 'from-amber-500 to-orange-500' },
  { href: '/dashboard/cover-letter', icon: FileText, label: 'Cover Letter', color: 'from-emerald-500 to-teal-500' },
  { href: '/dashboard/interview-prep', icon: MessageSquare, label: 'Interview Prep', color: 'from-pink-500 to-rose-500' },
  { href: '/dashboard/recent-jobs', icon: Briefcase, label: 'Recent Jobs', color: 'from-violet-500 to-purple-500' },
  { href: '/dashboard/career-coach', icon: Bot, label: 'Career Coach', color: 'from-indigo-500 to-blue-500' },
];

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    resumeScore: 0,
    atsScore: 0,
    applicationsCount: 0,
    interviewPrepCount: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);

  const loadDashboardData = async (showLoadingState = false) => {
    if (showLoadingState) setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');

        // ── Read scores from localStorage first (always up-to-date) ──────────
        const lsResumeScore = parseInt(localStorage.getItem('careerlift_resume_score') || '0', 10);
        const lsAtsScore    = parseInt(localStorage.getItem('careerlift_ats_score') || '0', 10);
        const lsInterviewCount = parseInt(localStorage.getItem('careerlift_interview_count') || '0', 10);

        // ── Also try Supabase for richer activity data ────────────────────────
        const { data: resumes }   = await supabase.from('resumes').select('file_name, resume_score, created_at').order('created_at', { ascending: false }).limit(5);
        const { data: analyses }  = await supabase.from('job_analyses').select('job_title, company, match_percentage, created_at').order('created_at', { ascending: false }).limit(5);
        const { data: preps }     = await supabase.from('interview_preps').select('job_title, company, created_at').order('created_at', { ascending: false }).limit(5);

        // Pick best score: localStorage wins if > 0, else fall back to Supabase
        const supabaseResumeScore = resumes && resumes.length > 0 ? Math.round(resumes[0].resume_score || 0) : 0;
        const supabaseAtsScore    = analyses && analyses.length > 0 ? Math.round(analyses[0].match_percentage || 0) : 0;
        const supabaseInterviewCount = preps ? preps.length : 0;

        const finalResumeScore    = lsResumeScore > 0 ? lsResumeScore : supabaseResumeScore;
        const finalAtsScore       = lsAtsScore > 0 ? lsAtsScore : supabaseAtsScore;
        const finalInterviewCount = lsInterviewCount > 0 ? lsInterviewCount : supabaseInterviewCount;

        setStats({
          resumeScore: finalResumeScore,
          atsScore: finalAtsScore,
          applicationsCount: 0,
          interviewPrepCount: finalInterviewCount,
        });

        // ── Build recent activity list ────────────────────────────────────────
        const list: any[] = [];

        // From localStorage
        const lsResumeFile = localStorage.getItem('careerlift_last_resume');
        const lsResumeTime = localStorage.getItem('careerlift_last_resume_time');
        if (lsResumeFile && lsResumeTime && lsResumeScore > 0) {
          list.push({
            icon: CheckCircle2,
            text: `Resume analyzed — Score: ${lsResumeScore}/100 (${lsResumeFile})`,
            time: formatRelativeTime(lsResumeTime),
            color: 'text-success',
            timestamp: new Date(lsResumeTime).getTime(),
          });
        }

        const lsAtsTime  = localStorage.getItem('careerlift_last_job_time');
        const lsAtsTitle = localStorage.getItem('careerlift_last_job_title');
        if (lsAtsTime && lsAtsScore > 0) {
          list.push({
            icon: Target,
            text: `Job match: ${lsAtsScore}% — "${lsAtsTitle || 'Job'}"`,
            time: formatRelativeTime(lsAtsTime),
            color: 'text-primary',
            timestamp: new Date(lsAtsTime).getTime(),
          });
        }

        const lsIntTime = localStorage.getItem('careerlift_last_interview_time');
        const lsIntJob  = localStorage.getItem('careerlift_last_interview_job');
        if (lsIntTime && lsIntJob) {
          list.push({
            icon: MessageSquare,
            text: `Interview prep generated for ${lsIntJob}`,
            time: formatRelativeTime(lsIntTime),
            color: 'text-accent',
            timestamp: new Date(lsIntTime).getTime(),
          });
        }

        // From Supabase (fill extra slots)
        if (resumes && resumes.length > 0) {
          resumes.forEach((r: any) => {
            list.push({
              icon: CheckCircle2,
              text: `Resume analyzed — Score: ${Math.round(r.resume_score || 0)}/100 (${r.file_name})`,
              time: formatRelativeTime(r.created_at),
              color: 'text-success',
              timestamp: new Date(r.created_at).getTime(),
            });
          });
        }

        if (analyses && analyses.length > 0) {
          analyses.forEach((a: any) => {
            list.push({
              icon: Target,
              text: `Job match: ${Math.round(a.match_percentage || 0)}% for "${a.job_title} at ${a.company}"`,
              time: formatRelativeTime(a.created_at),
              color: 'text-primary',
              timestamp: new Date(a.created_at).getTime(),
            });
          });
        }

        if (preps && preps.length > 0) {
          preps.forEach((p: any) => {
            list.push({
              icon: MessageSquare,
              text: `Interview prep generated for ${p.job_title} at ${p.company}`,
              time: formatRelativeTime(p.created_at),
              color: 'text-accent',
              timestamp: new Date(p.created_at).getTime(),
            });
          });
        }

        // Deduplicate by text and sort by newest
        const seen = new Set<string>();
        const deduped = list.filter(item => {
          if (seen.has(item.text)) return false;
          seen.add(item.text);
          return true;
        });
        deduped.sort((a, b) => b.timestamp - a.timestamp);
        setActivities(deduped.slice(0, 5));

      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData(true);

    // Dynamic focus & visibility revalidation handler
    const handleRevalidate = () => {
      loadDashboardData(false);
    };

    window.addEventListener('focus', handleRevalidate);
    document.addEventListener('visibilitychange', handleRevalidate);

    return () => {
      window.removeEventListener('focus', handleRevalidate);
      document.removeEventListener('visibilitychange', handleRevalidate);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div>
          <div className="h-8 w-64 rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-48 rounded-lg bg-muted" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl border border-border bg-card p-6" />
          ))}
        </div>
        <div className="h-28 rounded-2xl border border-border bg-card" />
        <div className="h-72 rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 h-64 w-64 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 blur-3xl -z-10 animate-pulse-glow" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
              <Sparkles className="h-3 w-3 animate-pulse" />
              AI Career Copilot Active
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
              Welcome back, <span className="gradient-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-extrabold">{userName}</span> 👋
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
              Ready to take the next step in your career? Analyze your resume, track job applications, and prepare for interviews with your AI assistant.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/resume-analyzer"
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Zap className="h-4 w-4" />
              Analyze Resume
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Resume Score',
            value: stats.resumeScore > 0 ? `${stats.resumeScore}/100` : 'N/A',
            icon: TrendingUp,
            change: stats.resumeScore > 0 ? 'Latest uploaded resume' : 'No resumes uploaded yet',
            gradient: 'from-blue-500/20 to-cyan-500/20',
            border: 'hover:border-blue-500/40',
            iconBg: 'from-blue-500 to-cyan-500',
            glow: 'rgba(59, 130, 246, 0.15)',
          },
          {
            label: 'ATS Score',
            value: stats.atsScore > 0 ? `${stats.atsScore}%` : 'N/A',
            icon: Zap,
            change: stats.atsScore > 0 ? 'Latest job match score' : 'No job matches analyzed',
            gradient: 'from-violet-500/20 to-purple-500/20',
            border: 'hover:border-violet-500/40',
            iconBg: 'from-violet-500 to-purple-500',
            glow: 'rgba(139, 92, 246, 0.15)',
          },
          {
            label: 'Jobs Searched',
            value: 'Live',
            icon: Briefcase,
            change: 'Browse live Jooble listings',
            gradient: 'from-emerald-500/20 to-teal-500/20',
            border: 'hover:border-emerald-500/40',
            iconBg: 'from-emerald-500 to-teal-500',
            glow: 'rgba(16, 185, 129, 0.15)',
          },
          {
            label: 'Interview Preps',
            value: stats.interviewPrepCount.toString(),
            icon: MessageSquare,
            change: `${stats.interviewPrepCount} prep guides generated`,
            gradient: 'from-amber-500/20 to-orange-500/20',
            border: 'hover:border-amber-500/40',
            iconBg: 'from-amber-500 to-orange-500',
            glow: 'rgba(245, 158, 11, 0.15)',
          },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className={`group relative overflow-hidden rounded-2xl border border-border/80 bg-card/40 backdrop-blur-md p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${stat.border}`}
            style={{ 
              animationDelay: `${index * 100}ms`,
              boxShadow: `0 4px 30px rgba(0, 0, 0, 0.05)`
            }}
          >
            {/* Ambient glow on hover */}
            <div 
              className="absolute -inset-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-full blur-3xl pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${stat.glow} 0%, transparent 70%)`
              }}
            />
            
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3.5xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{stat.change}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.iconBg} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 shadow-black/10`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            
            {/* Elegant bottom gradient line */}
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary animate-pulse" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { href: '/dashboard/resume-analyzer', icon: FileSearch, label: 'Analyze Resume', color: 'from-blue-500 to-cyan-500', glow: 'shadow-blue-500/5' },
            { href: '/dashboard/job-analyzer', icon: Target, label: 'Match Job', color: 'from-violet-500 to-purple-500', glow: 'shadow-purple-500/5' },
            { href: '/dashboard/resume-optimizer', icon: Wand2, label: 'Optimize Resume', color: 'from-amber-500 to-orange-500', glow: 'shadow-orange-500/5' },
            { href: '/dashboard/cover-letter', icon: FileText, label: 'Cover Letter', color: 'from-emerald-500 to-teal-500', glow: 'shadow-emerald-500/5' },
            { href: '/dashboard/interview-prep', icon: MessageSquare, label: 'Interview Prep', color: 'from-pink-500 to-rose-500', glow: 'shadow-rose-500/5' },
            { href: '/dashboard/career-coach', icon: Bot, label: 'Career Coach', color: 'from-indigo-500 to-blue-500', glow: 'shadow-indigo-500/5' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`group flex flex-col items-center gap-3 rounded-2xl border border-border/80 bg-card/40 backdrop-blur-md p-5 transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1.5 ${action.glow}`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${action.color} shadow-lg shadow-black/15 transition-transform duration-300 group-hover:scale-110`}>
                <action.icon className="h-7 w-7 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground text-center group-hover:text-primary transition-colors">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-border/80 bg-card/40 backdrop-blur-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary animate-pulse" />
            Recent Activity
          </h2>
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-4">
          {activities.length > 0 ? (
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/60">
              {activities.map((activity, index) => (
                <div key={index} className="relative flex items-start gap-4 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  {/* Timeline dot */}
                  <div className={`absolute left-[-21px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--background)] border-2 border-current ${activity.color}`} />
                  
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border/80 ${activity.color} shadow-sm`}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground break-words leading-relaxed">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="h-8 w-8 animate-float" />
                <div className="absolute -inset-1 rounded-full border border-primary/20 animate-ping opacity-25" />
              </div>
              <p className="text-lg font-semibold text-foreground">No recent activities yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs leading-relaxed">
                Activities like resume analyses, job match ratings, and interview preps will show up here as you work.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
