import Image from "next/image";
import Link from "next/link";
import HeroSlideshow from "@/components/HeroSlideshow";
import {
  Shield,
  HeadphonesIcon,
  Star,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Users,
} from "lucide-react";
import SearchBar from "@/components/SearchBar";
import SectionHeading from "@/components/SectionHeading";
import ApartmentCard from "@/components/ApartmentCard";
import { featuredApartments, testimonials } from "@/lib/data";

export const metadata = {
  title: "Find a Place That Feels Like Home",
};

const destinations = [
  {
    city: "Lagos",
    label: "Lagos",
    image:
      "https://images.unsplash.com/photo-1576773585695-5d4d4d1a4e55?w=600&q=80",
    count: 3,
  },
  {
    city: "Abuja",
    label: "Abuja",
    image:
      "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=600&q=80",
    count: 2,
  },
  {
    city: "Port+Harcourt",
    label: "Port Harcourt",
    image:
      "https://images.unsplash.com/photo-1555400038-63f4c8a7fa9c?w=600&q=80",
    count: 1,
  },
  {
    city: "Enugu",
    label: "Enugu",
    image:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&q=80",
    count: 1,
  },
];

const whyUs = [
  {
    icon: Shield,
    title: "Verified Apartments",
    description:
      "Every property is personally inspected and verified to meet our quality standards before listing.",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description:
      "Our dedicated team is available around the clock to assist you before, during, and after your stay.",
  },
  {
    icon: CheckCircle2,
    title: "Secure Booking",
    description:
      "Book with confidence. Your payments are protected and your reservation is guaranteed.",
  },
  {
    icon: Users,
    title: "Local Expertise",
    description:
      "We know Nigeria's cities inside out, helping you find the perfect neighbourhood for your needs.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Search & Browse",
    description: "Search apartments by location, dates, and guest count.",
  },
  {
    step: "02",
    title: "View & Choose",
    description: "Explore photos, amenities, and reviews to find your perfect match.",
  },
  {
    step: "03",
    title: "Book Securely",
    description: "Reserve your apartment and pay securely through Paystack.",
  },
  {
    step: "04",
    title: "Enjoy Your Stay",
    description: "Check in and enjoy your premium Nestora apartment.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background slideshow */}
        <HeroSlideshow />

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-3xl">
            <p className="text-soft-gold text-sm font-semibold uppercase tracking-widest mb-4">
              Your comfort, your space.
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-tight mb-6">
              Find a Place That{" "}
              <span className="text-soft-gold">Feels Like Home.</span>
            </h1>
            <p className="text-white/80 text-lg mb-10 max-w-xl leading-relaxed">
              Discover premium apartments across Nigeria&apos;s finest cities.
              Comfortable, stylish, and ready for your stay.
            </p>

            {/* Search bar */}
            <div className="max-w-3xl">
              <SearchBar />
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { value: "500+", label: "Happy Guests" },
                { value: "50+", label: "Premium Apartments" },
                { value: "4", label: "Major Cities" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-semibold text-white">{value}</p>
                  <p className="text-white/60 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED APARTMENTS ───────────────────────────────────────── */}
      <section className="py-20 bg-warm-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <SectionHeading
              eyebrow="Handpicked Stays"
              title="Featured Apartments"
              description="Our most beloved properties, selected for their exceptional comfort and quality."
            />
            <Link
              href="/apartments"
              className="flex items-center gap-2 text-sm font-medium text-forest-green hover:text-soft-gold transition-colors shrink-0"
            >
              View all apartments
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredApartments.slice(0, 6).map((apt) => (
              <ApartmentCard key={apt.id} apartment={apt} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY NESTORA ───────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Why Choose Us"
            title="The Nestora Difference"
            description="We go beyond accommodation to deliver an experience you'll want to return to."
            centered
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {whyUs.map(({ icon: Icon, title, description }) => (
              <div key={title} className="group text-center p-6 rounded-2xl hover:bg-forest-green/3 transition-colors">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-forest-green/8 text-forest-green mx-auto mb-5 group-hover:bg-forest-green group-hover:text-warm-ivory transition-all duration-300">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-lg font-semibold text-forest-green mb-2">
                  {title}
                </h3>
                <p className="text-sm text-charcoal/60 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="py-20 bg-forest-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Simple Process"
            title="How Booking Works"
            description="Reserve your perfect apartment in minutes, from anywhere."
            centered
            light
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {howItWorks.map(({ step, title, description }) => (
              <div key={step} className="relative text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-soft-gold/20 text-soft-gold font-display text-lg font-semibold mx-auto mb-5">
                  {step}
                </div>
                <h3 className="font-display text-lg font-semibold text-warm-ivory mb-2">
                  {title}
                </h3>
                <p className="text-sm text-warm-ivory/60 leading-relaxed">
                  {description}
                </p>
                {/* Connector line */}
                {step !== "04" && (
                  <div className="hidden lg:block absolute top-6 left-[calc(50%+32px)] right-0 h-px bg-soft-gold/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POPULAR DESTINATIONS ──────────────────────────────────────── */}
      <section className="py-20 bg-warm-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Top Cities"
            title="Popular Destinations"
            description="Find your ideal apartment in Nigeria's most vibrant cities."
            centered
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {destinations.map((dest) => (
              <Link
                key={dest.city}
                href={`/apartments?city=${dest.city}`}
                className="group relative overflow-hidden rounded-2xl aspect-[3/4] block"
              >
                <Image
                  src={dest.image}
                  alt={dest.label}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin size={13} className="text-soft-gold" />
                    <span className="text-xs text-white/70">{dest.count} apartment{dest.count !== 1 ? "s" : ""}</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-white">
                    {dest.label}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Guest Reviews"
            title="What Our Guests Say"
            description="Real experiences from real guests who have stayed with us."
            centered
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-warm-ivory/60 rounded-2xl p-6 border border-charcoal/8"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < t.rating
                          ? "text-soft-gold fill-soft-gold"
                          : "text-charcoal/20"
                      }
                    />
                  ))}
                </div>
                {/* Review text */}
                <p className="text-sm text-charcoal/70 leading-relaxed mb-5 italic">
                  &ldquo;{t.review}&rdquo;
                </p>
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-forest-green text-warm-ivory text-xs font-semibold shrink-0">
                    {t.avatarInitials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">
                      {t.name}
                    </p>
                    <p className="text-xs text-charcoal/50">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ────────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
            alt="Comfortable apartment"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-forest-green/80" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-soft-gold text-sm font-semibold uppercase tracking-widest mb-4">
            Ready to Book?
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white mb-5">
            Your Perfect Stay Awaits
          </h2>
          <p className="text-white/70 text-base mb-8 leading-relaxed">
            Browse our curated collection of premium apartments and find the
            perfect place to call home during your next visit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apartments"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-soft-gold text-white rounded-xl font-medium hover:bg-soft-gold/90 transition-colors"
            >
              Browse Apartments
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/30 rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
