'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, RefreshCw, Trash2, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface CustomerData {
  id: string;
  email: string;
  survey_data: Record<string, any>;
  ai_email?: string;
  email_sent: boolean;
}

export default function CustomerClient({ customerData }: { customerData: CustomerData }) {
  const [customer, setCustomer] = useState<CustomerData>(customerData);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('customer_data').delete().eq('id', customer.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Survey entry deleted successfully',
      });

      // Force navigation
      window.location.href = '/dashboard/data';
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleEmailSent = async () => {
    try {
      const { error } = await supabase
        .from('customer_data')
        .update({ email_sent: !customer.email_sent })
        .eq('id', customer.id);

      if (error) throw error;

      setCustomer({ ...customer, email_sent: !customer.email_sent });
      toast({
        title: 'Success',
        description: `Email marked as ${!customer.email_sent ? 'sent' : 'not sent'}`,
      });

      // Force navigation
      window.location.href = '/dashboard/data';
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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
          <h1 className="text-3xl font-bold">Survey Details</h1>
          <p className="text-muted-foreground">View and manage survey response</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/data')}
            className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Data
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-2">
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete Entry
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Response Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">{customer.email}</p>
                </div>
                <Button
                  variant={customer.email_sent ? 'default' : 'outline'}
                  onClick={toggleEmailSent}
                  className="gap-2">
                  <Mail className="h-4 w-4" />
                  {customer.email_sent ? 'Email Sent' : 'Mark as Sent'}
                </Button>
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
