// Empty = relative /api via Vite proxy (required for cookies in dev)
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

type ApiError = { error?: string; message?: string; details?: unknown };

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(
      err.error ?? err.message ?? `Request failed (${res.status})`
    );
  }

  return data as T;
}

export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string }) =>
      request<{ user: import("../types/models.js").UserProfile }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      request<{ user: import("../types/models.js").UserProfile }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    logout: () =>
      request<{ message: string }>("/api/auth/logout", { method: "POST" }),
    me: () =>
      request<{ user: import("../types/models.js").UserProfile }>("/api/auth/me"),
  },
  properties: {
    list: () =>
      request<{ properties: import("../types/models.js").Property[] }>(
        "/api/properties"
      ),
    get: (id: string) =>
      request<{ property: import("../types/models.js").Property }>(
        `/api/properties/${id}`
      ),
    create: (body: Omit<import("../types/models.js").Property, "id" | "userId" | "listingAgentId"> & { listingAgentId?: string | null }) =>
      request<{ property: import("../types/models.js").Property }>(
        "/api/properties",
        { method: "POST", body: JSON.stringify(body) }
      ),
    update: (id: string, body: Partial<import("../types/models.js").Property>) =>
      request<{ property: import("../types/models.js").Property }>(
        `/api/properties/${id}`,
        { method: "PUT", body: JSON.stringify(body) }
      ),
    delete: (id: string) =>
      request<{ message: string }>(`/api/properties/${id}`, {
        method: "DELETE",
      }),
  },
  bookings: {
    list: () =>
      request<{ bookings: import("../types/models.js").Booking[] }>(
        "/api/bookings"
      ),
    create: (body: {
      propertyId: string;
      checkInDate: string;
      checkOutDate: string;
    }) =>
      request<{ booking: import("../types/models.js").Booking }>(
        "/api/bookings",
        { method: "POST", body: JSON.stringify(body) }
      ),
    delete: (id: string) =>
      request<{ message: string }>(`/api/bookings/${id}`, {
        method: "DELETE",
      }),
  },
};
