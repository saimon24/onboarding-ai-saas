import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request, { params }: { params: { webhookId: string } }) {
  const webhookId = params.webhookId;

  try {
    // Find the profile with this webhook ID
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, webhook_enabled, webhook_config')
      .eq('webhook_id', webhookId)
      .single();

    if (profileError || !profiles) {
      return NextResponse.json({ error: 'Invalid webhook ID' }, { status: 404 });
    }

    // Check if webhooks are enabled for this user
    if (!profiles.webhook_enabled) {
      return NextResponse.json({ error: 'Webhooks are disabled for this user' }, { status: 403 });
    }

    // Parse the request body
    const body = await req.json();

    // Get the field mappings from the webhook config
    const fieldMappings = profiles.webhook_config?.field_mappings || {};

    // If there are no field mappings yet, store this as a test event
    if (Object.keys(fieldMappings).length === 0) {
      // Update the profile with the test event data
      await supabase
        .from('profiles')
        .update({
          webhook_config: {
            ...profiles.webhook_config,
            test_event: body,
          },
          webhook_last_received: new Date().toISOString(),
        })
        .eq('id', profiles.id);

      return NextResponse.json({
        success: true,
        message: 'Test event received. Please configure field mappings in your webhook settings.',
      });
    }

    // Apply field mappings to transform the incoming data
    const surveyData: Record<string, any> = {};
    let email = '';

    // Map the fields according to the user's configuration
    for (const [targetField, sourceField] of Object.entries(fieldMappings)) {
      if (sourceField && typeof sourceField === 'string') {
        // Handle nested fields with dot notation (e.g., "response.email")
        const value = sourceField.split('.').reduce((obj, key) => obj?.[key], body);

        if (targetField === 'email' && value) {
          email = value;
        } else {
          surveyData[targetField] = value;
        }
      }
    }

    // Ensure we have an email
    if (!email) {
      return NextResponse.json({ error: 'Email field mapping is required' }, { status: 400 });
    }

    // Insert the customer data
    const { error: insertError } = await supabase.from('customer_data').insert({
      profile_id: profiles.id,
      email,
      survey_data: surveyData,
    });

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to insert customer data', details: insertError.message },
        { status: 500 }
      );
    }

    // Update the last received timestamp
    await supabase
      .from('profiles')
      .update({
        webhook_last_received: new Date().toISOString(),
      })
      .eq('id', profiles.id);

    return NextResponse.json({
      success: true,
      message: 'Survey data received and processed successfully',
    });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook', details: error.message },
      { status: 500 }
    );
  }
}
