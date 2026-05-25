import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Property } from "../types/models";

export function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { properties: list } = await api.properties.list();
      setProperties(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte hämta boenden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Ta bort detta boende?")) return;
    try {
      await api.properties.delete(id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunde inte ta bort");
    }
  };

  if (loading) return <p>Laddar boenden…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <div className="page-header">
        <h1>Boenden</h1>
        {user && (
          <Link to="/properties/new" className="btn btn-primary">
            + Nytt boende
          </Link>
        )}
      </div>
      {properties.length === 0 ? (
        <p className="empty">Inga boenden ännu.</p>
      ) : (
        <ul className="property-grid">
          {properties.map((p) => (
            <li key={p.id} className="property-card">
              <h2>{p.name}</h2>
              <p className="location">{p.location}</p>
              <p className="price">{p.pricePerNight} kr / natt</p>
              <p className="desc">{p.description || "Ingen beskrivning"}</p>
              <span className={`badge ${p.availability ? "available" : "unavailable"}`}>
                {p.availability ? "Tillgänglig" : "Ej tillgänglig"}
              </span>
              <div className="card-actions">
                <Link to={`/properties/${p.id}`}>Visa / boka</Link>
                {user?.id === p.userId && (
                  <>
                    <Link to={`/properties/${p.id}/edit`}>Redigera</Link>
                    <button type="button" onClick={() => void handleDelete(p.id)}>
                      Ta bort
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
