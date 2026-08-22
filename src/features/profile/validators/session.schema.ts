import { z } from "zod";

// Valid PaymentMethod values (backend enum se match karo)
export const PaymentMethodEnum = z.enum([
  "razorpay",
  "stripe",
  "cash",
  "bank_transfer",
  "free",
]);

// Valid SessionType values (backend se match)
export const SessionTypeEnum = z.enum([
  "quick_call",
  "deep_dive",
  "resume_review",
  "mock_interview",
  "career_planning",
  "portfolio_review",
  "ask_query",
  "group_session",
]);

// ── Main create session schema ─────────────────────────────
export const createSessionSchema = z.object({
  mentorId: z
    .string()
    .min(1, "Mentor ID is required")
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      "Invalid mentor ID format"
    ),

  sessionType: SessionTypeEnum.refine((val) => val.length > 0, {
    message: "Session type is required",
  }),

  scheduledAt: z
    .string()
    .min(1, "Scheduled time is required")
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Invalid scheduled date")
    .refine((val) => {
      const date = new Date(val);
      // At least 5 minutes in future (buffer for form submission time)
      return date.getTime() > Date.now() + 5 * 60 * 1000;
    }, "Scheduled time must be in the future"),

  timezone: z.string().min(1, "Timezone is required"),

  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title cannot exceed 200 characters"),

  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),

  paymentMethod: PaymentMethodEnum,

  pricing: z.object({
    basePrice: z.number().min(0, "Price cannot be negative"),
    platformFee: z.number().min(0, "Platform fee cannot be negative"),
    totalAmount: z.number().min(0, "Total amount cannot be negative"),
    currency: z.string().optional().default("INR"),
  }),

  // Session-type specific fields
  interviewType: z
    .enum(["technical", "behavioral", "case_study", "hr", "system_design", "coding"])
    .optional(),

  portfolioUrl: z
    .string()
    .url("Portfolio URL must be a valid URL")
    .optional()
    .or(z.literal("")),

  targetCompany: z.string().max(100).optional().or(z.literal("")),
  targetRole: z.string().max(100).optional().or(z.literal("")),
});

export type CreateSessionFormData = z.infer<typeof createSessionSchema>;

// ── Form-level validation (extra checks) ──────────────────
export const validateSessionForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (data.serviceType === "group_session") {
    if (!data.serviceName || data.serviceName.trim().length < 10) {
      errors.serviceName = "Title must be at least 10 characters";
    }
  } else {
    if (!data.serviceName || data.serviceName.trim().length < 5) {
      errors.serviceName = "Title must be at least 5 characters";
    }
  }

  // Price validation
  if (data.serviceType === "group_session") {
    if (data.price === undefined || data.price === null || Number(data.price) < 0) {
      errors.price = "Price cannot be negative";
    }
  } else {
    if (data.paymentMethod !== "free") {
      if (!data.price || Number(data.price) <= 0) {
        errors.price = "Price must be greater than 0";
      }
    }
  }

  if (!data.scheduledAt) {
    errors.scheduledAt = "Please select a scheduled date and time";
  } else {
    const date = new Date(data.scheduledAt);
    if (date.getTime() <= Date.now() + 5 * 60 * 1000) {
      errors.scheduledAt = "Scheduled time must be at least 5 minutes in the future";
    }
  }
  if (!data.paymentMethod) {
    errors.paymentMethod = "Please select a payment method";
  }
  if (!data.serviceType) {
    errors.serviceType = "Please select a service type";
  }
  if (data.serviceType === "mock_interview" && !data.interviewType) {
    errors.interviewType = "Interview type is required for mock interview";
  }
  if (data.serviceType === "portfolio_review" && !data.portfolioUrl) {
    errors.portfolioUrl = "Portfolio URL is required for portfolio review";
  }
  if (data.serviceType === "group_session") {
    if (!data.description || data.description.trim().length < 50) {
      errors.description = "Description must be at least 50 characters";
    }
    if (!data.topic || data.topic.trim().length < 5) {
      errors.topic = "Topic must be at least 5 characters";
    }
    const minP = Number(data.minParticipants);
    const maxP = Number(data.maxParticipants);
    if (!minP || minP < 1) {
      errors.minParticipants = "Minimum participants must be at least 1";
    }
    if (!maxP || maxP < 3) {
      errors.maxParticipants = "Maximum participants must be at least 3";
    }
    if (minP && maxP && minP > maxP) {
      errors.minParticipants = "Min participants cannot exceed Max participants";
    }
  }

  return errors;
};