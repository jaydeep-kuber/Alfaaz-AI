import { createAuthClient } from "better-auth/react";

/**
 * Better Auth Client Configuration for Next.js
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
});
