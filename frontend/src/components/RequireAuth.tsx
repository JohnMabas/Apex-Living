"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface RequireAuthProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function RequireAuth({
  children,
  adminOnly = false,
}: RequireAuthProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (adminOnly && user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 mx-auto mb-4">
            <ShieldAlert size={26} className="text-red-500" />
          </span>
          <h1 className="font-display text-2xl font-semibold text-forest-green mb-2">
            Administrator access required
          </h1>
          <p className="text-sm text-charcoal/60 mb-6">
            Your account does not have permission to view this section.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-forest-green text-warm-ivory text-sm font-medium hover:bg-forest-green/90 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
