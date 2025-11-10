import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend_api_key = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
const RESEND_TEST_RECIPIENT = Deno.env.get("RESEND_TEST_RECIPIENT");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationNotificationRequest {
  applicationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId }: ApplicationNotificationRequest = await req.json();
    
    console.log(`Processing notification for application: ${applicationId}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch application details with job and freelancer info
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        *,
        jobs (
          title,
          description,
          required_skills,
          recruiter_id,
          pay_per_hour
        ),
        profiles!applications_freelancer_id_fkey (
          full_name,
          email
        )
      `)
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("Error fetching application:", appError);
      throw new Error("Application not found");
    }

    // Fetch recruiter details
    const { data: recruiter, error: recruiterError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", application.jobs.recruiter_id)
      .single();

    if (recruiterError || !recruiter) {
      console.error("Error fetching recruiter:", recruiterError);
      throw new Error("Recruiter not found");
    }

    const jobTitle = application.jobs.title;
    const freelancerName = application.profiles.full_name || "A freelancer";
    const freelancerEmail = application.profiles.email;
    
    console.log(`Sending notification to recruiter: ${recruiter.email} for job: ${jobTitle}`);

    // Prepare email content
    const subject = `🎯 New Application for ${jobTitle}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .job-title { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 15px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .label { font-weight: bold; color: #555; }
            .value { margin-bottom: 10px; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Application Received!</h1>
            </div>
            <div class="content">
              <p>Hi ${recruiter.full_name || "there"},</p>
              
              <p>You've received a new application for your job posting:</p>
              
              <div class="job-title">${jobTitle}</div>
              
              <div class="info-box">
                <div class="value"><span class="label">👤 Applicant:</span> ${freelancerName}</div>
                <div class="value"><span class="label">📧 Email:</span> ${freelancerEmail}</div>
                <div class="value"><span class="label">📅 Applied:</span> ${new Date(application.applied_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
                ${application.cover_letter ? `
                  <div class="value">
                    <span class="label">📝 Cover Letter:</span>
                    <p style="margin-top: 10px; padding: 15px; background: #f5f5f5; border-radius: 5px; font-style: italic;">
                      ${application.cover_letter}
                    </p>
                  </div>
                ` : ''}
              </div>
              
              <p><strong>⏰ What's Next?</strong></p>
              <ul>
                <li>Review the candidate's profile and resume in your dashboard</li>
                <li>Check their skills match: ${application.jobs.required_skills.join(', ')}</li>
                <li>Accept or reject the application</li>
                <li>Contact the freelancer if accepted</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="https://tssbfvquiwjlvhehvxpe.supabase.co" class="cta-button">
                  Review Application →
                </a>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from SkillConnect</p>
                <p>Please do not reply to this email</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const fromEmail = RESEND_FROM_EMAIL || "SkillConnect <onboarding@resend.dev>";
    
    let toEmail = recruiter.email;
    let finalHtml = htmlContent;
    
    // If using sandbox mode, redirect to test recipient
    if (fromEmail.includes("onboarding@resend.dev") && RESEND_TEST_RECIPIENT) {
      toEmail = RESEND_TEST_RECIPIENT;
      finalHtml = `
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <strong>🧪 Sandbox Mode</strong><br>
          Originally intended for: ${recruiter.email}
        </div>
        ${htmlContent}
      `;
    }

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resend_api_key}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        html: finalHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log("Notification email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
