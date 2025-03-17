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
      setTestEventJson(JSON.stringify(data.webhook_config?.test_event || {}, null, 2));
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
      ...profile.webhook_config,
      field_mappings: newMappings,
      test_event: parsedExample || profile.webhook_config?.test_event,
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

      // Extract all possible fields
      const fields: ParsedField[] = [];

      // Helper function to get field options
      const getFieldOptions = (field: any) => {
        if (field.type === 'MULTIPLE_CHOICE' || field.type === 'CHECKBOXES') {
          return field.options;
        }
        return undefined;
      };

      // Process fields array
      if (parsed.data?.fields && Array.isArray(parsed.data.fields)) {
        const seenLabels = new Set<string>();

        parsed.data.fields.forEach((field: any, index: number) => {
          // Skip fields that are individual checkbox options (they have the same base label)
          if (field.label && !field.label.includes('(')) {
            // Check if we've already processed this field (for checkboxes/multiple choice)
            if (!seenLabels.has(field.label)) {
              seenLabels.add(field.label);
              fields.push({
                path: `data.fields[${index}]`,
                label: field.label,
                type: field.type,
                options: getFieldOptions(field),
              });
            }
          }
        });
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

    // Helper function to get value from path
    const getValueFromPath = (path: string) => {
      const parts = path.split('.');
      let value = parsedExample;
      for (const part of parts) {
        if (part.includes('[') && part.includes(']')) {
          const arrayName = part.split('[')[0];
          const index = parseInt(part.split('[')[1].split(']')[0]);
          value = value[arrayName][index];
        } else {
          value = value[part];
        }
      }
      return value;
    };

    // Get email
    if (selectedEmailField) {
      preview.email = getValueFromPath(`${selectedEmailField}.value`);
    }

    // Get survey data
    Object.entries(selectedSurveyFields).forEach(([label, path]) => {
      if (!path) return; // Skip empty mappings

      const field = parsedFields.find((f) => f.path === path);
      if (field) {
        const rawValue = getValueFromPath(`${path}.value`);

        // Handle multiple choice and checkbox fields
        if (field.type === 'MULTIPLE_CHOICE' && field.options && Array.isArray(rawValue)) {
          const selectedOption = field.options.find((opt) => rawValue.includes(opt.id));
          preview.survey_data[label] = selectedOption?.text || '';
        } else if (field.type === 'CHECKBOXES' && field.options && Array.isArray(rawValue)) {
          const selectedOptions = field.options
            .filter((opt) => rawValue.includes(opt.id))
            .map((opt) => opt.text);
          preview.survey_data[label] = selectedOptions.length ? selectedOptions : [];
        } else {
          preview.survey_data[label] = rawValue || '';
        }
      }
    });

    console.log('Preview data:', preview); // Add logging to debug
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
                <div className="grid gap-4">
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

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Webhook Security</Label>
                      <div className="text-sm text-muted-foreground">
                        Regenerate your webhook URL if you suspect it has been compromised.
                      </div>
                    </div>
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
