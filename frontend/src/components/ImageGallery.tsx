"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
  };

  const next = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % images.length);
  };

  const mainImage = images[0];
  const thumbnails = images.slice(1, 5);

  return (
    <>
      {/* Gallery grid */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[360px] sm:h-[480px] rounded-2xl overflow-hidden">
        {/* Main image */}
        <button
          className="col-span-4 sm:col-span-2 row-span-2 relative overflow-hidden focus:outline-none group"
          onClick={() => openLightbox(0)}
          aria-label={`View ${title} image 1`}
        >
          <Image
            src={mainImage}
            alt={`${title} — main image`}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/10 transition-colors duration-300" />
        </button>

        {/* Thumbnails */}
        {thumbnails.map((src, i) => (
          <button
            key={src}
            className="col-span-2 sm:col-span-1 relative overflow-hidden focus:outline-none group"
            onClick={() => openLightbox(i + 1)}
            aria-label={`View ${title} image ${i + 2}`}
          >
            <Image
              src={src}
              alt={`${title} — image ${i + 2}`}
              fill
              sizes="25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/10 transition-colors duration-300" />
            {/* Show "more" overlay on last thumbnail if there are more images */}
            {i === thumbnails.length - 1 && images.length > 5 && (
              <div className="absolute inset-0 bg-charcoal/50 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  +{images.length - 5} more
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/95 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close gallery"
          >
            <X size={20} />
          </button>

          {/* Prev */}
          <button
            onClick={prev}
            className="absolute left-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Image */}
          <div className="relative w-full max-w-4xl aspect-video">
            <Image
              src={images[lightboxIndex]}
              alt={`${title} — image ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Next */}
          <button
            onClick={next}
            className="absolute right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight size={22} />
          </button>

          {/* Counter */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
