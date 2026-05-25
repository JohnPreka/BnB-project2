import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, logout, loading } = useAuth();

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            <span className="logo-icon">John BnB</span>
          </Link>
          <nav className="nav">
            <Link to="/properties">Boenden</Link>
            {user && <Link to="/bookings">Mina bokningar</Link>}
            {user && <Link to="/properties/new">Lägg till boende</Link>}
            {!loading && !user && (
              <>
                <Link to="/login">Logga in</Link>
                <Link to="/register" className="btn-nav">
                  Registrera
                </Link>
              </>
            )}
            {user && (
              <span className="user-bar">
                <span>{user.name}</span>
                <button type="button" onClick={() => void logout()}>
                  Logga ut
                </button>
              </span>
            )}
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
