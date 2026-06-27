'use client';

import { useState, useCallback } from 'react';
import {
  Target,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Lightbulb,
  Upload,
  FileText,
  X,
  Image as ImageIcon,
} from 'lucide-react';

interface AnalysisResult {
  match_percentage: number;
  matching_keywords: string[];
  missing_keywords: string[];
  matching_skills: string[];
  missing_skills: string[];
  recommendations: string[];
}

const MatchGauge = ({ percentage }: { percentage: number }) => {
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 80 ? '#22c55e' : percentage >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: 160, height: 160 }}>
      <svg className="rotate-[-90deg]" width="160" height="160" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="60" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle cx="70" cy="70" r="60" fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground">{percentage}%</span>
        <span className="text-sm text-muted-foreground">Match</span>
      </div>
    </div>
  );
};

export default function JobAnalyzerPage() {
  const [jobDescription, setJobDescription] = useState('');

  // Resume input state
  const [resumeInputMode, setResumeInputMode] = useState<'upload' | 'paste'>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState('');
  const [resumeText, setResumeText] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const isImage = (f: File) => f.type.startsWith('image/');

  // ── Drag & drop handlers ──────────────────────────────────────────────────
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) await processFile(droppedFile);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) await processFile(selected);
  };

  const processFile = async (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() ?? '';
    const valid = ['pdf', 'docx', 'png', 'jpg', 'jpeg'].includes(ext);
    if (!valid) {
      setError('Please upload a PDF, DOCX, PNG, JPG, or JPEG file');
      return;
    }

    setResumeFile(selectedFile);
    setError('');
    setExtracting(true);

    try {
      if (isImage(selectedFile)) {
        setExtractStatus('Reading resume image with AI vision...');
        const imageForm = new FormData();
        imageForm.append('file', selectedFile);

        const res = await fetch('/api/resume/extract-image', {
          method: 'POST',
          body: imageForm,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Could not read text from image');
        }
        const data = await res.json();
        setResumeText(data.content || '');
      } else {
        setExtractStatus(selectedFile.name.endsWith('.docx') ? 'Extracting DOCX...' : 'Extracting PDF...');
        const formData = new FormData();
        formData.append('file', selectedFile);

        const res = await fetch('/api/resume/analyze', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Failed to extract document text');
        const data = await res.json();
        const extracted = (data.content || '').trim();
        setResumeText(extracted);
      }
      setResumeInputMode('paste');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setExtracting(false);
      setExtractStatus('');
    }
  };

  // ── Analyze ───────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      setError('Please provide both a job description and your resume');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/job/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, resumeText }),
      });

      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setResult(data);
      // Persist ATS score to localStorage so dashboard updates
      if (data.match_percentage !== undefined) {
        localStorage.setItem('careerlift_ats_score', String(data.match_percentage));
        localStorage.setItem('careerlift_last_job_time', new Date().toISOString());
        localStorage.setItem('careerlift_last_job_title', jobDescription.split('\n')[0]?.substring(0, 80) || 'Job');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Job Description Analyzer</h1>
        <p className="mt-1 text-muted-foreground">
          Upload your resume and paste a job description to get your match percentage and skill gaps
        </p>
      </div>

      {!result ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Left: Job Description ─────────────────────────────── */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
                rows={16}
                className="w-full rounded-xl border border-input bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{jobDescription.length} characters</p>
            </div>

            {/* ── Right: Resume Upload ──────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Your Resume</label>
                {/* Tab switcher */}
                <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium">
                  <button
                    onClick={() => setResumeInputMode('upload')}
                    className={`px-3 py-1.5 transition-colors ${
                      resumeInputMode === 'upload'
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Upload
                  </button>
                  <button
                    onClick={() => setResumeInputMode('paste')}
                    className={`px-3 py-1.5 transition-colors ${
                      resumeInputMode === 'paste'
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Paste
                  </button>
                </div>
              </div>

              {resumeInputMode === 'upload' ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all min-h-[350px] ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : resumeFile
                      ? 'border-success bg-success/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/40'
                  }`}
                >
                  {extracting ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground font-medium">
                        {extractStatus || 'Extracting content...'}
                      </p>
                      <p className="text-xs text-muted-foreground">This may take a moment</p>
                    </div>
                  ) : resumeFile ? (
                    <div className="flex flex-col items-center gap-3 animate-scale-in p-8">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
                        {isImage(resumeFile)
                          ? <ImageIcon className="h-8 w-8 text-success" />
                          : <FileText className="h-8 w-8 text-success" />}
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{resumeFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(resumeFile.size / 1024).toFixed(1)} KB
                          {isImage(resumeFile) && (
                            <span className="ml-2 text-xs text-primary bg-primary/10 rounded-full px-2 py-0.5">
                              AI Vision OCR
                            </span>
                          )}
                        </p>
                        {resumeText && (
                          <p className="text-xs text-success mt-1">✓ Content extracted successfully</p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        {resumeText && (
                          <button
                            onClick={() => setResumeInputMode('paste')}
                            className="text-xs text-primary hover:text-primary/80 transition-colors"
                          >
                            Review text →
                          </button>
                        )}
                        <button
                          onClick={() => { setResumeFile(null); setResumeText(''); setError(''); }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-center p-8">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-foreground">Drop your resume here</p>
                        <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                      </div>
                      {/* Format badges */}
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {[
                          { label: 'PDF', color: 'bg-red-500/10 text-red-400' },
                          { label: 'DOCX', color: 'bg-blue-500/10 text-blue-400' },
                          { label: 'PNG', color: 'bg-emerald-500/10 text-emerald-400' },
                          { label: 'JPG', color: 'bg-amber-500/10 text-amber-400' },
                          { label: 'JPEG', color: 'bg-amber-500/10 text-amber-400' },
                        ].map((fmt) => (
                          <span key={fmt.label} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${fmt.color}`}>
                            {fmt.label}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Images processed with AI vision OCR</p>
                      <input
                        type="file"
                        accept=".pdf,.docx,.png,.jpg,.jpeg"
                        onChange={handleFileSelect}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {resumeFile && (
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        From: <span className="text-foreground font-medium">{resumeFile.name}</span>
                      </p>
                      <button
                        onClick={() => { setResumeFile(null); setResumeText(''); setResumeInputMode('upload'); }}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        Change file
                      </button>
                    </div>
                  )}
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume content here, or upload a file using the Upload tab..."
                    rows={15}
                    className="w-full rounded-xl border border-input bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {resumeText.length} characters · {resumeText.split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading || extracting || !jobDescription.trim() || !resumeText.trim()}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-8 font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing match...</>
            ) : (
              <><Target className="h-5 w-5" /> Analyze Match</>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <button
            onClick={() => { setResult(null); }}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            ← New analysis
          </button>

          {/* Match Score */}
          <div className="flex justify-center rounded-2xl border border-border bg-card p-8">
            <MatchGauge percentage={result.match_percentage} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Matching Keywords */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h3 className="text-lg font-semibold">Matching Keywords ({result.matching_keywords.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.matching_keywords.map((k) => (
                  <span key={k} className="rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">{k}</span>
                ))}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="h-5 w-5 text-destructive" />
                <h3 className="text-lg font-semibold">Missing Keywords ({result.missing_keywords.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.missing_keywords.map((k) => (
                  <span key={k} className="rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">{k}</span>
                ))}
              </div>
            </div>

            {/* Matching Skills */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-success" />
                <h3 className="text-lg font-semibold">Matching Skills ({result.matching_skills.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.matching_skills.map((s) => (
                  <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{s}</span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-warning" />
                <h3 className="text-lg font-semibold">Missing Skills ({result.missing_skills.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.missing_skills.map((s) => (
                  <span key={s} className="rounded-full bg-warning/10 px-3 py-1 text-sm font-medium text-warning">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Recommendations</h3>
            </div>
            <ul className="space-y-3">
              {result.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
