export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt?: string;
}

export interface Property {
  id: string;
  name: string;
  description: string;
  location: string;
  pricePerNight: number;
  availability: boolean;
  userId: string;
  listingAgentId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  createdAt: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  userId: string;
  propertyId: string;
}

export interface PropertyRow {
  id: string;
  name: string;
  description: string;
  location: string;
  price_per_night: number;
  availability: boolean;
  user_id: string;
  listing_agent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingRow {
  id: string;
  created_at: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  user_id: string;
  property_id: string;
}

export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}
