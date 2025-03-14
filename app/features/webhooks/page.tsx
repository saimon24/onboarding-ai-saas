import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function WebhooksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 bg-background flex justify-center">
          <div className="container px-6 w-full max-w-7xl">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl mb-6">
                Automate Your Customer Onboarding with Webhooks
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Connect your survey tools directly to OnboardAI and automatically generate
                personalized emails for every new customer response.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="animated-button gap-1.5">
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
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-muted/50 flex justify-center">
          <div className="container px-6 w-full max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How Webhooks Work</h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground text-xl">
                Seamlessly connect your survey tools to OnboardAI in three simple steps
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="bg-background rounded-lg p-6 shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Get Your Webhook URL</h3>
                <p className="text-muted-foreground">
                  Each account gets a unique webhook URL that you can find in your dashboard. Just
                  copy it and you're ready to go.
                </p>
              </div>

              <div className="bg-background rounded-lg p-6 shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Connect Your Survey Tool</h3>
                <p className="text-muted-foreground">
                  Paste your webhook URL into your survey platform (Typeform, Google Forms,
                  SurveyMonkey, etc.) to automatically send responses.
                </p>
              </div>

              <div className="bg-background rounded-lg p-6 shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Map Your Fields</h3>
                <p className="text-muted-foreground">
                  After receiving a test response, map your survey fields to our system. We'll
                  automatically process incoming data and generate personalized emails.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background flex justify-center">
          <div className="container px-6 w-full max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Webhook Features</h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground text-xl">
                Powerful automation tools to streamline your customer onboarding
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Simple Integration</h3>
                  <p className="text-muted-foreground">
                    Just copy your unique webhook URL and paste it into your survey tool. No complex
                    setup or coding required.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Flexible Field Mapping</h3>
                  <p className="text-muted-foreground">
                    Map any field from your survey to our system, supporting complex nested data
                    structures.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Real-time Processing</h3>
                  <p className="text-muted-foreground">
                    Survey responses are processed immediately, allowing for instant email
                    generation.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Test Mode</h3>
                  <p className="text-muted-foreground">
                    Send a test response to configure your field mappings before going live with
                    real customer data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground flex justify-center">
          <div className="container px-6 w-full max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Automate Your Customer Onboarding?
              </h2>
              <p className="mx-auto max-w-[700px] md:text-xl">
                Start using webhooks today to streamline your workflow and deliver personalized
                onboarding emails automatically.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/auth/signup">
                  <Button size="lg" className="animated-button gap-1.5">
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
