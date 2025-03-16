'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface CustomerData {
  id: string;
  email: string;
  survey_data: Record<string, any>;
  ai_email?: string;
}

export default function CustomerClient({ customerData }: { customerData: CustomerData }) {
  const [customer, setCustomer] = useState<CustomerData>(customerData);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const generateEmail = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyData: customer.survey_data,
          customerId: customer.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate email');

      const { email } = await response.json();

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
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Customer Details</h1>
          <p className="text-muted-foreground">View and manage customer information</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/data')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Data
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground">{customer.email}</p>
              </div>
              <div>
                <p className="font-medium">Survey Responses</p>
                <div className="mt-2 space-y-2">
                  {Object.entries(customer.survey_data).map(
                    ([key, value]: [string, any]) =>
                      key !== 'email' && (
                        <div key={key} className="bg-muted p-3 rounded-lg">
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI-Generated Email</CardTitle>
              <Button onClick={generateEmail} disabled={generating} className="gap-2">
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
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
              <p className="text-center py-8 text-muted-foreground">
                No email generated yet. Click the button above to generate one.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
