import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import CustomerClient from './client';
import { DashboardLayout } from '@/components/dashboard-layout';

export const dynamic = 'force-dynamic';

async function getCustomerData(id: string) {
  const supabase = createServerComponentClient({ cookies });

  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    return null;
  }

  const { data, error } = await supabase.from('customer_data').select('*').eq('id', id).single();

  if (error || !data) {
    console.error('Error fetching customer:', error);
    return null;
  }

  return data;
}

export default async function CustomerPage({ params }: { params: { id: string } }) {
  const customerData = await getCustomerData(params.id);

  if (!customerData) {
    notFound();
  }

  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }>
        <CustomerClient customerData={customerData} />
      </Suspense>
    </DashboardLayout>
  );
}
