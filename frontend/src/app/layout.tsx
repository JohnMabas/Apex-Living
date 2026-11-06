import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import CookieConsentLoader from "@/components/CookieConsentLoader";

export const metadata: Metadata = {
  title: {
    default: "Nestora — Your comfort, your space.",
    template: "%s | Nestora",
  },
  description:
    "Discover premium apartments across Nigeria's finest cities. Book your perfect stay with Nestora.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsentLoader />
        </AuthProvider>
      </body>
    </html>
  );
}
