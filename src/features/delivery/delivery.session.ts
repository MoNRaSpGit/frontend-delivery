import type { DeliveryUser } from "./delivery.types";

// Sesion sin contraseña: elegis quien sos de una lista fija de botones y
// eso queda guardado en localStorage (para no tener que elegir de nuevo
// en cada recarga). Es un simulacro -- cuando haga falta login de verdad,
// esto se reemplaza sin tocar el resto de las pantallas.
const STORAGE_KEY = "delivery.session.v1";

export function loadSession(): DeliveryUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeliveryUser;
    if (!parsed || typeof parsed.id !== "number" || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(user: DeliveryUser) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Si localStorage no esta disponible, la sesion no persiste entre
    // recargas pero la app sigue funcionando en la pestaña actual.
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // sin efecto si localStorage no esta disponible
  }
}
