import { z } from "zod";

// ---------------------------------------------------------------------------
// Reusable field definitions
// ---------------------------------------------------------------------------

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

const emailField = z
  .string()
  .email("Please enter a valid email address.")
  .toLowerCase()
  .trim();

const phoneField = z
  .string()
  .trim()
  .regex(/^\+?[\d\s\-().]{7,20}$/, "Please enter a valid phone number.");

const fullNameField = z
  .string()
  .trim()
  .min(3, "Full name must be at least 3 characters.")
  .max(100, "Full name is too long.");

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export const registerSchema = z
  .object({
    fullName: fullNameField,
    email: emailField.optional(),
    phone: phoneField.optional(),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.email || data.phone, {
    message: "At least one of email or phone is required.",
    path: ["email"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  emailOrPhone: z
    .string()
    .trim()
    .min(1, "Email or phone number is required."),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Forgot password
// ---------------------------------------------------------------------------

export const forgotPasswordSchema = z.object({
  emailOrPhone: z
    .string()
    .trim()
    .min(1, "Email or phone number is required."),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ---------------------------------------------------------------------------
// Reset password
// ---------------------------------------------------------------------------

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required."),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ---------------------------------------------------------------------------
// Update profile
// ---------------------------------------------------------------------------

export const updateProfileSchema = z
  .object({
    fullName: fullNameField.optional(),
    email: emailField.optional(),
    phone: phoneField.optional(),
  })
  .refine((data) => data.fullName || data.email || data.phone, {
    message: "At least one field must be provided.",
    path: ["fullName"],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ---------------------------------------------------------------------------
// Change password
// ---------------------------------------------------------------------------

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: passwordField,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match.",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must differ from the current password.",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
