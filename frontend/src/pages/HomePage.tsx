import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const { user } = useAuth();

  return (
    <section className="hero">
      <h1>Välkommen till John BnB</h1>
      <div className="hero-actions">
        <Link to="/properties" className="btn btn-primary">
          Bläddra boenden
        </Link>
        {user ? (
          <Link to="/bookings" className="btn btn-secondary">
            Mina bokningar
          </Link>
        ) : (
          <Link to="/register" className="btn btn-secondary">
            Skapa konto
          </Link>
        )}
      </div>
    </section>
  );
}
