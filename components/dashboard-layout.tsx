'use client';

import { DashboardNav } from '@/components/dashboard-nav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  heading?: string;
  subheading?: string;
}

export function DashboardLayout({ children, heading, subheading }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex flex-col w-64 border-r p-6">
        <DashboardNav />
      </div>
      <div className="flex-1">
        <div className="container mx-auto py-8 px-4">
          {(heading || subheading) && (
            <div className="flex justify-between items-center mb-8">
              <div>
                {heading && <h1 className="text-3xl font-bold">{heading}</h1>}
                {subheading && <p className="text-muted-foreground">{subheading}</p>}
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
