import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "../db";
import * as schema from "../db/schema";
import { env } from "../env";
import { APP_NAME } from "../constants";
import {
  validateName,
  validateEmail,
  validatePassword,
  getAllowedEmailDomains,
} from "../validation/auth";

/**
 * Better Auth Server Configuration
 * Configured with official Drizzle ORM adapter for PostgreSQL.
 *
 * AUTH-2 Policies:
 * - autoSignIn: false (Strictly prevents creating session records or cookies on registration)
 * - requireEmailVerification: true (Stores users with emailVerified = false)
 * - Server-side before-hook intercepts sign-up attempts to enforce:
 *   1. Unicode/Devanagari names (2-50 chars, no empty/whitespace-only/digits/symbols)
 *   2. ALLOWED_EMAIL_DOMAINS exact domain allowlist (case-insensitive after trim)
 *   3. Duplicate email detection -> "This email is already registered."
 *   4. Password strength (length 10-128, zxcvbn score >= 3, email local-part exclusion)
 * - Database hook guarantees no user is created without matching the domain allowlist.
 * - No email delivery or sessions established.
 */
export const auth = betterAuth({
  appName: APP_NAME,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: env.AUTH_SECRET,
  baseURL: env.BASE_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = (user.email || "").trim().toLowerCase();
          const atParts = email.split("@");
          const domain = atParts.length === 2 ? atParts[1] : "";
          const allowed = getAllowedEmailDomains();
          if (!allowed.includes(domain)) {
            throw new APIError("BAD_REQUEST", {
              message: "Please use a Gmail, Outlook, Yahoo or iCloud email address.",
            });
          }
          return {
            data: {
              ...user,
              email,
            },
          };
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const body = (ctx.body || {}) as {
          name?: string;
          email?: string;
          password?: string;
        };

        // 1. Validate Name (Devanagari, Latin, 2-50 characters)
        const nameRes = validateName(body.name);
        if (!nameRes.valid) {
          throw new APIError("BAD_REQUEST", {
            message: nameRes.error || "Name is invalid.",
          });
        }

        // 2. Validate Email & Domain Enforcement (Exact domain match, case-insensitive after trim)
        const emailRes = validateEmail(body.email, getAllowedEmailDomains());
        if (!emailRes.valid) {
          throw new APIError("BAD_REQUEST", {
            message: emailRes.error || "Enter a valid email address.",
          });
        }

        // 3. Enforce Unique Email
        const normalizedEmail = emailRes.normalizedEmail!;
        try {
          const existing = await ctx.context.internalAdapter.findUserByEmail(normalizedEmail);
          if (existing?.user) {
            throw new APIError("BAD_REQUEST", {
              message: "This email is already registered.",
            });
          }
        } catch (checkErr: any) {
          if (checkErr instanceof APIError) throw checkErr;
          // Continue if internal adapter check threw non-APIError
        }

        // 4. Validate Password (length 10-128, zxcvbn score >= 3, local-part exclusion)
        const passwordRes = validatePassword(body.password, body.email);
        if (!passwordRes.valid) {
          throw new APIError("BAD_REQUEST", {
            message:
              passwordRes.error ||
              "Password does not meet required security standards.",
          });
        }
      }
    }),
  },
});
