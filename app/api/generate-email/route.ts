import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define email length options
type EmailLength = 'short' | 'medium' | 'long';

interface EmailContext {
  tone: string;
  brand_info: string;
  additional_instructions: string;
  system_context?: string;
  welcome_line?: string;
  end_line?: string;
  pre_content_block?: string;
  post_content_block?: string;
  email_length?: EmailLength;
}

export async function POST(request: Request) {
  try {
    const { customerEmail, surveyData, context } = await request.json();

    // Construct the system message
    const systemMessage = `You are an expert email writer with the following characteristics:
${context.systemContext || ''}
Your task is to write a personalized email based on survey data.
Tone: ${context.tone}
${context.brandInfo ? `Brand Information: ${context.brandInfo}` : ''}
Length: ${context.emailLength} (short: 2-3 sentences, medium: 4-6 sentences, long: 7-10 sentences)
Important: Do not include any greeting or salutation at the start of the email body as it will be added separately.`;

    // Construct the user message
    const userMessage = `Write a personalized email for ${customerEmail} based on their survey responses:
${JSON.stringify(surveyData, null, 2)}

Generate both a subject line and email body that references their specific survey responses.
Make it personal and engaging.
Do not include any greeting - the greeting will be handled separately.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the response to extract subject and email body
    let subject = '';
    let email = '';

    // The AI should return the response in a format like:
    // Subject: The subject line
    // Body: The email content
    const parts = response.split('\n');
    for (let i = 0; i < parts.length; i++) {
      const line = parts[i];
      if (line.toLowerCase().startsWith('subject:')) {
        subject = line.substring('subject:'.length).trim();
      } else if (line.toLowerCase().startsWith('body:')) {
        email = parts
          .slice(i + 1)
          .join('\n')
          .trim();
        break;
      }
    }

    // If parsing fails, use some fallbacks
    if (!subject) {
      subject = 'Welcome to our community!';
    }
    if (!email) {
      email = response; // Use the entire response as email body
    }

    // Add welcome line if provided, otherwise leave as is
    if (context.welcomeLine) {
      email = `${context.welcomeLine}\n\n${email.trim()}`;
    }

    // Add end line if provided
    if (context.endLine) {
      email = `${email}\n\n${context.endLine}`;
    }

    return NextResponse.json({ email, subject });
  } catch (error: any) {
    console.error('Email generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate email' },
      { status: 500 }
    );
  }
}
