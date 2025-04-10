'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, FileSpreadsheet, Mail, Loader2, ExternalLink, Webhook } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { CSVMappingModal } from '@/components/csv-mapping-modal';
import { DashboardLayout } from '@/components/dashboard-layout';

// Define types for customer data
interface CustomerData {
  id: string;
  profile_id: string;
  email: string;
  survey_data: Record<string, any>;
  ai_email?: string;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkSessionAndProfile();
  }, []);

  const checkSessionAndProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // If profile doesn't exist or there was an error fetching it, create a new one
      if ((!profile || profileError) && session.user.id) {
        try {
          const { error: insertError } = await supabase.from('profiles').insert({
            id: session.user.id,
            email: session.user.email,
            email_context: {
              tone: 'professional and friendly',
              brand_info: '',
              additional_instructions: '',
            },
          });

          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
        } catch (createError) {
          console.error('Error creating profile:', createError);
        }
      }

      // Check for checkout success query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const checkoutStatus = urlParams.get('checkout');

      if (checkoutStatus === 'success') {
        toast({
          title: 'Success!',
          description: 'Your subscription has been processed successfully.',
        });

        // Remove the query parameter from the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }

      fetchRecentCustomers();
    } catch (error: any) {
      console.error('Session/profile check error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check user session',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const fetchRecentCustomers = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('customer_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setCustomers(data || []);
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

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      Papa.parse(file, {
        header: true,
        preview: 1,
        complete: (results) => {
          if (results.errors.length > 0) {
            throw new Error('Error parsing CSV file');
          }
          setCsvHeaders(Object.keys(results.data[0]));
          setCsvFile(file);
          setShowMappingModal(true);
        },
        error: (error) => {
          throw new Error(error.message);
        },
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleStartImport = async (mapping: Record<string, string>) => {
    if (!csvFile) return;
    setUploading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      Papa.parse(csvFile, {
        header: true,
        complete: async (results) => {
          const { data, errors } = results;
          if (errors.length > 0) throw new Error('Error parsing CSV file');

          const importErrors: Array<{ row: number; error: string }> = [];
          let successCount = 0;

          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
              // Get email from mapping
              const email = row[mapping.email];
              if (!email) {
                throw new Error('Email is required');
              }

              // Build survey data from selected mappings
              const surveyData: Record<string, any> = {};
              Object.entries(mapping).forEach(([field, csvHeader]) => {
                if (csvHeader && field !== 'email') {
                  surveyData[field] = row[csvHeader];
                }
              });

              const { error } = await supabase.from('customer_data').insert({
                profile_id: session.user.id,
                email: email,
                survey_data: surveyData,
              });

              if (error) throw error;
              successCount++;
            } catch (error: any) {
              importErrors.push({
                row: i + 2, // Add 2 to account for 1-based indexing and header row
                error: error.message,
              });
            }
          }

          // Show import results
          if (importErrors.length > 0) {
            toast({
              title: 'Import Completed with Errors',
              description: `${successCount} records imported successfully. ${importErrors.length} errors occurred.`,
              variant: 'default',
              duration: 5000,
            });
          } else {
            toast({
              title: 'Success',
              description: `${successCount} records imported successfully`,
            });
          }

          setShowMappingModal(false);
          fetchRecentCustomers();
        },
        error: (error) => {
          throw new Error(error.message);
        },
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <DashboardLayout heading="Dashboard" subheading="Manage your customer onboarding data">
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload Customer Data
            </CardTitle>
            <CardDescription>
              Import your customer data from a CSV file to generate personalized onboarding emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary hover:bg-primary/5'
                }`}>
              <input {...getInputProps()} />
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <p>Uploading...</p>
                </div>
              ) : (
                <div>
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p>Drag & drop a CSV file here, or click to select one</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-primary" />
              Set Up Webhooks
            </CardTitle>
            <CardDescription>
              Connect your existing systems to automatically import customer data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[180px] text-center">
              <Mail className="w-12 h-12 mb-4 text-muted-foreground" />
              <p className="mb-4">Automatically import customer data from your existing systems</p>
              <Button onClick={() => router.push('/webhooks')} className="gap-2">
                Configure Webhooks
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[180px]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center text-muted-foreground h-[180px] flex items-center justify-center">
              <p>No customer data uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customers.map((customer: any) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium">{customer.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {customers.length > 0 && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={() => router.push('/data')} className="gap-2">
                    View All Customers
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CSVMappingModal
        isOpen={showMappingModal}
        onClose={() => setShowMappingModal(false)}
        csvHeaders={csvHeaders}
        onStartImport={handleStartImport}
      />
    </DashboardLayout>
  );
}
