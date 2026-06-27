// ─── Enums & Literals ────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'premium';

export type ApplicationStatus =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

// ─── User & Profile ─────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

// ─── Resume ──────────────────────────────────────────────────────────────────

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  content: string;
  ats_score: number | null;
  resume_score: number | null;
  analysis: ResumeAnalysis | null;
  created_at: string;
}

export interface ResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  ats_score: number;
  resume_score: number;
  keyword_density: number;
  formatting_score: number;
  content_score: number;
  sections_found: string[];
  missing_sections: string[];
}

// ─── Job Analysis ────────────────────────────────────────────────────────────

export interface JobAnalysis {
  id: string;
  user_id: string;
  resume_id: string;
  job_title: string;
  company: string;
  job_description: string;
  match_percentage: number;
  matching_keywords: string[];
  missing_keywords: string[];
  matching_skills: string[];
  missing_skills: string[];
  recommendations: string[];
  created_at: string;
}

// ─── Optimized Resume ────────────────────────────────────────────────────────

export interface OptimizedResume {
  id: string;
  user_id: string;
  resume_id: string;
  job_analysis_id: string | null;
  optimized_content: string;
  improvements: string[];
  created_at: string;
}

// ─── Cover Letter ────────────────────────────────────────────────────────────

export interface CoverLetter {
  id: string;
  user_id: string;
  resume_id: string;
  job_title: string;
  company: string;
  content: string;
  created_at: string;
}

// ─── Interview Prep ──────────────────────────────────────────────────────────

export interface InterviewPrep {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  hr_questions: InterviewQuestion[];
  technical_questions: InterviewQuestion[];
  preparation_plan: PreparationDay[];
  created_at: string;
}

export interface InterviewQuestion {
  question: string;
  model_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface PreparationDay {
  day: number;
  title: string;
  tasks: string[];
  focus_areas: string[];
  resources: string[];
}

// ─── Application Tracker ─────────────────────────────────────────────────────

export interface Application {
  id: string;
  user_id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  applied_date: string;
  notes: string | null;
  url: string | null;
  salary_range: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ─── Subscription & Billing ──────────────────────────────────────────────────

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string;
  created_at: string;
}

// ─── Usage Tracking ──────────────────────────────────────────────────────────

export interface UsageTracking {
  id: string;
  user_id: string;
  month: string;
  analyses_used: number;
  max_analyses: number;
}
