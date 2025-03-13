'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, RefreshCw, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface CustomerDetailsClientProps {
  params: { id: string };
  initialData?: any;
}

export default function CustomerDetailsClient({ params, initialData }: CustomerDetailsClientProps) {
  const [customer, setCustomer] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!initialData) {
      fetchCustomerData();
    }
  }, [params.id, initialData]);

  const fetchCustomerData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      const { data, error } = await supabase
        .from('customer_data')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setCustomer(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateEmail = async () => {
    setGenerating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      if (!customer || !customer.survey_data) {
        throw new Error('Customer data is missing or incomplete');
      }

      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyData: customer.survey_data,
          customerId: customer.id,
          userId: session.user.id,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to generate email');
      }

      const { email } = responseData;
      if (!email) {
        throw new Error('No email was generated');
      }

      const { error } = await supabase
        .from('customer_data')
        .update({ ai_email: email })
        .eq('id', customer.id);

      if (error) throw error;

      setCustomer({ ...customer, ai_email: email });

      toast({
        title: 'Success',
        description: 'Email generated successfully',
      });
    } catch (error: any) {
      console.error('Error generating email:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Customer not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="font-medium">Email</label>
                  <p className="text-muted-foreground">{customer.email}</p>
                </div>
                <div>
                  <label className="font-medium">Survey Responses</label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(customer.survey_data).map(
                      ([key, value]: [string, any]) =>
                        key !== 'email' && (
                          <div key={key} className="bg-muted/50 p-3 rounded-lg">
                            <p className="font-medium">{key}</p>
                            <p className="text-muted-foreground">{value}</p>
                          </div>
                        )
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>AI-Generated Email</CardTitle>
                <Button onClick={generateEmail} disabled={generating} className="gap-2">
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      {customer.ai_email ? 'Regenerate' : 'Generate'} Email
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customer.ai_email ? (
                <div className="prose dark:prose-invert max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: customer.ai_email.replace(/\n/g, '<br>') }}
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8 border border-dashed rounded-lg">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No email generated yet. Click the button above to generate one.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
