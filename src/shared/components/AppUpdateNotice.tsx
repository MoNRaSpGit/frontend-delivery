import { useEffect, useRef, useState } from "react";
import { fetchPublishedFrontendBuildMeta, FRONTEND_BUILD_INFO } from "../config/build";
import { isAppIdle } from "../state/appActivity";

const UPDATE_CHECK_INTERVAL_MS = 2 * 60 * 1000;
const IDLE_RETRY_INTERVAL_MS = 15 * 1000;
const APP_CACHE_PREFIX = "delivery-";

// Misma logica que frontend-joker/frontend-ejemplo: en vez de coordinar con
// el service worker "nuevo", directo lo desregistra, borra el cache de la
// app y recarga -- como sw.js ya hace skipWaiting + clients.claim solo, el
// proximo load arranca limpio.
async function applyUpdate() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const appBasePath = new URL(import.meta.env.BASE_URL, window.location.href).pathname;
      await Promise.all(
        registrations
          .filter((registration) => registration.scope.includes(appBasePath))
          .map((registration) => registration.unregister())
      );
    }

    if ("caches" in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith(APP_CACHE_PREFIX)).map((key) => window.caches.delete(key)));
    }
  } catch {
    // Si la limpieza falla, igual conviene forzar el reload para reintentar.
  } finally {
    window.location.reload();
  }
}

export function AppUpdateNotice() {
  const [show, setShow] = useState(false);
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!import.meta.env.PROD) {
      setShow(false);
      return;
    }

    let mounted = true;

    const checkForUpdates = async () => {
      if (appliedRef.current) return;

      try {
        const published = await fetchPublishedFrontendBuildMeta();
        if (!mounted || published.releaseSha === FRONTEND_BUILD_INFO.releaseSha) {
          return;
        }

        if (isAppIdle()) {
          appliedRef.current = true;
          await applyUpdate();
          return;
        }

        setShow(true);
      } catch {
        // Silencioso: se reintenta solo en el proximo chequeo.
      }
    };

    void checkForUpdates();
    const intervalId = window.setInterval(() => {
      void checkForUpdates();
    }, UPDATE_CHECK_INTERVAL_MS);

    const idleRetryId = window.setInterval(() => {
      if (show && !appliedRef.current && isAppIdle()) {
        appliedRef.current = true;
        void applyUpdate();
      }
    }, IDLE_RETRY_INTERVAL_MS);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void checkForUpdates();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.clearInterval(idleRetryId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [show]);

  if (!show) {
    return null;
  }

  return (
    <aside style={noticeStyle}>
      <strong>Hay una version nueva disponible.</strong>
      <button type="button" onClick={() => void applyUpdate()} style={buttonStyle}>
        Actualizar
      </button>
    </aside>
  );
}

const noticeStyle: React.CSSProperties = {
  position: "fixed",
  left: 16,
  bottom: 16,
  zIndex: 30,
  padding: "12px 14px",
  borderRadius: 18,
  background: "#1f2a44",
  color: "#fff",
  display: "flex",
  gap: 12,
  alignItems: "center",
  boxShadow: "0 16px 30px rgba(0,0,0,0.16)"
};

const buttonStyle: React.CSSProperties = {
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 999,
  border: "none",
  fontWeight: 800,
  cursor: "pointer"
};
