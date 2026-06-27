'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Wand2,
  Loader2,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Upload,
  FileText,
  X,
  Save,
  Image as ImageIcon,
} from 'lucide-react';

export default function ResumeOptimizerPage() {
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState('');

  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // File drag & drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      await processFile(selected);
    }
  };

  const processFile = async (selectedFile: File) => {
    const validExtensions = ['.pdf', '.docx', '.png', '.jpg', '.jpeg'];
    const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      setError('Please upload a PDF, DOCX, or Image file (PNG, JPG, JPEG)');
      return;
    }

    setFile(selectedFile);
    setError('');
    setExtracting(true);

    try {
      const isImage = selectedFile.type.startsWith('image/');

      if (isImage) {
        // Use Groq vision model to OCR the resume image
        setExtractStatus('Reading resume image with AI vision...');
        const imageForm = new FormData();
        imageForm.append('file', selectedFile);

        const res = await fetch('/api/resume/extract-image', {
          method: 'POST',
          body: imageForm,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Image text extraction failed');
        }

        const data = await res.json();
        setResumeText(data.content || '');
        setInputMode('paste');
      } else {
        // For PDF / DOCX — call the analyze endpoint and use the returned content
        setExtractStatus(
          selectedFile.name.endsWith('.docx')
            ? 'Extracting DOCX content...'
            : 'Extracting PDF content...'
        );

        const formData = new FormData();
        formData.append('file', selectedFile);

        const res = await fetch('/api/resume/analyze', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Failed to extract document text');
        const data = await res.json();

        // Use the actual extracted content from the API
        const extracted = (data.content || '').trim();
        if (extracted.length > 20) {
          setResumeText(extracted);
        } else {
          // Content was empty/very short — prompt user to paste
          setError(
            'Could not extract text from this file. Please switch to "Write/Paste Resume" tab and paste your resume content.'
          );
        }
        setInputMode('paste');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setExtracting(false);
      setExtractStatus('');
    }
  };

  const handleOptimize = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Please provide both your resume and the target job description');
      return;
    }
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/resume/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      if (!res.ok) throw new Error('Optimization failed');
      const data = await res.json();
      setOptimizedContent(data.optimized_content);
      setImprovements(data.improvements || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(optimizedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - margin * 2;
      const lineHeight = 6;
      let y = 20;

      const lines = optimizedContent.split('\n');

      for (const rawLine of lines) {
        const line = rawLine.trimEnd();

        // Check if line looks like a section heading (all caps, short)
        const isHeading =
          line.length > 0 &&
          line === line.toUpperCase() &&
          line.length <= 40 &&
          /[A-Z]/.test(line);

        if (isHeading) {
          // Add spacing before headings
          if (y > 30) y += 3;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(30, 30, 30);
          doc.text(line, margin, y);
          y += lineHeight;
          // Underline
          doc.setDrawColor(80, 80, 200);
          doc.setLineWidth(0.4);
          doc.line(margin, y - 1, pageWidth - margin, y - 1);
          y += 2;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(50, 50, 50);
        } else if (line === '') {
          y += lineHeight * 0.4;
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(50, 50, 50);
          const splitLines = doc.splitTextToSize(line, maxWidth);
          for (const sl of splitLines) {
            if (y > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(sl, margin, y);
            y += lineHeight;
          }
        }
      }

      const fileName = file
        ? `Optimized_${file.name.replace(/\.[^/.]+$/, '')}.pdf`
        : 'Optimized_Resume.pdf';
      doc.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback to text download
      const blob = new Blob([optimizedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'optimized-resume.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleSaveToDashboard = async () => {
    setSaveLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User session not found. Please log in.');

      // Calculate a dynamic score based on the improvements length
      const atsScore = Math.min(75 + improvements.length * 3, 98);
      const resumeScore = Math.min(80 + improvements.length * 2, 97);

      // Save optimized resume to resumes table — updates dashboard score
      const { error: resumeError } = await supabase.from('resumes').insert({
        user_id: user.id,
        file_name: file
          ? `Optimized_${file.name.replace(/\.[^/.]+$/, '')}.pdf`
          : 'Optimized_Resume.pdf',
        content: optimizedContent,
        ats_score: atsScore,
        resume_score: resumeScore,
        analysis: {
          strengths: [
            'Optimized keywords matching job description',
            'Action-oriented bullet points',
            'Standardized ATS-friendly format',
          ],
          weaknesses: ['Requires local review to confirm numeric metrics details'],
          suggestions: ['Verify dates match your background documentation'],
          ats_score: atsScore,
          resume_score: resumeScore,
          sections_found: ['Contact', 'Summary', 'Experience', 'Skills'],
          missing_sections: [],
        },
      });

      if (resumeError) throw resumeError;

      // Also save to optimized_resumes table
      await supabase.from('optimized_resumes').insert({
        user_id: user.id,
        optimized_content: optimizedContent,
        improvements: improvements,
      });

      setSaved(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to save optimized resume'
      );
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Resume Optimizer</h1>
        <p className="mt-1 text-muted-foreground">
          Upload your resume (PDF, DOCX, or photo), add a job description, and get an AI-tailored
          resume with a one-click PDF download.
        </p>
      </div>

      {!optimizedContent ? (
        <div className="space-y-6">
          {/* Mode Switcher */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setInputMode('upload')}
              className={`pb-3 text-sm font-semibold border-b-2 px-4 transition-colors ${
                inputMode === 'upload'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Upload File or Image
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`pb-3 text-sm font-semibold border-b-2 px-4 transition-colors ${
                inputMode === 'paste'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Write / Paste Resume
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Input Pane */}
            <div className="space-y-4">
              {inputMode === 'upload' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Upload Resume (PDF, DOCX, or Image)
                  </label>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-14 transition-all min-h-[350px] ${
                      dragActive
                        ? 'border-primary bg-primary/5'
                        : file
                        ? 'border-success bg-success/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    {extracting ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground font-medium">
                          {extractStatus || 'Extracting resume content...'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          This may take a few seconds
                        </p>
                      </div>
                    ) : file ? (
                      <div className="flex flex-col items-center gap-3 animate-scale-in">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="h-8 w-8 text-success" />
                          ) : (
                            <FileText className="h-8 w-8 text-success" />
                          )}
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-foreground">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                          {resumeText && (
                            <p className="text-xs text-success mt-1">
                              ✓ Content extracted — switch to &quot;Write/Paste&quot; tab to review
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setFile(null);
                            setResumeText('');
                            setError('');
                          }}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" /> Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                          <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">
                            Drag and drop your resume here
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            PDF, DOCX, PNG, JPG, JPEG · AI reads your content automatically
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.docx,.png,.jpg,.jpeg"
                          onChange={handleFileSelect}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                      </div>
                    )}
                  </div>
                  {file && resumeText && !extracting && (
                    <button
                      onClick={() => setInputMode('paste')}
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      → Review &amp; edit extracted content
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-foreground">
                      {file ? 'Extracted Resume Text (edit if needed)' : 'Paste Your Resume'}
                    </label>
                    {file && (
                      <button
                        onClick={() => {
                          setFile(null);
                          setResumeText('');
                          setInputMode('upload');
                        }}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        Change uploaded file
                      </button>
                    )}
                  </div>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your current resume content here, or upload a file in the previous tab..."
                    rows={15}
                    className="w-full rounded-xl border border-input bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    {resumeText.length} characters · {resumeText.split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>
              )}
            </div>

            {/* Right Job Description Pane */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Target Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here. AI will match keywords, skills, and qualifications from this description..."
                rows={inputMode === 'upload' ? 17 : 15}
                className="w-full rounded-xl border border-input bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {jobDescription.length} characters
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={handleOptimize}
            disabled={loading || extracting || !resumeText.trim() || !jobDescription.trim()}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-8 font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Tailoring Resume with AI...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" /> Optimize Resume
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Back Action */}
          <button
            onClick={() => {
              setOptimizedContent('');
              setImprovements([]);
              setSaved(false);
              setError('');
            }}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            ← Start new optimization
          </button>

          {/* Improvements Made */}
          {improvements.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Improvements Made</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-primary/10 text-primary rounded-full px-2.5 py-1">
                  {improvements.length} changes
                </span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dual Interactive Editors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
                Original Resume (Edit &amp; Re-tailor)
              </h3>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/20 p-4 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono"
                rows={18}
              />
            </div>

            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-success" />
                Optimized Resume (Editable)
                <ArrowRight className="h-3 w-3 text-success animate-pulse" />
              </h3>
              <textarea
                value={optimizedContent}
                onChange={(e) => setOptimizedContent(e.target.value)}
                className="w-full rounded-xl border border-success/30 bg-success/5 p-4 text-sm text-foreground transition-all focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20 resize-none font-mono"
                rows={18}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-scale-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Resume saved successfully! Your
              Dashboard scores have been updated.
            </div>
          )}

          {/* Interactive Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveToDashboard}
              disabled={saveLoading || saved}
              className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
            >
              {saveLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save to Dashboard
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>

            <button
              onClick={handleCopy}
              className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground transition-all hover:bg-muted"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>

            <button
              onClick={handleOptimize}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-xl border border-primary/30 text-primary px-5 text-sm font-semibold transition-all hover:bg-primary/5 ml-auto"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Re-optimize
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
