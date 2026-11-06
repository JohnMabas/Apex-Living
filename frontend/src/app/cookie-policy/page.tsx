import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn about the cookies Nestora uses, why we use them, and how to manage your preferences.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-8">
          <Link href="/" className="hover:text-forest-green transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-charcoal/80">Cookie Policy</span>
        </nav>

        <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 sm:p-12">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-charcoal/8">
            <h1 className="font-display text-3xl font-semibold text-forest-green mb-2">
              Cookie Policy
            </h1>
            <p className="text-sm text-charcoal/50">
              Effective 1 November 2025 &mdash; Nestora
            </p>
          </div>

          <p className="text-charcoal/70 mb-8 leading-relaxed">
            Nestora uses cookies and similar technologies to make our platform
            work, remember your preferences, and understand how our site is
            used. This policy explains each category of cookie we use.
          </p>

          {/* Cookie categories */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-forest-green mb-5">
              Cookie Categories
            </h2>

            <div className="space-y-4">
              {/* Strictly necessary */}
              <div className="rounded-xl border border-charcoal/8 p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-medium text-charcoal">
                    Strictly Necessary
                  </h3>
                  <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                    Always Active
                  </span>
                </div>
                <p className="text-sm text-charcoal/65 mb-3 leading-relaxed">
                  These cookies are essential for Nestora to function. They
                  enable core features such as authentication, secure sessions,
                  and booking state management. Without them, the platform
                  cannot operate.
                </p>
                <div className="bg-warm-ivory/60 rounded-lg p-3">
                  <p className="text-xs text-charcoal/60">
                    <span className="font-medium">Examples:</span>{" "}
                    <code className="text-xs bg-charcoal/8 px-1 py-0.5 rounded">nestora_token</code>{" "}
                    (authentication session cookie, HTTP-only)
                  </p>
                </div>
              </div>

              {/* Functional */}
              <div className="rounded-xl border border-charcoal/8 p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-medium text-charcoal">Functional</h3>
                  <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    Optional
                  </span>
                </div>
                <p className="text-sm text-charcoal/65 mb-3 leading-relaxed">
                  These cookies enhance your experience by remembering your
                  preferences, such as saved search filters and UI settings.
                  Declining them will not prevent you from using the platform,
                  but some personalisation features will be unavailable.
                </p>
                <div className="bg-warm-ivory/60 rounded-lg p-3">
                  <p className="text-xs text-charcoal/60">
                    <span className="font-medium">Examples:</span>{" "}
                    <code className="text-xs bg-charcoal/8 px-1 py-0.5 rounded">nestora_cookie_consent</code>{" "}
                    (stores your cookie preferences in localStorage)
                  </p>
                </div>
              </div>

              {/* Analytics */}
              <div className="rounded-xl border border-charcoal/8 p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-medium text-charcoal">Analytics</h3>
                  <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-charcoal/5 text-charcoal/60 border border-charcoal/10">
                    Not Currently Active
                  </span>
                </div>
                <p className="text-sm text-charcoal/65 leading-relaxed">
                  Analytics cookies help us understand how visitors use our
                  platform — which pages are most popular, how long sessions
                  last, and where users drop off. This category is{" "}
                  <strong>not currently implemented</strong> on Nestora. If we
                  introduce analytics tools in the future, we will update this
                  policy and request your consent.
                </p>
              </div>

              {/* Marketing */}
              <div className="rounded-xl border border-charcoal/8 p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-medium text-charcoal">Marketing</h3>
                  <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-charcoal/5 text-charcoal/60 border border-charcoal/10">
                    Not Currently Used
                  </span>
                </div>
                <p className="text-sm text-charcoal/65 leading-relaxed">
                  Marketing cookies are used to track visitors across websites
                  for the purpose of displaying relevant advertising. Nestora
                  does <strong>not currently use</strong> any marketing or
                  retargeting cookies. If this changes, your consent will be
                  sought before any marketing cookies are set.
                </p>
              </div>
            </div>
          </section>

          {/* Managing preferences */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
              Managing Your Preferences
            </h2>
            <p className="text-sm text-charcoal/70 leading-relaxed mb-4">
              When you first visit Nestora, you will see a cookie consent banner
              at the bottom of the page. You may:
            </p>
            <ul className="space-y-2 text-sm text-charcoal/70 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-soft-gold mt-0.5 shrink-0">•</span>
                <strong>Accept All</strong> — consent to all cookie categories
              </li>
              <li className="flex items-start gap-2">
                <span className="text-soft-gold mt-0.5 shrink-0">•</span>
                <strong>Reject Optional</strong> — accept only strictly
                necessary cookies
              </li>
              <li className="flex items-start gap-2">
                <span className="text-soft-gold mt-0.5 shrink-0">•</span>
                <strong>Manage Preferences</strong> — toggle individual
                categories
              </li>
            </ul>
            <p className="text-sm text-charcoal/60 leading-relaxed">
              Your choices are stored in your browser&apos;s localStorage under
              the key{" "}
              <code className="text-xs bg-charcoal/8 px-1 py-0.5 rounded">
                nestora_cookie_consent
              </code>
              . You may update your preferences at any time by clearing this
              storage key and reloading the page.
            </p>
          </section>

          {/* Browser controls */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
              Browser Settings
            </h2>
            <p className="text-sm text-charcoal/70 leading-relaxed mb-3">
              You can also control cookies through your browser settings:
            </p>
            <ul className="space-y-2 text-sm text-charcoal/70">
              {[
                "Most browsers allow you to block all cookies, block third-party cookies, or delete cookies when you close the browser.",
                "Blocking all cookies will prevent you from logging in to Nestora as the authentication session cookie is strictly necessary.",
                "Refer to your browser's help documentation for specific instructions on managing cookies.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-soft-gold mt-0.5 shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Contact */}
          <section className="pt-6 border-t border-charcoal/8">
            <p className="text-sm text-charcoal/50">
              Questions about this policy? Email{" "}
              <a
                href="mailto:privacy@nestora.ng"
                className="text-forest-green underline hover:text-forest-green/80 transition-colors"
              >
                privacy@nestora.ng
              </a>{" "}
              or read our{" "}
              <Link
                href="/privacy"
                className="text-forest-green underline hover:text-forest-green/80 transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
