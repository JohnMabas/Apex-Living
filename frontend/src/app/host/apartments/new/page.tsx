"use client";

import RequireAuth from "@/components/RequireAuth";
import ApartmentForm from "@/components/ApartmentForm";

export default function NewApartmentPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-warm-ivory pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ApartmentForm mode="create" />
        </div>
      </div>
    </RequireAuth>
  );
}
