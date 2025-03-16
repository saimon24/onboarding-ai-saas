'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
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

export default function DataPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage]);

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

      // Get total count
      const { count, error: countError } = await supabase
        .from('customer_data')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Get paginated data
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('customer_data')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <DashboardLayout heading="Customer Data" subheading="View and manage all your customer data">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            All Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center text-muted-foreground h-[300px] flex items-center justify-center">
              <p>No customer data uploaded yet</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <div className="grid grid-cols-3 gap-4 p-4 font-medium border-b">
                  <div>Email</div>
                  <div>Date Added</div>
                  <div className="text-right">Actions</div>
                </div>
                <div className="divide-y">
                  {customers.map((customer: any) => (
                    <div key={customer.id} className="grid grid-cols-3 gap-4 p-4 items-center">
                      <div className="font-medium">{customer.email}</div>
                      <div className="text-muted-foreground">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/customer/${customer.id}`)}
                          className="gap-1">
                          View Details
                          <ChevronRight className="h-4 w-4" />
                        </Button>
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
    </DashboardLayout>
  );
}
