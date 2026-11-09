// ---------------------------------------------------------------------------
// Apartment
// ---------------------------------------------------------------------------

export type ApartmentStatus =
  | "DRAFT"
  | "PENDING"
  | "PUBLISHED"
  | "REJECTED"
  | "SUSPENDED"
  | "ARCHIVED";

export interface ApartmentImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
  isPrimary: boolean;
}

export interface ApartmentAmenity {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface ApartmentHost {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
}

export interface Apartment {
  id: string;
  slug: string;
  title: string;
  description: string;
  propertyType: string;
  city: string;
  location: string;
  address: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  pricePerNight: number;
  cleaningFee: number | null;
  otherFees: number | null;
  otherFeesNote: string | null;
  checkInInfo: string;
  checkOutInfo: string;
  smokingPolicy: string;
  petPolicy: string;
  additionalRules: string | null;
  status: ApartmentStatus;
  isFeatured: boolean;
  isDemo: boolean;
  rating: number;
  reviewCount: number;
  images: ApartmentImage[];
  mainImage: string | null;
  amenities: ApartmentAmenity[];
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string | null;
  reviewNotes?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  publishedAt?: string | null;
  suspendedAt?: string | null;
  host?: ApartmentHost;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApartmentListResult {
  apartments: Apartment[];
  meta: PaginationMeta;
}

export interface HostApartmentStats {
  total: number;
  draft: number;
  pending: number;
  published: number;
  rejected: number;
  suspended: number;
  archived: number;
  recent: Apartment[];
}

export type AdminApartmentStats = Omit<HostApartmentStats, "recent">;

export interface PublicApartmentFilters {
  city?: string;
  location?: string;
  search?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  bedrooms?: number | null;
  guests?: number | null;
  sortBy?: "newest" | "price-asc" | "price-desc" | "rating";
  page?: number;
  limit?: number;
}

export interface ApartmentFormValues {
  title: string;
  description: string;
  propertyType: string;
  city: string;
  location: string;
  address: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  pricePerNight: number;
  cleaningFee: number | null;
  otherFees: number | null;
  otherFeesNote: string;
  checkInInfo: string;
  checkOutInfo: string;
  smokingPolicy: string;
  petPolicy: string;
  additionalRules: string;
  amenityIds: string[];
}

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

export type BookingStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "DECLINED";

export interface BookingApartment {
  id: string;
  title: string;
  city: string;
  location: string;
  address: string;
  checkInInfo: string;
  checkOutInfo: string;
  hostId: string;
  mainImage: string | null;
  mainImageAlt: string | null;
}

export interface BookingGuest {
  id: string | null;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  specialRequests: string | null;
  arrivalTime: string | null;
  additionalNotes: string | null;
}

export interface BookingStatusHistoryEntry {
  id: string;
  status: BookingStatus;
  note: string | null;
  createdAt: string;
  changedBy: { id: string; fullName: string } | null;
}

export interface Booking {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  isGuestBooking: boolean;
  termsAcceptedAt: string | null;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  numberOfNights: number;
  nightlyPriceSnapshot: number;
  accommodationSubtotal: number;
  cleaningFeeSnapshot: number | null;
  additionalFeesSnapshot: number | null;
  totalAmount: number;
  currency: string;
  expiresAt: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  adminNotes: string | null;
  apartment: BookingApartment;
  guest: BookingGuest;
  latestPayment: {
    paymentReference: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    paidAt: string | null;
  } | null;
  statusHistory: BookingStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface BookingListResult {
  bookings: Booking[];
  meta: PaginationMeta;
}

export interface AvailabilityPricing {
  nightlyPriceSnapshot: number;
  accommodationSubtotal: number;
  cleaningFeeSnapshot: number | null;
  additionalFeesSnapshot: number | null;
  otherFeesNote: string | null;
  totalAmount: number;
  currency: string;
}

export interface AvailabilityResult {
  available: boolean;
  apartment: { id: string; title: string; maxGuests: number };
  checkIn: string;
  checkOut: string;
  numberOfNights: number;
  numberOfGuests: number;
  pricing: AvailabilityPricing;
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
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  hasPassword: boolean;
  isGoogleLinked: boolean;
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
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T = undefined> = ApiSuccessResponse<T> | ApiErrorResponse;

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export type PaymentStatus =
  | "INITIALIZED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "ABANDONED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface Payment {
  id: string;
  paymentReference: string;
  paystackReference: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  paidAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  booking?: {
    bookingReference: string;
    apartment: { title: string; city: string; location: string };
  };
}

export interface PaymentListResult {
  payments: Payment[];
  meta: PaginationMeta;
}

export interface EmailPreference {
  promotionalEmailsEnabled: boolean;
  consentGivenAt: string | null;
  unsubscribedAt: string | null;
}

export interface CookieConsent {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

// ---------------------------------------------------------------------------
// Guest booking (no account)
// ---------------------------------------------------------------------------

export interface CreateBookingFormData {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  phone: string;
  country: string;
  specialRequests?: string;
  arrivalTime?: string;
  additionalNotes?: string;
  acceptTerms: boolean;
}

export interface GuestBookingFormData {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  specialRequests?: string;
  arrivalTime?: string;
  additionalNotes?: string;
  acceptTerms: boolean;
}

export interface GuestBookingResult {
  booking: Booking;
  accessToken: string;
}

// ---------------------------------------------------------------------------
// Availability Block — Phase 7
// ---------------------------------------------------------------------------

export type BlockType =
  | "HOST_BLOCK"
  | "MAINTENANCE"
  | "RENOVATION"
  | "PERSONAL_USE"
  | "OTHER";

export interface AvailabilityBlock {
  id: string;
  apartmentId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  blockType: BlockType;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  apartment?: { id: string; title: string };
}

export interface AvailabilityData {
  blockedDates: {
    checkIn: string;
    checkOut: string;
    status: string;
    type: "booking";
  }[];
  availabilityBlocks: {
    id: string;
    startDate: string;
    endDate: string;
    blockType: BlockType;
    reason: string | null;
    type: "block";
  }[];
}

// ---------------------------------------------------------------------------
// Notification — Phase 7
// ---------------------------------------------------------------------------

export type NotificationCategory =
  | "BOOKINGS"
  | "PAYMENTS"
  | "APARTMENTS"
  | "AVAILABILITY"
  | "REFUNDS"
  | "SUPPORT"
  | "SYSTEM";

export interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResult {
  notifications: Notification[];
  meta: PaginationMeta;
  unreadCount?: number;
}

// ---------------------------------------------------------------------------
// Support Ticket — Phase 7
// ---------------------------------------------------------------------------

export type SupportTicketCategory =
  | "BOOKING_ISSUE"
  | "PAYMENT_ISSUE"
  | "CANCELLATION"
  | "REFUND"
  | "APARTMENT_ISSUE"
  | "GENERAL_ENQUIRY";

export type SupportTicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_CUSTOMER"
  | "RESOLVED"
  | "CLOSED";

export interface SupportTicketMessage {
  id: string;
  body: string;
  senderType: string;
  senderName: string | null;
  isInternal: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketReference: string;
  fullName: string;
  email: string;
  phone: string | null;
  bookingReference: string | null;
  category: SupportTicketCategory;
  subject: string;
  status: SupportTicketStatus;
  assignedToId: string | null;
  authorId: string | null;
  messages?: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketListResult {
  tickets: SupportTicket[];
  meta: PaginationMeta;
}
