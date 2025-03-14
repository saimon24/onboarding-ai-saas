import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json({ error: `Webhook signature verification failed` }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Get subscription details
        if (session.subscription && session.customer) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          const planName = subscription.metadata.planName || 'Unknown Plan';
          const userId = subscription.metadata.userId;

          if (userId) {
            // Update user's subscription status in the database
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                subscription_id: subscription.id,
                subscription_price_id: subscription.items.data[0].price.id,
                subscription_plan_name: planName,
                subscription_current_period_end: new Date(
                  subscription.current_period_end * 1000
                ).toISOString(),
              })
              .eq('id', userId);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find the user with this subscription
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('subscription_id', subscription.id);

        if (profiles && profiles.length > 0) {
          const userId = profiles[0].id;

          // Update subscription details
          await supabase
            .from('profiles')
            .update({
              subscription_status: subscription.status,
              subscription_price_id: subscription.items.data[0].price.id,
              subscription_current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find the user with this subscription
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('subscription_id', subscription.id);

        if (profiles && profiles.length > 0) {
          const userId = profiles[0].id;

          // Update subscription status to canceled
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'canceled',
              subscription_current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq('id', userId);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

          // Find the user with this subscription
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('subscription_id', subscription.id);

          if (profiles && profiles.length > 0) {
            const userId = profiles[0].id;

            // Update subscription period end date
            await supabase
              .from('profiles')
              .update({
                subscription_current_period_end: new Date(
                  subscription.current_period_end * 1000
                ).toISOString(),
              })
              .eq('id', userId);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

          // Find the user with this subscription
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('subscription_id', subscription.id);

          if (profiles && profiles.length > 0) {
            const userId = profiles[0].id;

            // Update subscription status to past_due
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', userId);

            // Here you could also send an email notification about the failed payment
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
  }
}
