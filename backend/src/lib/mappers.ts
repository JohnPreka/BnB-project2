import type {
  Booking,
  BookingRow,
  ProfileRow,
  Property,
  PropertyRow,
  UserProfile,
} from "../types/models.js";

export function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    isAdmin: row.is_admin,
    createdAt: row.created_at,
  };
}

export function mapProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    location: row.location,
    pricePerNight: Number(row.price_per_night),
    availability: row.availability,
    userId: row.user_id,
    listingAgentId: row.listing_agent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    createdAt: row.created_at,
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    totalPrice: Number(row.total_price),
    userId: row.user_id,
    propertyId: row.property_id,
  };
}
