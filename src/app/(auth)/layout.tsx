import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-accent to-primary">
        {/* Animated background orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 h-32 w-32 rounded-full bg-white/5 blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <Link href="/" className="mb-12 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-7 w-7" />
            </div>
            <span className="text-3xl font-bold">CareerLift-ai</span>
          </Link>

          <h2 className="text-4xl font-bold text-center mb-4">
            Your AI-Powered Career Partner
          </h2>
          <p className="text-lg text-white/80 text-center max-w-md">
            Optimize your resume, ace your interviews, and land your dream job with intelligent AI assistance.
          </p>

          {/* Feature highlights */}
          <div className="mt-12 space-y-4 w-full max-w-sm">
            {[
              'AI-powered resume analysis & optimization',
              'Smart interview preparation with model answers',
              'Real-time career coaching & guidance',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">CareerLift-ai</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
