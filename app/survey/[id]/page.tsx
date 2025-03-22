'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2, User, Mail, Wand2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';

interface CustomerData {
  id: string;
  profile_id: string;
  email: string;
  survey_data: Record<string, any>;
  ai_email?: string;
  ai_subject?: string;
  email_sent: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailContext {
  default_subject?: string;
  tone?: string;
  brand_info?: string;
  additional_instructions?: string;
  system_context?: string;
  welcome_line?: string;
  end_line?: string;
  email_length?: 'short' | 'medium' | 'long';
}

export default function SurveyPage({ params }: { params: { id: string } }) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [emailContext, setEmailContext] = useState<EmailContext>({});
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
    fetchCustomerData();
    fetchEmailContext();
  }, []);

  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }
    } catch (error: any) {
      console.error('Session check error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check user session',
        variant: 'destructive',
      });
    }
  };

  const fetchEmailContext = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('email_context')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (data && data.email_context) {
        setEmailContext(data.email_context);
      }
    } catch (error: any) {
      console.error('Error fetching email context:', error);
    }
  };

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
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

  const handleGenerateEmail = async () => {
    if (!customer) return;
    setGeneratingEmail(true);
    try {
      // Prepare the email generation request with context
      const emailPrompt = {
        customerEmail: customer.email,
        surveyData: customer.survey_data,
        context: {
          tone: emailContext.tone || 'professional and friendly',
          brandInfo: emailContext.brand_info || '',
          welcomeLine: emailContext.welcome_line,
          endLine: emailContext.end_line,
          systemContext: emailContext.system_context,
          emailLength: emailContext.email_length || 'medium',
        },
      };

      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPrompt),
      });

      if (!response.ok) throw new Error('Failed to generate email');

      const { email, subject } = await response.json();

      const { error } = await supabase
        .from('customer_data')
        .update({
          ai_email: email,
          ai_subject: subject,
        })
        .eq('id', customer.id);

      if (error) throw error;

      setCustomer({ ...customer, ai_email: email, ai_subject: subject });

      toast({
        title: 'Success',
        description: 'Email content generated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleOpenEmailClient = () => {
    if (!customer) return;

    // Use AI-generated subject if available, otherwise use a default
    const subject = customer.ai_subject || 'Follow-up on your survey response';

    // Convert HTML links to proper mailto format
    // Example: <a href="https://example.com">Click here</a> becomes [Click here](https://example.com)
    const bodyWithLinks =
      customer.ai_email?.replace(
        /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/g,
        (_, url, text) => `[${text}](${url})`
      ) || '';

    // Encode both subject and body for the mailto link
    const mailtoUrl = `mailto:${customer.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyWithLinks)}`;
    window.location.href = mailtoUrl;
  };

  const toggleEmailSent = async () => {
    if (!customer) return;
    try {
      const { error } = await supabase
        .from('customer_data')
        .update({ email_sent: !customer.email_sent })
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;

      setCustomer({ ...customer, email_sent: !customer.email_sent });
      toast({
        title: 'Success',
        description: `Email marked as ${!customer.email_sent ? 'sent' : 'not sent'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout
      heading="Survey Details"
      subheading="View detailed information about the survey response">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Responses
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Button
            className="w-full gap-2"
            variant="outline"
            onClick={handleOpenEmailClient}
            disabled={!customer?.ai_email}>
            <Mail className="h-4 w-4" />
            Pre-fill Email
          </Button>
          <Button
            className="w-full gap-2"
            variant={customer?.email_sent ? 'default' : 'outline'}
            onClick={toggleEmailSent}>
            <Mail className="h-4 w-4" />
            {customer?.email_sent ? 'Marked as Sent' : 'Mark as Sent'}
          </Button>
          <Button
            className="w-full gap-2"
            variant="outline"
            onClick={handleGenerateEmail}
            disabled={generatingEmail}>
            {generatingEmail ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                {customer?.ai_email ? 'Regenerate Email' : 'Generate Email'}
              </>
            )}
          </Button>
          <Button
            className="w-full gap-2"
            variant="destructive"
            onClick={() => {
              if (
                confirm(
                  'Are you sure you want to delete this survey response? This action cannot be undone.'
                )
              ) {
                const deleteEntry = async () => {
                  try {
                    const { error } = await supabase
                      .from('customer_data')
                      .delete()
                      .eq('id', customer?.id);

                    if (error) throw error;

                    toast({
                      title: 'Success',
                      description: 'Survey response deleted successfully',
                    });
                    router.push('/data');
                  } catch (error: any) {
                    toast({
                      title: 'Error',
                      description: error.message,
                      variant: 'destructive',
                    });
                  }
                };
                deleteEntry();
              }
            }}>
            <Trash2 className="h-4 w-4" />
            Delete Entry
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Response Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : customer ? (
              <div className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-muted-foreground">{customer.email}</div>
                  </div>
                  <div>
                    <div className="font-medium">Received At</div>
                    <div className="text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString()}{' '}
                      {new Date(customer.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">Survey Data</div>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(customer.survey_data, null, 2)}
                  </pre>
                </div>

                <div className="space-y-4">
                  <div className="font-medium">Email Content</div>
                  {customer.ai_email ? (
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="font-medium mb-2">Subject</div>
                        <div className="text-muted-foreground">
                          {customer.ai_subject || 'No subject generated yet'}
                        </div>
                      </div>
                      <div
                        className="bg-muted p-4 rounded-lg prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: customer.ai_email.replace(/\n/g, '<br>'),
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground p-4 bg-muted rounded-lg">
                      No email content generated yet
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">Customer not found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
