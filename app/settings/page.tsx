'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { DashboardNav } from '@/components/dashboard-nav';

type EmailLength = 'short' | 'medium' | 'long';

interface EmailContext {
  tone: string;
  brand_info: string;
  additional_instructions: string;
  system_context?: string;
  welcome_line?: string;
  end_line?: string;
  pre_content_block?: string;
  post_content_block?: string;
  email_length?: EmailLength;
  default_subject?: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailContext, setEmailContext] = useState<EmailContext>({
    tone: '',
    brand_info: '',
    additional_instructions: '',
    system_context: '',
    welcome_line: '',
    end_line: '',
    pre_content_block: '',
    post_content_block: '',
    email_length: 'medium',
    default_subject: '',
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkSessionAndFetchSettings();
  }, []);

  const checkSessionAndFetchSettings = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }

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
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          email_context: emailContext,
        })
        .eq('id', session.user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Email settings saved successfully',
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
              <h1 className="text-3xl font-bold">Email Settings</h1>
              <p className="text-muted-foreground">
                Customize how AI-generated emails are created for your customers
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Email Generation Settings</CardTitle>
                <CardDescription>
                  Configure how AI generates personalized onboarding emails for your customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="system-context">AI Personality</Label>
                  <Textarea
                    id="system-context"
                    value={emailContext.system_context}
                    onChange={(e) =>
                      setEmailContext({ ...emailContext, system_context: e.target.value })
                    }
                    placeholder="e.g. You act like Simon Grimm, a popular YouTuber with great knowledge about React Native"
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Define a specific personality or context for the AI to use when writing emails
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Email Tone</Label>
                  <Input
                    id="tone"
                    value={emailContext.tone}
                    onChange={(e) => setEmailContext({ ...emailContext, tone: e.target.value })}
                    placeholder="e.g. professional and friendly"
                  />
                  <p className="text-sm text-muted-foreground">
                    Describe the tone you want for your emails (e.g., professional, casual,
                    friendly)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-length">Email Length</Label>
                  <Select
                    value={emailContext.email_length}
                    onValueChange={(value: EmailLength) =>
                      setEmailContext({ ...emailContext, email_length: value })
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select email length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Choose the preferred length for your generated emails
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-line">Welcome Line</Label>
                  <Input
                    id="welcome-line"
                    value={emailContext.welcome_line}
                    onChange={(e) =>
                      setEmailContext({ ...emailContext, welcome_line: e.target.value })
                    }
                    placeholder="e.g. Hey there, fellow developer! 👋"
                  />
                  <p className="text-sm text-muted-foreground">
                    Specify a custom welcome line for your emails
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-line">End Line</Label>
                  <Input
                    id="end-line"
                    value={emailContext.end_line}
                    onChange={(e) => setEmailContext({ ...emailContext, end_line: e.target.value })}
                    placeholder="e.g. Keep coding awesome stuff! 🚀"
                  />
                  <p className="text-sm text-muted-foreground">
                    Specify a custom ending line for your emails
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand-info">Brand Information</Label>
                  <Textarea
                    id="brand-info"
                    value={emailContext.brand_info}
                    onChange={(e) =>
                      setEmailContext({ ...emailContext, brand_info: e.target.value })
                    }
                    placeholder="Describe your company, products, and services"
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Provide information about your company, products, and services
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pre-content">Pre-Content Block</Label>
                  <Textarea
                    id="pre-content"
                    value={emailContext.pre_content_block}
                    onChange={(e) =>
                      setEmailContext({ ...emailContext, pre_content_block: e.target.value })
                    }
                    placeholder="Text to include at the start of every email"
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Add text that should appear at the beginning of every email
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post-content">Post-Content Block</Label>
                  <Textarea
                    id="post-content"
                    value={emailContext.post_content_block}
                    onChange={(e) =>
                      setEmailContext({ ...emailContext, post_content_block: e.target.value })
                    }
                    placeholder="Text to include at the end of every email"
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Add text that should appear at the end of every email
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional-instructions">Additional Instructions</Label>
                  <Textarea
                    id="additional-instructions"
                    value={emailContext.additional_instructions}
                    onChange={(e) =>
                      setEmailContext({
                        ...emailContext,
                        additional_instructions: e.target.value,
                      })
                    }
                    placeholder="Any specific instructions for email generation"
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Any specific instructions or preferences for email generation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-subject">Default Email Subject (Optional)</Label>
                  <Input
                    id="default-subject"
                    value={emailContext.default_subject}
                    onChange={(e) =>
                      setEmailContext({ ...emailContext, default_subject: e.target.value })
                    }
                    placeholder="Leave empty to use AI-generated subjects (recommended)"
                  />
                  <p className="text-sm text-muted-foreground">
                    Override AI-generated subjects with a fixed subject line. Leave empty to let AI
                    generate contextual subjects based on the email content (recommended).
                  </p>
                </div>

                <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
