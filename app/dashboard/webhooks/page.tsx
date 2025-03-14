'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Copy, RefreshCw, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface WebhookConfig {
  field_mappings: Record<string, string>;
  test_event?: Record<string, any>;
}

interface Profile {
  id: string;
  webhook_id: string;
  webhook_enabled: boolean;
  webhook_config: WebhookConfig;
  webhook_last_received?: string;
}

export default function WebhooksPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regeneratingSecret, setRegeneratingSecret] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldPath, setNewFieldPath] = useState('');
  const [testEventJson, setTestEventJson] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/signin');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, webhook_id, webhook_enabled, webhook_config, webhook_last_received')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load webhook settings',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      setProfile(data);
      setFieldMappings(data.webhook_config?.field_mappings || {});
      setTestEventJson(JSON.stringify(data.webhook_config?.test_event || {}, null, 2));
      setWebhookUrl(`${window.location.origin}/api/webhooks/survey/${data.webhook_id}`);
      setLoading(false);
    };

    fetchProfile();
  }, [router, toast]);

  const handleToggleWebhook = async (enabled: boolean) => {
    if (!profile) return;

    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ webhook_enabled: enabled })
      .eq('id', profile.id);

    if (error) {
      console.error('Error updating webhook status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update webhook status',
        variant: 'destructive',
      });
      setSaving(false);
      return;
    }

    setProfile({ ...profile, webhook_enabled: enabled });
    toast({
      title: 'Success',
      description: `Webhooks ${enabled ? 'enabled' : 'disabled'} successfully`,
    });

    setSaving(false);
  };

  const handleRegenerateSecret = async () => {
    if (!profile) return;

    setRegeneratingSecret(true);

    // Generate a new webhook ID
    const { error } = await supabase
      .from('profiles')
      .update({ webhook_id: supabase.rpc('gen_random_uuid') })
      .eq('id', profile.id);

    if (error) {
      console.error('Error regenerating webhook ID:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate webhook URL',
        variant: 'destructive',
      });
      setRegeneratingSecret(false);
      return;
    }

    // Fetch the updated profile
    const { data } = await supabase
      .from('profiles')
      .select('webhook_id')
      .eq('id', profile.id)
      .single();

    if (data) {
      setProfile({ ...profile, webhook_id: data.webhook_id });
      setWebhookUrl(`${window.location.origin}/api/webhooks/survey/${data.webhook_id}`);
    }

    toast({
      title: 'Success',
      description: 'Webhook URL regenerated successfully',
    });

    setRegeneratingSecret(false);
  };

  const handleCopyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: message,
    });
  };

  const handleAddFieldMapping = () => {
    if (!newFieldName || !newFieldPath) return;

    const updatedMappings = { ...fieldMappings, [newFieldName]: newFieldPath };
    setFieldMappings(updatedMappings);
    setNewFieldName('');
    setNewFieldPath('');
  };

  const handleRemoveFieldMapping = (field: string) => {
    const updatedMappings = { ...fieldMappings };
    delete updatedMappings[field];
    setFieldMappings(updatedMappings);
  };

  const handleSaveFieldMappings = async () => {
    if (!profile) return;

    setSaving(true);

    const updatedConfig = {
      ...profile.webhook_config,
      field_mappings: fieldMappings,
    };

    const { error } = await supabase
      .from('profiles')
      .update({ webhook_config: updatedConfig })
      .eq('id', profile.id);

    if (error) {
      console.error('Error saving field mappings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save field mappings',
        variant: 'destructive',
      });
      setSaving(false);
      return;
    }

    setProfile({ ...profile, webhook_config: updatedConfig });
    toast({
      title: 'Success',
      description: 'Field mappings saved successfully',
    });

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Webhook Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure webhooks to automatically import survey data from external sources
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Webhook Status</CardTitle>
                <CardDescription>Enable or disable your webhook endpoint</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={profile?.webhook_enabled || false}
                  onCheckedChange={handleToggleWebhook}
                  disabled={saving}
                />
                <span>{profile?.webhook_enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {profile?.webhook_last_received && (
              <div className="mb-4">
                <Badge variant="outline" className="text-xs">
                  Last received: {new Date(profile.webhook_last_received).toLocaleString()}
                </Badge>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">Your Webhook URL</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Use this URL in your survey tool to automatically send data to OnboardAI
                </p>
                <div className="flex mt-1.5">
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-2"
                    onClick={() =>
                      handleCopyToClipboard(webhookUrl, 'Webhook URL copied to clipboard')
                    }>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="configuration">
          <TabsList className="mb-4">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="test-event">Test Event</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="configuration">
            <Card>
              <CardHeader>
                <CardTitle>Field Mappings</CardTitle>
                <CardDescription>
                  Map fields from your survey data to our system. The email field is required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(fieldMappings).length === 0 &&
                  !profile?.webhook_config?.test_event && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No test event received</AlertTitle>
                      <AlertDescription>
                        Send a test webhook to see your data structure and configure field mappings.
                      </AlertDescription>
                    </Alert>
                  )}

                {profile?.webhook_config?.test_event && Object.keys(fieldMappings).length === 0 && (
                  <Alert className="mb-4">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Test event received</AlertTitle>
                    <AlertDescription>
                      Configure your field mappings below based on the test event data.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  {Object.entries(fieldMappings).map(([field, path]) => (
                    <div key={field} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <Label>{field}</Label>
                        <Input value={path} readOnly className="mt-1.5 font-mono text-sm" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-6"
                        onClick={() => handleRemoveFieldMapping(field)}>
                        Remove
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <Label htmlFor="new-field-name">Field Name</Label>
                      <Input
                        id="new-field-name"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        className="mt-1.5"
                        placeholder="e.g. email"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="new-field-path">JSON Path</Label>
                      <Input
                        id="new-field-path"
                        value={newFieldPath}
                        onChange={(e) => setNewFieldPath(e.target.value)}
                        className="mt-1.5 font-mono text-sm"
                        placeholder="e.g. response.email"
                      />
                    </div>
                    <Button onClick={handleAddFieldMapping}>Add</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveFieldMappings} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Mappings'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="test-event">
            <Card>
              <CardHeader>
                <CardTitle>Test Event Data</CardTitle>
                <CardDescription>
                  This is the data structure of your most recent test webhook event
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!profile?.webhook_config?.test_event ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No test event received</AlertTitle>
                    <AlertDescription>
                      Send a test webhook to see your data structure here.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Textarea value={testEventJson} readOnly className="font-mono text-sm h-96" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentation">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Documentation</CardTitle>
                <CardDescription>
                  Learn how to integrate your survey platform with our webhook API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Overview</h3>
                  <p>
                    Our webhook API allows you to automatically send survey responses to your
                    OnboardAI account. Each user has a unique webhook URL that can be used with any
                    survey platform.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Request Format</h3>
                  <p className="mb-2">
                    Send a POST request to your webhook URL with your survey data as JSON:
                  </p>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code>{`POST ${webhookUrl}
Content-Type: application/json

{
  "response": {
    "email": "customer@example.com",
    "name": "John Doe",
    "answers": {
      "question1": "Answer 1",
      "question2": "Answer 2"
    }
  }
}`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Field Mappings</h3>
                  <p>
                    After sending a test event, configure field mappings to tell our system how to
                    interpret your data. Use dot notation to access nested fields (e.g.,
                    "response.email").
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Integration Examples</h3>
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-medium">Typeform</h4>
                      <p>
                        Set up a Typeform webhook to send responses to your webhook URL. Map
                        "form_response.answers[0].email" to the email field.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Google Forms</h4>
                      <p>
                        Use Google Apps Script to send form responses to your webhook URL. Map
                        "responses.emailAddress" to the email field.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">SurveyMonkey</h4>
                      <p>
                        Configure a SurveyMonkey webhook to send responses to your webhook URL. Map
                        "data.responses[0].email" to the email field.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('mailto:simon@galaxies.dev', '_blank')}>
                  Need help with integration? Contact Support{' '}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
