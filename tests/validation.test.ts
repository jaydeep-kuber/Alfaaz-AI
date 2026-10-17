import { test, describe } from "node:test";
import assert from "node:assert";
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateSignUpData,
  getAllowedEmailDomains,
} from "../src/lib/validation/auth";

describe("AUTH-2 Validation Tests", () => {
  // --------------------------------------------------------------------------
  // 7.1 Email normalization and domain tests
  // --------------------------------------------------------------------------
  describe("7.1 Email Normalization & Domain Enforcement", () => {
    const allowed = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"];

    test("a@gmail.com is accepted", () => {
      const res = validateEmail("a@gmail.com", allowed);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.normalizedEmail, "a@gmail.com");
      assert.strictEqual(res.domain, "gmail.com");
    });

    test("A@GMAIL.com is accepted and stored as a@gmail.com", () => {
      const res = validateEmail("A@GMAIL.com", allowed);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.normalizedEmail, "a@gmail.com");
    });

    test("a@gmail.com.evil.com is rejected", () => {
      const res = validateEmail("a@gmail.com.evil.com", allowed);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(
        res.error,
        "Please use a Gmail, Outlook, Yahoo or iCloud email address."
      );
    });

    test("a@evil.com is rejected", () => {
      const res = validateEmail("a@evil.com", allowed);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(
        res.error,
        "Please use a Gmail, Outlook, Yahoo or iCloud email address."
      );
    });

    test("a@evil.com@gmail.com is rejected", () => {
      const res = validateEmail("a@evil.com@gmail.com", allowed);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, "Enter a valid email address.");
    });

    test("Surrounding email whitespace is trimmed", () => {
      const res = validateEmail("   poet@outlook.com   ", allowed);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.normalizedEmail, "poet@outlook.com");
    });

    test("Domain matching uses the configured environment allowlist", () => {
      const customAllowlist = ["customdomain.org"];
      const resValid = validateEmail("writer@customdomain.org", customAllowlist);
      assert.strictEqual(resValid.valid, true);

      const resInvalid = validateEmail("writer@gmail.com", customAllowlist);
      assert.strictEqual(resInvalid.valid, false);
      assert.strictEqual(
        resInvalid.error,
        "Please use a Gmail, Outlook, Yahoo or iCloud email address."
      );
    });

    test("A valid allowed domain is accepted when configured (outlook, hotmail, yahoo, icloud)", () => {
      for (const d of allowed) {
        const res = validateEmail(`test@${d}`, allowed);
        assert.strictEqual(res.valid, true, `Expected domain ${d} to be accepted`);
      }
    });

    test("Malformed email addresses are rejected", () => {
      const invalidEmails = [
        "",
        "plainaddress",
        "@missingusername.com",
        "username@.com",
        "username@domain",
        "user name@gmail.com",
      ];
      for (const inv of invalidEmails) {
        const res = validateEmail(inv, allowed);
        assert.strictEqual(res.valid, false, `Expected '${inv}' to be rejected`);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 7.3 Password tests
  // --------------------------------------------------------------------------
  describe("7.3 Password Tests", () => {
    test("password123 is rejected (score < 3)", () => {
      const res = validatePassword("password123");
      assert.strictEqual(res.valid, false);
      assert.ok(res.score < 3);
    });

    test("A password shorter than 10 characters is rejected", () => {
      const res = validatePassword("Ab1!cde");
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, "Password must be at least 10 characters long.");
    });

    test("A password longer than 128 characters is rejected", () => {
      const longPass = "A".repeat(129) + "!23";
      const res = validatePassword(longPass);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, "Password must not exceed 128 characters.");
    });

    test("A password scoring below 3 is rejected", () => {
      // 10 chars but very predictable
      const res = validatePassword("1234567890");
      assert.strictEqual(res.valid, false);
      assert.ok(res.score < 3);
    });

    test("A password scoring at least 3 is accepted", () => {
      // High entropy passphrase
      const res = validatePassword("Gulmohar#Chai-Parchment99!");
      assert.strictEqual(res.valid, true);
      assert.ok(res.score >= 3);
    });

    test("A password containing the email local part is rejected (case-insensitive)", () => {
      const res1 = validatePassword(
        "Kabeer-Shayari#2026-Vault!",
        "kabeer@gmail.com"
      );
      assert.strictEqual(res1.valid, false);
      assert.strictEqual(res1.error, "Password must not contain your email address.");

      const res2 = validatePassword(
        "kabeer-shayari#2026-Vault!",
        "KABEER@GMAIL.COM"
      );
      assert.strictEqual(res2.valid, false);
      assert.strictEqual(res2.error, "Password must not contain your email address.");
    });

    test("Password confirmation mismatches are rejected", () => {
      const res = validateConfirmPassword("SecretPass#2026!", "DifferentPass#2026!");
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, "Passwords do not match.");

      const resMatch = validateConfirmPassword("SecretPass#2026!", "SecretPass#2026!");
      assert.strictEqual(resMatch.valid, true);
    });
  });

  // --------------------------------------------------------------------------
  // 7.4 Name tests
  // --------------------------------------------------------------------------
  describe("7.4 Name Tests", () => {
    test("A valid Latin-script name is accepted", () => {
      const res = validateName("Mirza Ghalib");
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.normalizedName, "Mirza Ghalib");
    });

    test("A valid Devanagari name is accepted (with vowel matras and conjuncts)", () => {
      const hindiNames = [
        "कबीर दास",
        "मिर्ज़ा ग़ालिब",
        "मुंशी प्रेमचंद",
        "हरिवंश राय बच्चन",
        "महादेवी वर्मा",
      ];
      for (const name of hindiNames) {
        const res = validateName(name);
        assert.strictEqual(res.valid, true, `Expected '${name}' to be accepted`);
        assert.strictEqual(res.normalizedName, name);
      }
    });

    test("Names at minimum (2 chars) and maximum (50 chars) are handled correctly", () => {
      const minName = "Al";
      const resMin = validateName(minName);
      assert.strictEqual(resMin.valid, true);

      const maxName = "A".repeat(50);
      const resMax = validateName(maxName);
      assert.strictEqual(resMax.valid, true);

      const tooShort = "A";
      const resTooShort = validateName(tooShort);
      assert.strictEqual(resTooShort.valid, false);
      assert.strictEqual(resTooShort.error, "Name must be at least 2 characters.");

      const tooLong = "A".repeat(51);
      const resTooLong = validateName(tooLong);
      assert.strictEqual(resTooLong.valid, false);
      assert.strictEqual(resTooLong.error, "Name must be at most 50 characters.");
    });

    test("Empty and whitespace-only names are rejected", () => {
      assert.strictEqual(validateName("").valid, false);
      assert.strictEqual(validateName("   ").valid, false);
    });

    test("Names containing unsupported characters (digits, code symbols) are rejected", () => {
      const invalidNames = [
        "Poet123",
        "Mirza <script>",
        "Kabir @home",
        "Writer $rich",
      ];
      for (const inv of invalidNames) {
        const res = validateName(inv);
        assert.strictEqual(res.valid, false, `Expected '${inv}' to be rejected`);
      }
    });
  });
});
