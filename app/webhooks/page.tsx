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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, RefreshCw, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/dashboard-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WebhookConfig {
  provider: 'tally' | 'typeform' | 'other';
  field_mappings: Record<string, string>;
  test_event?: Record<string, any>;
}

interface Profile {
  id: string;
  webhook_id: string;
  webhook_config: WebhookConfig;
  webhook_last_received?: string;
}

interface ParsedField {
  path: string;
  label: string;
  type?: string;
  options?: Array<{ id: string; text: string }>;
}

export default function WebhooksPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regeneratingSecret, setRegeneratingSecret] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [provider, setProvider] = useState<'tally' | 'typeform' | 'other'>('tally');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldPath, setNewFieldPath] = useState('');
  const [testEventJson, setTestEventJson] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [exampleJson, setExampleJson] = useState('');
  const [parsedExample, setParsedExample] = useState<any>(null);
  const [parsedFields, setParsedFields] = useState<ParsedField[]>([]);
  const [selectedEmailField, setSelectedEmailField] = useState('');
  const [selectedSurveyFields, setSelectedSurveyFields] = useState<Record<string, string>>({});
  const [parsingError, setParsingError] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
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
        .select('id, webhook_id, webhook_config, webhook_last_received')
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
      setProvider(data.webhook_config?.provider || 'tally');
      try {
        // Parse and re-stringify to ensure proper formatting
        let testEvent = {};
        if (data.webhook_last_received) {
          try {
            // It might already be a JSON string or an object
            testEvent =
              typeof data.webhook_last_received === 'string'
                ? JSON.parse(data.webhook_last_received)
                : data.webhook_last_received;
          } catch (e) {
            // If it's not valid JSON, use as is
            testEvent = { data: data.webhook_last_received };
          }
        }
        setTestEventJson(JSON.stringify(testEvent, null, 2));
      } catch (e) {
        console.error('Error parsing webhook_last_received:', e);
        setTestEventJson('{}');
      }
      setWebhookUrl(`${window.location.origin}/api/webhooks/survey/${data.webhook_id}`);
      setLoading(false);
    };

    fetchProfile();
  }, [router, toast]);

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
    if (!profile || !selectedEmailField) {
      toast({
        title: 'Error',
        description: 'Please select an email field',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    const newMappings: Record<string, string> = {
      email: selectedEmailField,
    };

    // Add selected survey fields with their full paths
    Object.entries(selectedSurveyFields).forEach(([label, path]) => {
      newMappings[label] = path;
    });

    const updatedConfig = {
      provider,
      field_mappings: newMappings,
    };

    // Only update the webhook_config with the mappings and provider
    const { error: configError } = await supabase
      .from('profiles')
      .update({ webhook_config: updatedConfig })
      .eq('id', profile.id);

    if (configError) {
      console.error('Error saving field mappings:', configError);
      toast({
        title: 'Error',
        description: 'Failed to save field mappings',
        variant: 'destructive',
      });
      setSaving(false);
      return;
    }

    // If we have a parsed example and it's different from what's already saved, update it
    if (
      parsedExample &&
      JSON.stringify(parsedExample) !== JSON.stringify(profile.webhook_config?.test_event)
    ) {
      // Update the test event if needed, but keep it separate from the main config
      const { error: testEventError } = await supabase
        .from('profiles')
        .update({ webhook_last_received: JSON.stringify(parsedExample) })
        .eq('id', profile.id);

      if (testEventError) {
        console.error('Error saving test event:', testEventError);
        // Non-critical error, so just log it and continue
      }
    }

    setProfile({
      ...profile,
      webhook_config: updatedConfig,
      webhook_last_received: parsedExample
        ? JSON.stringify(parsedExample)
        : profile.webhook_last_received,
    });
    setFieldMappings(newMappings);
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
    setSelectedSurveyFields({});
  };

  const parseExampleJson = () => {
    try {
      const parsed = JSON.parse(exampleJson);
      setParsedExample(parsed);

      // Extract all possible fields based on the provider
      const fields: ParsedField[] = [];

      if (provider === 'typeform') {
        // Parse Typeform fields
        const answers = parsed.form_response?.answers || [];
        const definition = parsed.form_response?.definition || {};
        const definitionFields = definition.fields || [];

        answers.forEach((answer: any, index: number) => {
          const field = definitionFields.find((f: any) => f.id === answer.field.id);
          if (field) {
            fields.push({
              path: `form_response.answers[${index}]`,
              label: field.title,
              type: answer.type,
              options: field.choices?.map((choice: any) => ({
                id: choice.id,
                text: choice.label,
              })),
            });
          }
        });
      } else if (provider === 'tally') {
        // Original Tally format parsing
        if (parsed.data?.fields && Array.isArray(parsed.data.fields)) {
          const seenLabels = new Set<string>();

          parsed.data.fields.forEach((field: any, index: number) => {
            if (field.label && !field.label.includes('(')) {
              if (!seenLabels.has(field.label)) {
                seenLabels.add(field.label);
                fields.push({
                  path: `data.fields[${index}]`,
                  label: field.label,
                  type: field.type,
                  options: field.options,
                });
              }
            }
          });
        }
      } else {
        // For 'other' provider, try to intelligently parse the structure
        const findPotentialFields = (obj: any, path = ''): void => {
          if (!obj || typeof obj !== 'object') return;

          // Look for common field patterns
          if (
            obj.label ||
            obj.title ||
            obj.name ||
            (obj.type && (obj.value !== undefined || obj.answer !== undefined))
          ) {
            fields.push({
              path: path,
              label: obj.label || obj.title || obj.name || path,
              type: obj.type,
              options: obj.options || obj.choices,
            });
            return;
          }

          // Recursively search through objects and arrays
          Object.entries(obj).forEach(([key, value]) => {
            const newPath = path ? `${path}.${key}` : key;
            if (Array.isArray(value)) {
              value.forEach((item, index) => {
                findPotentialFields(item, `${newPath}[${index}]`);
              });
            } else if (typeof value === 'object') {
              findPotentialFields(value, newPath);
            }
          });
        };

        findPotentialFields(parsed);
      }

      setParsedFields(fields);
      setParsingError('');
      updatePreview();
    } catch (error) {
      console.error('Error parsing JSON:', error);
      setParsingError('Invalid JSON format');
      setParsedExample(null);
      setParsedFields([]);
      setPreviewData(null);
    }
  };

  const updatePreview = () => {
    if (!parsedExample) return;

    const preview: Record<string, any> = {
      email: '',
      survey_data: {},
    };

    // Helper function to get value from path for Typeform
    const getTypeformValue = (answer: any) => {
      switch (answer.type) {
        case 'choice':
          return answer.choice.label;
        case 'choices':
          return answer.choices.labels;
        case 'email':
          return answer.email;
        case 'text':
        case 'long_text':
          return answer.text;
        default:
          return answer[answer.type];
      }
    };

    // Helper to access nested properties using dot notation string
    const getNestedValue = (obj: any, pathString: string): any => {
      const parts = pathString.split('.');
      let value = obj;
      for (const part of parts) {
        if (!value) return undefined;
        if (part.includes('[') && part.includes(']')) {
          const arrayName = part.substring(0, part.indexOf('['));
          const index = parseInt(part.substring(part.indexOf('[') + 1, part.indexOf(']')));
          if (!value[arrayName] || index >= value[arrayName].length) return undefined;
          value = value[arrayName][index];
        } else {
          value = value[part];
        }
      }
      return value;
    };

    // Helper function to get value from path
    const getValueFromPath = (path: string) => {
      const fieldData = getNestedValue(parsedExample, path);
      if (!fieldData) return undefined;

      if (provider === 'typeform') {
        const answers = parsedExample.form_response?.answers || [];
        const answer = answers.find((a: any) => a.field?.id === fieldData.field?.id);
        return answer ? getTypeformValue(answer) : undefined;
      } else if (provider === 'tally') {
        // For Tally forms, handle the different field types properly
        switch (fieldData.type) {
          case 'MULTIPLE_CHOICE':
          case 'CHECKBOXES':
            // If the value is an array of IDs, map them to their text labels
            if (Array.isArray(fieldData.value) && fieldData.options) {
              return fieldData.value
                .map((optionId: string) => {
                  const option = fieldData.options.find((opt: any) => opt.id === optionId);
                  return option ? option.text : optionId;
                })
                .join(', ');
            }
            // If the value is boolean true/false (individual checkbox), return appropriate value
            else if (typeof fieldData.value === 'boolean') {
              return fieldData.value ? 'Yes' : 'No';
            }
            // Fallback
            return fieldData.value;

          case 'TEXTAREA':
          case 'TEXT_INPUT':
          case 'EMAIL':
          case 'HIDDEN_FIELDS':
          default:
            // For simple field types, just return the value directly
            return fieldData.value;
        }
      } else {
        // For 'other' provider, try to get the value intelligently
        return fieldData?.value || fieldData?.answer || fieldData;
      }
    };

    // Get email
    if (selectedEmailField) {
      preview.email = getValueFromPath(selectedEmailField);
    }

    // Get survey data
    Object.entries(selectedSurveyFields).forEach(([label, path]) => {
      if (!path) return;

      const field = parsedFields.find((f) => f.path === path);
      if (field) {
        preview.survey_data[field.label] = getValueFromPath(path);
      }
    });

    setPreviewData(preview);
  };

  return (
    <DashboardLayout
      heading="Webhook Configuration"
      subheading="Configure your webhook endpoint to receive survey responses.">
      <Card>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <Tabs defaultValue="setup">
              <TabsList>
                <TabsTrigger value="setup">Setup</TabsTrigger>
                <TabsTrigger value="configure">Configure</TabsTrigger>
                <TabsTrigger value="test">Test</TabsTrigger>
              </TabsList>

              <TabsContent value="setup">
                <div className="grid gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Provider</Label>
                      <div className="mt-1.5">
                        <Select
                          value={provider}
                          onValueChange={(value: 'tally' | 'typeform' | 'other') => {
                            setProvider(value);
                            // Clear any existing mappings when changing provider
                            setFieldMappings({});
                            setSelectedEmailField('');
                            setSelectedSurveyFields({});
                            setParsedFields([]);
                            setPreviewData(null);
                          }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tally">Tally</SelectItem>
                            <SelectItem value="typeform">Typeform</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        {provider === 'typeform'
                          ? 'Configure your Typeform webhook to send responses to this URL.'
                          : provider === 'tally'
                          ? 'Configure your Tally webhook to send responses to this URL.'
                          : "Configure your webhook to send survey responses to this URL. We'll help you map the fields."}
                      </p>
                    </div>

                    <div>
                      <Label>Your Webhook URL</Label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Input value={webhookUrl} readOnly />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleCopyToClipboard(webhookUrl, 'Webhook URL copied to clipboard')
                          }>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Webhook Security</Label>
                    <div className="text-sm text-muted-foreground">
                      Regenerate your webhook URL if you suspect it has been compromised.
                    </div>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        onClick={handleRegenerateSecret}
                        disabled={regeneratingSecret}>
                        {regeneratingSecret ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Regenerate URL
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="configure">
                <div className="grid gap-4">
                  {profile?.webhook_config?.field_mappings &&
                    Object.keys(profile.webhook_config.field_mappings).length > 0 && (
                      <div>
                        <Label>Current Field Mappings</Label>
                        <div className="mt-1.5 p-4 bg-muted rounded-lg space-y-2">
                          {Object.entries(profile.webhook_config.field_mappings).map(
                            ([field, path]) => (
                              <div key={field} className="flex items-center gap-2">
                                <Badge variant="outline">{field}</Badge>
                                <ArrowRight className="h-4 w-4" />
                                <code className="text-sm bg-background rounded px-2 py-1">
                                  {path}
                                </code>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  <div>
                    <Label>Example JSON Payload</Label>
                    <div className="mt-1.5 space-y-2">
                      <Textarea
                        value={exampleJson}
                        onChange={handleExampleJsonChange}
                        placeholder="Paste your JSON payload here..."
                        className="font-mono"
                        rows={10}
                      />
                      <Button onClick={parseExampleJson}>Parse JSON</Button>
                    </div>
                  </div>

                  {parsingError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{parsingError}</AlertDescription>
                    </Alert>
                  )}

                  {parsedFields.length > 0 && (
                    <div className="space-y-6">
                      <div>
                        <Label>Select Email Field</Label>
                        <Select
                          value={selectedEmailField}
                          onValueChange={(value) => {
                            setSelectedEmailField(value);
                            setTimeout(updatePreview, 0);
                          }}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select the field containing the email" />
                          </SelectTrigger>
                          <SelectContent>
                            {parsedFields.map((field) => (
                              <SelectItem key={field.path} value={field.path}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Map Survey Fields</Label>
                        <div className="mt-1.5 grid gap-4">
                          {parsedFields.map((field) => (
                            <div key={field.path} className="flex items-center gap-4">
                              <div className="flex-1">
                                <Input value={field.label} readOnly />
                              </div>
                              <ArrowRight className="h-4 w-4" />
                              <div className="flex-1">
                                <Select
                                  value={selectedSurveyFields[field.label] || ''}
                                  onValueChange={(value) => {
                                    setSelectedSurveyFields((prev) => ({
                                      ...prev,
                                      [field.label]: value,
                                    }));
                                    setTimeout(updatePreview, 0);
                                  }}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select field mapping" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {parsedFields.map((f) => (
                                      <SelectItem key={f.path} value={f.path}>
                                        {f.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {previewData && (
                        <div className="mt-6">
                          <Label>Data Preview</Label>
                          <div className="mt-1.5 p-4 bg-muted rounded-lg">
                            <pre className="whitespace-pre-wrap overflow-auto">
                              {JSON.stringify(previewData, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      <Button onClick={handleSaveFieldMappings} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Field Mappings'}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="test">
                <div className="grid gap-4">
                  <div>
                    <Label>Last Received Webhook Data</Label>
                    <Textarea
                      value={testEventJson}
                      readOnly
                      className="font-mono mt-1.5"
                      rows={20}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
