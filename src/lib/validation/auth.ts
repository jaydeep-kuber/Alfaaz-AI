import zxcvbn from "zxcvbn";

/**
 * Validation rules and utilities for Qalam AUTH-2 Sign-up.
 * Shared between server enforcement and client feedback.
 */

export interface PasswordFeedback {
  score: number; // 0 to 4
  warning: string;
  suggestions: string[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface PasswordValidationResult extends ValidationResult {
  score: number;
  feedback: PasswordFeedback;
}

export interface EmailValidationResult extends ValidationResult {
  normalizedEmail?: string;
  domain?: string;
}

export interface NameValidationResult extends ValidationResult {
  normalizedName?: string;
}

/**
 * Extracts and parses allowed email domains from environment or explicit override.
 * Defaults to: gmail.com, outlook.com, hotmail.com, yahoo.com, icloud.com
 */
export function getAllowedEmailDomains(override?: string): string[] {
  const raw =
    override ??
    process.env.ALLOWED_EMAIL_DOMAINS ??
    "gmail.com,outlook.com,hotmail.com,yahoo.com,icloud.com";

  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Validates a user name or pen name.
 * Rules:
 * - 2 to 50 characters (Unicode code points counted safely).
 * - Accepts Unicode letters (including Devanagari script: letters and combining vowel marks/matras).
 * - Accepts spaces and common name punctuation (. ' -).
 * - Rejects empty values, whitespace-only, numbers, and unsupported symbols.
 */
export function validateName(name: unknown): NameValidationResult {
  if (typeof name !== "string") {
    return { valid: false, error: "Name is required." };
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: "Name is required." };
  }

  // Count Unicode code points properly using Array.from
  const length = Array.from(trimmed).length;
  if (length < 2) {
    return { valid: false, error: "Name must be at least 2 characters." };
  }
  if (length > 50) {
    return { valid: false, error: "Name must be at most 50 characters." };
  }

  // Unicode letters (\p{L}), combining marks / Devanagari matras (\p{M}), spaces (\s), and punctuation (. ' -)
  const validNameRegex = /^[\p{L}\p{M}\s.'-]+$/u;
  if (!validNameRegex.test(trimmed)) {
    return {
      valid: false,
      error: "Name can only contain letters, spaces, hyphens, and apostrophes.",
    };
  }

  return { valid: true, normalizedName: trimmed };
}

/**
 * Normalizes and validates an email address.
 * Rules:
 * - Normalizes by trimming surrounding whitespace and converting to lowercase.
 * - Enforces valid email syntax (exactly one @ symbol, valid user and domain parts).
 * - Rejects multiple @ symbols (e.g. a@evil.com@gmail.com).
 * - Rejects subdomain traversal (e.g. a@gmail.com.evil.com).
 * - Enforces exact domain matching against ALLOWED_EMAIL_DOMAINS.
 * - Error message for disallowed domain: "Please use a Gmail, Outlook, Yahoo or iCloud email address."
 */
export function validateEmail(
  email: unknown,
  allowedDomainsList?: string[]
): EmailValidationResult {
  if (typeof email !== "string") {
    return { valid: false, error: "Email is required." };
  }

  const trimmed = email.trim();
  if (!trimmed) {
    return { valid: false, error: "Email is required." };
  }

  const normalized = trimmed.toLowerCase();

  // Ensure there is exactly one '@'
  const atParts = normalized.split("@");
  if (atParts.length !== 2) {
    return { valid: false, error: "Enter a valid email address." };
  }

  const [localPart, domain] = atParts;
  if (!localPart || !domain) {
    return { valid: false, error: "Enter a valid email address." };
  }

  // Standard RFC-compliant syntax check
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(normalized)) {
    return { valid: false, error: "Enter a valid email address." };
  }

  // Domain allowlist enforcement
  const allowed = allowedDomainsList ?? getAllowedEmailDomains();
  if (!allowed.includes(domain)) {
    return {
      valid: false,
      domain,
      normalizedEmail: normalized,
      error: "Please use a Gmail, Outlook, Yahoo or iCloud email address.",
    };
  }

  return { valid: true, normalizedEmail: normalized, domain };
}

/**
 * Validates a password using length, zxcvbn strength estimation, and email local-part exclusion.
 * Rules:
 * - Minimum length: 10 characters.
 * - Maximum length: 128 characters.
 * - Must not be empty or whitespace-only.
 * - Must not contain the email's local part (case-insensitive, when local part >= 3 chars).
 * - Must achieve a zxcvbn score of at least 3 (on a 0–4 scale).
 * - Rejects predictable passwords such as "password123".
 */
export function validatePassword(
  password: unknown,
  emailContext?: string
): PasswordValidationResult {
  if (typeof password !== "string" || !password) {
    return {
      valid: false,
      score: 0,
      feedback: {
        score: 0,
        warning: "Password is required.",
        suggestions: ["Use at least 10 characters with a mix of words or symbols."],
      },
      error: "Password is required.",
    };
  }

  if (password.length < 10) {
    return {
      valid: false,
      score: 0,
      feedback: {
        score: 0,
        warning: "Password is too short.",
        suggestions: ["Password must be at least 10 characters long."],
      },
      error: "Password must be at least 10 characters long.",
    };
  }

  if (password.length > 128) {
    return {
      valid: false,
      score: 0,
      feedback: {
        score: 0,
        warning: "Password is too long.",
        suggestions: ["Password must not exceed 128 characters."],
      },
      error: "Password must not exceed 128 characters.",
    };
  }

  // Check against email local-part if provided
  if (emailContext && typeof emailContext === "string") {
    const atIdx = emailContext.indexOf("@");
    const localPart = (atIdx > 0 ? emailContext.slice(0, atIdx) : emailContext)
      .trim()
      .toLowerCase();

    // Check if password contains the email username (meaningful comparison: length >= 3)
    if (localPart.length >= 3 && password.toLowerCase().includes(localPart)) {
      return {
        valid: false,
        score: 1,
        feedback: {
          score: 1,
          warning: "Password contains your email username.",
          suggestions: ["Avoid using parts of your email address in your password."],
        },
        error: "Password must not contain your email address.",
      };
    }
  }

  // Run zxcvbn estimation
  const estimation = zxcvbn(password);
  const score = estimation.score; // 0, 1, 2, 3, or 4

  const warning = estimation.feedback.warning || (score < 3 ? "Password is too weak." : "");
  const suggestions =
    estimation.feedback.suggestions.length > 0
      ? estimation.feedback.suggestions
      : score < 3
        ? ["Add another word or use uncommon words, numbers, and symbols."]
        : ["Strong password."];

  if (score < 3) {
    return {
      valid: false,
      score,
      feedback: { score, warning, suggestions },
      error: warning || "Password is too weak. Please use a stronger passphrase.",
    };
  }

  return {
    valid: true,
    score,
    feedback: { score, warning, suggestions },
  };
}

/**
 * Validates that the password confirmation matches the password exactly.
 */
export function validateConfirmPassword(
  password: unknown,
  confirmPassword: unknown
): ValidationResult {
  if (typeof confirmPassword !== "string" || !confirmPassword) {
    return { valid: false, error: "Please confirm your password." };
  }

  if (confirmPassword !== password) {
    return { valid: false, error: "Passwords do not match." };
  }

  return { valid: true };
}

/**
 * Comprehensive form validation for Sign-up.
 */
export function validateSignUpData(
  data: {
    name?: unknown;
    email?: unknown;
    password?: unknown;
    confirmPassword?: unknown;
  },
  allowedDomainsList?: string[]
): {
  valid: boolean;
  errors: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
  normalized?: {
    name: string;
    email: string;
  };
} {
  const nameRes = validateName(data.name);
  const emailRes = validateEmail(data.email, allowedDomainsList);
  const passwordRes = validatePassword(
    data.password,
    typeof data.email === "string" ? data.email : undefined
  );
  const confirmRes = validateConfirmPassword(data.password, data.confirmPassword);

  const errors: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  } = {};

  if (!nameRes.valid) errors.name = nameRes.error;
  if (!emailRes.valid) errors.email = emailRes.error;
  if (!passwordRes.valid) errors.password = passwordRes.error;
  if (!confirmRes.valid) errors.confirmPassword = confirmRes.error;

  const valid =
    nameRes.valid && emailRes.valid && passwordRes.valid && confirmRes.valid;

  return {
    valid,
    errors,
    normalized: valid
      ? {
          name: nameRes.normalizedName!,
          email: emailRes.normalizedEmail!,
        }
      : undefined,
  };
}
