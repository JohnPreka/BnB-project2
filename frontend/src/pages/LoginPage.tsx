import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/properties");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inloggning misslyckades");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card form-card">
      <h1>Logga in</h1>
      <form onSubmit={(e) => void handleSubmit(e)}>
        {error && <p className="error">{error}</p>}
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
          Lösenord
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Loggar in…" : "Logga in"}
        </button>
      </form>
      <p className="form-footer">
        Har du inget konto? <Link to="/register">Registrera dig</Link>
      </p>
    </section>
  );
}
