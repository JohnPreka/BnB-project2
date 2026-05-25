import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Property } from "../types/models";

function nightsBetween(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.properties
      .get(id)
      .then(({ property: p }) => setProperty(p))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const estimatedTotal =
    property && checkIn && checkOut && checkOut > checkIn
      ? property.pricePerNight * nightsBetween(checkIn, checkOut)
      : null;

  const handleBook = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!id) return;

    setError("");
    setBooking(true);
    try {
      const { booking: created } = await api.bookings.create({
        propertyId: id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      });
      navigate("/bookings", { state: { message: `Bokning skapad! Totalt: ${created.totalPrice} kr` } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bokning misslyckades");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <p>Laddar…</p>;
  if (!property) return <p className="error">{error || "Boende hittades inte"}</p>;

  return (
    <section className="detail">
      <Link to="/properties">← Tillbaka</Link>
      <h1>{property.name}</h1>
      <p className="location">{property.location}</p>
      <p className="price">{property.pricePerNight} kr / natt</p>
      <p>{property.description}</p>
      <span className={`badge ${property.availability ? "available" : "unavailable"}`}>
        {property.availability ? "Tillgänglig" : "Ej tillgänglig"}
      </span>

      {property.availability && (
        <section className="card booking-form">
          <h2>Boka vistelse</h2>
          {!user && (
            <p>
              <Link to="/login">Logga in</Link> för att boka.
            </p>
          )}
          {user && (
            <form onSubmit={(e) => void handleBook(e)}>
              {error && <p className="error">{error}</p>}
              <label>
                Incheckning
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                />
              </label>
              <label>
                Utcheckning
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                />
              </label>
              {estimatedTotal !== null && estimatedTotal > 0 && (
                <p className="estimate">
                  Uppskattat totalpris: <strong>{estimatedTotal} kr</strong> (backend
                  beräknar slutgiltigt pris)
                </p>
              )}
              <button type="submit" className="btn btn-primary" disabled={booking}>
                {booking ? "Bokar…" : "Boka nu"}
              </button>
            </form>
          )}
        </section>
      )}
    </section>
  );
}
