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
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface SubscriptionManagementProps {
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionPeriodEnd?: string;
}

export function SubscriptionManagement({
  subscriptionStatus,
  subscriptionPlan,
  subscriptionPeriodEnd,
}: SubscriptionManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-500';

    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'trialing':
        return 'bg-blue-500';
      case 'past_due':
        return 'bg-yellow-500';
      case 'canceled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create portal session',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Subscription Management
        </CardTitle>
        <CardDescription>Manage your subscription and billing details</CardDescription>
      </CardHeader>
      <CardContent>
        {subscriptionPlan ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                <p className="text-lg font-semibold">{subscriptionPlan}</p>
              </div>
              <div className="flex items-start">
                <Badge
                  className={`${getStatusColor(
                    subscriptionStatus
                  )} text-white capitalize px-2 py-1`}>
                  {subscriptionStatus || 'No Subscription'}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Renewal Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p>{formatDate(subscriptionPeriodEnd)}</p>
              </div>
            </div>

            <Button onClick={handleManageSubscription} className="w-full mt-4" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>Manage Subscription</>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">You don't have an active subscription yet.</p>
            <Link href="/pricing">
              <Button className="gap-2">
                View Pricing Plans <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
