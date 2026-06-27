'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Brain,
  Users,
  Sparkles,
  BookOpen,
  Target,
} from 'lucide-react';
import { InterviewQuestion, PreparationDay } from '@/types';

const difficultyColor = (d: string) => {
  switch (d) {
    case 'easy': return 'bg-success/10 text-success';
    case 'medium': return 'bg-warning/10 text-warning';
    case 'hard': return 'bg-destructive/10 text-destructive';
    default: return 'bg-muted text-muted-foreground';
  }
};

const QuestionCard = ({
  q,
  idx,
  expandedQ,
  setExpandedQ,
}: {
  q: InterviewQuestion;
  idx: string;
  expandedQ: string | null;
  setExpandedQ: (val: string | null) => void;
}) => {
  const isExpanded = expandedQ === idx;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all">
      <button
        onClick={() => setExpandedQ(isExpanded ? null : idx)}
        className="flex w-full items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {parseInt(idx.split('-')[1]) + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{q.question}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor(q.difficulty)}`}>
              {q.difficulty}
            </span>
            <span className="text-xs text-muted-foreground">{q.category}</span>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
      </button>
      {isExpanded && (
        <div className="border-t border-border bg-muted/30 p-4 animate-slide-up">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Model Answer</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{q.model_answer}</p>
        </div>
      )}
    </div>
  );
};

export default function InterviewPrepPage() {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [hrQuestions, setHrQuestions] = useState<InterviewQuestion[]>([]);
  const [techQuestions, setTechQuestions] = useState<InterviewQuestion[]>([]);
  const [prepPlan, setPrepPlan] = useState<PreparationDay[]>([]);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hr' | 'technical' | 'plan'>('hr');

  useEffect(() => {
    async function loadLatestPrep() {
      try {
        const res = await fetch('/api/interview/generate');
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setJobTitle(data.job_title || '');
            setCompany(data.company || '');
            setHrQuestions(data.hr_questions || []);
            setTechQuestions(data.technical_questions || []);
            setPrepPlan(data.preparation_plan || []);
            if (!data.technical_questions || data.technical_questions.length === 0) {
              setActiveTab('hr');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load past prep guide:', err);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadLatestPrep();
  }, []);

  const handleGenerate = async () => {
    if (!jobTitle.trim() || !company.trim()) {
      setError('Please provide the job title and company');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, jobDescription }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setHrQuestions(data.hr_questions);
      setTechQuestions(data.technical_questions);
      setPrepPlan(data.preparation_plan);
      // Persist to localStorage so dashboard counter updates
      const prevCount = parseInt(localStorage.getItem('careerlift_interview_count') || '0', 10);
      localStorage.setItem('careerlift_interview_count', String(prevCount + 1));
      localStorage.setItem('careerlift_last_interview_time', new Date().toISOString());
      localStorage.setItem('careerlift_last_interview_job', `${jobTitle} at ${company}`);
      if (!data.technical_questions || data.technical_questions.length === 0) {
        setActiveTab('hr');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const hasResults = hrQuestions.length > 0;

  if (loadingHistory) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Interview Preparation</h1>
        <p className="mt-1 text-muted-foreground">
          Generate tailored interview questions, model answers, and a 7-day preparation plan
        </p>
      </div>

      {!hasResults ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Job Title *</label>
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer"
                className="h-11 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Company *</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google"
                className="h-11 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Job Description (optional)</label>
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste for more targeted questions..." rows={6}
              className="w-full rounded-xl border border-input bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-8 font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Generating prep materials...</> : <><Brain className="h-5 w-5" /> Generate Prep Plan</>}
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <button onClick={() => { setHrQuestions([]); setTechQuestions([]); setPrepPlan([]); }} className="text-sm text-primary hover:text-primary/80 transition-colors">
            ← New preparation
          </button>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {[
              { key: 'hr' as const, label: 'HR Questions', icon: Users, count: hrQuestions.length },
              { key: 'technical' as const, label: 'Technical Questions', icon: Brain, count: techQuestions.length },
              { key: 'plan' as const, label: '7-Day Plan', icon: Calendar, count: prepPlan.length },
            ]
              .filter((tab) => tab.key !== 'technical' || techQuestions.length > 0)
              .map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{tab.count}</span>
                </button>
              ))}
          </div>

          {/* HR Questions */}
          {activeTab === 'hr' && (
            <div className="space-y-3">
              {hrQuestions.map((q, i) => (
                <QuestionCard key={`hr-${i}`} q={q} idx={`hr-${i}`} expandedQ={expandedQ} setExpandedQ={setExpandedQ} />
              ))}
            </div>
          )}

          {/* Technical Questions */}
          {activeTab === 'technical' && (
            <div className="space-y-3">
              {techQuestions.map((q, i) => (
                <QuestionCard key={`tech-${i}`} q={q} idx={`tech-${i}`} expandedQ={expandedQ} setExpandedQ={setExpandedQ} />
              ))}
            </div>
          )}

          {/* 7-Day Plan */}
          {activeTab === 'plan' && (
            <div className="space-y-4">
              {prepPlan.map((day) => (
                <div key={day.day} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white font-bold">
                      {day.day}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Day {day.day}: {day.title}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold uppercase text-primary">Tasks</span>
                      </div>
                      <ul className="space-y-1">
                        {day.tasks.map((t, i) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Brain className="h-4 w-4 text-accent" />
                        <span className="text-xs font-semibold uppercase text-accent">Focus Areas</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {day.focus_areas.map((f, i) => (
                          <span key={i} className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">{f}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <BookOpen className="h-4 w-4 text-success" />
                        <span className="text-xs font-semibold uppercase text-success">Resources</span>
                      </div>
                      <ul className="space-y-1">
                        {day.resources.map((r, i) => (
                          <li key={i} className="text-sm text-muted-foreground">{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
