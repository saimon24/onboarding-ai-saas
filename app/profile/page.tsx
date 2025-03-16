'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, CreditCard, BarChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionManagement } from '@/components/subscription-management';
import { DashboardNav } from '@/components/dashboard-nav';

interface ProfileData {
  id: string;
  email: string;
  subscription_status: string;
  subscription_plan_name: string;
  subscription_current_period_end: string;
  created_at: string;
}

interface UsageStats {
  totalCustomers: number;
  totalEmails: number;
  lastUploadDate: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalCustomers: 0,
    totalEmails: 0,
    lastUploadDate: null,
  });
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkSessionAndFetchData();
  }, []);

  const checkSessionAndFetchData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch usage statistics
      await fetchUsageStats(session.user.id);
    } catch (error: any) {
      console.error('Error fetching profile data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load profile data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStats = async (userId: string) => {
    try {
      // Get total customers count
      const { count: customerCount, error: customerError } = await supabase
        .from('customer_data')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId);

      if (customerError) throw customerError;

      // Get total emails sent
      const { count: emailCount, error: emailError } = await supabase
        .from('customer_data')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId)
        .not('ai_email', 'is', null);

      if (emailError) throw emailError;

      // Get last upload date
      const { data: lastCustomer, error: lastCustomerError } = await supabase
        .from('customer_data')
        .select('created_at')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastCustomerError && lastCustomerError.code !== 'PGRST116') {
        // PGRST116 is the error code for no rows returned
        throw lastCustomerError;
      }

      setUsageStats({
        totalCustomers: customerCount || 0,
        totalEmails: emailCount || 0,
        lastUploadDate: lastCustomer?.created_at || null,
      });
    } catch (error: any) {
      console.error('Error fetching usage stats:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex flex-col w-64 border-r p-6">
        <DashboardNav />
      </div>
      <div className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Profile</h1>
              <p className="text-muted-foreground">Manage your account and subscription</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="account" className="space-y-6">
              <TabsList>
                <TabsTrigger value="account" className="gap-2">
                  <User className="h-4 w-4" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="subscription" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Subscription
                </TabsTrigger>
                <TabsTrigger value="usage" className="gap-2">
                  <BarChart className="h-4 w-4" />
                  Usage
                </TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Your account details and information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Account Created</p>
                      <p className="text-sm text-muted-foreground">
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subscription" className="space-y-6">
                <SubscriptionManagement
                  subscriptionStatus={profile?.subscription_status || ''}
                  subscriptionPlan={profile?.subscription_plan_name || ''}
                  subscriptionPeriodEnd={profile?.subscription_current_period_end || ''}
                />
              </TabsContent>

              <TabsContent value="usage" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{usageStats.totalCustomers}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Emails Generated</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{usageStats.totalEmails}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Last Upload</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">
                        {usageStats.lastUploadDate
                          ? new Date(usageStats.lastUploadDate).toLocaleDateString()
                          : 'No uploads yet'}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
