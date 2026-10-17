import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import * as schema from "../src/lib/db/schema";
import {
  validateName,
  validateEmail,
  validatePassword,
  getAllowedEmailDomains,
} from "../src/lib/validation/auth";

describe("AUTH-2 Database Persistence & Registration Tests", () => {
  let client: PGlite;
  let testDb: any;
  let testAuth: any;

  after(async () => {
    if (client) {
      await client.close();
    }
  });

  before(async () => {
    // 1. Initialize isolated in-memory PostgreSQL instance
    client = new PGlite();
    testDb = drizzle(client, { schema });

    // 2. Apply our official Drizzle SQL migration
    const migrationPath = path.resolve("./drizzle/0000_reflective_ronan.sql");
    const migrationSql = fs.readFileSync(migrationPath, "utf8");
    await client.exec(migrationSql);

    // 3. Configure Better Auth with exact production hooks & adapter
    testAuth = betterAuth({
      database: drizzleAdapter(testDb, {
        provider: "pg",
        schema: {
          user: schema.user,
          session: schema.session,
          account: schema.account,
          verification: schema.verification,
        },
      }),
      secret: "test-cryptographic-secret-must-be-32-chars-long!",
      baseURL: "http://localhost:3000",
      emailAndPassword: {
        enabled: true,
        autoSignIn: false,
        requireEmailVerification: true,
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

            const nameRes = validateName(body.name);
            if (!nameRes.valid) {
              throw new APIError("BAD_REQUEST", {
                message: nameRes.error || "Name is invalid.",
              });
            }

            const emailRes = validateEmail(body.email, getAllowedEmailDomains());
            if (!emailRes.valid) {
              throw new APIError("BAD_REQUEST", {
                message: emailRes.error || "Enter a valid email address.",
              });
            }

            const normalizedEmail = emailRes.normalizedEmail!;
            try {
              const existing = await ctx.context.internalAdapter.findUserByEmail(normalizedEmail);
              if (existing?.user) {
                throw new APIError("BAD_REQUEST", {
                  message: "This email is already registered.",
                });
              }
            } catch (err: any) {
              if (err instanceof APIError) throw err;
            }

            const passwordRes = validatePassword(body.password, body.email);
            if (!passwordRes.valid) {
              throw new APIError("BAD_REQUEST", {
                message: passwordRes.error || "Password does not meet required security standards.",
              });
            }
          }
        }),
      },
    });
  });

  // --------------------------------------------------------------------------
  // Step 3 Checklist Tests
  // --------------------------------------------------------------------------
  test("a@gmail.com and A@GMAIL.com pass, stored lowercase", async () => {
    // 1. a@gmail.com passes
    const res1 = await testAuth.api.signUpEmail({
      body: {
        name: "Test Poet A",
        email: "a@gmail.com",
        password: "StrongPassword#2026!",
      },
    });
    assert.ok(res1?.user, "a@gmail.com should be created");
    assert.strictEqual(res1.user.email, "a@gmail.com");

    // 2. A@GMAIL.com normalization passes
    const res2 = await testAuth.api.signUpEmail({
      body: {
        name: "Test Poet B",
        email: "B@GMAIL.COM",
        password: "StrongPassword#2026!",
      },
    });
    assert.ok(res2?.user, "B@GMAIL.COM should be created");
    assert.strictEqual(res2.user.email, "b@gmail.com");

    // Verify stored in lowercase in PostgreSQL
    const dbRecord = await testDb.query.user.findFirst({
      where: (u: any, { eq }: any) => eq(u.email, "b@gmail.com"),
    });
    assert.ok(dbRecord);
    assert.strictEqual(dbRecord.email, "b@gmail.com");
  });

  test("a@gmail.com.evil.com, a@evil.com, a@evil.com@gmail.com rejected", async () => {
    const invalidEmails = [
      "a@gmail.com.evil.com",
      "a@evil.com",
      "a@evil.com@gmail.com",
    ];

    for (const email of invalidEmails) {
      let rejected = false;
      try {
        await testAuth.api.signUpEmail({
          body: {
            name: "Evil Test",
            email,
            password: "StrongPassword#2026!",
          },
        });
      } catch (err: any) {
        rejected = true;
        const msg = String(err.message || "");
        assert.ok(
          msg.includes("Please use a Gmail") || msg.includes("valid email"),
          `Expected domain or format error for '${email}', got: ${msg}`
        );
      }
      assert.strictEqual(rejected, true, `Expected '${email}' to be rejected`);
    }
  });

  test("duplicate email rejected with exact message 'This email is already registered.'", async () => {
    let rejected = false;
    try {
      await testAuth.api.signUpEmail({
        body: {
          name: "Duplicate Attempt",
          email: "a@gmail.com", // Already registered in earlier test
          password: "StrongPassword#2026!",
        },
      });
    } catch (err: any) {
      rejected = true;
      assert.strictEqual(err.message, "This email is already registered.");
    }
    assert.strictEqual(rejected, true, "Expected duplicate email to be rejected");
  });

  test("'password123' and any password under 10 characters rejected", async () => {
    // 1. password123 rejected
    let rejectedP123 = false;
    try {
      await testAuth.api.signUpEmail({
        body: {
          name: "Weak Pass User",
          email: "weakpass@gmail.com",
          password: "password123",
        },
      });
    } catch (err: any) {
      rejectedP123 = true;
    }
    assert.strictEqual(rejectedP123, true, "Expected password123 to be rejected");

    // 2. password under 10 chars rejected
    let rejectedShort = false;
    try {
      await testAuth.api.signUpEmail({
        body: {
          name: "Short Pass User",
          email: "shortpass@gmail.com",
          password: "Ab1!cdef", // 8 chars
        },
      });
    } catch (err: any) {
      rejectedShort = true;
      assert.ok(err.message.includes("10 characters"));
    }
    assert.strictEqual(rejectedShort, true, "Expected short password to be rejected");
  });

  test("Devanagari name accepted", async () => {
    const hindiNames = ["मिर्ज़ा ग़ालिब", "कबीर दास", "मुंशी प्रेमचंद"];
    for (let i = 0; i < hindiNames.length; i++) {
      const name = hindiNames[i];
      const email = `poet${i}@gmail.com`;
      const res = await testAuth.api.signUpEmail({
        body: {
          name,
          email,
          password: "StrongPass#Chai2026!",
        },
      });
      assert.ok(res?.user, `Expected registration with Devanagari name '${name}' to succeed`);
      assert.strictEqual(res.user.name, name);

      const dbUser = await testDb.query.user.findFirst({
        where: (u: any, { eq }: any) => eq(u.email, email),
      });
      assert.strictEqual(dbUser.name, name);
    }
  });

  test("user row exists with emailVerified = false and a hashed password", async () => {
    const email = "verified.check@gmail.com";
    const plainPassword = "Gulmohar#Chai-2026!";

    const res = await testAuth.api.signUpEmail({
      body: {
        name: "Verification Check",
        email,
        password: plainPassword,
      },
    });

    assert.ok(res?.user);
    assert.strictEqual(res.user.emailVerified, false);

    // Verify user row directly in PostgreSQL
    const userRow = await testDb.query.user.findFirst({
      where: (u: any, { eq }: any) => eq(u.email, email),
    });
    assert.ok(userRow, "User row must exist in PostgreSQL");
    assert.strictEqual(userRow.emailVerified, false);

    // Verify account row with non-plaintext password
    const accountRow = await testDb.query.account.findFirst({
      where: (a: any, { eq }: any) => eq(a.userId, userRow.id),
    });
    assert.ok(accountRow, "Account row must exist");
    assert.notStrictEqual(accountRow.password, plainPassword, "Password must not be plaintext");
    assert.ok(accountRow.password.length > 20, "Password must be a secure hash");
  });

  test("the sign-up response sets no session cookie", async () => {
    const res = await testAuth.api.signUpEmail({
      body: {
        name: "Cookie Check User",
        email: "cookie.audit@gmail.com",
        password: "Independent#SecurePass-2026!",
      },
      asResponse: true,
    });

    const setCookie = res.headers.get("set-cookie");
    assert.strictEqual(
      setCookie,
      null,
      "Expected sign-up response to NOT set any session cookie"
    );

    // Verify zero session records exist in the session table for this user
    const userRow = await testDb.query.user.findFirst({
      where: (u: any, { eq }: any) => eq(u.email, "cookie.audit@gmail.com"),
    });
    const sessionRows = await testDb.query.session.findMany({
      where: (s: any, { eq }: any) => eq(s.userId, userRow.id),
    });
    assert.strictEqual(sessionRows.length, 0, "No session rows must exist for new user");
  });
});
