import { useState } from "react";
import { clearSession, loadSession, saveSession } from "./delivery.session";
import { AdminScreen } from "./screens/AdminScreen";
import { CourierScreen } from "./screens/CourierScreen";
import { LoginScreen } from "./screens/LoginScreen";
import type { DeliveryUser } from "./delivery.types";

export function DeliveryApp() {
  const [session, setSession] = useState<DeliveryUser | null>(() => loadSession());

  function handleLogin(user: DeliveryUser) {
    saveSession(user);
    setSession(user);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <span className="app-header__brand">Delivery</span>
          <span className="app-header__user">
            {session.role === "administrador" ? "Administrador" : `Delivery · ${session.name}`}
          </span>
        </div>
        <button type="button" className="ghost-button" onClick={handleLogout}>
          Salir
        </button>
      </header>

      <main className="app-main">
        {session.role === "administrador" ? <AdminScreen admin={session} /> : <CourierScreen courier={session} />}
      </main>
    </div>
  );
}
