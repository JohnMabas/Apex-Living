// ---------------------------------------------------------------------------
// Apartment
// ---------------------------------------------------------------------------

export interface Apartment {
  id: string;
  slug: string;
  title: string;
  location: string;
  city: string;
  description: string;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  guestCapacity: number;
  images: string[];
  mainImage: string;
  amenities: string[];
  houseRules: string[];
  checkInTime: string;
  checkOutTime: string;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
}

export interface SearchFilters {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface ApartmentFilters {
  location: string;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  guests: number | null;
  sortBy: "price-asc" | "price-desc" | "rating" | "default";
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  review: string;
  avatarInitials: string;
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Auth — form state
// ---------------------------------------------------------------------------

export interface LoginFormData {
  emailOrPhone: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

// ---------------------------------------------------------------------------
// Auth — API / user
// ---------------------------------------------------------------------------

export type UserRole = "CUSTOMER" | "ADMIN";

/** The user object returned by the backend (no password hash). */
export interface AuthUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// API response envelope
// ---------------------------------------------------------------------------

export interface ApiSuccessResponse<T = undefined> {
  status: "success";
  message?: string;
  data?: T;
}

export interface ApiErrorResponse {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T = undefined> = ApiSuccessResponse<T> | ApiErrorResponse;
