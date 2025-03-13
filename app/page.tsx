'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ArrowRight, CheckCircle2, BarChart3, Mail, Upload, Users, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check for existing session and redirect to dashboard if found
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };

    checkSession();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                  Introducing OnboardAI
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Streamline Your Customer Onboarding with AI
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Automate personalized email generation based on customer survey responses. Save
                  time, improve engagement, and deliver a seamless onboarding experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/auth/signup">
                    <Button size="lg" className="gap-1.5">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button size="lg" variant="outline">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative mx-auto aspect-video overflow-hidden rounded-xl border bg-background shadow-xl lg:order-last">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-background"></div>
                <div className="p-4">
                  <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="h-4 w-2/3 rounded-lg bg-muted"></div>
                      <div className="h-8 rounded-lg bg-muted"></div>
                      <div className="h-4 w-1/2 rounded-lg bg-muted"></div>
                      <div className="h-32 rounded-lg bg-muted"></div>
                      <div className="flex justify-end">
                        <div className="h-8 w-24 rounded-lg bg-primary"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Powerful Features
              </h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                Everything you need to streamline your customer onboarding process
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-card p-6 shadow-sm card-hover">
                <div className="feature-icon-container">
                  <Upload className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">CSV Upload</h3>
                <p className="text-muted-foreground">
                  Easily import customer data from CSV files with our intuitive mapping interface.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6 shadow-sm card-hover">
                <div className="feature-icon-container">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Customer Management</h3>
                <p className="text-muted-foreground">
                  Organize and manage all your customer data in one centralized dashboard.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6 shadow-sm card-hover">
                <div className="feature-icon-container">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">AI Email Generation</h3>
                <p className="text-muted-foreground">
                  Generate personalized onboarding emails based on customer survey responses.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6 shadow-sm card-hover">
                <div className="feature-icon-container">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Customizable Templates</h3>
                <p className="text-muted-foreground">
                  Define your brand voice and customize email generation to match your style.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6 shadow-sm card-hover">
                <div className="feature-icon-container">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Analytics</h3>
                <p className="text-muted-foreground">
                  Track customer engagement and optimize your onboarding process.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6 shadow-sm card-hover">
                <div className="feature-icon-container">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Secure & Reliable</h3>
                <p className="text-muted-foreground">
                  Your data is protected with enterprise-grade security and encryption.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Transform Your Onboarding Process?
              </h2>
              <p className="mx-auto max-w-[700px] md:text-xl">
                Join thousands of companies using OnboardAI to streamline their customer onboarding.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/auth/signup">
                  <Button size="lg" variant="secondary" className="gap-1.5">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
