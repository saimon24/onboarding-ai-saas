import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Helper function to get value from path for Typeform
const getTypeformValue = (answer: any) => {
  switch (answer.type) {
    case "choice":
      return answer.choice.label;
    case "choices":
      return answer.choices.labels;
    case "email":
      return answer.email;
    case "text":
    case "long_text":
      return answer.text;
    default:
      return answer[answer.type];
  }
};

// Helper function to get value from path
const getValueFromPath = (obj: any, path: string, provider: string) => {
  if (provider === "typeform") {
    const parts = path.split(".");
    const answerIndex = parseInt(
      parts[parts.length - 1].match(/\[(\d+)\]/)?.[1] || "0",
    );
    const answers = obj.form_response?.answers || [];
    const answer = answers[answerIndex];
    return answer ? getTypeformValue(answer) : undefined;
  }

  // Handle array paths like "data.fields[type=HIDDEN_FIELDS&label=email].value"
  if (path.includes("[") && path.includes("]")) {
    const [arrayPath, conditions] = path.split("[");
    const cleanConditions = conditions.replace("]", "");
    const conditionPairs = cleanConditions.split("&").map((c) => {
      const [key, value] = c.split("=");
      return { key, value };
    });

    // Get the array from the path
    const array = arrayPath.split(".").reduce((obj, key) => obj?.[key], obj);
    if (Array.isArray(array)) {
      // Find the matching item
      const item = array.find((item) =>
        conditionPairs.every((condition) =>
          item[condition.key] === condition.value
        )
      );
      return item?.value;
    }
    return undefined;
  }

  // Regular nested path
  return path.split(".").reduce((obj, key) => obj?.[key], obj);
};

// Helper function to get field label from path
const getFieldLabel = (
  obj: any,
  path: string,
  provider: string,
): string | undefined => {
  if (provider === "typeform") {
    const parts = path.split(".");
    const answerIndex = parseInt(
      parts[parts.length - 1].match(/\[(\d+)\]/)?.[1] || "0",
    );
    const answers = obj.form_response?.answers || [];
    const answer = answers[answerIndex];
    if (answer) {
      const field = obj.form_response?.definition?.fields?.find((f: any) =>
        f.id === answer.field.id
      );
      return field?.title;
    }
    return undefined;
  }

  // If it's a direct field reference like "data.fields[1]", get the label
  if (path.match(/data\.fields\[\d+\]/)) {
    const index = parseInt(path.match(/\[(\d+)\]/)?.[1] || "0");
    const fields = getValueFromPath(obj, "data.fields", provider);
    if (Array.isArray(fields) && fields[index]) {
      return fields[index].label;
    }
  }
  return undefined;
};

export async function POST(
  req: Request,
  { params }: { params: { webhookId: string } },
) {
  const webhookId = params.webhookId;

  try {
    // Find the profile with this webhook ID
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, webhook_config")
      .eq("webhook_id", webhookId)
      .single();

    if (profileError || !profiles) {
      return NextResponse.json({ error: "Invalid webhook ID" }, {
        status: 404,
      });
    }

    // Parse the request body
    const body = await req.json();

    // Get the field mappings and provider from the webhook config
    const fieldMappings = profiles.webhook_config?.field_mappings || {};
    const provider = profiles.webhook_config?.provider || "custom";

    // If there are no field mappings yet, store this as a test event
    if (Object.keys(fieldMappings).length === 0) {
      // Update the profile with the test event data
      await supabase
        .from("profiles")
        .update({
          webhook_config: {
            ...profiles.webhook_config,
            test_event: body,
          },
          webhook_last_received: new Date().toISOString(),
        })
        .eq("id", profiles.id);

      return NextResponse.json({
        success: true,
        message:
          "Test event received. Please configure field mappings in your webhook settings.",
      });
    }

    // Apply field mappings to transform the incoming data
    const surveyData: Record<string, any> = {};
    let email = "";

    // Map the fields according to the user's configuration
    for (const [targetField, sourcePath] of Object.entries(fieldMappings)) {
      if (sourcePath && typeof sourcePath === "string") {
        if (targetField === "email") {
          // For email field, use the standard path-based value
          email = getValueFromPath(body, sourcePath, provider);
        } else {
          // For other fields, get both label and value
          const fieldLabel = getFieldLabel(body, sourcePath, provider);
          const fieldValue = getValueFromPath(body, sourcePath, provider);

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
      return NextResponse.json({ error: "Email field mapping is required" }, {
        status: 400,
      });
    }

    // Insert the customer data
    const { error: insertError } = await supabase.from("customer_data").insert({
      profile_id: profiles.id,
      email,
      survey_data: surveyData,
    });

    if (insertError) {
      return NextResponse.json(
        {
          error: "Failed to insert customer data",
          details: insertError.message,
        },
        { status: 500 },
      );
    }

    // Get the email context from the profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("email_context")
      .eq("id", profiles.id)
      .single();

    // Generate email content
    try {
      const emailPrompt = {
        customerEmail: email,
        surveyData,
        context: profileData?.email_context || {
          tone: "professional and friendly",
          brandInfo: "",
          welcomeLine: "",
          endLine: "",
          systemContext: "",
          emailLength: "medium",
        },
      };

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/api/generate-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPrompt),
        },
      );

      if (!response.ok) throw new Error("Failed to generate email");

      const { email: generatedEmail, subject } = await response.json();

      // Update the customer data with the generated email
      await supabase
        .from("customer_data")
        .update({
          ai_email: generatedEmail,
          ai_subject: subject,
        })
        .eq("profile_id", profiles.id)
        .eq("email", email);
    } catch (error: any) {
      console.error("Error generating email:", error);
      // We don't want to fail the webhook if email generation fails
      // The user can always generate it manually later
    }

    // Update the last received timestamp
    await supabase
      .from("profiles")
      .update({
        webhook_last_received: new Date().toISOString(),
      })
      .eq("id", profiles.id);

    return NextResponse.json({
      success: true,
      message: "Survey data received and processed successfully",
    });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Error processing webhook", details: error.message },
      { status: 500 },
    );
  }
}
