import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request, { params }: { params: { webhookId: string } }) {
  const webhookId = params.webhookId;
  console.log('🚀 ~ POST ~ webhookId:', webhookId);

  try {
    // Find the profile with this webhook ID
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, webhook_config')
      .eq('webhook_id', webhookId)
      .single();

    console.log('🚀 ~ POST ~ profiles:', profiles);
    if (profileError || !profiles) {
      console.log('🚀 ~ POST ~ profileError:', profileError);
      return NextResponse.json({ error: 'Invalid webhook ID' }, { status: 404 });
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

    console.log('🚀 ~ POST ~ fieldMappings:', fieldMappings);

    // Apply field mappings to transform the incoming data
    const surveyData: Record<string, any> = {};
    let email = '';

    // Helper function to get value from nested path
    const getValueFromPath = (obj: any, path: string) => {
      // Handle array paths like "data.fields[type=HIDDEN_FIELDS&label=email].value"
      if (path.includes('[') && path.includes(']')) {
        const [arrayPath, conditions] = path.split('[');
        const cleanConditions = conditions.replace(']', '');
        const conditionPairs = cleanConditions.split('&').map((c) => {
          const [key, value] = c.split('=');
          return { key, value };
        });

        // Get the array from the path
        const array = arrayPath.split('.').reduce((obj, key) => obj?.[key], obj);
        if (Array.isArray(array)) {
          // Find the matching item
          const item = array.find((item) =>
            conditionPairs.every((condition) => item[condition.key] === condition.value)
          );
          return item?.value;
        }
        return undefined;
      }

      // Regular nested path
      return path.split('.').reduce((obj, key) => obj?.[key], obj);
    };

    // Helper function to get field label from path
    const getFieldLabel = (obj: any, path: string): string | undefined => {
      // If it's a direct field reference like "data.fields[1]", get the label
      if (path.match(/data\.fields\[\d+\]/)) {
        const index = parseInt(path.match(/\[(\d+)\]/)?.[1] || '0');
        const fields = getValueFromPath(obj, 'data.fields');
        if (Array.isArray(fields) && fields[index]) {
          return fields[index].label;
        }
      }
      return undefined;
    };

    // Helper function to get field value from path
    const getFieldValue = (obj: any, path: string): any => {
      // If it's a direct field reference like "data.fields[1]", get the value
      if (path.match(/data\.fields\[\d+\]/)) {
        const index = parseInt(path.match(/\[(\d+)\]/)?.[1] || '0');
        const fields = getValueFromPath(obj, 'data.fields');
        if (Array.isArray(fields) && fields[index]) {
          return fields[index].value;
        }
      }
      // For paths with conditions like "data.fields[type=HIDDEN_FIELDS&label=email]"
      return getValueFromPath(obj, path);
    };

    // Map the fields according to the user's configuration
    for (const [targetField, sourcePath] of Object.entries(fieldMappings)) {
      if (sourcePath && typeof sourcePath === 'string') {
        if (targetField === 'email') {
          // For email field, use the standard path-based value
          email = getValueFromPath(body, sourcePath);
        } else {
          // For other fields, get both label and value
          const fieldLabel = getFieldLabel(body, sourcePath.replace('.value', ''));
          const fieldValue = getFieldValue(body, sourcePath);

          if (fieldLabel && fieldValue !== undefined) {
            // Use the actual field label as the key and the field value as the value
            surveyData[fieldLabel] = fieldValue;
          } else {
            // Fallback to the target field if no label is found
            surveyData[targetField] = fieldValue;
          }
        }
      }
    }

    // Ensure we have an email
    if (!email) {
      return NextResponse.json({ error: 'Email field mapping is required' }, { status: 400 });
    }

    console.log('🚀 ~ SAVE ~ surveyData:', surveyData);
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
