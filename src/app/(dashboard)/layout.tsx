import { Sidebar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl p-4 pt-16 sm:p-6 lg:p-8 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
