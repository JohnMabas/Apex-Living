"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Loader2,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import Button from "@/components/Button";
import { Input, Textarea } from "@/components/Input";
import type {
  Apartment,
  ApartmentAmenity,
  ApartmentFormValues,
} from "@/types";
import {
  createApartment,
  deleteApartmentImage,
  getAmenities,
  reorderApartmentImages,
  setPrimaryApartmentImage,
  updateApartment,
  uploadApartmentImage,
} from "@/services/apartmentService";
import { resolveMediaUrl } from "@/lib/format";

const PROPERTY_TYPES = [
  "Apartment",
  "Studio",
  "Duplex",
  "Penthouse",
  "Bungalow",
  "Villa",
] as const;

const SMOKING_POLICIES = [
  "No smoking",
  "Smoking allowed outdoors",
  "Smoking allowed",
] as const;

const PET_POLICIES = ["No pets", "Pets on request", "Pets allowed"] as const;

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface FormImage {
  key: string;
  url: string;
  existingId?: string;
  file?: File;
  isPrimary: boolean;
}

type FieldErrors = Partial<
  Record<keyof ApartmentFormValues | "images" | "form", string>
>;

interface ApartmentFormProps {
  mode: "create" | "edit";
  apartment?: Apartment;
}

function toFormValues(apartment?: Apartment): ApartmentFormValues {
  return {
    title: apartment?.title ?? "",
    description: apartment?.description ?? "",
    propertyType: apartment?.propertyType ?? "Apartment",
    city: apartment?.city ?? "",
    location: apartment?.location ?? "",
    address: apartment?.address ?? "",
    maxGuests: apartment?.maxGuests ?? 2,
    bedrooms: apartment?.bedrooms ?? 1,
    bathrooms: apartment?.bathrooms ?? 1,
    pricePerNight: apartment?.pricePerNight ?? 0,
    cleaningFee: apartment?.cleaningFee ?? null,
    otherFees: apartment?.otherFees ?? null,
    otherFeesNote: apartment?.otherFeesNote ?? "",
    checkInInfo: apartment?.checkInInfo ?? "",
    checkOutInfo: apartment?.checkOutInfo ?? "",
    smokingPolicy: apartment?.smokingPolicy ?? "No smoking",
    petPolicy: apartment?.petPolicy ?? "No pets",
    additionalRules: apartment?.additionalRules ?? "",
    amenityIds: apartment?.amenities.map((amenity) => amenity.id) ?? [],
  };
}

function toImages(apartment?: Apartment): FormImage[] {
  return (
    apartment?.images.map((image) => ({
      key: `existing-${image.id}`,
      url: resolveMediaUrl(image.url) ?? image.url,
      existingId: image.id,
      isPrimary: image.isPrimary,
    })) ?? []
  );
}

function validate(values: ApartmentFormValues, imageCount: number): FieldErrors {
  const errors: FieldErrors = {};

  if (values.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters.";
  }
  if (values.description.trim().length < 30) {
    errors.description = "Description must be at least 30 characters.";
  }
  if (values.city.trim().length < 2) errors.city = "City is required.";
  if (values.location.trim().length < 2) {
    errors.location = "Location is required.";
  }
  if (values.address.trim().length < 5) {
    errors.address = "Please enter the full address.";
  }
  if (values.maxGuests < 1) errors.maxGuests = "At least 1 guest is required.";
  if (values.bedrooms < 1) errors.bedrooms = "At least 1 bedroom is required.";
  if (values.bathrooms < 1) {
    errors.bathrooms = "At least 1 bathroom is required.";
  }
  if (values.pricePerNight < 1) {
    errors.pricePerNight = "Price per night is required.";
  }
  if (!values.checkInInfo.trim()) {
    errors.checkInInfo = "Check-in information is required.";
  }
  if (!values.checkOutInfo.trim()) {
    errors.checkOutInfo = "Check-out information is required.";
  }
  if (imageCount > MAX_IMAGES) {
    errors.images = `You can upload a maximum of ${MAX_IMAGES} images.`;
  }

  return errors;
}

export default function ApartmentForm({
  mode,
  apartment,
}: ApartmentFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ApartmentFormValues>(() =>
    toFormValues(apartment),
  );
  const [images, setImages] = useState<FormImage[]>(() => toImages(apartment));
  const [amenities, setAmenities] = useState<ApartmentAmenity[]>([]);
  const [amenitiesLoading, setAmenitiesLoading] = useState(true);
  const [amenitiesError, setAmenitiesError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(
    apartment?.id ?? null,
  );

  const initialExistingIds = useMemo(
    () => apartment?.images.map((image) => image.id) ?? [],
    [apartment],
  );

  useEffect(() => {
    let cancelled = false;

    getAmenities()
      .then((result) => {
        if (!cancelled) setAmenities(result);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setAmenitiesError(
            error instanceof Error ? error.message : "Could not load amenities.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setAmenitiesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function setField<K extends keyof ApartmentFormValues>(
    key: K,
    value: ApartmentFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function numberFromInput(event: ChangeEvent<HTMLInputElement>): number {
    const raw = event.target.value;
    return raw === "" ? 0 : Number(raw);
  }

  function moneyFromInput(event: ChangeEvent<HTMLInputElement>): number | null {
    const raw = event.target.value;
    return raw === "" ? null : Number(raw);
  }

  function toggleAmenity(id: string) {
    setValues((current) => ({
      ...current,
      amenityIds: current.amenityIds.includes(id)
        ? current.amenityIds.filter((amenityId) => amenityId !== id)
        : [...current.amenityIds, id],
    }));
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selected.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setErrors((current) => ({
        ...current,
        images: `You can upload a maximum of ${MAX_IMAGES} images.`,
      }));
      return;
    }

    const accepted: FormImage[] = [];

    for (const file of selected.slice(0, remaining)) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setErrors((current) => ({
          ...current,
          images: "Only JPEG, PNG, and WebP images are allowed.",
        }));
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setErrors((current) => ({
          ...current,
          images: "Each image must be smaller than 5MB.",
        }));
        continue;
      }
      accepted.push({
        key: `new-${crypto.randomUUID()}`,
        url: URL.createObjectURL(file),
        file,
        isPrimary: images.length === 0 && accepted.length === 0,
      });
    }

    if (accepted.length > 0) {
      setImages((current) => [...current, ...accepted]);
      setErrors((current) => ({ ...current, images: undefined }));
    }
  }

  function removeImage(key: string) {
    setImages((current) => {
      const next = current.filter((image) => image.key !== key);
      if (next.length > 0 && !next.some((image) => image.isPrimary)) {
        return next.map((image, index) => ({
          ...image,
          isPrimary: index === 0,
        }));
      }
      return next;
    });
  }

  function setPrimary(key: string) {
    setImages((current) =>
      current.map((image) => ({ ...image, isPrimary: image.key === key })),
    );
  }

  function moveImage(key: string, direction: -1 | 1) {
    setImages((current) => {
      const index = current.findIndex((image) => image.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate(values, images.length);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    const payload: ApartmentFormValues = {
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      city: values.city.trim(),
      location: values.location.trim(),
      address: values.address.trim(),
      otherFeesNote: values.otherFeesNote.trim(),
      checkInInfo: values.checkInInfo.trim(),
      checkOutInfo: values.checkOutInfo.trim(),
      additionalRules: values.additionalRules.trim(),
    };

    try {
      let apartmentId = workingId;

      if (!apartmentId) {
        const created = await createApartment(payload);
        apartmentId = created.id;
        setWorkingId(created.id);
      } else {
        await updateApartment(apartmentId, payload);
      }

      const keptExistingIds = images
        .map((image) => image.existingId)
        .filter((id): id is string => Boolean(id));
      const removedIds = initialExistingIds.filter(
        (id) => !keptExistingIds.includes(id),
      );

      for (const imageId of removedIds) {
        await deleteApartmentImage(apartmentId, imageId);
      }

      const uploadedIds = new Map<string, string>();
      for (const image of images) {
        if (!image.file) continue;
        const uploaded = await uploadApartmentImage(
          apartmentId,
          image.file,
          values.title.trim(),
        );
        uploadedIds.set(image.key, uploaded.id);
      }

      const orderedIds = images
        .map((image) => image.existingId ?? uploadedIds.get(image.key))
        .filter((id): id is string => Boolean(id));

      if (orderedIds.length > 0) {
        await reorderApartmentImages(apartmentId, orderedIds);
      }

      const primary = images.find((image) => image.isPrimary);
      const primaryId = primary
        ? (primary.existingId ?? uploadedIds.get(primary.key))
        : undefined;
      if (primaryId) {
        await setPrimaryApartmentImage(apartmentId, primaryId);
      }

      router.push(`/host/apartments/${apartmentId}`);
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        const fieldErrors = (
          error as Error & { fieldErrors?: Record<string, string[]> }
        ).fieldErrors;
        if (fieldErrors) {
          const mapped: FieldErrors = {};
          for (const [key, messages] of Object.entries(fieldErrors)) {
            mapped[key as keyof FieldErrors] = messages[0];
          }
          setErrors(mapped);
        }
        setFormError(error.message);
      } else {
        setFormError("Something went wrong while saving the listing.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-soft-gold font-medium mb-1">
            Host dashboard
          </p>
          <h1 className="font-display text-3xl font-semibold text-forest-green">
            {mode === "create" ? "Add a new apartment" : "Edit apartment"}
          </h1>
          <p className="text-sm text-charcoal/60 mt-1">
            {mode === "create"
              ? "Save a draft, add photos, then submit it for admin review."
              : "Update your listing details and images, then submit for review."}
          </p>
        </div>
        <Link
          href="/host/apartments"
          className="text-sm font-medium text-forest-green hover:text-soft-gold transition-colors"
        >
          Back to my apartments
        </Link>
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          Please fix the highlighted fields before saving.
        </div>
      )}

      <section className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6 space-y-5">
        <h2 className="font-display text-xl font-semibold text-forest-green">
          Listing details
        </h2>

        <Input
          label="Apartment title"
          value={values.title}
          onChange={(event) => setField("title", event.target.value)}
          error={errors.title}
          placeholder="e.g. The Sapphire Suite on Victoria Island"
          maxLength={120}
        />

        <Textarea
          label="Description"
          value={values.description}
          onChange={(event) => setField("description", event.target.value)}
          error={errors.description}
          placeholder="Describe the space, the neighbourhood, and what makes it special."
          rows={6}
          maxLength={5000}
          hint={`${values.description.trim().length}/5000 characters (minimum 30)`}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="property-type"
              className="block text-sm font-medium text-charcoal mb-1.5"
            >
              Property type
            </label>
            <select
              id="property-type"
              value={values.propertyType}
              onChange={(event) => setField("propertyType", event.target.value)}
              className="w-full rounded-lg border border-charcoal/20 bg-white px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green"
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="City"
            value={values.city}
            onChange={(event) => setField("city", event.target.value)}
            error={errors.city}
            placeholder="e.g. Lagos"
            maxLength={80}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Neighbourhood / area"
            value={values.location}
            onChange={(event) => setField("location", event.target.value)}
            error={errors.location}
            placeholder="e.g. Victoria Island"
            maxLength={120}
          />

          <Input
            label="Full address"
            value={values.address}
            onChange={(event) => setField("address", event.target.value)}
            error={errors.address}
            placeholder="Street, building, apartment number"
            maxLength={255}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Max guests"
            type="number"
            min={1}
            max={50}
            value={values.maxGuests}
            onChange={(event) => setField("maxGuests", numberFromInput(event))}
            error={errors.maxGuests}
          />
          <Input
            label="Bedrooms"
            type="number"
            min={1}
            max={50}
            value={values.bedrooms}
            onChange={(event) => setField("bedrooms", numberFromInput(event))}
            error={errors.bedrooms}
          />
          <Input
            label="Bathrooms"
            type="number"
            min={1}
            max={50}
            value={values.bathrooms}
            onChange={(event) => setField("bathrooms", numberFromInput(event))}
            error={errors.bathrooms}
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6 space-y-5">
        <h2 className="font-display text-xl font-semibold text-forest-green">
          Pricing
        </h2>

        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Price per night (₦)"
            type="number"
            min={1}
            value={values.pricePerNight}
            onChange={(event) =>
              setField("pricePerNight", numberFromInput(event))
            }
            error={errors.pricePerNight}
          />
          <Input
            label="Cleaning fee (optional)"
            type="number"
            min={0}
            value={values.cleaningFee ?? ""}
            onChange={(event) =>
              setField("cleaningFee", moneyFromInput(event))
            }
          />
          <Input
            label="Other fees (optional)"
            type="number"
            min={0}
            value={values.otherFees ?? ""}
            onChange={(event) => setField("otherFees", moneyFromInput(event))}
          />
        </div>

        <Input
          label="Other fees note (optional)"
          value={values.otherFeesNote}
          onChange={(event) => setField("otherFeesNote", event.target.value)}
          placeholder="e.g. Refundable security deposit"
          maxLength={200}
        />
      </section>

      <section className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6 space-y-5">
        <h2 className="font-display text-xl font-semibold text-forest-green">
          House rules & policies
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Check-in information"
            value={values.checkInInfo}
            onChange={(event) => setField("checkInInfo", event.target.value)}
            error={errors.checkInInfo}
            placeholder="e.g. Check-in from 2:00 PM"
            maxLength={500}
          />
          <Input
            label="Check-out information"
            value={values.checkOutInfo}
            onChange={(event) => setField("checkOutInfo", event.target.value)}
            error={errors.checkOutInfo}
            placeholder="e.g. Check-out by 11:00 AM"
            maxLength={500}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="smoking-policy"
              className="block text-sm font-medium text-charcoal mb-1.5"
            >
              Smoking policy
            </label>
            <select
              id="smoking-policy"
              value={values.smokingPolicy}
              onChange={(event) => setField("smokingPolicy", event.target.value)}
              className="w-full rounded-lg border border-charcoal/20 bg-white px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green"
            >
              {SMOKING_POLICIES.map((policy) => (
                <option key={policy} value={policy}>
                  {policy}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="pet-policy"
              className="block text-sm font-medium text-charcoal mb-1.5"
            >
              Pet policy
            </label>
            <select
              id="pet-policy"
              value={values.petPolicy}
              onChange={(event) => setField("petPolicy", event.target.value)}
              className="w-full rounded-lg border border-charcoal/20 bg-white px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green"
            >
              {PET_POLICIES.map((policy) => (
                <option key={policy} value={policy}>
                  {policy}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Textarea
          label="Additional rules (optional)"
          value={values.additionalRules}
          onChange={(event) => setField("additionalRules", event.target.value)}
          placeholder="Anything else guests should know before booking."
          rows={3}
          maxLength={2000}
        />
      </section>

      <section className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6 space-y-5">
        <div>
          <h2 className="font-display text-xl font-semibold text-forest-green">
            Amenities
          </h2>
          <p className="text-sm text-charcoal/60 mt-1">
            Select everything available at the property.
          </p>
        </div>

        {amenitiesLoading ? (
          <div className="flex items-center gap-2 text-sm text-charcoal/60">
            <Loader2 size={16} className="animate-spin" />
            Loading amenities…
          </div>
        ) : amenitiesError ? (
          <p className="text-sm text-red-600">{amenitiesError}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map((amenity) => {
              const checked = values.amenityIds.includes(amenity.id);
              return (
                <label
                  key={amenity.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm cursor-pointer transition-colors ${
                    checked
                      ? "border-forest-green/40 bg-forest-green/5 text-forest-green"
                      : "border-charcoal/10 text-charcoal/70 hover:border-charcoal/25"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAmenity(amenity.id)}
                    className="h-4 w-4 accent-forest-green"
                  />
                  {amenity.name}
                </label>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-forest-green">
              Photos
            </h2>
            <p className="text-sm text-charcoal/60 mt-1">
              Add up to {MAX_IMAGES} photos. JPEG, PNG, or WebP, max 5MB each.
            </p>
          </div>
          <label
            className={`inline-flex items-center justify-center gap-2 rounded-lg border border-forest-green/20 bg-warm-ivory px-4 py-2 text-sm font-medium text-forest-green transition-colors ${
              images.length >= MAX_IMAGES
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:bg-forest-green/5"
            }`}
          >
            <ImagePlus size={16} />
            Add photos
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              multiple
              disabled={images.length >= MAX_IMAGES}
              onChange={handleFileSelection}
              className="sr-only"
            />
          </label>
        </div>

        {errors.images && (
          <p className="text-xs text-red-500">{errors.images}</p>
        )}

        {images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-charcoal/20 bg-warm-ivory/50 px-6 py-10 text-center">
            <ImagePlus
              size={32}
              className="mx-auto mb-3 text-forest-green/30"
              strokeWidth={1.4}
            />
            <p className="text-sm font-medium text-charcoal/70">
              No photos added yet
            </p>
            <p className="text-xs text-charcoal/50 mt-1">
              Listings need at least one photo before they can be published.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <div
                key={image.key}
                className="group relative overflow-hidden rounded-xl border border-charcoal/10 bg-warm-ivory"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={image.url}
                    alt={`Apartment photo ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  {image.isPrimary && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-soft-gold px-2 py-0.5 text-[11px] font-semibold text-white">
                      <Star size={10} className="fill-white" />
                      Primary
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 bg-white px-2 py-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(image.key, -1)}
                      disabled={index === 0}
                      className="rounded-md p-1.5 text-charcoal/50 hover:bg-charcoal/5 hover:text-charcoal disabled:opacity-30"
                      aria-label="Move photo left"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(image.key, 1)}
                      disabled={index === images.length - 1}
                      className="rounded-md p-1.5 text-charcoal/50 hover:bg-charcoal/5 hover:text-charcoal disabled:opacity-30"
                      aria-label="Move photo right"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPrimary(image.key)}
                      disabled={image.isPrimary}
                      className="rounded-md p-1.5 text-charcoal/50 hover:bg-soft-gold/10 hover:text-soft-gold disabled:opacity-30"
                      aria-label="Make primary photo"
                    >
                      <Star size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(image.key)}
                      className="rounded-md p-1.5 text-charcoal/50 hover:bg-red-50 hover:text-red-500"
                      aria-label="Remove photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/host/apartments"
          className="inline-flex items-center justify-center rounded-lg border border-charcoal/20 px-6 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors"
        >
          Cancel
        </Link>
        <Button type="submit" loading={saving} size="md">
          <Plus size={16} />
          {mode === "create" ? "Save draft" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
