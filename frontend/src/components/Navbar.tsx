"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Home,
  User,
  LogOut,
  ChevronDown,
  Building2,
  ShieldCheck,
  CalendarDays,
  Headphones,
  CalendarCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/apartments", label: "Apartments" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logoutUser } = useAuth();

  const isHomePage = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    setScrolled(window.scrollY > 20);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href;
  const isTransparent = isHomePage && !scrolled;

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
  };

  // Derive initials for avatar
  const initials = user
    ? user.fullName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent
          ? "bg-transparent"
          : "bg-white/95 backdrop-blur-sm shadow-sm border-b border-soft-gold/20"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="Nestora — Home"
          >
            <span
              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-200 ${
                isTransparent
                  ? "bg-white/20 text-white group-hover:bg-soft-gold"
                  : "bg-forest-green text-warm-ivory group-hover:bg-soft-gold"
              }`}
            >
              <Home size={18} strokeWidth={1.8} />
            </span>
            <span
              className={`font-display text-xl font-semibold tracking-wide transition-colors duration-200 ${
                isTransparent ? "text-white" : "text-forest-green"
              }`}
            >
              Nestora
            </span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 pb-0.5 border-b-2 ${
                    isActive(link.href)
                      ? isTransparent
                        ? "text-white border-soft-gold"
                        : "text-forest-green border-soft-gold"
                      : isTransparent
                      ? "text-white/85 border-transparent hover:text-white hover:border-soft-gold/60"
                      : "text-charcoal/80 border-transparent hover:text-forest-green hover:border-soft-gold/50"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop auth area */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              // Placeholder while checking session to avoid layout shift
              <div className="w-20 h-8 rounded-lg bg-charcoal/10 animate-pulse" />
            ) : user ? (
              // Logged-in: show user menu
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200 px-3 py-1.5 rounded-lg ${
                    isTransparent
                      ? "text-white hover:bg-white/15"
                      : "text-charcoal/80 hover:bg-forest-green/5 hover:text-forest-green"
                  }`}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  {/* Avatar */}
                  <span
                    className={`relative flex items-center justify-center w-7 h-7 rounded-full overflow-hidden text-xs font-semibold ${
                      isTransparent
                        ? "bg-white/20 text-white"
                        : "bg-forest-green/10 text-forest-green"
                    }`}
                  >
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.fullName}
                        fill
                        sizes="28px"
                        className="object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </span>
                  <span className="hidden lg:inline max-w-[120px] truncate">
                    {user.fullName.split(" ")[0]}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-charcoal/8 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-charcoal/8">
                      <p className="text-xs font-medium text-charcoal truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-charcoal/50 truncate">
                        {user.email ?? user.phone ?? ""}
                      </p>
                    </div>
                    <Link
                      href="/account"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                    >
                      <User size={14} />
                      My Account
                    </Link>
                    <Link
                      href="/account/bookings"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                    >
                      <CalendarDays size={14} />
                      My Bookings
                    </Link>
                    <Link
                      href="/host"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                    >
                      <Building2 size={14} />
                      My Apartments
                    </Link>
                    <Link
                      href="/host/bookings"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                    >
                      <CalendarDays size={14} />
                      Reservations
                    </Link>
                    <Link
                      href="/host/availability"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                    >
                      <CalendarCheck size={14} />
                      Availability
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                      >
                        <ShieldCheck size={14} />
                        Admin
                      </Link>
                    )}
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin/support"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                      >
                        <Headphones size={14} />
                        Support
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-charcoal hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Logged-out: customer Google sign-in plus public browsing
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isTransparent
                      ? "text-white/90 hover:text-white hover:bg-white/10"
                      : "text-charcoal/80 hover:text-forest-green hover:bg-forest-green/5"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/apartments"
                  className={`text-sm font-medium px-5 py-2 rounded-lg transition-colors duration-200 ${
                    isTransparent
                      ? "bg-white/15 text-white border border-white/30 hover:bg-white/25"
                      : "bg-forest-green text-warm-ivory hover:bg-forest-green/90"
                  }`}
                >
                  Book Now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className={`md:hidden flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
              isTransparent
                ? "text-white hover:bg-white/10"
                : "text-charcoal hover:bg-charcoal/5"
            }`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-soft-gold/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive(link.href)
                    ? "bg-forest-green/5 text-forest-green"
                    : "text-charcoal hover:bg-forest-green/5 hover:text-forest-green"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 pb-1 border-t border-charcoal/8 flex flex-col gap-1">
              {user ? (
                <>
                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-2">
                    <span className="relative flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-forest-green/10 text-forest-green text-xs font-semibold shrink-0">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt={user.fullName}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-charcoal/50 truncate">
                        {user.email ?? user.phone ?? ""}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/account"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                  >
                    <User size={16} />
                    My Account
                  </Link>
                  <Link
                    href="/account/bookings"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                  >
                    <CalendarDays size={16} />
                    My Bookings
                  </Link>
                  <Link
                    href="/host"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                  >
                    <Building2 size={16} />
                    My Apartments
                  </Link>
                  <Link
                    href="/host/bookings"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                  >
                    <CalendarDays size={16} />
                    Reservations
                  </Link>
                  <Link
                    href="/host/availability"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                  >
                    <CalendarCheck size={16} />
                    Availability
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                    >
                      <ShieldCheck size={16} />
                      Admin
                    </Link>
                  )}
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin/support"
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                    >
                      <Headphones size={16} />
                      Support
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-charcoal hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-4 py-3 rounded-lg text-sm font-medium text-charcoal hover:bg-forest-green/5 hover:text-forest-green transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/apartments"
                    className="block px-4 py-3 rounded-lg text-sm font-medium bg-forest-green text-warm-ivory text-center hover:bg-forest-green/90 transition-colors"
                  >
                    Book Now
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
