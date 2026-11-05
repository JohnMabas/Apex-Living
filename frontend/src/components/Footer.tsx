import Link from "next/link";
import { Home, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

const footerLinks = {
  company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ],
  apartments: [
    { href: "/apartments", label: "Browse Apartments" },
    { href: "/apartments?city=Lagos", label: "Lagos" },
    { href: "/apartments?city=Abuja", label: "Abuja" },
    { href: "/apartments?city=Port+Harcourt", label: "Port Harcourt" },
    { href: "/apartments?city=Enugu", label: "Enugu" },
  ],
  account: [
    { href: "/login", label: "Sign In" },
    { href: "/register", label: "Create Account" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-forest-green text-warm-ivory">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-5 group">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-warm-ivory/10 group-hover:bg-soft-gold/30 transition-colors">
                <Home size={18} className="text-warm-ivory" strokeWidth={1.8} />
              </span>
              <span className="font-display text-xl font-semibold text-warm-ivory">
                Nestora
              </span>
            </Link>
            <p className="text-warm-ivory/70 text-sm leading-relaxed mb-6">
              Your comfort, your space. Discover premium apartments across
              Nigeria&apos;s finest cities.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Nestora on Facebook"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-warm-ivory/10 hover:bg-soft-gold/30 text-warm-ivory transition-colors"
              >
                <Facebook size={16} />
              </a>
              <a
                href="#"
                aria-label="Nestora on Twitter"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-warm-ivory/10 hover:bg-soft-gold/30 text-warm-ivory transition-colors"
              >
                <Twitter size={16} />
              </a>
              <a
                href="#"
                aria-label="Nestora on Instagram"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-warm-ivory/10 hover:bg-soft-gold/30 text-warm-ivory transition-colors"
              >
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Company links */}
          <div>
            <h3 className="font-semibold text-warm-ivory mb-4 text-sm uppercase tracking-wider">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-warm-ivory/70 hover:text-soft-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Apartments links */}
          <div>
            <h3 className="font-semibold text-warm-ivory mb-4 text-sm uppercase tracking-wider">
              Apartments
            </h3>
            <ul className="space-y-3">
              {footerLinks.apartments.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-warm-ivory/70 hover:text-soft-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-warm-ivory mb-4 text-sm uppercase tracking-wider">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-soft-gold mt-0.5 shrink-0" />
                <span className="text-sm text-warm-ivory/70">
                  Victoria Island, Lagos, Nigeria
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-soft-gold shrink-0" />
                <a
                  href="tel:+2348000000000"
                  className="text-sm text-warm-ivory/70 hover:text-soft-gold transition-colors"
                >
                  +234 800 000 0000
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-soft-gold shrink-0" />
                <a
                  href="mailto:hello@nestora.ng"
                  className="text-sm text-warm-ivory/70 hover:text-soft-gold transition-colors"
                >
                  hello@nestora.ng
                </a>
              </li>
            </ul>

            {/* Account links */}
            <div className="mt-6">
              <h3 className="font-semibold text-warm-ivory mb-4 text-sm uppercase tracking-wider">
                Account
              </h3>
              <ul className="space-y-3">
                {footerLinks.account.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-warm-ivory/70 hover:text-soft-gold transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-warm-ivory/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-warm-ivory/50">
            © {year} Nestora. All rights reserved.
          </p>
          <p className="text-sm text-warm-ivory/50">
            Your comfort, your space.
          </p>
        </div>
      </div>
    </footer>
  );
}
