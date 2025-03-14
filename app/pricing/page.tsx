'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { PricingPlans } from '@/components/pricing-plans';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

export default function Pricing() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');

    if (checkoutStatus === 'success') {
      toast({
        title: 'Success!',
        description: 'Your subscription has been processed successfully.',
      });
    } else if (checkoutStatus === 'canceled') {
      toast({
        title: 'Checkout canceled',
        description: 'You have canceled the checkout process.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setIsLoggedIn(true);

          // Get user's current subscription plan
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_plan_name')
            .eq('id', session.user.id)
            .single();

          if (profile?.subscription_plan_name) {
            setCurrentPlan(profile.subscription_plan_name);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-background flex justify-center">
        <div className="container py-12 px-6 md:py-16 w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that's right for your business. All plans include a 14-day free trial.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <PricingPlans isLoggedIn={isLoggedIn} currentPlan={currentPlan} />
          )}

          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="bg-card rounded-lg p-6 border">
                <h3 className="text-lg font-medium mb-2">Can I switch plans later?</h3>
                <p className="text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected
                  in your next billing cycle.
                </p>
              </div>
              <div className="bg-card rounded-lg p-6 border">
                <h3 className="text-lg font-medium mb-2">What happens after my free trial?</h3>
                <p className="text-muted-foreground">
                  After your 14-day free trial, you'll be automatically subscribed to the plan you
                  selected. You can cancel anytime before the trial ends to avoid being charged.
                </p>
              </div>
              <div className="bg-card rounded-lg p-6 border">
                <h3 className="text-lg font-medium mb-2">Do you offer refunds?</h3>
                <p className="text-muted-foreground">
                  We offer a 30-day money-back guarantee. If you're not satisfied with our service
                  within the first 30 days, contact us for a full refund.
                </p>
              </div>
              <div className="bg-card rounded-lg p-6 border">
                <h3 className="text-lg font-medium mb-2">Do you offer custom plans?</h3>
                <p className="text-muted-foreground">
                  Yes, we can create custom plans for organizations with specific needs. Contact our
                  sales team at sales@onboardai.com to discuss your requirements.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Our team is here to help. Email us at support@onboardai.com for more information.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
