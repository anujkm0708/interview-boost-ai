'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

import {
  User,
  Mail,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ProfileData {
  full_name: string;
  email: string;
  subscription_tier: 'free' | 'premium';
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    subscription_tier: 'free',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);


  const loadProfile = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile({
          full_name: profileData?.full_name || user.user_metadata?.full_name || '',
          email: user.email || '',
          subscription_tier: profileData?.subscription_tier || 'free',
        });
      }
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          full_name: profile.full_name,
        }).eq('id', user.id);

        await supabase.auth.updateUser({
          data: { full_name: profile.full_name },
        });

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch { /* empty */ }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    }
    setPasswordLoading(false);
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and subscription</p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={profile.email}
                disabled
                className="h-11 w-full rounded-xl border border-input bg-muted pl-10 pr-4 text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : saved ? (
              <><CheckCircle2 className="h-4 w-4" /> Saved!</>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {passwordError && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Password updated successfully!
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={passwordLoading || !newPassword}
            className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-medium text-foreground transition-all hover:bg-muted disabled:opacity-50"
          >
            {passwordLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : 'Update Password'}
          </button>
        </div>
      </div>

    </div>
  );
}
