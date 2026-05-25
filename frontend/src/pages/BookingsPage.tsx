import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Booking, Property } from "../types/models";

export function BookingsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const message = (location.state as { message?: string } | null)?.message;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const [{ bookings: list }, { properties: all }] = await Promise.all([
          api.bookings.list(),
          api.properties.list(),
        ]);
        setBookings(list);
        const map: Record<string, Property> = {};
        for (const p of all) map[p.id] = p;
        setProperties(map);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kunde inte hämta bokningar");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Avboka / ta bort bokning?")) return;
    try {
      await api.bookings.delete(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunde inte ta bort");
    }
  };

  if (!user) {
    return (
      <section>
        <p>
          <Link to="/login">Logga in</Link> för att se dina bokningar.
        </p>
      </section>
    );
  }

  if (loading) return <p>Laddar bokningar…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <h1>Mina bokningar</h1>
      {message && <p className="success">{message}</p>}
      {bookings.length === 0 ? (
        <p className="empty">
          Inga bokningar ännu. <Link to="/properties">Bläddra boenden</Link>
        </p>
      ) : (
        <ul className="booking-list">
          {bookings.map((b) => (
            <li key={b.id} className="booking-card">
              <h2>{properties[b.propertyId]?.name ?? "Boende"}</h2>
              <p>
                {b.checkInDate} → {b.checkOutDate}
              </p>
              <p className="price">Totalt: {b.totalPrice} kr</p>
              <p className="meta">Skapad: {new Date(b.createdAt).toLocaleString("sv-SE")}</p>
              <button type="button" onClick={() => void handleDelete(b.id)}>
                Ta bort
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
