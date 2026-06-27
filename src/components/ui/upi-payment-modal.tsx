'use client';

import { useState } from 'react';
import {
  X,
  Crown,
  CheckCircle2,
  Copy,
  Loader2,
  QrCode,
  Sparkles,
} from 'lucide-react';

// ─── CONFIG — update these values ────────────────────────────────────────────
const UPI_ID = 'tyler0708@upi';           // ← Replace with your real UPI ID
const UPI_NAME = 'CareerLift-ai';       // ← Displayed name in UPI apps
const PLANS = {
  monthly: { label: 'Monthly', price: 99,  period: '/month', saving: '' },
  yearly:  { label: 'Yearly',  price: 999, period: '/year',  saving: 'Save 16%' },
} as const;

type PlanKey = keyof typeof PLANS;

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

function buildUpiUrl(upiId: string, name: string, amount: number, note: string) {
  return encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
  );
}

function buildQrUrl(upiId: string, name: string, amount: number, note: string) {
  const data = buildUpiUrl(upiId, name, amount, note);
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${data}`;
}

export default function UPIPaymentModal({ onClose, onSuccess }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('monthly');
  const [step, setStep] = useState<'select' | 'pay' | 'confirm'>('select');
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [txnId, setTxnId] = useState('');

  const plan = PLANS[selectedPlan];
  const qrUrl = buildQrUrl(UPI_ID, UPI_NAME, plan.price, `${plan.label} Premium - ${UPI_NAME}`);

  const handleCopyUPI = async () => {
    await navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = async () => {
    setConfirming(true);
    // In production: call your backend to verify payment
    // For now we just show success after 1.5s
    await new Promise((r) => setTimeout(r, 1500));
    setStep('confirm');
    setConfirming(false);
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-scale-in overflow-hidden">

        {/* Header gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />

        <div className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* ── STEP 1: Select Plan ─────────────────────────────────── */}
          {step === 'select' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" />
                <h2 className="text-xl font-bold text-foreground">Choose a Plan</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Unlock unlimited access to all AI-powered features
              </p>

              {/* Feature list */}
              <div className="space-y-1.5">
                {[
                  'Unlimited resume analyses & optimizations',
                  'AI-powered cover letter generation',
                  'Tailored interview preparation plans',
                  'Unlimited AI Career Coach chats',
                  'Priority support',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                    {f}
                  </div>
                ))}
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                      selectedPlan === key
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    {p.saving && (
                      <span className="absolute -top-2.5 right-2 rounded-full bg-gradient-to-r from-primary to-accent px-2 py-0.5 text-[10px] font-bold text-white">
                        {p.saving}
                      </span>
                    )}
                    <p className="text-xl font-bold text-foreground">
                      ₹{p.price}
                      <span className="text-xs font-normal text-muted-foreground">{p.period}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.label} billing</p>
                    {selectedPlan === key && (
                      <div className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('pay')}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/25"
              >
                <QrCode className="h-4 w-4" />
                Pay ₹{plan.price} via UPI
              </button>
            </div>
          )}

          {/* ── STEP 2: QR / UPI Payment ────────────────────────────── */}
          {step === 'pay' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep('select')}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  ← Back
                </button>
                <h2 className="text-lg font-bold text-foreground ml-auto mr-auto">
                  Pay via UPI
                </h2>
              </div>

              {/* Amount badge */}
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 px-5 py-2 text-center">
                  <p className="text-2xl font-bold text-foreground">₹{plan.price}</p>
                  <p className="text-xs text-muted-foreground">{plan.label} Premium Plan</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-2xl border-2 border-primary/20 bg-white p-2 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="UPI QR Code"
                    width={220}
                    height={220}
                    className="rounded-xl"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Scan with any UPI app — PhonePe, GPay, Paytm, BHIM
                </p>
              </div>

              {/* UPI ID */}
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1 font-medium">UPI ID</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-bold text-foreground tracking-wide select-all">
                    {UPI_ID}
                  </p>
                  <button
                    onClick={handleCopyUPI}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors shrink-0"
                  >
                    {copied ? (
                      <><CheckCircle2 className="h-3.5 w-3.5" /> Copied!</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" /> Copy</>
                    )}
                  </button>
                </div>
              </div>

              {/* Transaction ID input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Transaction / UTR ID{' '}
                  <span className="text-muted-foreground font-normal">(optional, for faster verification)</span>
                </label>
                <input
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  placeholder="e.g. 4231908765432"
                  className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={confirming}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-60"
              >
                {confirming ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Verifying payment...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> I have paid</>
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                After payment, your account will be upgraded within a few minutes.
                Contact support if not activated within 24 hours.
              </p>
            </div>
          )}

          {/* ── STEP 3: Confirm ─────────────────────────────────────── */}
          {step === 'confirm' && (
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                <Crown className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Thank you! 🎉</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your payment has been received. Your Premium account will be
                  activated shortly. Refresh the page to see your updated plan.
                </p>
              </div>

              {txnId && (
                <div className="w-full rounded-xl bg-muted/50 p-3 text-left">
                  <p className="text-xs text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm font-semibold text-foreground">{txnId}</p>
                </div>
              )}

              <div className="space-y-1.5 w-full">
                {[
                  'Unlimited resume analyses',
                  'AI Cover Letter Generator',
                  'Interview Prep Plans',
                  'AI Career Coach',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent font-semibold text-white transition-all hover:shadow-lg"
              >
                Start Using Premium →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
