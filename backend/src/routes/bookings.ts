import { Hono } from "hono";
import { createUserClient } from "../lib/supabase.js";
import { calculateTotalPrice } from "../lib/booking-price.js";
import { mapBooking } from "../lib/mappers.js";
import {
  createBookingSchema,
  updateBookingSchema,
} from "../schemas/validation.js";
import type { BookingRow, PropertyRow } from "../types/models.js";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";

const bookings = new Hono<{ Variables: AuthVariables }>();

bookings.get("/", requireAuth, async (c) => {
  const token = c.get("accessToken");
  const client = createUserClient(token);

  const { data, error } = await client
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  const rows = (data ?? []) as BookingRow[];
  return c.json({ bookings: rows.map(mapBooking) });
});

bookings.get("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const token = c.get("accessToken");
  const client = createUserClient(token);

  const { data, error } = await client
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle<BookingRow>();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  if (!data) {
    return c.json({ error: "Booking not found" }, 404);
  }

  return c.json({ booking: mapBooking(data) });
});

bookings.post("/", requireAuth, async (c) => {
  const body: unknown = await c.req.json();
  const parsed = createBookingSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const user = c.get("user");
  const token = c.get("accessToken");
  const client = createUserClient(token);

  const { data: property, error: propertyError } = await client
    .from("properties")
    .select("id, price_per_night, availability")
    .eq("id", parsed.data.propertyId)
    .maybeSingle<Pick<PropertyRow, "id" | "price_per_night" | "availability">>();

  if (propertyError) {
    return c.json({ error: propertyError.message }, 500);
  }

  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  if (!property.availability) {
    return c.json({ error: "Property is not available" }, 400);
  }

  let totalPrice: number;
  try {
    totalPrice = calculateTotalPrice(
      Number(property.price_per_night),
      parsed.data.checkInDate,
      parsed.data.checkOutDate
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid dates";
    return c.json({ error: message }, 400);
  }

  const insertRow = {
    user_id: user.id,
    property_id: parsed.data.propertyId,
    check_in_date: parsed.data.checkInDate,
    check_out_date: parsed.data.checkOutDate,
    total_price: totalPrice,
  };

  const { data, error } = await client
    .from("bookings")
    .insert(insertRow)
    .select("*")
    .single<BookingRow>();

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({ booking: mapBooking(data) }, 201);
});

bookings.put("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const body: unknown = await c.req.json();
  const parsed = updateBookingSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const token = c.get("accessToken");
  const client = createUserClient(token);

  const { data: existing, error: fetchError } = await client
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle<BookingRow>();

  if (fetchError) {
    return c.json({ error: fetchError.message }, 500);
  }

  if (!existing) {
    return c.json({ error: "Booking not found" }, 404);
  }

  const { data: property, error: propertyError } = await client
    .from("properties")
    .select("price_per_night")
    .eq("id", existing.property_id)
    .maybeSingle<Pick<PropertyRow, "price_per_night">>();

  if (propertyError) {
    return c.json({ error: propertyError.message }, 500);
  }

  const checkIn = parsed.data.checkInDate ?? existing.check_in_date;
  const checkOut = parsed.data.checkOutDate ?? existing.check_out_date;
  const pricePerNight = property?.price_per_night;

  if (pricePerNight === undefined) {
    return c.json({ error: "Could not resolve property price" }, 500);
  }

  let totalPrice: number;
  try {
    totalPrice = calculateTotalPrice(Number(pricePerNight), checkIn, checkOut);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid dates";
    return c.json({ error: message }, 400);
  }

  const { data, error } = await client
    .from("bookings")
    .update({
      check_in_date: checkIn,
      check_out_date: checkOut,
      total_price: totalPrice,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle<BookingRow>();

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  if (!data) {
    return c.json({ error: "Booking not found or not authorized" }, 404);
  }

  return c.json({ booking: mapBooking(data) });
});

bookings.delete("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const token = c.get("accessToken");
  const client = createUserClient(token);

  const { data, error } = await client
    .from("bookings")
    .delete()
    .eq("id", id)
    .select("*")
    .maybeSingle<BookingRow>();

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  if (!data) {
    return c.json({ error: "Booking not found or not authorized" }, 404);
  }

  return c.json({ message: "Booking deleted", booking: mapBooking(data) });
});

export default bookings;
