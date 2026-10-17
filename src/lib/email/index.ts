import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../env";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

let cachedTransporter: Transporter | null = null;

/**
 * Creates and returns a reusable Nodemailer SMTP transport.
 * Reads configuration strictly from SMTP_* environment variables.
 * Automatically supports unauthenticated local SMTP (Mailpit)
 * when SMTP_USER and SMTP_PASS are not configured.
 */
export function getEmailTransporter(): Transporter {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST || env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : env.SMTP_PORT;
  const secure = port === 465;

  const user = process.env.SMTP_USER !== undefined ? process.env.SMTP_USER : env.SMTP_USER;
  const pass = process.env.SMTP_PASS !== undefined ? process.env.SMTP_PASS : env.SMTP_PASS;
  const hasAuth = Boolean(user && pass);

  const transportOptions = {
    host,
    port,
    secure,
    ...(hasAuth
      ? {
          auth: {
            user,
            pass,
          },
        }
      : {}),
  };

  cachedTransporter = nodemailer.createTransport(transportOptions as any);
  return cachedTransporter;
}

/**
 * Sends an email using the centralized SMTP transport.
 * Credentials and sender info are never logged on error.
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const transporter = getEmailTransporter();
  const from = options.from || process.env.SMTP_FROM || env.SMTP_FROM;

  try {
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return {
      messageId: info.messageId,
      accepted: (info.accepted as string[]) || [],
      rejected: (info.rejected as string[]) || [],
    };
  } catch (error: any) {
    // Sanitized error logging: do NOT leak credentials or auth headers
    const errorMessage = error?.message || "Unknown SMTP delivery error";
    const errorCode = error?.code || "SMTP_ERROR";
    console.error(`[Email Error] Failed to send email via ${env.SMTP_HOST}:${env.SMTP_PORT} - Code: ${errorCode}: ${errorMessage}`);
    throw new Error(`Email delivery failed [${errorCode}]: ${errorMessage}`);
  }
}

/**
 * Verifies the connection configuration with the SMTP server.
 */
export async function verifyEmailConnection(): Promise<boolean> {
  const transporter = getEmailTransporter();
  try {
    await transporter.verify();
    return true;
  } catch (error: any) {
    console.error(
      `[Email Verification Error] Could not connect to SMTP server at ${env.SMTP_HOST}:${env.SMTP_PORT} - ${error.message}`
    );
    return false;
  }
}
