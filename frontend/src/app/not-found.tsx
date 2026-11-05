import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-warm-ivory px-4 text-center">
      <p className="text-soft-gold text-sm font-semibold uppercase tracking-widest mb-4">
        404
      </p>
      <h1 className="font-display text-4xl font-semibold text-forest-green mb-4">
        Page Not Found
      </h1>
      <p className="text-charcoal/60 mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center px-6 py-3 bg-forest-green text-warm-ivory rounded-xl text-sm font-medium hover:bg-forest-green/90 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
