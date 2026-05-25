import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate("/properties");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrering misslyckades");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card form-card">
      <h1>Registrera</h1>
      <form onSubmit={(e) => void handleSubmit(e)}>
        {error && <p className="error">{error}</p>}
        <label>
          Namn
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          E-post
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Lösenord (minst 6 tecken)
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Registrerar…" : "Skapa konto"}
        </button>
      </form>
      <p className="form-footer">
        Har du redan konto? <Link to="/login">Logga in</Link>
      </p>
    </section>
  );
}
