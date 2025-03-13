import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OnboardAI - AI-Powered Customer Onboarding Platform',
  description:
    'Streamline your customer onboarding process with AI-generated personalized emails based on survey responses. Upload CSV data, manage customers, and automate communications.',
  keywords: [
    'customer onboarding',
    'AI email generation',
    'onboarding automation',
    'customer management',
    'CSV upload',
    'personalized emails',
  ],
  authors: [{ name: 'OnboardAI Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://onboardai.com',
    title: 'OnboardAI - AI-Powered Customer Onboarding Platform',
    description:
      'Streamline your customer onboarding process with AI-generated personalized emails based on survey responses.',
    siteName: 'OnboardAI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OnboardAI - AI-Powered Customer Onboarding Platform',
    description:
      'Streamline your customer onboarding process with AI-generated personalized emails based on survey responses.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
