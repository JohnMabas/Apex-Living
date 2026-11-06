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
import { getPublicApartment } from "@/services/apartmentService";
import type { Apartment } from "@/types";
import { formatPrice, resolveMediaUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function loadApartment(id: string): Promise<Apartment | null> {
  try {
    return await getPublicApartment(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const apartment = await loadApartment(id);

  if (!apartment) return { title: "Apartment Not Found" };

  return {
    title: `${apartment.title} — ${apartment.location}`,
    description: apartment.description.slice(0, 155),
  };
}

export default async function ApartmentDetailPage({ params }: Props) {
  const { id } = await params;
  const apartment = await loadApartment(id);

  if (!apartment) notFound();

  const images = apartment.images
    .map((image) => resolveMediaUrl(image.url))
    .filter((url): url is string => Boolean(url));

  const houseRules = [
    apartment.smokingPolicy,
    apartment.petPolicy,
    ...(apartment.additionalRules ? [apartment.additionalRules] : []),
  ];

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
              {apartment.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-soft-gold shrink-0" />
                <span className="text-sm text-charcoal/70">
                  {apartment.location}, {apartment.city}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star size={14} className="text-soft-gold fill-soft-gold" />
                <span className="text-sm font-medium text-charcoal">
                  {apartment.rating > 0 ? apartment.rating.toFixed(1) : "New"}
                </span>
                <span className="text-sm text-charcoal/50">
                  ({apartment.reviewCount} review
                  {apartment.reviewCount !== 1 ? "s" : ""})
                </span>
              </div>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-2xl font-semibold text-forest-green">
              {formatPrice(apartment.pricePerNight)}
            </p>
            <p className="text-sm text-charcoal/50">per night</p>
          </div>
        </div>

        {/* Gallery */}
        <div className="mb-10">
          {images.length > 0 ? (
            <ImageGallery images={images} title={apartment.title} />
          ) : (
            <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-charcoal/20 bg-white/60">
              <p className="text-sm text-charcoal/50">
                Photos for this apartment are coming soon.
              </p>
            </div>
          )}
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
                  {apartment.bedrooms}
                </p>
                <p className="text-xs text-charcoal/50">
                  Bedroom{apartment.bedrooms !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-charcoal/8 text-center">
                <Bath
                  size={22}
                  className="text-forest-green mx-auto mb-2"
                  strokeWidth={1.5}
                />
                <p className="text-lg font-semibold text-charcoal">
                  {apartment.bathrooms}
                </p>
                <p className="text-xs text-charcoal/50">
                  Bathroom{apartment.bathrooms !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-charcoal/8 text-center">
                <Users
                  size={22}
                  className="text-forest-green mx-auto mb-2"
                  strokeWidth={1.5}
                />
                <p className="text-lg font-semibold text-charcoal">
                  {apartment.maxGuests}
                </p>
                <p className="text-xs text-charcoal/50">Max guests</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-display text-xl font-semibold text-forest-green mb-3">
                About this apartment
              </h2>
              <p className="text-charcoal/70 leading-relaxed whitespace-pre-line">
                {apartment.description}
              </p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
                Amenities
              </h2>
              {apartment.amenities.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {apartment.amenities.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center gap-2.5 bg-white rounded-lg px-3 py-2.5 border border-charcoal/8"
                    >
                      <CheckCircle2
                        size={15}
                        className="text-forest-green shrink-0"
                      />
                      <span className="text-sm text-charcoal/80">
                        {amenity.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-charcoal/50">
                  Amenity details are being updated.
                </p>
              )}
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
                  <p className="text-sm font-medium text-forest-green">
                    {apartment.checkInInfo}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-charcoal/8">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-soft-gold" />
                    <span className="text-sm font-semibold text-charcoal">
                      Check-out
                    </span>
                  </div>
                  <p className="text-sm font-medium text-forest-green">
                    {apartment.checkOutInfo}
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
                {houseRules.map((rule) => (
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
                    {apartment.address}
                  </span>
                </div>
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
                apartmentId={apartment.id}
                pricePerNight={apartment.pricePerNight}
                maxGuests={apartment.maxGuests}
                rating={apartment.rating}
                reviewCount={apartment.reviewCount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
