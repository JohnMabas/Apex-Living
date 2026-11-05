import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  Heart,
  MapPin,
  Award,
  Users,
  ArrowRight,
} from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

export const metadata = {
  title: "About Us",
  description:
    "Learn about Nestora — our mission, our values, and why thousands of guests trust us for their stays across Nigeria.",
};

const values = [
  {
    icon: Heart,
    title: "Comfort First",
    description:
      "Every apartment in our collection is chosen with your comfort in mind. We inspect each property personally before listing it.",
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    description:
      "Your safety is our priority. Verified listings, secure payments, and 24/7 support give you complete peace of mind.",
  },
  {
    icon: MapPin,
    title: "Local Knowledge",
    description:
      "We know Nigeria's cities intimately. Our local expertise helps you find the right neighbourhood for your needs.",
  },
  {
    icon: Award,
    title: "Quality Standards",
    description:
      "We maintain strict quality standards. If an apartment doesn't meet our benchmark, it doesn't make our platform.",
  },
];

const team = [
  {
    name: "Adaora Chukwu",
    role: "Founder & CEO",
    initials: "AC",
  },
  {
    name: "Tunde Bakare",
    role: "Head of Operations",
    initials: "TB",
  },
  {
    name: "Chisom Obi",
    role: "Customer Experience Lead",
    initials: "CO",
  },
  {
    name: "Musa Ibrahim",
    role: "Property Relations Manager",
    initials: "MI",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
            alt="Nestora apartment interior"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/60" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-soft-gold text-sm font-semibold uppercase tracking-widest mb-4">
            Our Story
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white mb-5 leading-tight">
            Built Around Your Comfort
          </h1>
          <p className="text-white/75 text-lg leading-relaxed max-w-2xl mx-auto">
            Nestora was born from a simple belief: everyone deserves a beautiful
            place to stay that truly feels like home.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeading
                eyebrow="Who We Are"
                title="A Platform Built on Trust"
                description="Nestora is Nigeria's premier apartment booking platform, connecting guests with premium short-stay properties across the country's most vibrant cities."
              />
              <p className="text-charcoal/65 leading-relaxed mt-5">
                We started with a straightforward observation: finding quality
                short-stay accommodation in Nigeria was harder than it needed to
                be. Too many platforms made promises they couldn&apos;t keep — poor
                photography, inaccurate descriptions, and zero accountability.
              </p>
              <p className="text-charcoal/65 leading-relaxed mt-4">
                We built Nestora to be different. Every apartment on our
                platform is personally verified. Every price is transparent.
                Every booking is protected. And if anything ever goes wrong, our
                team is available around the clock to make it right.
              </p>
            </div>
            <div className="relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80"
                  alt="Premium Nestora apartment"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-lg p-5 border border-charcoal/8">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-forest-green/8">
                    <Users size={22} className="text-forest-green" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-forest-green">500+</p>
                    <p className="text-xs text-charcoal/50">Happy Guests</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision blocks */}
      <section className="py-20 bg-warm-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-forest-green rounded-2xl p-8 lg:p-10">
              <p className="text-soft-gold text-xs font-semibold uppercase tracking-widest mb-3">
                Our Mission
              </p>
              <h2 className="font-display text-2xl font-semibold text-warm-ivory mb-4">
                Making Every Stay Memorable
              </h2>
              <p className="text-warm-ivory/70 leading-relaxed">
                To provide guests across Nigeria with access to beautiful,
                verified, and comfortable apartment accommodation — delivered
                with simplicity, transparency, and care.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 lg:p-10 border border-charcoal/8">
              <p className="text-soft-gold text-xs font-semibold uppercase tracking-widest mb-3">
                Our Vision
              </p>
              <h2 className="font-display text-2xl font-semibold text-forest-green mb-4">
                Nigeria&apos;s Most Trusted Stay Platform
              </h2>
              <p className="text-charcoal/65 leading-relaxed">
                To become the most trusted name in short-stay accommodation
                across Nigeria, setting the standard for quality, reliability,
                and genuine hospitality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our Values"
            title="What We Stand For"
            description="These principles guide every decision we make and every apartment we list."
            centered
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {values.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl border border-charcoal/8 hover:border-forest-green/20 hover:shadow-sm transition-all duration-300"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-forest-green/8 text-forest-green mb-5 group-hover:bg-forest-green group-hover:text-warm-ivory transition-all duration-300">
                  <Icon size={22} strokeWidth={1.5} />
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

      {/* Team */}
      <section className="py-20 bg-warm-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="The People Behind Nestora"
            title="Meet Our Team"
            description="A small, dedicated team passionate about hospitality and technology."
            centered
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {team.map((member) => (
              <div key={member.name} className="text-center group">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-forest-green text-warm-ivory font-display text-xl font-semibold mx-auto mb-4 group-hover:bg-soft-gold transition-colors duration-300">
                  {member.initials}
                </div>
                <h3 className="font-semibold text-charcoal text-sm">
                  {member.name}
                </h3>
                <p className="text-xs text-charcoal/50 mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-forest-green">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-soft-gold text-sm font-semibold uppercase tracking-widest mb-4">
            Ready to Experience Nestora?
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-warm-ivory mb-5">
            Find Your Perfect Apartment Today
          </h2>
          <p className="text-warm-ivory/70 mb-8 leading-relaxed">
            Browse our curated collection of premium apartments and discover
            what it means to stay somewhere truly comfortable.
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
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-warm-ivory border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
