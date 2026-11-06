"use client";

import dynamic from "next/dynamic";

const CookieConsentBanner = dynamic(
  () => import("@/components/CookieConsent"),
  { ssr: false },
);

export default function CookieConsentLoader() {
  return <CookieConsentBanner />;
}
