import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { createSignup, deleteSignup, listEvents } from "../delivery.client";
import { formatEventDateTime } from "../delivery.format";
import type { DeliveryEvent, DeliveryUser } from "../delivery.types";

const REFRESH_INTERVAL_MS = 4000;

type CourierScreenProps = {
  courier: DeliveryUser;
};

export function CourierScreen({ courier }: CourierScreenProps) {
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEventId, setPendingEventId] = useState<number | null>(null);

  async function refresh() {
    try {
      const items = await listEvents();
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

  return (
    <div className="screen">
      <section className="card">
        <h2>Eventos</h2>
        {isLoading ? <p className="muted">Cargando...</p> : null}
        {!isLoading && visibleEvents.length === 0 ? <p className="muted">No hay eventos por ahora.</p> : null}

        <ul className="event-list">
          {visibleEvents.map((event) => {
            const isSignedUp = event.signups.some((signup) => signup.userId === courier.id);
            const isFull = event.slots !== null && event.signups.length >= event.slots && !isSignedUp;
            const canAct = event.status === "abierto" && !isFull;

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
                    {isSignedUp ? "Desanotarme" : isFull ? "Sin cupo" : "Anotarme"}
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
