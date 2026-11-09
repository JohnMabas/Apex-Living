"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Home, ShieldCheck } from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";

function safeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/account";
  }
  if (value.startsWith("/auth/")) return "/account";
  return value;
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const redirectPath = safeRedirectPath(
    searchParams.get("redirect") ?? searchParams.get("next"),
  );
  const [apiError, setApiError] = useState<string | null>(
    searchParams.get("error"),
  );

  return (
    <div className="min-h-screen bg-warm-ivory pt-20 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-lg overflow-hidden border border-charcoal/8">
        <div className="hidden lg:block relative">
          <Image
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80"
            alt="Nestora apartment"
            fill
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-forest-green/75" />
          <div className="relative z-10 flex flex-col h-full p-10 justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-warm-ivory/10">
                <Home size={18} className="text-warm-ivory" strokeWidth={1.8} />
              </span>
              <span className="font-display text-xl font-semibold text-warm-ivory">
                Nestora
              </span>
            </Link>
            <div>
              <h2 className="font-display text-3xl font-semibold text-warm-ivory mb-3 leading-tight">
                Join thousands of guests who trust Nestora.
              </h2>
              <p className="text-warm-ivory/65 text-sm leading-relaxed">
                Create your account securely with Google and unlock access to
                Nigeria&apos;s finest short-stay apartments.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-forest-green">
              <Home size={16} className="text-warm-ivory" strokeWidth={1.8} />
            </span>
            <span className="font-display text-lg font-semibold text-forest-green">
              Nestora
            </span>
          </Link>

          <h1 className="font-display text-2xl font-semibold text-forest-green mb-1">
            Create Account
          </h1>
          <p className="text-sm text-charcoal/55 mb-8">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-forest-green font-medium hover:text-soft-gold transition-colors"
            >
              Sign in
            </Link>
          </p>

          {apiError && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
            >
              {apiError}
            </div>
          )}

          <div className="rounded-2xl border border-forest-green/10 bg-warm-ivory/60 p-5 mb-6">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-green/10 text-forest-green">
                <ShieldCheck size={18} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-charcoal">
                  One secure sign-in
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-charcoal/55">
                  Nestora customer accounts use Google. We receive only your
                  verified name, email address and profile photo — never your
                  Google password.
                </p>
              </div>
            </div>
          </div>

          <GoogleSignInButton
            next={redirectPath}
            label="Create account with Google"
            onError={(message) => setApiError(message || null)}
          />

          <p className="text-xs text-charcoal/40 text-center mt-6">
            By creating an account, you agree to our{" "}
            <Link
              href="#"
              className="hover:text-charcoal/60 transition-colors underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="hover:text-charcoal/60 transition-colors underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-warm-ivory pt-20 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-green border-t-transparent" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
