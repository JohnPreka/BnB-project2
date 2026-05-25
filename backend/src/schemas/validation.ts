import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createPropertySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
  location: z.string().min(1).max(300),
  pricePerNight: z.number().positive(),
  availability: z.boolean().optional().default(true),
  listingAgentId: z.string().uuid().nullable().optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const createBookingSchema = z.object({
  propertyId: z.string().uuid(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateBookingSchema = z.object({
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
