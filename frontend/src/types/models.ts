export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
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
