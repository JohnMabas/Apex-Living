import Image from "next/image";
import Link from "next/link";
import { BedDouble, Bath, Users, Star, MapPin, Home } from "lucide-react";
import type { Apartment } from "@/types";
import { formatPrice, resolveMediaUrl } from "@/lib/format";

interface ApartmentCardProps {
  apartment: Apartment;
}

export default function ApartmentCard({ apartment }: ApartmentCardProps) {
  const imageUrl = resolveMediaUrl(apartment.mainImage);

  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-charcoal/8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
      {/* Image */}
      <Link
        href={`/apartments/${apartment.id}`}
        className="relative block overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative aspect-[4/3] bg-forest-green/5">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={apartment.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Home size={40} className="text-forest-green/20" strokeWidth={1.2} />
            </div>
          )}
          {/* Rating badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
            <Star size={12} className="text-soft-gold fill-soft-gold" />
            <span className="text-xs font-semibold text-charcoal">
              {apartment.rating > 0 ? apartment.rating.toFixed(1) : "New"}
            </span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Location */}
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={13} className="text-soft-gold shrink-0" />
          <span className="text-xs text-charcoal/60 truncate">
            {apartment.location}, {apartment.city}
          </span>
        </div>

        {/* Title */}
        <Link href={`/apartments/${apartment.id}`} className="mb-3 group/title">
          <h3 className="font-display text-lg font-semibold text-forest-green group-hover/title:text-soft-gold transition-colors leading-tight">
            {apartment.title}
          </h3>
        </Link>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <span className="flex items-center gap-1.5 text-xs text-charcoal/60">
            <BedDouble size={14} className="text-forest-green/60" />
            {apartment.bedrooms} bed{apartment.bedrooms !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-charcoal/60">
            <Bath size={14} className="text-forest-green/60" />
            {apartment.bathrooms} bath{apartment.bathrooms !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-charcoal/60">
            <Users size={14} className="text-forest-green/60" />
            Up to {apartment.maxGuests}
          </span>
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-charcoal/8">
          <div>
            <span className="text-lg font-semibold text-forest-green">
              {formatPrice(apartment.pricePerNight)}
            </span>
            <span className="text-xs text-charcoal/50 ml-1">/ night</span>
          </div>
          <Link
            href={`/apartments/${apartment.id}`}
            className="text-xs font-medium px-4 py-2 rounded-lg bg-forest-green/5 text-forest-green border border-forest-green/20 hover:bg-forest-green hover:text-warm-ivory transition-all duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
