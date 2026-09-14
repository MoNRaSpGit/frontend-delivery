import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { createSignup, deleteSignup, listEvents } from "../delivery.client";
import { formatEventDateTime, isEventInPast } from "../delivery.format";
import type { DeliveryEvent, DeliveryUser } from "../delivery.types";

const REFRESH_INTERVAL_MS = 4000;

type CourierScreenProps = {
  courier: DeliveryUser;
};

export function CourierScreen({ courier }: CourierScreenProps) {
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEventId, setPendingEventId] = useState<number | null>(null);
  // Eventos cancelados de los que ya se avisó al delivery (para no repetir
  // el toast en cada refresco de 4s mientras siga viendo la pantalla).
  const notifiedCancelledRef = useRef<Set<number>>(new Set());

  async function refresh() {
    try {
      const items = await listEvents();
      for (const event of items) {
        const wasSignedUp = event.signups.some((signup) => signup.userId === courier.id);
        if (wasSignedUp && event.status === "cancelado" && !notifiedCancelledRef.current.has(event.id)) {
          notifiedCancelledRef.current.add(event.id);
          toast.warning(`Se cancelo el evento en ${event.place}, ya no hace falta que vayas.`);
        }
      }
      setEvents(items);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    const intervalId = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  async function handleToggleSignup(event: DeliveryEvent, isSignedUp: boolean) {
    setPendingEventId(event.id);
    try {
      if (isSignedUp) {
        await deleteSignup(event.id, courier.id);
        toast.success("Te desanotaste.");
      } else {
        await createSignup(event.id, courier.id);
        toast.success("Te anotaste al evento.");
      }
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar tu inscripcion.");
    } finally {
      setPendingEventId(null);
    }
  }

  const visibleEvents = events.filter((event) => event.status !== "cancelado");
  const mySignedUpEvents = events.filter((event) => event.signups.some((signup) => signup.userId === courier.id));

  return (
    <div className="screen">
      <section className="card">
        <h2>Tus eventos</h2>
        {mySignedUpEvents.length === 0 ? (
          <p className="muted">Todavia no te anotaste a ningun evento.</p>
        ) : (
          <ul className="event-list">
            {mySignedUpEvents.map((event) => (
              <li key={event.id} className={`event-item event-item--${event.status}`}>
                <div className="event-item__header">
                  <div>
                    <strong>{event.place}</strong>
                    <span className="event-item__when">{formatEventDateTime(event.startsAt)}</span>
                  </div>
                  <span className={`status-pill status-pill--${event.status}`}>
                    {event.status === "cancelado" ? "Cancelado" : "Confirmado"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Eventos</h2>
        {isLoading ? <p className="muted">Cargando...</p> : null}
        {!isLoading && visibleEvents.length === 0 ? <p className="muted">No hay eventos por ahora.</p> : null}

        <ul className="event-list">
          {visibleEvents.map((event) => {
            const isSignedUp = event.signups.some((signup) => signup.userId === courier.id);
            const isFull = event.slots !== null && event.signups.length >= event.slots && !isSignedUp;
            const isPast = isEventInPast(event.startsAt);
            const canAct = event.status === "abierto" && !isFull && !isPast;

            return (
              <li key={event.id} className={`event-item event-item--${event.status}`}>
                <div className="event-item__header">
                  <div>
                    <strong>{event.place}</strong>
                    <span className="event-item__when">{formatEventDateTime(event.startsAt)}</span>
                  </div>
                  {event.status === "cerrado" ? <span className="status-pill status-pill--cerrado">Cerrado</span> : null}
                </div>

                {event.notes ? <p className="event-item__notes">{event.notes}</p> : null}
                {event.slots !== null ? (
                  <p className="event-item__slots">
                    Cupo: {event.signups.length}/{event.slots}
                  </p>
                ) : null}

                <div className="event-item__signups">
                  <span className="event-item__signups-label">Anotados ({event.signups.length}):</span>
                  {event.signups.length ? (
                    <ul className="signup-list">
                      {event.signups.map((signup) => (
                        <li key={signup.id}>{signup.userName}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="muted"> nadie todavia</span>
                  )}
                </div>

                <div className="event-item__actions">
                  <button
                    type="button"
                    className={isSignedUp ? "danger-button" : "primary-button"}
                    disabled={pendingEventId === event.id || (!isSignedUp && !canAct)}
                    onClick={() => void handleToggleSignup(event, isSignedUp)}
                  >
                    {isSignedUp ? "Desanotarme" : isPast ? "Evento pasado" : isFull ? "Sin cupo" : "Anotarme"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
