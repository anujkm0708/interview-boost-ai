'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Application, ApplicationStatus } from '@/types';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  X,
  Loader2,
  Building2,
  Calendar,
  ExternalLink,
  StickyNote,
  Briefcase,
} from 'lucide-react';

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: 'applied', label: 'Applied', color: 'bg-blue-500/10 text-blue-500' },
  { value: 'screening', label: 'Screening', color: 'bg-purple-500/10 text-purple-500' },
  { value: 'interview', label: 'Interview', color: 'bg-amber-500/10 text-amber-500' },
  { value: 'offer', label: 'Offer', color: 'bg-emerald-500/10 text-emerald-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/10 text-red-500' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-500/10 text-gray-500' },
];

interface FormData {
  company: string;
  role: string;
  status: ApplicationStatus;
  applied_date: string;
  notes: string;
  url: string;
  salary_range: string;
}

const emptyForm: FormData = {
  company: '',
  role: '',
  status: 'applied',
  applied_date: new Date().toISOString().split('T')[0],
  notes: '',
  url: '',
  salary_range: '',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch { /* empty */ }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch = search === '' ||
        app.company.toLowerCase().includes(search.toLowerCase()) ||
        app.role.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const handleSave = async () => {
    if (!form.company.trim() || !form.role.trim()) return;
    setSaving(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...form, id: editingId } : form;
      const res = await fetch('/api/applications', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await loadApplications();
        setShowModal(false);
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch { /* empty */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application?')) return;
    try {
      await fetch('/api/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await loadApplications();
    } catch { /* empty */ }
  };

  const handleEdit = (app: Application) => {
    setEditingId(app.id);
    setForm({
      company: app.company,
      role: app.role,
      status: app.status,
      applied_date: app.applied_date,
      notes: app.notes || '',
      url: app.url || '',
      salary_range: app.salary_range || '',
    });
    setShowModal(true);
  };

  const statusCount = (status: ApplicationStatus) =>
    applications.filter(a => a.status === status).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Application Tracker</h1>
          <p className="mt-1 text-muted-foreground">Track and manage all your job applications</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true); }}
          className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-primary/25">
          <Plus className="h-4 w-4" /> Add Application
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_OPTIONS.map((s) => (
          <button key={s.value} onClick={() => setStatusFilter(statusFilter === s.value ? 'all' : s.value)}
            className={`rounded-xl border p-3 text-center transition-all ${statusFilter === s.value ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted'}`}>
            <p className="text-2xl font-bold text-foreground">{statusCount(s.value)}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by company or role..."
            className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
          className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground appearance-none cursor-pointer">
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-lg font-medium text-foreground">No applications yet</p>
          <p className="text-sm text-muted-foreground">Start tracking your job applications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const status = STATUS_OPTIONS.find(s => s.value === app.status)!;
            return (
              <div key={app.id} className="group rounded-2xl border border-border bg-card p-4 sm:p-5 transition-all hover:shadow-md hover:shadow-primary/5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{app.role}</h3>
                      <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{app.company}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(app.applied_date).toLocaleDateString()}</span>
                      {app.salary_range && <span className="text-success font-medium">{app.salary_range}</span>}
                    </div>
                    {app.notes && <p className="mt-1.5 text-sm text-muted-foreground flex items-start gap-1"><StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0" />{app.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {app.url && (
                      <a href={app.url} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button onClick={() => handleEdit(app)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(app.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-scale-in">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-foreground mb-6">{editingId ? 'Edit Application' : 'Add Application'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Company *</label>
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name"
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Role *</label>
                  <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Job title"
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground appearance-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Applied Date</label>
                  <input type="date" value={form.applied_date} onChange={(e) => setForm({ ...form, applied_date: e.target.value })}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">URL</label>
                <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="Job posting URL"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Salary Range</label>
                <input value={form.salary_range} onChange={(e) => setForm({ ...form, salary_range: e.target.value })} placeholder="e.g. $80K - $120K"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add any notes..." rows={3}
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              <button onClick={handleSave} disabled={saving || !form.company.trim() || !form.role.trim()}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent font-medium text-white transition-all hover:shadow-lg disabled:opacity-50">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : editingId ? 'Update Application' : 'Add Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
