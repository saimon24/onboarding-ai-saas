'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Loader2, Users, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Define types for customer data
interface CustomerData {
  id: string;
  profile_id: string;
  email: string;
  survey_data: Record<string, any>;
  ai_email?: string;
  email_sent: boolean;
  created_at: string;
  updated_at: string;
}

export default function DataPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailFilter, setEmailFilter] = useState<'all' | 'sent' | 'not_sent'>('all');

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, emailFilter]);

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

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      let query = supabase.from('customer_data').select('*', { count: 'exact' });

      // Apply email sent filter
      if (emailFilter === 'sent') {
        query = query.eq('email_sent', true);
      } else if (emailFilter === 'not_sent') {
        query = query.eq('email_sent', false);
      }

      // Get total count
      const countQuery = query.select('*', { count: 'exact', head: true });
      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      setTotalCount(count || 0);

      // Get paginated data
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await query
        .select()
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setCustomers(data || []);

      if (data?.length === 0 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map((customer) => customer.id));
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]
    );
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      console.log('Attempting to delete customers:', selectedCustomers);

      // First verify we have the session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { error, data } = await supabase
        .from('customer_data')
        .delete()
        .in('id', selectedCustomers)
        .select(); // Add select to see what was deleted

      if (error) throw error;

      console.log('Delete response:', data);

      toast({
        title: 'Success',
        description: `Successfully deleted ${data?.length || 0} customers`,
      });

      setSelectedCustomers([]);
      // Reset to first page when deleting
      setCurrentPage(1);
      await fetchCustomers();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <DashboardLayout heading="Survey Data" subheading="View and manage all your survey responses">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              All Responses
            </CardTitle>
            <div className="flex items-center gap-4">
              <select
                className="px-2 py-1 rounded-md border bg-background"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value as typeof emailFilter)}>
                <option value="all">All Responses</option>
                <option value="sent">Email Sent</option>
                <option value="not_sent">Email Not Sent</option>
              </select>
              {selectedCustomers.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedCustomers.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center text-muted-foreground h-[300px] flex items-center justify-center">
              <p>No survey responses found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <div className="grid grid-cols-[40px_1fr_1fr_100px_100px] gap-4 p-4 font-medium border-b">
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectedCustomers.length === customers.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </div>
                  <div>Email</div>
                  <div>Date Added</div>
                  <div>Status</div>
                  <div className="text-right">Actions</div>
                </div>
                <div className="divide-y">
                  {customers.map((customer: any) => (
                    <div
                      key={customer.id}
                      className="grid grid-cols-[40px_1fr_1fr_100px_100px] gap-4 p-4 items-center hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/survey/${customer.id}`)}>
                      <div
                        className="flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCustomer(customer.id);
                        }}>
                        <Checkbox checked={selectedCustomers.includes(customer.id)} />
                      </div>
                      <div className="font-medium">{customer.email}</div>
                      <div className="text-muted-foreground">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        {customer.email_sent ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Not Sent
                          </span>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8">
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </nav>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedCustomers.length}{' '}
              selected customer(s) and their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
