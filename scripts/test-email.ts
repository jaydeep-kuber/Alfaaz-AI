import { config } from "dotenv";
config({ path: ".env" });

import { sendEmail } from "../src/lib/email";
import { env } from "../src/lib/env";

/**
 * AUTH-1 Email Test Script
 * Exercises the shared email-sending module (src/lib/email) using SMTP_* env vars.
 */
async function main() {
  const testRecipient = process.env.TEST_EMAIL_RECIPIENT || "writer@qalam.local";
  const subject = "Qalam AUTH-1 SMTP Test";
  const timestamp = new Date().toISOString();
  const textBody = `This is a verification email for Qalam AUTH-1 scaffold and local infrastructure.\n\nDispatched at: ${timestamp}\nTarget Recipient: ${testRecipient}\nSMTP Endpoint: ${env.SMTP_HOST}:${env.SMTP_PORT}\nSender: ${env.SMTP_FROM}`;
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; background: #fff8f5; color: #1f1b17; border-radius: 8px;">
      <h2 style="color: #293343; margin-top: 0;">Qalam &mdash; AUTH-1 SMTP Test</h2>
      <p>This verification email confirms that the centralized SMTP sending module is operational and configured properly.</p>
      <div style="background: #ffffff; padding: 16px; border: 1px solid #c5c6cc; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Subject:</strong> ${subject}</p>
        <p style="margin: 4px 0;"><strong>Recipient:</strong> ${testRecipient}</p>
        <p style="margin: 4px 0;"><strong>Sender:</strong> ${env.SMTP_FROM}</p>
        <p style="margin: 4px 0;"><strong>Dispatched:</strong> ${timestamp}</p>
        <p style="margin: 4px 0;"><strong>Host:</strong> ${env.SMTP_HOST}:${env.SMTP_PORT}</p>
      </div>
      <p style="font-size: 13px; color: #675d52;">Inspect this message in the local Mailpit web interface at <a href="http://localhost:8025" style="color: #293343;">http://localhost:8025</a>.</p>
    </div>
  `;

  console.log(`[Email Test] Dispatching test email to "${testRecipient}" via SMTP ${env.SMTP_HOST}:${env.SMTP_PORT}...`);

  try {
    const result = await sendEmail({
      to: testRecipient,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log("[Email Test] ✓ Test email dispatched successfully!");
    console.log(`[Email Test]   Message ID: ${result.messageId}`);
    console.log(`[Email Test]   Accepted: ${result.accepted.join(", ")}`);
    console.log("[Email Test]   Check Mailpit Web UI at http://localhost:8025 to view message.");
    process.exit(0);
  } catch (error: any) {
    console.error(`[Email Test] ✗ Email delivery failed: ${error.message || "Unknown error"}`);
    process.exit(1);
  }
}

main();
