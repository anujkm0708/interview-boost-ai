'use client';

import { useState, useCallback } from 'react';
import {
  FileText,
  Loader2,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit3,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react';

export default function CoverLetterPage() {
  // Resume input state
  const [resumeInputMode, setResumeInputMode] = useState<'upload' | 'paste'>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeDragActive, setResumeDragActive] = useState(false);
  const [resumeExtracting, setResumeExtracting] = useState(false);
  const [resumeText, setResumeText] = useState('');

  // Form state
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [editing, setEditing] = useState(false);
  const [editedLetter, setEditedLetter] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const isImage = (f: File) => f.type.startsWith('image/');

  // ─── Resume file drag & drop ───────────────────────────────────────────────
  const handleResumeDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setResumeDragActive(true);
    else if (e.type === 'dragleave') setResumeDragActive(false);
  }, []);

  const handleResumeDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResumeDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) await processResumeFile(droppedFile);
  }, []);

  const handleResumeFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) await processResumeFile(selected);
  };

  const processResumeFile = async (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() ?? '';
    const valid = ['pdf', 'docx', 'png', 'jpg', 'jpeg'].includes(ext);
    if (!valid) {
      setError('Please upload a PDF, DOCX, PNG, JPG, or JPEG file');
      return;
    }
    setResumeFile(selectedFile);
    setError('');
    setResumeExtracting(true);

    try {
      if (isImage(selectedFile)) {
        // Vision OCR for images
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
        // PDF or DOCX via analyze endpoint (returns raw content)
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
      setResumeInputMode('paste'); // switch to text view after extraction
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setResumeExtracting(false);
    }
  };

  // ─── Cover letter generation ───────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!jobTitle.trim() || !company.trim() || !jobDescription.trim()) {
      setError('Please fill in the Job Title, Company, and Job Description');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobTitle, company, jobDescription }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setCoverLetter(data.content);
      setEditedLetter(data.content);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editing ? editedLetter : coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    const content = editing ? editedLetter : coverLetter;
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 18;
      const maxWidth = pageWidth - margin * 2;
      let y = 22;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);

      const lines = content.split('\n');
      for (const rawLine of lines) {
        if (rawLine.trim() === '') {
          y += 4;
          continue;
        }
        const splitLines = doc.splitTextToSize(rawLine, maxWidth);
        for (const sl of splitLines) {
          if (y > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(sl, margin, y);
          y += 6.5;
        }
      }

      doc.save(`Cover_Letter_${company.replace(/\s+/g, '_')}.pdf`);
    } catch {
      // Fallback text download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-letter-${company.toLowerCase().replace(/\s+/g, '-')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Cover Letter Generator</h1>
        <p className="mt-1 text-muted-foreground">
          Upload your resume, fill in the job details, and get a tailored cover letter instantly
        </p>
      </div>

      {!coverLetter ? (
        <div className="space-y-6">

          {/* ── Resume Upload Section ───────────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                Your Resume{' '}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  (optional — for a more personalized letter)
                </span>
              </h2>
            </div>

            {/* Tab switcher */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setResumeInputMode('upload')}
                className={`pb-2.5 text-sm font-medium border-b-2 px-3 transition-colors ${
                  resumeInputMode === 'upload'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Upload File / Image
              </button>
              <button
                onClick={() => setResumeInputMode('paste')}
                className={`pb-2.5 text-sm font-medium border-b-2 px-3 transition-colors ${
                  resumeInputMode === 'paste'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Paste / Type Resume
              </button>
            </div>

            {resumeInputMode === 'upload' ? (
              <div
                onDragEnter={handleResumeDrag}
                onDragLeave={handleResumeDrag}
                onDragOver={handleResumeDrag}
                onDrop={handleResumeDrop}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
                  resumeDragActive
                    ? 'border-primary bg-primary/5'
                    : resumeFile
                    ? 'border-success bg-success/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/40'
                }`}
              >
                {resumeExtracting ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {resumeFile && isImage(resumeFile)
                        ? 'Reading image with AI vision...'
                        : 'Extracting resume content...'}
                    </p>
                  </div>
                ) : resumeFile ? (
                  <div className="flex flex-col items-center gap-2 animate-scale-in">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                      {isImage(resumeFile) ? (
                        <ImageIcon className="h-6 w-6 text-success" />
                      ) : (
                        <FileText className="h-6 w-6 text-success" />
                      )}
                    </div>
                    <p className="font-medium text-sm text-foreground">{resumeFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(resumeFile.size / 1024).toFixed(1)} KB
                      {resumeText && (
                        <span className="ml-2 text-success">· Content extracted ✓</span>
                      )}
                    </p>
                    <div className="flex gap-3 mt-1">
                      {resumeText && (
                        <button
                          onClick={() => setResumeInputMode('paste')}
                          className="text-xs text-primary hover:text-primary/80"
                        >
                          Review extracted text →
                        </button>
                      )}
                      <button
                        onClick={() => { setResumeFile(null); setResumeText(''); setError(''); }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Drop your resume here</p>
                      <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {['PDF', 'DOCX', 'PNG', 'JPG', 'JPEG'].map((fmt) => (
                        <span
                          key={fmt}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.docx,.png,.jpg,.jpeg"
                      onChange={handleResumeFileSelect}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {resumeFile && (
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Extracted from: <span className="text-foreground font-medium">{resumeFile.name}</span>
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
                  placeholder="Paste your resume content here to create a more personalized cover letter..."
                  rows={8}
                  className="w-full rounded-xl border border-input bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {resumeText.length} characters
                </p>
              </div>
            )}
          </div>

          {/* ── Job Details Section ─────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Job Title *</label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="h-11 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Company Name *</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
                className="h-11 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Job Description *</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={6}
              className="w-full rounded-xl border border-input bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || resumeExtracting}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-8 font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-5 w-5" /> Generate Cover Letter</>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <button
            onClick={() => { setCoverLetter(''); setEditedLetter(''); setEditing(false); setError(''); }}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            ← Generate another
          </button>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Cover Letter for {jobTitle} at {company}
                </h3>
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  editing
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                {editing ? 'Editing' : 'Edit'}
              </button>
            </div>

            {editing ? (
              <textarea
                value={editedLetter}
                onChange={(e) => setEditedLetter(e.target.value)}
                rows={20}
                className="w-full rounded-xl border border-input bg-background p-4 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                {coverLetter}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopy}
              className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground transition-all hover:bg-muted"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
            <button
              onClick={handleDownload}
              className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/25"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
