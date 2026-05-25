import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function PropertyFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [availability, setAvailability] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isEdit || !id) return;

    api.properties
      .get(id)
      .then(({ property }) => {
        setName(property.name);
        setDescription(property.description);
        setLocation(property.location);
        setPricePerNight(String(property.pricePerNight));
        setAvailability(property.availability);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit, user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const body = {
      name,
      description,
      location,
      pricePerNight: Number(pricePerNight),
      availability,
    };

    try {
      if (isEdit && id) {
        await api.properties.update(id, body);
      } else {
        await api.properties.create(body);
      }
      navigate("/properties");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte spara");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Laddar…</p>;

  return (
    <section className="card form-card">
      <h1>{isEdit ? "Redigera boende" : "Nytt boende"}</h1>
      <form onSubmit={(e) => void handleSubmit(e)}>
        {error && <p className="error">{error}</p>}
        <label>
          Namn
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Plats
          <input value={location} onChange={(e) => setLocation(e.target.value)} required />
        </label>
        <label>
          Beskrivning
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </label>
        <label>
          Pris per natt (kr)
          <input
            type="number"
            min="1"
            step="0.01"
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            required
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={availability}
            onChange={(e) => setAvailability(e.target.checked)}
          />
          Tillgänglig för bokning
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Sparar…" : "Spara"}
          </button>
          <Link to="/properties" className="btn btn-secondary">
            Avbryt
          </Link>
        </div>
      </form>
    </section>
  );
}
