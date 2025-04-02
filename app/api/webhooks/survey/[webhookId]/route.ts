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
  console.log(`Getting value from path: ${path} for provider: ${provider}`);
  console.log("Path parts:", path.split("."));

  if (provider === "typeform") {
    const parts = path.split(".");
    const answerIndex = parseInt(
      parts[parts.length - 1].match(/\[(\d+)\]/)?.[1] || "0",
    );
    const answers = obj.form_response?.answers || [];
    const answer = answers[answerIndex];
    return answer ? getTypeformValue(answer) : undefined;
  } else if (provider === "tally") {
    // For Tally, handle array references like "data.fields[0]"
    if (path.match(/data\.fields\[\d+\]/)) {
      const index = parseInt(path.match(/\[(\d+)\]/)?.[1] || "0");
      console.log(`Tally field index: ${index}`);

      // Get the fields array
      const fields = obj.data?.fields;
      console.log(`Fields array length: ${fields?.length || 0}`);

      if (Array.isArray(fields) && fields[index]) {
        const field = fields[index];
        console.log(`Field at index ${index}:`, field);

        // Handle different field types
        switch (field.type) {
          case "MULTIPLE_CHOICE":
          case "CHECKBOXES":
            console.log(`Processing ${field.type} field`);
            // For multiple choice and checkboxes, convert IDs to text values
            if (Array.isArray(field.value) && field.options) {
              const result = field.value.map((optionId: string) => {
                const option = field.options.find((opt: any) =>
                  opt.id === optionId
                );
                const text = option ? option.text : optionId;
                console.log(`Mapped option ${optionId} to text: ${text}`);
                return text;
              }).join(", ");
              console.log(`Final mapped result: ${result}`);
              return result;
            } // Handle boolean checkbox values
            else if (typeof field.value === "boolean") {
              console.log(`Boolean value: ${field.value}`);
              return field.value ? "Yes" : "No";
            }
            // Fallback
            console.log(`Using fallback value: ${field.value}`);
            return field.value;

          case "TEXTAREA":
          case "TEXT_INPUT":
          case "EMAIL":
          case "HIDDEN_FIELDS":
          default:
            console.log(`Simple field value: ${field.value}`);
            // For simple field types, just return the value
            return field.value;
        }
      } else {
        console.log("Field not found at the specified index");
      }
    } else {
      console.log("Path does not match expected Tally field pattern");
    }
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
  try {
    const result = path.split(".").reduce((obj, key) => obj?.[key], obj);
    console.log(`Regular path result: ${result}`);
    return result;
  } catch (e) {
    console.error(`Error getting value from path ${path}:`, e);
    return undefined;
  }
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
            provider,
          },
          webhook_last_received: JSON.stringify(body),
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

    console.log("Processing webhook with provider:", provider);
    console.log("Field mappings:", fieldMappings);

    // Map the fields according to the user's configuration
    for (const [targetField, sourcePath] of Object.entries(fieldMappings)) {
      if (sourcePath && typeof sourcePath === "string") {
        console.log(
          `Processing field mapping: ${targetField} -> ${sourcePath}`,
        );

        if (targetField === "email") {
          // For email field, use the standard path-based value
          email = getValueFromPath(body, sourcePath, provider);
          console.log(`Extracted email: ${email}`);
        } else {
          // For other fields, get the field value using the proper path
          const fieldValue = getValueFromPath(body, sourcePath, provider);
          console.log(`Extracted value for ${targetField}: ${fieldValue}`);

          // Always use the target field (from the mapping) as the key
          // This ensures we use the labels from the form configuration
          surveyData[targetField] = fieldValue;
        }
      }
    }

    // Ensure we have an email
    if (!email) {
      console.log("Email field mapping is missing or invalid");
      return NextResponse.json({ error: "Email field mapping is required" }, {
        status: 400,
      });
    }

    console.log("Final survey data:", surveyData);

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

    // Update the last received timestamp and data
    try {
      await supabase
        .from("profiles")
        .update({
          webhook_last_received: JSON.stringify(body),
        })
        .eq("id", profiles.id);
      console.log("Successfully updated webhook_last_received");
    } catch (error) {
      console.error("Error updating webhook_last_received:", error);
    }

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
