'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { getStripe } from '@/lib/stripe-client';
import { useToast } from '@/hooks/use-toast';

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  priceId: string;
  features: string[];
  popular?: boolean;
}

interface PricingPlansProps {
  isLoggedIn: boolean;
  currentPlan?: string;
}

export function PricingPlans({ isLoggedIn, currentPlan }: PricingPlansProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const plans: PricingPlan[] = [
    {
      name: 'Starter',
      description: 'Perfect for small businesses just getting started',
      price: '$29',
      priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID!,
      features: [
        'Up to 100 customers',
        'CSV data import',
        'AI email generation',
        'Basic customization options',
        'Email support',
      ],
    },
    {
      name: 'Professional',
      description: 'For growing businesses with more customers',
      price: '$79',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID!,
      popular: true,
      features: [
        'Up to 1,000 customers',
        'Advanced CSV mapping',
        'Enhanced AI email generation',
        'Advanced customization options',
        'Priority email support',
        'Analytics dashboard',
      ],
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with custom needs',
      price: '$199',
      priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID!,
      features: [
        'Unlimited customers',
        'API access',
        'Custom AI model training',
        'White-labeling options',
        'Dedicated account manager',
        '24/7 priority support',
        'Advanced security features',
      ],
    },
  ];

  const handleCheckout = async (priceId: string, planName: string) => {
    if (!isLoggedIn) {
      // Redirect to sign in page if not logged in
      window.location.href = '/auth/signin?redirect=/pricing';
      return;
    }

    try {
      setIsLoading(priceId);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planName,
        }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create checkout session',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={`border-2 ${
            plan.popular ? 'border-primary' : 'border-border'
          } flex flex-col card-hover ${currentPlan === plan.name ? 'bg-muted/50' : ''}`}>
          {plan.popular && (
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-full">
              Most Popular
            </div>
          )}
          <CardHeader className="pb-8">
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground ml-1">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="pt-4">
            {currentPlan === plan.name ? (
              <Button className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleCheckout(plan.priceId, plan.name)}
                disabled={isLoading === plan.priceId}>
                {isLoading === plan.priceId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Subscribe'
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
