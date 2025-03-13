'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailContext, setEmailContext] = useState({
    tone: 'professional and friendly',
    brand_info: '',
    additional_instructions: '',
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
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

      if (data?.email_context) {
        setEmailContext(data.email_context);
      }
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

  const saveEmailContext = async () => {
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      // Validate the email context before saving
      const validatedContext = {
        tone: emailContext.tone || 'professional and friendly',
        brand_info: emailContext.brand_info || '',
        additional_instructions: emailContext.additional_instructions || '',
      };

      const { error } = await supabase
        .from('profiles')
        .update({ email_context: validatedContext })
        .eq('id', session.user.id);

      if (error) throw error;

      // Update the local state with validated values
      setEmailContext(validatedContext);

      toast({
        title: 'Success',
        description: 'Email settings saved successfully',
      });
    } catch (error: any) {
      console.error('Error saving email context:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEmailContext((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Customize your email generation preferences</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Email Generation Settings</CardTitle>
            <CardDescription>Customize how AI generates emails for your customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tone">Email Tone</Label>
              <Input
                id="tone"
                value={emailContext.tone}
                onChange={(e) => handleInputChange('tone', e.target.value)}
                placeholder="e.g., professional and friendly, casual, formal"
                className="max-w-md"
              />
              <p className="text-sm text-muted-foreground">
                Describe the tone you want your emails to have
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand_info">Brand Information</Label>
              <Textarea
                id="brand_info"
                value={emailContext.brand_info}
                onChange={(e) => handleInputChange('brand_info', e.target.value)}
                placeholder="e.g., Company name, values, mission statement"
                rows={4}
                className="max-w-2xl"
              />
              <p className="text-sm text-muted-foreground">
                Provide information about your brand that should be reflected in emails
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_instructions">Additional Instructions</Label>
              <Textarea
                id="additional_instructions"
                value={emailContext.additional_instructions}
                onChange={(e) => handleInputChange('additional_instructions', e.target.value)}
                placeholder="e.g., Always mention our 24/7 support, Include a link to our knowledge base"
                rows={4}
                className="max-w-2xl"
              />
              <p className="text-sm text-muted-foreground">
                Any specific instructions for how emails should be structured or what they should
                include
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={saveEmailContext} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
