'use client';

import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Upload,
  FileSpreadsheet,
  Mail,
  Zap,
  BarChart3,
  Users,
  Settings2,
  Shield,
  ArrowRight,
} from 'lucide-react';

export default function Features() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-muted/30 flex justify-center">
          <div className="container px-6 w-full">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-6">
                Powerful Features for Seamless Onboarding
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover how OnboardAI helps you streamline your customer onboarding process with
                AI-powered tools and intuitive workflows.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-primary-foreground shadow-md transition-all hover:shadow-lg">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Main Features Section */}
        <section className="py-16 md:py-24 flex justify-center">
          <div className="container px-6 w-full">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">Key Features</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Everything you need to create a personalized onboarding experience for your
                customers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="card-hover">
                <CardHeader>
                  <div className="feature-icon-container">
                    <Upload className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">CSV Upload & Mapping</CardTitle>
                  <CardDescription>
                    Easily import customer data from CSV files with our intuitive mapping interface.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Drag and drop file uploads</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Intelligent field mapping</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Data validation and error handling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Support for various CSV formats</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="feature-icon-container">
                    <Mail className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">AI Email Generation</CardTitle>
                  <CardDescription>
                    Generate personalized onboarding emails based on customer survey responses.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Context-aware email content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Customizable tone and style</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Brand voice integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>One-click regeneration</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="feature-icon-container">
                    <Users className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">Customer Management</CardTitle>
                  <CardDescription>
                    Organize and manage all your customer data in one centralized dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Comprehensive customer profiles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Survey response tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Email history and versioning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Search and filtering capabilities</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="feature-icon-container">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">Customizable Settings</CardTitle>
                  <CardDescription>
                    Define your brand voice and customize email generation to match your style.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Email tone configuration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Brand information integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Custom instructions for AI</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Template management</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="feature-icon-container">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">Analytics</CardTitle>
                  <CardDescription>
                    Track customer engagement and optimize your onboarding process.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Customer onboarding metrics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Email generation statistics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Data import tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Performance dashboards</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <div className="feature-icon-container">
                    <Shield className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">Security & Compliance</CardTitle>
                  <CardDescription>
                    Your data is protected with enterprise-grade security and encryption.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>End-to-end encryption</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>GDPR compliance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Data retention controls</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Access management</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground flex justify-center">
          <div className="container px-6 w-full">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-6">
                Ready to Transform Your Onboarding Process?
              </h2>
              <p className="text-xl mb-8 text-primary-foreground/90">
                Join thousands of companies using OnboardAI to streamline their customer onboarding.
                Start your free trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup" className="mx-auto">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="gap-2 bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-secondary-foreground shadow-md transition-all hover:shadow-lg">
                    Get Started <ArrowRight className="h-4 w-4" />
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
