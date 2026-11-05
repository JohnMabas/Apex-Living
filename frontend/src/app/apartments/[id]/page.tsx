import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  BedDouble,
  Bath,
  Users,
  Star,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import ImageGallery from "@/components/ImageGallery";
import BookingSummary from "@/components/BookingSummary";
import { apartments, formatPrice } from "@/lib/data";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return apartments.map((apt) => ({ id: apt.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const apt = apartments.find((a) => a.id === id);
  if (!apt) return { title: "Apartment Not Found" };
  return {
    title: `${apt.title} — ${apt.location}`,
    description: apt.description.slice(0, 155),
  };
}

export default async function ApartmentDetailPage({ params }: Props) {
  const { id } = await params;
  const apt = apartments.find((a) => a.id === id);

  if (!apt) notFound();

  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/apartments"
          className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-forest-green transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back to apartments
        </Link>

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-forest-green mb-2">
              {apt.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-soft-gold shrink-0" />
                <span className="text-sm text-charcoal/70">{apt.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star size={14} className="text-soft-gold fill-soft-gold" />
                <span className="text-sm font-medium text-charcoal">
                  {apt.rating.toFixed(1)}
                </span>
                <span className="text-sm text-charcoal/50">
                  ({apt.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-2xl font-semibold text-forest-green">
              {formatPrice(apt.pricePerNight)}
            </p>
            <p className="text-sm text-charcoal/50">per night</p>
          </div>
        </div>

        {/* Gallery */}
        <div className="mb-10">
          <ImageGallery images={apt.images} title={apt.title} />
        </div>

        {/* Content + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-charcoal/8 text-center">
                <BedDouble
                  size={22}
                  className="text-forest-green mx-auto mb-2"
                  strokeWidth={1.5}
                />
                <p className="text-lg font-semibold text-charcoal">
                  {apt.bedrooms}
                </p>
                <p className="text-xs text-charcoal/50">
                  Bedroom{apt.bedrooms !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-charcoal/8 text-center">
                <Bath
                  size={22}
                  className="text-forest-green mx-auto mb-2"
                  strokeWidth={1.5}
                />
                <p className="text-lg font-semibold text-charcoal">
                  {apt.bathrooms}
                </p>
                <p className="text-xs text-charcoal/50">
                  Bathroom{apt.bathrooms !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-charcoal/8 text-center">
                <Users
                  size={22}
                  className="text-forest-green mx-auto mb-2"
                  strokeWidth={1.5}
                />
                <p className="text-lg font-semibold text-charcoal">
                  {apt.guestCapacity}
                </p>
                <p className="text-xs text-charcoal/50">Max guests</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-display text-xl font-semibold text-forest-green mb-3">
                About this apartment
              </h2>
              <p className="text-charcoal/70 leading-relaxed">{apt.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
                Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {apt.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2.5 bg-white rounded-lg px-3 py-2.5 border border-charcoal/8"
                  >
                    <CheckCircle2
                      size={15}
                      className="text-forest-green shrink-0"
                    />
                    <span className="text-sm text-charcoal/80">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Check-in / Check-out */}
            <div>
              <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
                Check-in Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 border border-charcoal/8">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-soft-gold" />
                    <span className="text-sm font-semibold text-charcoal">
                      Check-in
                    </span>
                  </div>
                  <p className="text-2xl font-semibold text-forest-green">
                    {apt.checkInTime}
                  </p>
                  <p className="text-xs text-charcoal/50 mt-1">
                    Early check-in subject to availability
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-charcoal/8">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-soft-gold" />
                    <span className="text-sm font-semibold text-charcoal">
                      Check-out
                    </span>
                  </div>
                  <p className="text-2xl font-semibold text-forest-green">
                    {apt.checkOutTime}
                  </p>
                  <p className="text-xs text-charcoal/50 mt-1">
                    Late check-out subject to availability
                  </p>
                </div>
              </div>
            </div>

            {/* House rules */}
            <div>
              <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
                House Rules
              </h2>
              <div className="bg-white rounded-xl border border-charcoal/8 p-5 space-y-3">
                {apt.houseRules.map((rule) => (
                  <div key={rule} className="flex items-start gap-3">
                    <AlertCircle
                      size={15}
                      className="text-soft-gold mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-charcoal/70">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
                Location
              </h2>
              <div className="bg-white rounded-xl border border-charcoal/8 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-soft-gold" />
                  <span className="text-sm font-medium text-charcoal">
                    {apt.location}
                  </span>
                </div>
                {/* Placeholder map block */}
                <div className="rounded-lg bg-forest-green/5 border border-forest-green/10 h-36 flex items-center justify-center">
                  <p className="text-sm text-charcoal/40">
                    Interactive map available after booking
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <BookingSummary
                pricePerNight={apt.pricePerNight}
                rating={apt.rating}
                reviewCount={apt.reviewCount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
