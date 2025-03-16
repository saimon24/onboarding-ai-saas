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
import { DashboardNav } from '@/components/dashboard-nav';

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
      const parsed = JSON.parse(exampleJson);
      setParsedExample(parsed);

      // Extract all possible fields
      const fields: string[] = [];
      const extractFields = (obj: any, prefix = '') => {
        if (Array.isArray(obj)) {
          // For arrays, we want to support field selection by conditions
          // Example: data.fields[type=HIDDEN_FIELDS&label=email].value
          obj.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              // If the array item has type and label fields, create a conditional path
              if (item.type && item.label) {
                fields.push(`${prefix}[type=${item.type}&label=${item.label}].value`);
              }
              // Also add regular array access
              extractFields(item, `${prefix}[${index}]`);
            }
          });
        } else if (typeof obj === 'object' && obj !== null) {
          Object.entries(obj).forEach(([key, value]) => {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null) {
              extractFields(value, newPrefix);
            } else {
              fields.push(newPrefix);
            }
          });
        }
      };

      extractFields(parsed);
      setParsedFields(fields);
      setParsingError('');
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
    if (!selectedEmailField) {
      toast({
        title: 'Error',
        description: 'Please select an email field',
        variant: 'destructive',
      });
      return;
    }

    const newMappings: Record<string, string> = {
      email: selectedEmailField,
    };

    // Add selected survey fields with their full paths
    selectedSurveyFields.forEach((field) => {
      // Use the field path as both key and value
      newMappings[field] = field;
    });

    setFieldMappings(newMappings);
    toast({
      title: 'Success',
      description: 'Field mappings applied',
    });
  };

  return (
    <div className="container mx-auto py-10">
      <DashboardNav />
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>
              Configure your webhook endpoint to receive survey responses.
            </CardDescription>
          </CardHeader>
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
                      <div className="space-y-4">
                        <div>
                          <Label>Select Email Field</Label>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {parsedFields.map((field) => (
                              <Badge
                                key={field}
                                variant={selectedEmailField === field ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setSelectedEmailField(field)}>
                                {field}
                                {selectedEmailField === field && (
                                  <CheckCircle2 className="ml-1 h-3 w-3" />
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label>Select Survey Fields</Label>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {parsedFields.map((field) => (
                              <Badge
                                key={field}
                                variant={
                                  selectedSurveyFields.includes(field) ? 'default' : 'outline'
                                }
                                className="cursor-pointer"
                                onClick={() => toggleSurveyField(field)}>
                                {field}
                                {selectedSurveyFields.includes(field) && (
                                  <CheckCircle2 className="ml-1 h-3 w-3" />
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button onClick={applyFieldMappings}>
                          Apply Field Mappings
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <Label>Current Field Mappings</Label>
                        <div className="mt-1.5 space-y-2">
                          {Object.entries(fieldMappings).map(([field, path]) => (
                            <div key={field} className="flex items-center gap-2">
                              <Input value={field} readOnly />
                              <ArrowRight className="h-4 w-4" />
                              <Input value={path} readOnly />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFieldMapping(field)}>
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label>Field Name</Label>
                          <Input
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            placeholder="e.g., company_name"
                          />
                        </div>
                        <div className="flex-1">
                          <Label>JSON Path</Label>
                          <Input
                            value={newFieldPath}
                            onChange={(e) => setNewFieldPath(e.target.value)}
                            placeholder="e.g., data.fields[0].value"
                          />
                        </div>
                        <Button onClick={handleAddFieldMapping}>Add Field</Button>
                      </div>

                      <Button onClick={handleSaveFieldMappings} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Field Mappings'}
                      </Button>
                    </div>
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
      </div>
    </div>
  );
}
