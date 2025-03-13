import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // Parse request body with error handling
    const body = await req.json().catch(() => ({}));
    const { surveyData, customerId, userId } = body;

    // Validate required parameters
    if (!surveyData) {
      return NextResponse.json({ error: 'Survey data is required' }, { status: 400 });
    }

    // Default email context in case we can't fetch the profile
    let emailContext = {
      tone: 'professional and friendly',
      brand_info: '',
      additional_instructions: '',
    };

    // Only try to fetch profile if userId is provided
    if (userId) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email_context')
          .eq('id', userId)
          .single();

        if (!profileError && profileData?.email_context) {
          emailContext = profileData.email_context;
        }
      } catch (profileFetchError) {
        console.error('Error fetching profile:', profileFetchError);
        // Continue with default email context
      }
    }

    // Build the prompt with the email context
    const prompt = `
      Generate a ${
        emailContext.tone
      } onboarding email for a customer based on their survey responses.
      The email should be personalized and reference their specific responses.
      
      ${emailContext.brand_info ? `Brand information: ${emailContext.brand_info}` : ''}
      
      Survey responses:
      ${Object.entries(surveyData)
        .filter(([key]) => key !== 'email')
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')}
      
      Please write an email that:
      1. Welcomes them personally
      2. References their specific needs/responses
      3. Provides next steps
      4. Maintains a ${emailContext.tone} tone
      ${emailContext.additional_instructions ? `5. ${emailContext.additional_instructions}` : ''}
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional customer success manager writing an onboarding email. ${emailContext.additional_instructions}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const generatedEmail = completion.choices[0].message.content;

    // Store the generated email in the database if customerId is provided
    if (customerId) {
      try {
        const { error: updateError } = await supabase
          .from('customer_data')
          .update({ ai_email: generatedEmail })
          .eq('id', customerId);

        if (updateError) {
          console.error('Failed to save generated email:', updateError);
          // Continue anyway - we'll return the email even if saving fails
        }
      } catch (updateError) {
        console.error('Error updating customer data:', updateError);
        // Continue anyway - we'll return the email even if saving fails
      }
    }

    return NextResponse.json({ email: generatedEmail });
  } catch (error: any) {
    console.error('Error in generate-email API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
