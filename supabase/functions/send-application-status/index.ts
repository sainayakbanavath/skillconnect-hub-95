import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const resend_api_key = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
const RESEND_TEST_RECIPIENT = Deno.env.get("RESEND_TEST_RECIPIENT");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApplicationStatusRequest {
  freelancerEmail: string;
  freelancerName: string;
  jobTitle: string;
  status: "accepted" | "rejected";
  companyName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      freelancerEmail, 
      freelancerName, 
      jobTitle, 
      status,
      companyName = "SkillConnect"
    }: ApplicationStatusRequest = await req.json();

    console.log(`Sending ${status} email to ${freelancerEmail} for job: ${jobTitle}`);

    const isAccepted = status === "accepted";
    const subject = isAccepted 
      ? `🎉 Your application for ${jobTitle} has been accepted!`
      : `Update on your application for ${jobTitle}`;

    const html = isAccepted
      ? `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .job-title { font-size: 20px; font-weight: bold; color: #667eea; margin: 15px 0; }
              .section { margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #667eea; }
              .section-title { font-weight: bold; color: #667eea; margin-bottom: 10px; }
              .next-steps { list-style: none; padding: 0; }
              .next-steps li { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .next-steps li:last-child { border-bottom: none; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Congratulations!</h1>
              </div>
              <div class="content">
                <p>Hi ${freelancerName},</p>
                <p>Great news! Your application has been <strong>accepted</strong> for the following position:</p>
                <div class="job-title">${jobTitle}</div>
                
                <div class="section">
                  <div class="section-title">📋 Next Steps:</div>
                  <ul class="next-steps">
                    <li><strong>1. Check your SkillConnect dashboard</strong> - The recruiter may have additional details for you</li>
                    <li><strong>2. Prepare for contact</strong> - The recruiter will reach out to you directly with next steps</li>
                    <li><strong>3. Review the project details</strong> - Familiarize yourself with the job requirements and deliverables</li>
                    <li><strong>4. Be responsive</strong> - Reply promptly to any communication from the recruiter</li>
                  </ul>
                </div>

                <div class="section">
                  <div class="section-title">💡 Pro Tips:</div>
                  <p>• Have your portfolio and relevant work samples ready to share</p>
                  <p>• Prepare questions about the project scope and timeline</p>
                  <p>• Be ready to discuss your availability and rate</p>
                </div>

                <p style="margin-top: 20px;">We're excited to see you succeed! The recruiter will be in touch soon with the next steps.</p>
                
                <p>Best of luck,<br><strong>The ${companyName} Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated message from ${companyName}. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .job-title { font-size: 20px; font-weight: bold; color: #6b7280; margin: 15px 0; }
              .section { margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #6b7280; }
              .section-title { font-weight: bold; color: #6b7280; margin-bottom: 10px; }
              .next-steps { list-style: none; padding: 0; }
              .next-steps li { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .next-steps li:last-child { border-bottom: none; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Application Update</h1>
              </div>
              <div class="content">
                <p>Hi ${freelancerName},</p>
                <p>Thank you for your interest in the following position:</p>
                <div class="job-title">${jobTitle}</div>
                
                <p>After careful consideration, we've decided to move forward with other candidates whose experience more closely matches our current needs.</p>

                <div class="section">
                  <div class="section-title">🚀 What's Next:</div>
                  <ul class="next-steps">
                    <li><strong>Keep applying</strong> - There are many more opportunities on ${companyName}</li>
                    <li><strong>Update your profile</strong> - Make sure your skills and portfolio are up to date</li>
                    <li><strong>Expand your skillset</strong> - Consider adding new skills that are in high demand</li>
                    <li><strong>Stay active</strong> - New jobs are posted every day</li>
                  </ul>
                </div>

                <div class="section">
                  <div class="section-title">💡 Improve Your Applications:</div>
                  <p>• Tailor your profile to match job requirements</p>
                  <p>• Showcase relevant projects in your portfolio</p>
                  <p>• Highlight your unique value proposition</p>
                  <p>• Write compelling cover letters when applying</p>
                </div>

                <p style="margin-top: 20px;">We appreciate your interest and wish you the best in your freelance journey!</p>
                
                <p>Best regards,<br><strong>The ${companyName} Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated message from ${companyName}. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `;

// Determine sender and recipient with sandbox fallback
const fromEmail = RESEND_FROM_EMAIL ?? "SkillConnect <onboarding@resend.dev>";
const usingOnboarding = fromEmail.includes("onboarding@resend.dev");
const recipient = usingOnboarding && RESEND_TEST_RECIPIENT ? RESEND_TEST_RECIPIENT : freelancerEmail;
const htmlToSend = usingOnboarding && RESEND_TEST_RECIPIENT && recipient !== freelancerEmail
  ? `${html}<p style="color:#6b7280;font-size:12px;margin-top:16px;">[Sandbox mode] Originally intended for: ${freelancerEmail}</p>`
  : html;

// Helper to send email
const sendEmail = async (from: string, to: string, subj: string, htmlBody: string) => {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resend_api_key}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: subj,
      html: htmlBody,
    }),
  });
  let data: any = null;
  try { data = await resp.json(); } catch { data = null; }
  return { resp, data } as const;
};

// Retry on 429 and fallback on unverified domain (403)
const sendWithRetry = async (from: string, to: string, subj: string, htmlBody: string) => {
  let attempt = 0;
  let lastData: any = null;
  while (attempt < 3) {
    const { resp, data } = await sendEmail(from, to, subj, htmlBody);
    lastData = data;
    if (resp.ok) {
      return { data, sent_to: to, from, sandbox: to !== freelancerEmail };
    }

    if (resp.status === 429) {
      const delay = 500 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
      continue;
    }

    const message = String(data?.message || data?.error?.message || "").toLowerCase();
    if (resp.status === 403 && message.includes("domain is not verified")) {
      const fallbackFrom = "SkillConnect <onboarding@resend.dev>";
      const fallbackTo = RESEND_TEST_RECIPIENT || to;
      const fallbackHtml = RESEND_TEST_RECIPIENT && fallbackTo !== to
        ? `${htmlBody}<p style=\"color:#6b7280;font-size:12px;margin-top:16px;\">[Sandbox mode] Originally intended for: ${to}</p>`
        : htmlBody;
      const { resp: fResp, data: fData } = await sendEmail(fallbackFrom, fallbackTo, subj, fallbackHtml);
      if (fResp.ok) {
        return { data: fData, sent_to: fallbackTo, from: fallbackFrom, sandbox: fallbackTo !== freelancerEmail };
      }
      throw new Error(`Resend API error: ${JSON.stringify(fData)}`);
    }

    // Non-retryable errors
    throw new Error(`Resend API error: ${JSON.stringify(data)}`);
  }
  throw new Error(`Resend API error: rate_limit_exceeded after retries: ${JSON.stringify(lastData)}`);
};

const result = await sendWithRetry(fromEmail, recipient, subject, htmlToSend);

console.log("Email sent successfully:", result.data);

return new Response(
  JSON.stringify({ success: true, emailData: result.data, sent_to: result.sent_to, from: result.from, sandbox: result.sandbox }),
  {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  }
);
  } catch (error: any) {
    console.error("Error in send-application-status function:", error);
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
