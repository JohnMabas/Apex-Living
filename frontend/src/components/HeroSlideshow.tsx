"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=85",
    alt: "Luxury apartment living room with modern furnishings",
  },
  {
    src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&q=85",
    alt: "Bright spacious bedroom with floor-to-ceiling windows",
  },
  {
    src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=85",
    alt: "Modern open-plan kitchen and dining area",
  },
  {
    src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1920&q=85",
    alt: "Cozy apartment interior with warm lighting",
  },
  {
    src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1920&q=85",
    alt: "Premium apartment with city view balcony",
  },
];

const INTERVAL_MS = 5000;

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setCurrent((index + slides.length) % slides.length);
  }, []);

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => goTo(current + 1), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [current, paused, goTo]);

  return (
    <div
      className="absolute inset-0 z-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== current}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-charcoal/55 z-10" />

      {/* Prev / Next buttons */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`transition-all duration-300 rounded-full ${
              i === current
                ? "w-6 h-2 bg-soft-gold"
                : "w-2 h-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
