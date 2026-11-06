import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Nestora collects, uses, and protects your personal data under the Nigeria Data Protection Act 2023.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-8">
          <Link href="/" className="hover:text-forest-green transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-charcoal/80">Privacy Policy</span>
        </nav>

        <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 sm:p-12">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-charcoal/8">
            <h1 className="font-display text-3xl font-semibold text-forest-green mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm text-charcoal/50">
              Effective 1 November 2025 &mdash; Nestora
            </p>
          </div>

          <p className="text-charcoal/70 mb-8 leading-relaxed">
            Nestora (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is
            committed to protecting your personal data in accordance with the{" "}
            <strong>Nigeria Data Protection Act 2023 (NDPA)</strong> and the
            Nigeria Data Protection Regulation (NDPR). This policy explains
            what data we collect, why we collect it, and your rights.
          </p>

          {/* 1. Data we collect */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
              1. Data We Collect
            </h2>
            <div className="space-y-3">
              {[
                {
                  label: "Identity data",
                  value: "Full name, email address, phone number",
                },
                {
                  label: "Booking data",
                  value:
                    "Booking reference, check-in/check-out dates, number of guests, booking status",
                },
                {
                  label: "Payment data",
                  value:
                    "Payment reference, Paystack transaction reference, amount, payment status. We do not store card numbers — card data is handled solely by Paystack.",
                },
                {
                  label: "Account data",
                  value:
                    "Password (stored as a one-way hash), account creation date, role",
                },
                {
                  label: "Usage data",
                  value:
                    "IP address, browser type, pages visited (collected via server logs for security purposes)",
                },
                {
                  label: "Communication data",
                  value:
                    "Email preferences, contact form messages",
                },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-warm-ivory/60 border border-charcoal/8 p-4">
                  <p className="text-sm font-medium text-charcoal mb-1">
                    {label}
                  </p>
                  <p className="text-sm text-charcoal/65">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 2. How we use it */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
              2. How We Use Your Data
            </h2>
            <ul className="space-y-2.5 text-sm text-charcoal/70">
              {[
                "To create and manage your Nestora account",
                "To process bookings and communicate booking status to you and the host",
                "To initiate and verify payments via Paystack",
                "To send transactional emails (booking confirmations, payment receipts, password resets)",
                "To send promotional emails where you have given consent (you may withdraw consent at any time)",
                "To investigate fraud, abuse, and security incidents",
                "To comply with legal obligations under Nigerian law",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-soft-gold mt-0.5 shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Third parties */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
              3. Third Parties
            </h2>
            <p className="text-sm text-charcoal/70 mb-4 leading-relaxed">
              We share your data only with service providers who help us operate
              Nestora. We do not sell your data.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-warm-ivory/70 border-b border-charcoal/8">
                    <th className="text-left p-3 font-medium text-charcoal/70 text-xs uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="text-left p-3 font-medium text-charcoal/70 text-xs uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="text-left p-3 font-medium text-charcoal/70 text-xs uppercase tracking-wider">
                      Data Shared
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal/5">
                  {[
                    {
                      provider: "Paystack",
                      purpose: "Payment processing",
                      data: "Name, email, booking amount",
                    },
                    {
                      provider: "Email provider",
                      purpose: "Transactional & marketing emails",
                      data: "Name, email",
                    },
                    {
                      provider: "Aiven (PostgreSQL)",
                      purpose: "Database hosting",
                      data: "All account & booking data (encrypted at rest)",
                    },
                    {
                      provider: "Cloudinary",
                      purpose: "Image hosting",
                      data: "Apartment images (no personal data)",
                    },
                    {
                      provider: "Render",
                      purpose: "Application hosting",
                      data: "Application logs (may include IP)",
                    },
                  ].map((row) => (
                    <tr key={row.provider} className="hover:bg-warm-ivory/30">
                      <td className="p-3 font-medium text-charcoal">
                        {row.provider}
                      </td>
                      <td className="p-3 text-charcoal/70">{row.purpose}</td>
                      <td className="p-3 text-charcoal/60">{row.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Data retention */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
              4. Data Retention
            </h2>
            <p className="text-sm text-charcoal/70 leading-relaxed">
              We retain your account data for as long as you hold an active
              account with Nestora. Booking and payment records are retained for
              a minimum of 7 years for accounting and legal compliance purposes.
              You may request deletion of your account at any time; however,
              transactional records required by law will be retained.
            </p>
          </section>

          {/* 5. Your rights */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
              5. Your Rights Under the NDPA 2023
            </h2>
            <p className="text-sm text-charcoal/70 mb-4">
              As a data subject under the Nigeria Data Protection Act 2023, you
              have the following rights:
            </p>
            <ul className="space-y-2 text-sm text-charcoal/70">
              {[
                "Right to access — request a copy of the personal data we hold about you",
                "Right to rectification — request correction of inaccurate or incomplete data",
                "Right to erasure — request deletion of your data where we have no legal obligation to retain it",
                "Right to restrict processing — request that we limit how we use your data",
                "Right to data portability — receive your data in a structured, machine-readable format",
                "Right to object — object to processing based on legitimate interests or for direct marketing",
                "Right to withdraw consent — where processing is based on your consent, you may withdraw it at any time",
              ].map((right) => (
                <li key={right} className="flex items-start gap-2">
                  <span className="text-forest-green mt-0.5 shrink-0">✓</span>
                  {right}
                </li>
              ))}
            </ul>
          </section>

          {/* 6. Cookies */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
              6. Cookies
            </h2>
            <p className="text-sm text-charcoal/70 leading-relaxed">
              We use cookies to manage your authenticated session and store your
              preferences. For full details, please see our{" "}
              <Link
                href="/cookie-policy"
                className="text-forest-green underline hover:text-forest-green/80 transition-colors"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </section>

          {/* Contact */}
          <section className="pt-6 border-t border-charcoal/8">
            <h2 className="font-display text-base font-semibold text-forest-green mb-2">
              Contact Our Privacy Team
            </h2>
            <p className="text-sm text-charcoal/60">
              For privacy-related enquiries or to exercise your rights, email{" "}
              <a
                href="mailto:privacy@nestora.ng"
                className="text-forest-green underline hover:text-forest-green/80 transition-colors"
              >
                privacy@nestora.ng
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
