"use client";

import React, { useState, useId, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  PasswordFeedback,
} from "@/src/lib/validation/auth";
import { APP_NAME, APP_NAME_HINDI } from "@/src/lib/constants";

export default function SignUpPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form Fields State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility Toggles (Independent for both fields)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field Errors State
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Real-time Password Strength State
  const [strengthFeedback, setStrengthFeedback] = useState<PasswordFeedback>({
    score: 0,
    warning: "",
    suggestions: [],
  });

  // Touch tracking for blur validation
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  // Real-time password change handler
  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (!val) {
      setStrengthFeedback({ score: 0, warning: "", suggestions: [] });
      if (touched.password) setPasswordError("Password is required.");
      return;
    }

    const res = validatePassword(val, email);
    setStrengthFeedback(res.feedback);

    if (touched.password) {
      setPasswordError(res.valid ? null : res.error || null);
    }

    // Also revalidate confirm password if touched
    if (touched.confirmPassword && confirmPassword) {
      const cRes = validateConfirmPassword(val, confirmPassword);
      setConfirmPasswordError(cRes.valid ? null : cRes.error || null);
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (touched.confirmPassword) {
      const cRes = validateConfirmPassword(password, val);
      setConfirmPasswordError(cRes.valid ? null : cRes.error || null);
    }
  };

  const handleNameBlur = () => {
    setTouched((prev) => ({ ...prev, name: true }));
    const res = validateName(name);
    setNameError(res.valid ? null : res.error || null);
  };

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    const res = validateEmail(email);
    setEmailError(res.valid ? null : res.error || null);

    // Recheck password local-part with new email if password exists
    if (password) {
      const pRes = validatePassword(password, email);
      setStrengthFeedback(pRes.feedback);
      if (touched.password) {
        setPasswordError(pRes.valid ? null : pRes.error || null);
      }
    }
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    const res = validatePassword(password, email);
    setPasswordError(res.valid ? null : res.error || null);
  };

  const handleConfirmPasswordBlur = () => {
    setTouched((prev) => ({ ...prev, confirmPassword: true }));
    const res = validateConfirmPassword(password, confirmPassword);
    setConfirmPasswordError(res.valid ? null : res.error || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Mark all as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // Validate all fields client-side before sending
    const nRes = validateName(name);
    const eRes = validateEmail(email);
    const pRes = validatePassword(password, email);
    const cRes = validateConfirmPassword(password, confirmPassword);

    setNameError(nRes.valid ? null : nRes.error || null);
    setEmailError(eRes.valid ? null : eRes.error || null);
    setPasswordError(pRes.valid ? null : pRes.error || null);
    setConfirmPasswordError(cRes.valid ? null : cRes.error || null);

    if (!nRes.valid || !eRes.valid || !pRes.valid || !cRes.valid) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            confirmPassword,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.fieldErrors) {
            if (data.fieldErrors.name) setNameError(data.fieldErrors.name);
            if (data.fieldErrors.email) setEmailError(data.fieldErrors.email);
            if (data.fieldErrors.password) setPasswordError(data.fieldErrors.password);
            if (data.fieldErrors.confirmPassword)
              setConfirmPasswordError(data.fieldErrors.confirmPassword);
          }
          setGeneralError(data.error || "Registration failed. Please check your information.");
          return;
        }

        // Exact success redirect with the required message
        const successMessage =
          data.message || "Account created. Sign in to verify your email.";
        router.push(`/signin?message=${encodeURIComponent(successMessage)}`);
      } catch (err: any) {
        setGeneralError("Network error. Please verify your connection and try again.");
      }
    });
  };

  // Helper for password strength meter visual
  const getScoreColor = (score: number) => {
    if (score <= 1) return "bg-[#A84232]"; // Terracotta / Red
    if (score === 2) return "bg-[#D97706]"; // Amber
    if (score === 3) return "bg-[#3F4A5A]"; // Slate
    return "bg-[#059669]"; // Emerald
  };

  const getScoreLabel = (score: number) => {
    if (score === 0) return "Very Weak";
    if (score === 1) return "Weak";
    if (score === 2) return "Fair";
    if (score === 3) return "Good";
    return "Strong";
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAF6EF] text-[#1f1b17]">
      {/* ---------------------------------------------------------------------- */}
      {/* LEFT COLUMN: Authentication Form (50% desktop, full-width mobile)     */}
      {/* ---------------------------------------------------------------------- */}
      <section className="flex-1 flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-10 lg:py-16 max-w-2xl mx-auto w-full">
        <div>
          {/* Brand Header */}
          <header className="mb-10 sm:mb-14">
            <div className="flex items-center gap-2 select-none">
              <span className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-[#293343]">
                {APP_NAME_HINDI}
              </span>
              <span className="text-xs uppercase tracking-widest text-[#8A7F73] font-medium pl-1 border-l border-[#E2D7C8]">
                {APP_NAME.toUpperCase()}
              </span>
            </div>
          </header>

          {/* Form Headline */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#293343] tracking-tight mb-2">
              Create your account
            </h1>
            <p className="text-sm text-[#675d52] leading-relaxed">
              Begin your personal archive of poetry, thoughts, and unfinished stories.
            </p>
          </div>

          {/* General Server Error Area */}
          {generalError && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-[#ffdad6]/60 border border-[#ba1a1a]/30 text-[#93000a] text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#ba1a1a]" />
              <div className="flex-1 leading-snug">{generalError}</div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Field 1: Name */}
            <div>
              <label
                htmlFor={nameId}
                className="block text-[11px] font-semibold uppercase tracking-wider text-[#675d52] mb-1.5"
              >
                Your name or pen name
              </label>
              <input
                id={nameId}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="e.g. Mirza or Kabir"
                disabled={isPending}
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? `${nameId}-error` : undefined}
                className={`w-full h-12 px-4 rounded-[10px] bg-white text-[#1f1b17] placeholder:text-[#8A7F73]/70 text-[15px] border transition-all duration-150 focus:outline-none ${
                  nameError
                    ? "border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20"
                    : "border-[#E2D7C8] focus:border-[#3F4A5A] focus:ring-2 focus:ring-[#3F4A5A]/20"
                }`}
              />
              {nameError && (
                <p
                  id={`${nameId}-error`}
                  className="mt-1.5 text-xs text-[#ba1a1a] flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{nameError}</span>
                </p>
              )}
            </div>

            {/* Field 2: Email */}
            <div>
              <label
                htmlFor={emailId}
                className="block text-[11px] font-semibold uppercase tracking-wider text-[#675d52] mb-1.5"
              >
                Email address
              </label>
              <input
                id={emailId}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="author@archive"
                autoComplete="email"
                disabled={isPending}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? `${emailId}-error` : undefined}
                className={`w-full h-12 px-4 rounded-[10px] bg-white text-[#1f1b17] placeholder:text-[#8A7F73]/70 text-[15px] border transition-all duration-150 focus:outline-none ${
                  emailError
                    ? "border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20"
                    : "border-[#E2D7C8] focus:border-[#3F4A5A] focus:ring-2 focus:ring-[#3F4A5A]/20"
                }`}
              />
              {emailError && (
                <p
                  id={`${emailId}-error`}
                  className="mt-1.5 text-xs text-[#ba1a1a] flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Field 3: Password */}
            <div>
              <label
                htmlFor={passwordId}
                className="block text-[11px] font-semibold uppercase tracking-wider text-[#675d52] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={handlePasswordBlur}
                  placeholder="••••••••••••••••"
                  autoComplete="new-password"
                  disabled={isPending}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={`${passwordId}-desc`}
                  className={`w-full h-12 pl-4 pr-12 rounded-[10px] bg-white text-[#1f1b17] placeholder:text-[#8A7F73]/70 text-[15px] border transition-all duration-150 focus:outline-none ${
                    passwordError
                      ? "border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20"
                      : "border-[#E2D7C8] focus:border-[#3F4A5A] focus:ring-2 focus:ring-[#3F4A5A]/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7F73] hover:text-[#293343] p-1.5 rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter & Actionable Guidance */}
              {password.length > 0 && (
                <div id={`${passwordId}-desc`} className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#675d52]">
                      Strength:{" "}
                      <strong className="font-medium text-[#293343]">
                        {getScoreLabel(strengthFeedback.score)}
                      </strong>
                    </span>
                    <span className="text-[11px] text-[#8A7F73]">
                      Min. 10 chars (score 3/4)
                    </span>
                  </div>

                  {/* 4 Segmented Progress Bars */}
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[0, 1, 2, 3].map((step) => {
                      const active = strengthFeedback.score >= step + 1;
                      return (
                        <div
                          key={step}
                          className={`rounded-full transition-colors duration-200 ${
                            active
                              ? getScoreColor(strengthFeedback.score)
                              : "bg-[#E2D7C8]"
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Suggestions / Guidance */}
                  {strengthFeedback.suggestions.length > 0 && (
                    <ul className="text-[12px] text-[#675d52] list-disc list-inside space-y-0.5 pt-0.5">
                      {strengthFeedback.suggestions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {passwordError && (
                <p className="mt-1.5 text-xs text-[#ba1a1a] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* Field 4: Confirm Password */}
            <div>
              <label
                htmlFor={confirmPasswordId}
                className="block text-[11px] font-semibold uppercase tracking-wider text-[#675d52] mb-1.5"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id={confirmPasswordId}
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  onBlur={handleConfirmPasswordBlur}
                  placeholder="••••••••••••••••"
                  autoComplete="new-password"
                  disabled={isPending}
                  aria-invalid={Boolean(confirmPasswordError)}
                  aria-describedby={
                    confirmPasswordError ? `${confirmPasswordId}-error` : undefined
                  }
                  className={`w-full h-12 pl-4 pr-12 rounded-[10px] bg-white text-[#1f1b17] placeholder:text-[#8A7F73]/70 text-[15px] border transition-all duration-150 focus:outline-none ${
                    confirmPasswordError
                      ? "border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20"
                      : "border-[#E2D7C8] focus:border-[#3F4A5A] focus:ring-2 focus:ring-[#3F4A5A]/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7F73] hover:text-[#293343] p-1.5 rounded transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p
                  id={`${confirmPasswordId}-error`}
                  className="mt-1.5 text-xs text-[#ba1a1a] flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{confirmPasswordError}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 px-6 rounded-[10px] bg-[#293343] hover:bg-[#3F4A5A] text-white font-medium text-[15px] shadow-sm active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create account</span>
                )}
              </button>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center text-sm text-[#675d52]">
            <span>Already have an account? </span>
            <Link
              href="/signin"
              className="font-medium text-[#293343] underline underline-offset-4 hover:text-black transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Quiet Footer Badges */}
        <footer className="mt-12 pt-8 border-t border-[#E2D7C8]/60 space-y-3 text-center">
          <p className="text-[11px] uppercase tracking-widest text-[#8A7F73] font-medium">
            End-to-End Encrypted Folio &nbsp;•&nbsp; Zero Telemetry
          </p>
          <p className="text-xs text-[#8A7F73]/80">
            © {APP_NAME} Editorial Press. All writings remain strictly yours.
          </p>
        </footer>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* RIGHT COLUMN: Contemplative Sanctuary Panel (Editorial Quote)          */}
      {/* ---------------------------------------------------------------------- */}
      <section className="hidden lg:flex flex-1 flex-col justify-between bg-[#E9DFD0] px-14 py-16 text-[#1f1b17] select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#2B2622]/10 text-xs text-[#675d52]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3F4A5A]" />
            <span className="uppercase tracking-widest font-medium">A Quiet Sanctuary</span>
          </div>
          <span className="font-mono text-[11px] text-[#8A7F73]">Folio 01 / 03</span>
        </div>

        {/* Center Quotation */}
        <div className="my-auto max-w-lg py-12">
          {/* Subtle Horizontal Accent Line */}
          <div className="w-10 h-0.5 bg-[#2B2622]/20 mb-8" />

          <blockquote className="font-serif text-3xl xl:text-4xl leading-relaxed text-[#2B2622] mb-6">
            “लिखे हुए शब्द कभी-कभी मन की आवाज़ बन जाते हैं।”
          </blockquote>

          <cite className="not-italic text-xs uppercase tracking-widest text-[#675d52] font-medium block">
            — विचार &nbsp;·&nbsp; The Written Reflection
          </cite>
        </div>

        {/* Bottom Metadata & Slide Indicator */}
        <div className="pt-6 border-t border-[#2B2622]/10 flex items-center justify-between text-xs text-[#675d52]">
          <p className="max-w-xs leading-relaxed text-[#675d52]">
            Crafted for authors, essayists, and solitary poets seeking clarity in the age of noise.
          </p>
          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-1 rounded-full bg-[#293343]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A7F73]/50" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A7F73]/50" />
          </div>
        </div>
      </section>
    </div>
  );
}
