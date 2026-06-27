'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ResumeAnalysis } from '@/types';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Shield,
  BookOpen,
  Lightbulb,
  X,
  Image as ImageIcon,
} from 'lucide-react';

const ScoreGauge = ({ score, label, size = 'lg' }: { score: number; label: string; size?: 'sm' | 'lg' }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const dim = size === 'lg' ? 140 : 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg className="rotate-[-90deg]" width={dim} height={dim} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold text-foreground ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}>{score}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
};

export default function ResumeAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState('');

  const isImage = (f: File) => f.type.startsWith('image/');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const ext = droppedFile.name.split('.').pop()?.toLowerCase() ?? '';
      const valid = ['pdf', 'docx', 'png', 'jpg', 'jpeg'].includes(ext);
      if (valid) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Please upload a PDF, DOCX, PNG, JPG, or JPEG file');
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      // For images — first extract text via vision OCR, then analyze
      if (isImage(file)) {
        setLoadingStatus('Reading resume image with AI vision...');
        const imageForm = new FormData();
        imageForm.append('file', file);

        const ocrRes = await fetch('/api/resume/extract-image', {
          method: 'POST',
          body: imageForm,
        });

        if (!ocrRes.ok) {
          const errData = await ocrRes.json();
          throw new Error(errData.error || 'Could not read text from image');
        }

        const ocrData = await ocrRes.json();
        const extractedText: string = ocrData.content || '';

        if (!extractedText.trim()) {
          throw new Error('No text could be extracted from the image. Please upload a clearer image.');
        }

        // Now send the extracted text as a pseudo-file to the analyze endpoint
        setLoadingStatus('Analyzing extracted resume content...');
        const textBlob = new Blob([extractedText], { type: 'text/plain' });
        const textFile = new File([textBlob], file.name.replace(/\.[^.]+$/, '.txt'), { type: 'text/plain' });

        // Use the analyze route, but for plain text we do a direct call with the content
        const analyzeRes = await fetch('/api/resume/analyze-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: extractedText, fileName: file.name }),
        });

        if (!analyzeRes.ok) throw new Error('Analysis failed');
        const analyzeData = await analyzeRes.json();
        setAnalysis(analyzeData.analysis);
        // Persist scores to localStorage so dashboard updates
        if (analyzeData.analysis) {
          localStorage.setItem('careerlift_resume_score', String(analyzeData.analysis.resume_score || 0));
          localStorage.setItem('careerlift_ats_score_resume', String(analyzeData.analysis.ats_score || 0));
          localStorage.setItem('careerlift_last_resume', file.name);
          localStorage.setItem('careerlift_last_resume_time', new Date().toISOString());
        }
      } else {
        // PDF or DOCX — use the existing analyze endpoint directly
        setLoadingStatus('Analyzing your resume...');
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/resume/analyze', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Analysis failed');
        const data = await res.json();
        setAnalysis(data.analysis);
        // Persist scores to localStorage so dashboard updates
        if (data.analysis) {
          localStorage.setItem('careerlift_resume_score', String(data.analysis.resume_score || 0));
          localStorage.setItem('careerlift_ats_score_resume', String(data.analysis.ats_score || 0));
          localStorage.setItem('careerlift_last_resume', file.name);
          localStorage.setItem('careerlift_last_resume_time', new Date().toISOString());
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze resume');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    if (isImage(file)) return <ImageIcon className="h-8 w-8 text-success" />;
    return <FileText className="h-8 w-8 text-success" />;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resume Analyzer</h1>
        <p className="mt-1 text-muted-foreground">
          Upload your resume to get an in-depth AI analysis and ATS compatibility score
        </p>
      </div>

      {!analysis ? (
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all ${
              dragActive
                ? 'border-primary bg-primary/5'
                : file
                ? 'border-success bg-success/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center gap-3 animate-scale-in">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
                  {getFileIcon()}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                    {isImage(file) && (
                      <span className="ml-2 text-xs text-primary bg-primary/10 rounded-full px-2 py-0.5">
                        AI Vision OCR
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => { setFile(null); setError(''); }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Drop your resume here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </div>
                {/* Format badges */}
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { label: 'PDF', color: 'bg-red-500/10 text-red-400' },
                    { label: 'DOCX', color: 'bg-blue-500/10 text-blue-400' },
                    { label: 'PNG', color: 'bg-emerald-500/10 text-emerald-400' },
                    { label: 'JPG', color: 'bg-amber-500/10 text-amber-400' },
                    { label: 'JPEG', color: 'bg-amber-500/10 text-amber-400' },
                  ].map((fmt) => (
                    <span
                      key={fmt.label}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${fmt.color}`}
                    >
                      {fmt.label}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Images are processed with AI vision OCR
                </p>
                <input
                  type="file"
                  accept=".pdf,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:px-8"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {loadingStatus || 'Analyzing your resume...'}
              </>
            ) : (
              <>
                <TrendingUp className="h-5 w-5" />
                Analyze Resume
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <button
            onClick={() => { setAnalysis(null); setFile(null); setError(''); }}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            ← Upload another resume
          </button>

          {/* Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-6">
              <ScoreGauge score={analysis.ats_score} label="ATS Score" />
            </div>
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-6">
              <ScoreGauge score={analysis.resume_score} label="Resume Score" />
            </div>
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-6">
              <ScoreGauge score={analysis.formatting_score} label="Formatting" size="sm" />
            </div>
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-6">
              <ScoreGauge score={analysis.content_score} label="Content" size="sm" />
            </div>
          </div>

          {/* Sections Found */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h3 className="text-lg font-semibold text-foreground">Sections Found</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.sections_found.map((section) => (
                  <span key={section} className="rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                    {section}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-warning" />
                <h3 className="text-lg font-semibold text-foreground">Missing Sections</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.missing_sections.length > 0 ? analysis.missing_sections.map((section) => (
                  <span key={section} className="rounded-full bg-warning/10 px-3 py-1 text-sm font-medium text-warning">
                    {section}
                  </span>
                )) : (
                  <p className="text-sm text-muted-foreground">All key sections are present! 🎉</p>
                )}
              </div>
            </div>
          </div>

          {/* Strengths */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-success" />
              <h3 className="text-lg font-semibold text-foreground">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <h3 className="text-lg font-semibold text-foreground">Areas for Improvement</h3>
            </div>
            <ul className="space-y-2">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Suggestions</h3>
            </div>
            <ul className="space-y-2">
              {analysis.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
