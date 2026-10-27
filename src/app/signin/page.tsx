"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Eye, EyeOff, ArrowRight, Loader2, LogOut, User } from "lucide-react";
import { APP_NAME, APP_NAME_HINDI } from "@/src/lib/constants";
import { authClient } from "@/src/lib/auth/auth-client";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notificationMessage = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: session } = authClient.useSession();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (res?.error) {
        const errMsg = res.error.message || "Invalid credentials.";
        setErrorMessage(errMsg || "Invalid email or password. Please try again.");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAF6EF] text-[#1f1b17]">
      {/* ---------------------------------------------------------------------- */}
      {/* LEFT COLUMN: Sign In Interface                                         */}
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

          {/* Active Session Display */}
          {session?.user ? (
            <div className="space-y-6">
              <div className="mb-4">
                <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#293343] tracking-tight mb-2">
                  Welcome back
                </h1>
                <p className="text-sm text-[#675d52] leading-relaxed">
                  You are currently signed in to your literary sanctuary.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[#E2D7C8] shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#293343] text-white flex items-center justify-center font-serif text-lg font-medium">
                    {session.user.name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#293343]">
                      {session.user.name}
                    </h3>
                    <p className="text-sm text-[#675d52] font-mono">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2D7C8]/60 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#137333] font-medium bg-[#e6f4ea] px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Session Active
                  </span>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 text-xs font-medium text-[#b91c1c] hover:text-[#991b1b] px-3 py-1.5 rounded-lg hover:bg-[#fde8e8] transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Headline */}
              <div className="mb-8">
                <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#293343] tracking-tight mb-2">
                  Sign in
                </h1>
                <p className="text-sm text-[#675d52] leading-relaxed">
                  Return to your drafts, poetry, and quiet ideas.
                </p>
              </div>

              {/* Notification Banner (e.g. from Sign-up redirect) */}
              {notificationMessage && (
                <div
                  role="status"
                  className="mb-6 p-4 rounded-xl bg-[#e6f4ea] border border-[#34a853]/30 text-[#137333] text-sm flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#137333]" />
                  <div className="flex-1 font-medium leading-snug">{notificationMessage}</div>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-6 p-4 rounded-xl bg-[#fde8e8] border border-[#ef4444]/30 text-[#b91c1c] text-sm flex items-start gap-3 animate-in fade-in duration-200"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#b91c1c]" />
                  <div className="flex-1 font-medium leading-snug">{errorMessage}</div>
                </div>
              )}

              {/* Interactive Sign In Form */}
              <form onSubmit={handleSignIn} className="space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="signin-email"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-[#675d52] mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="poet@alfaaz.app"
                    disabled={loading}
                    className="w-full h-12 px-4 rounded-[10px] bg-white text-[#1f1b17] text-[15px] border border-[#E2D7C8] focus:border-[#293343] focus:ring-2 focus:ring-[#293343]/15 focus:outline-none transition-all placeholder:text-[#8A7F73]/60 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="signin-password"
                      className="text-[11px] font-semibold uppercase tracking-wider text-[#675d52]"
                    >
                      Password
                    </label>
                    <span className="text-xs text-[#8A7F73] hover:text-[#293343] cursor-pointer transition-colors">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="••••••••••••"
                      disabled={loading}
                      className="w-full h-12 pl-4 pr-11 rounded-[10px] bg-white text-[#1f1b17] text-[15px] border border-[#E2D7C8] focus:border-[#293343] focus:ring-2 focus:ring-[#293343]/15 focus:outline-none transition-all placeholder:text-[#8A7F73]/60 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7F73] hover:text-[#293343] transition-colors p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 px-6 rounded-[10px] bg-[#293343] hover:bg-[#1f2835] active:bg-[#171f2a] text-white font-medium text-[15px] shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign in</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Link back to Sign Up */}
              <div className="mt-8 text-center text-sm text-[#675d52]">
                <span>Don't have an account? </span>
                <Link
                  href="/signup"
                  className="font-medium text-[#293343] underline underline-offset-4 hover:text-black transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-[#E2D7C8]/60 space-y-3 text-center">
          <p className="text-[11px] uppercase tracking-widest text-[#8A7F73] font-medium">
            Alfaaz Literary Systems &nbsp;•&nbsp; Quiet Terms &nbsp;•&nbsp; Privacy Note
          </p>
        </footer>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* RIGHT COLUMN: Editorial Quote Sanctuary Panel                         */}
      {/* ---------------------------------------------------------------------- */}
      <section className="hidden lg:flex flex-1 flex-col justify-between bg-[#E9DFD0] px-14 py-16 text-[#1f1b17] select-none">
        <div className="flex items-center justify-between pb-6 border-b border-[#2B2622]/10 text-xs text-[#675d52]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3F4A5A]" />
            <span className="uppercase tracking-widest font-medium">A Sanctuary for Words</span>
          </div>
          <span className="font-mono text-[11px] text-[#8A7F73]">Folio 01 // 2025</span>
        </div>

        <div className="my-auto max-w-lg py-12">
          <div className="w-10 h-0.5 bg-[#2B2622]/20 mb-8" />
          <blockquote className="font-serif text-3xl xl:text-4xl leading-relaxed text-[#2B2622] mb-6">
            “लिखे हुए शब्द कभी-कभी मन की आवाज़ बन जाते हैं।”
          </blockquote>
          <cite className="not-italic text-xs uppercase tracking-widest text-[#675d52] font-medium block">
            — अज्ञात विचार — कापी संख्या तीन
          </cite>
        </div>

        <div className="pt-6 border-t border-[#2B2622]/10 flex items-center justify-between text-xs text-[#675d52]">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-1 rounded-full bg-[#293343]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A7F73]/50" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A7F73]/50" />
          </div>
          <span className="text-[11px] uppercase tracking-wider text-[#8A7F73]">
            Alfaaz Engine
          </span>
        </div>
      </section>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF6EF]" />}>
      <SignInContent />
    </Suspense>
  );
}
