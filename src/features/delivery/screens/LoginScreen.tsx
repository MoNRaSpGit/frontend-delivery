import { useEffect, useState } from "react";
import { listUsers } from "../delivery.client";
import type { DeliveryUser } from "../delivery.types";

type LoginScreenProps = {
  onLogin: (user: DeliveryUser) => void;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [users, setUsers] = useState<DeliveryUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    listUsers()
      .then((items) => {
        if (mounted) setUsers(items);
      })
      .catch((fetchError) => {
        if (mounted) setError(fetchError instanceof Error ? fetchError.message : "No se pudo cargar la lista de usuarios.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const admin = users?.find((user) => user.role === "administrador");
  const couriers = users?.filter((user) => user.role === "delivery") ?? [];

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Delivery</h1>
        <p className="login-subtitle">Elegi con quien entrar</p>

        {error ? <p className="login-error">{error}</p> : null}
        {!users && !error ? <p className="login-loading">Cargando...</p> : null}

        {users ? (
          <div className="login-buttons">
            {admin ? (
              <button type="button" className="login-button login-button--admin" onClick={() => onLogin(admin)}>
                Entrar como administrador
              </button>
            ) : null}

            <div className="login-buttons-divider">Deliverys</div>

            {couriers.map((courier) => (
              <button key={courier.id} type="button" className="login-button" onClick={() => onLogin(courier)}>
                Entrar como {courier.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
