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
import { DashboardNav } from '@/components/dashboard-nav';

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
  const [exampleJson, setExampleJson] = useState('');
  const [parsedExample, setParsedExample] = useState<any>(null);
  const [parsedFields, setParsedFields] = useState<string[]>([]);
  const [selectedEmailField, setSelectedEmailField] = useState('');
  const [selectedSurveyFields, setSelectedSurveyFields] = useState<string[]>([]);
  const [parsingError, setParsingError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const sampleJson = JSON.stringify(
    {
      response: {
        email: 'customer@example.com',
        name: 'John Doe',
        company: 'Acme Inc',
        role: 'Product Manager',
        answers: {
          question1: 'I need help with onboarding',
          question2: 'Our team size is 10-50 people',
        },
      },
    },
    null,
    2
  );

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
      test_event: profile.webhook_config?.test_event || parsedExample || undefined,
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

  const handleExampleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExampleJson(e.target.value);
    setParsingError('');
    setParsedExample(null);
    setParsedFields([]);
    setSelectedEmailField('');
    setSelectedSurveyFields([]);
  };

  const parseExampleJson = () => {
    try {
      if (!exampleJson.trim()) {
        setParsingError('Please enter JSON data');
        return;
      }

      const parsed = JSON.parse(exampleJson);
      setParsedExample(parsed);

      // Extract all possible fields with dot notation
      const fields: string[] = [];

      const extractFields = (obj: any, prefix = '') => {
        if (!obj || typeof obj !== 'object') return;

        Object.entries(obj).forEach(([key, value]) => {
          const path = prefix ? `${prefix}.${key}` : key;

          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
          ) {
            fields.push(path);
          } else if (Array.isArray(value)) {
            // Handle arrays
            if (value.length > 0) {
              if (typeof value[0] === 'object' && value[0] !== null) {
                extractFields(value[0], `${path}[0]`);
              } else {
                fields.push(`${path}[0]`);
              }
            }
          } else if (value && typeof value === 'object') {
            extractFields(value, path);
          }
        });
      };

      extractFields(parsed);
      setParsedFields(fields);
      setParsingError('');

      toast({
        title: 'Success',
        description: 'JSON parsed successfully',
      });
    } catch (error) {
      console.error('Error parsing JSON:', error);
      setParsingError('Invalid JSON format');
      setParsedExample(null);
      setParsedFields([]);
    }
  };

  const toggleSurveyField = (field: string) => {
    setSelectedSurveyFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const applyFieldMappings = async () => {
    if (!profile) return;

    if (!selectedEmailField) {
      toast({
        title: 'Error',
        description: 'Please select an email field',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    // Create field mappings
    const newMappings: Record<string, string> = {
      email: selectedEmailField,
    };

    // Add survey data fields
    if (selectedSurveyFields.length > 0) {
      selectedSurveyFields.forEach((field) => {
        const fieldName = field.split('.').pop() || field;
        newMappings[`survey_data.${fieldName}`] = field;
      });
    }

    // Update local state
    setFieldMappings(newMappings);

    // Save to database
    const updatedConfig = {
      ...profile.webhook_config,
      field_mappings: newMappings,
      test_event: parsedExample,
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

    // Update profile state
    setProfile({
      ...profile,
      webhook_config: updatedConfig,
    });

    // Update test event JSON display
    setTestEventJson(JSON.stringify(parsedExample, null, 2));

    toast({
      title: 'Success',
      description: 'Field mappings created and saved',
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
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex flex-col w-64 border-r p-6">
        <DashboardNav />
      </div>
      <div className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Webhooks</h1>
              <p className="text-muted-foreground">
                Configure webhooks to automatically import customer data
              </p>
            </div>
          </div>

          <Tabs defaultValue="setup" className="space-y-6">
            <TabsList className="grid grid-cols-4 md:grid-cols-5 gap-2">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="example">Example</TabsTrigger>
              <TabsTrigger value="test-event">Test Event</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
            </TabsList>

            <TabsContent value="setup">
              <Card>
                <CardHeader>
                  <CardTitle>Webhook Status</CardTitle>
                  <CardDescription>Enable or disable your webhook endpoint</CardDescription>
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
            </TabsContent>

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
                          Send a test webhook to see your data structure and configure field
                          mappings.
                        </AlertDescription>
                      </Alert>
                    )}

                  {profile?.webhook_config?.test_event &&
                    Object.keys(fieldMappings).length === 0 && (
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
                      OnboardAI account. Each user has a unique webhook URL that can be used with
                      any survey platform.
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
                          Configure a SurveyMonkey webhook to send responses to your webhook URL.
                          Map "data.responses[0].email" to the email field.
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

            <TabsContent value="example">
              <Card>
                <CardHeader>
                  <CardTitle>Example Webhook</CardTitle>
                  <CardDescription>
                    Paste an example webhook JSON to create field mappings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="example-json">Example JSON</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Paste a sample webhook payload to analyze its structure
                      </p>
                      <Textarea
                        id="example-json"
                        value={exampleJson}
                        onChange={handleExampleJsonChange}
                        className="mt-1.5 h-40 font-mono text-sm"
                        placeholder='{"response": {"email": "customer@example.com", "name": "John Doe", "answers": {"question1": "Answer 1"}}}'
                      />
                      {parsingError && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{parsingError}</AlertDescription>
                        </Alert>
                      )}
                      <Button onClick={parseExampleJson} className="mt-2">
                        Parse JSON
                      </Button>
                      <Button
                        variant="outline"
                        className="mt-2 ml-2"
                        onClick={() => {
                          setExampleJson(sampleJson);
                          setParsingError('');
                        }}>
                        Load Sample
                      </Button>
                    </div>

                    {parsedExample && (
                      <>
                        <div className="border-t pt-6">
                          <h3 className="text-lg font-semibold mb-4">Select Fields</h3>

                          <div className="mb-6">
                            <Label className="text-base">Email Field (required)</Label>
                            <p className="text-sm text-muted-foreground mb-2">
                              Select the field that contains the customer's email address
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              {parsedFields.map((field) => (
                                <div key={field} className="flex items-center space-x-2">
                                  <Button
                                    variant={selectedEmailField === field ? 'default' : 'outline'}
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => setSelectedEmailField(field)}>
                                    <span className="font-mono text-xs">{field}</span>
                                    {selectedEmailField === field && (
                                      <CheckCircle2 className="ml-auto h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mb-6">
                            <Label className="text-base">Survey Data Fields</Label>
                            <p className="text-sm text-muted-foreground mb-2">
                              Select fields to include in the survey data
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              {parsedFields.map((field) => (
                                <div key={field} className="flex items-center space-x-2">
                                  <Button
                                    variant={
                                      selectedSurveyFields.includes(field) ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => toggleSurveyField(field)}>
                                    <span className="font-mono text-xs">{field}</span>
                                    {selectedSurveyFields.includes(field) && (
                                      <CheckCircle2 className="ml-auto h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {(selectedEmailField || selectedSurveyFields.length > 0) && (
                            <div className="mb-6 p-4 border rounded-md bg-muted">
                              <h4 className="font-medium mb-2">Field Mapping Summary</h4>

                              {selectedEmailField && (
                                <div className="mb-2">
                                  <span className="text-sm font-medium">Email Field:</span>
                                  <Badge variant="secondary" className="ml-2 font-mono">
                                    {selectedEmailField}
                                  </Badge>
                                </div>
                              )}

                              {selectedSurveyFields.length > 0 && (
                                <div>
                                  <span className="text-sm font-medium">Survey Data Fields:</span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedSurveyFields.map((field) => (
                                      <Badge
                                        key={field}
                                        variant="outline"
                                        className="font-mono text-xs">
                                        {field}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <Button
                            onClick={applyFieldMappings}
                            disabled={!selectedEmailField || saving}
                            className="w-full">
                            {saving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Apply Field Mappings'
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
