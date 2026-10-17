"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, ArrowRight } from "lucide-react";
import { APP_NAME, APP_NAME_HINDI } from "@/src/lib/constants";

function SignInContent() {
  const searchParams = useSearchParams();
  const notificationMessage = searchParams.get("message");

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

          {/* Headline */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#293343] tracking-tight mb-2">
              Sign in
            </h1>
            <p className="text-sm text-[#675d52] leading-relaxed">
              Return to your drafts, poetry, and quiet ideas.
            </p>
          </div>

          {/* Success Banner (Displayed upon redirect from Sign-up) */}
          {notificationMessage && (
            <div
              role="status"
              className="mb-6 p-4 rounded-xl bg-[#e6f4ea] border border-[#34a853]/30 text-[#137333] text-sm flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#137333]" />
              <div className="flex-1 font-medium leading-snug">{notificationMessage}</div>
            </div>
          )}

          {/* Scaffold Sign In Form (Design placeholder - Auth flow in future ticket) */}
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#675d52] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="poet@alfaaz.app"
                disabled
                className="w-full h-12 px-4 rounded-[10px] bg-white/70 text-[#1f1b17] text-[15px] border border-[#E2D7C8] opacity-80 cursor-not-allowed"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#675d52]">
                  Password
                </label>
                <span className="text-xs text-[#8A7F73]">Forgot password?</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••••••"
                  disabled
                  className="w-full h-12 px-4 rounded-[10px] bg-white/70 text-[#1f1b17] text-[15px] border border-[#E2D7C8] opacity-80 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled
                className="w-full h-12 px-6 rounded-[10px] bg-[#293343] text-white font-medium text-[15px] opacity-75 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

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
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-[#E2D7C8]/60 space-y-3 text-center">
          <p className="text-[11px] uppercase tracking-widest text-[#8A7F73] font-medium">
            Kalam &amp; Alfaaz Literary Systems &nbsp;•&nbsp; Quiet Terms &nbsp;•&nbsp; Privacy Note
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
            Kalam Engine
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
