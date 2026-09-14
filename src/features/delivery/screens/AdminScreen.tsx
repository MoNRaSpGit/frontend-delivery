import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { createEvent, deleteEvent, listEvents, updateEvent } from "../delivery.client";
import {
  buildStartsAtFromParts,
  formatEventDateTime,
  isEventInPast,
  maskDateInput,
  splitStartsAtIntoParts
} from "../delivery.format";
import type { DeliveryEvent, DeliveryEventStatus, DeliveryUser } from "../delivery.types";

const REFRESH_INTERVAL_MS = 4000;

const STATUS_LABELS: Record<DeliveryEventStatus, string> = {
  abierto: "Abierto",
  cerrado: "Cerrado",
  cancelado: "Cancelado"
};

type AdminScreenProps = {
  admin: DeliveryUser;
};

export function AdminScreen({ admin }: AdminScreenProps) {
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [place, setPlace] = useState("");
  const [dateText, setDateText] = useState("");
  const [timeText, setTimeText] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editPlace, setEditPlace] = useState("");
  const [editDateText, setEditDateText] = useState("");
  const [editTimeText, setEditTimeText] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSlots, setEditSlots] = useState("");
  const [isEditSaving, setIsEditSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"proximos" | "historial">("proximos");
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);

  async function refresh() {
    try {
      const items = await listEvents();
      setEvents(items);
    } catch (error) {
      // Silencioso en el refresco automatico -- no interrumpir con un
      // toast cada 4 segundos si hay un corte de red pasajero.
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

  async function handleCreateEvent(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    const startsAt = buildStartsAtFromParts(dateText, timeText);
    if (!place.trim() || !startsAt || !slots.trim()) {
      toast.error("Completa el lugar, la fecha/hora (DD/MM/AAAA) y la cantidad de deliverys.");
      return;
    }

    setIsSaving(true);
    try {
      await createEvent({
        place: place.trim(),
        startsAt,
        notes: notes.trim() || undefined,
        slots: Number(slots),
        createdBy: admin.id
      });
      toast.success("Evento creado.");
      setPlace("");
      setDateText("");
      setTimeText("");
      setNotes("");
      setSlots("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el evento.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(event: DeliveryEvent, status: DeliveryEventStatus) {
    try {
      await updateEvent(event.id, { status });
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el evento.");
    }
  }

  function startEdit(event: DeliveryEvent) {
    const { dateText: parsedDate, timeText: parsedTime } = splitStartsAtIntoParts(event.startsAt);
    setEditingEventId(event.id);
    setEditPlace(event.place);
    setEditDateText(parsedDate);
    setEditTimeText(parsedTime);
    setEditNotes(event.notes ?? "");
    setEditSlots(event.slots !== null ? String(event.slots) : "");
  }

  function cancelEdit() {
    setEditingEventId(null);
  }

  async function handleSaveEdit(event: DeliveryEvent) {
    const editStartsAt = buildStartsAtFromParts(editDateText, editTimeText);
    if (!editPlace.trim() || !editStartsAt || !editSlots.trim()) {
      toast.error("Completa el lugar, la fecha/hora (DD/MM/AAAA) y la cantidad de deliverys.");
      return;
    }

    setIsEditSaving(true);
    try {
      await updateEvent(event.id, {
        place: editPlace.trim(),
        startsAt: editStartsAt,
        notes: editNotes.trim(),
        slots: Number(editSlots)
      });
      toast.success("Evento actualizado.");
      setEditingEventId(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el evento.");
    } finally {
      setIsEditSaving(false);
    }
  }

  function toggleExpanded(eventId: number) {
    setExpandedEventId((current) => (current === eventId ? null : eventId));
  }

  async function handleDelete(event: DeliveryEvent) {
    try {
      await deleteEvent(event.id);
      toast.success("Evento eliminado.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el evento.");
    }
  }

  const upcomingEvents = events
    .filter((event) => event.status !== "cancelado" && !isEventInPast(event.startsAt))
    .sort((a, b) => (a.startsAt < b.startsAt ? -1 : a.startsAt > b.startsAt ? 1 : 0));
  const historyEvents = events.filter((event) => event.status === "cancelado" || isEventInPast(event.startsAt));
  const visibleEvents = activeTab === "proximos" ? upcomingEvents : historyEvents;

  return (
    <div className="screen">
      <section className="card">
        <h2>Nuevo evento</h2>
        <form className="event-form" onSubmit={(formEvent) => void handleCreateEvent(formEvent)}>
          <label className="form-field">
            <span>Lugar</span>
            <input
              type="text"
              placeholder="Ej: Mama Mia"
              value={place}
              onChange={(changeEvent) => setPlace(changeEvent.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Fecha</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={dateText}
              onChange={(changeEvent) => setDateText(maskDateInput(changeEvent.target.value))}
            />
          </label>

          <label className="form-field">
            <span>Hora</span>
            <input type="time" value={timeText} onChange={(changeEvent) => setTimeText(changeEvent.target.value)} />
          </label>

          <label className="form-field">
            <span>Cantidad de deliverys</span>
            <input
              type="number"
              min={1}
              placeholder="Ej: 3"
              value={slots}
              onChange={(changeEvent) => setSlots(changeEvent.target.value)}
            />
          </label>

          <label className="form-field form-field--wide">
            <span>Nota (opcional)</span>
            <input
              type="text"
              placeholder="Ej: llevar termo"
              value={notes}
              onChange={(changeEvent) => setNotes(changeEvent.target.value)}
            />
          </label>

          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? "Creando..." : "Crear evento"}
          </button>
        </form>
      </section>

      <div className="tab-bar">
        <button
          type="button"
          className={`tab-button${activeTab === "proximos" ? " tab-button--active" : ""}`}
          onClick={() => setActiveTab("proximos")}
        >
          Proximos{upcomingEvents.length ? ` (${upcomingEvents.length})` : ""}
        </button>
        <button
          type="button"
          className={`tab-button${activeTab === "historial" ? " tab-button--active" : ""}`}
          onClick={() => setActiveTab("historial")}
        >
          Historial{historyEvents.length ? ` (${historyEvents.length})` : ""}
        </button>
      </div>

      <section className="card">
        <h2>{activeTab === "proximos" ? "Proximos eventos" : "Historial"}</h2>
        {isLoading ? <p className="muted">Cargando...</p> : null}
        {!isLoading && visibleEvents.length === 0 ? (
          <p className="muted">
            {activeTab === "proximos" ? "No hay eventos proximos." : "Todavia no hay eventos en el historial."}
          </p>
        ) : null}

        <ul className="event-list">
          {visibleEvents.map((event) => {
            if (editingEventId === event.id) {
              return (
                <li key={event.id} className={`event-item event-item--${event.status}`}>
                  <form
                    className="event-form"
                    onSubmit={(formEvent) => {
                      formEvent.preventDefault();
                      void handleSaveEdit(event);
                    }}
                  >
                    <label className="form-field">
                      <span>Lugar</span>
                      <input
                        type="text"
                        value={editPlace}
                        onChange={(changeEvent) => setEditPlace(changeEvent.target.value)}
                      />
                    </label>

                    <label className="form-field">
                      <span>Fecha</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                        value={editDateText}
                        onChange={(changeEvent) => setEditDateText(maskDateInput(changeEvent.target.value))}
                      />
                    </label>

                    <label className="form-field">
                      <span>Hora</span>
                      <input
                        type="time"
                        value={editTimeText}
                        onChange={(changeEvent) => setEditTimeText(changeEvent.target.value)}
                      />
                    </label>

                    <label className="form-field">
                      <span>Cantidad de deliverys</span>
                      <input
                        type="number"
                        min={1}
                        placeholder="Ej: 3"
                        value={editSlots}
                        onChange={(changeEvent) => setEditSlots(changeEvent.target.value)}
                      />
                    </label>

                    <label className="form-field form-field--wide">
                      <span>Nota (opcional)</span>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(changeEvent) => setEditNotes(changeEvent.target.value)}
                      />
                    </label>

                    <div className="event-item__actions">
                      <button type="submit" className="primary-button" disabled={isEditSaving}>
                        {isEditSaving ? "Guardando..." : "Guardar cambios"}
                      </button>
                      <button type="button" className="ghost-button" onClick={cancelEdit} disabled={isEditSaving}>
                        Cancelar edicion
                      </button>
                    </div>
                  </form>
                </li>
              );
            }

            const isExpanded = expandedEventId === event.id;

            return (
              <li key={event.id} className={`event-item event-item--${event.status}`}>
                <button
                  type="button"
                  className="event-item__header event-item__header--toggle"
                  onClick={() => toggleExpanded(event.id)}
                >
                  <div>
                    <strong>{event.place}</strong>
                    <span className="event-item__when">{formatEventDateTime(event.startsAt)}</span>
                  </div>
                  <div className="event-item__header-right">
                    {event.slots !== null ? (
                      <span className="event-item__slots-inline">
                        {event.signups.length}/{event.slots}
                      </span>
                    ) : null}
                    <span className={`status-pill status-pill--${event.status}`}>{STATUS_LABELS[event.status]}</span>
                    <span className="event-item__chevron">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {!isExpanded ? null : (
                  <>
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
                      <button type="button" className="ghost-button" onClick={() => startEdit(event)}>
                        Editar
                      </button>
                      {event.status === "abierto" ? (
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => void handleStatusChange(event, "cerrado")}
                        >
                          Cerrar inscripciones
                        </button>
                      ) : null}
                      {event.status === "cerrado" ? (
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => void handleStatusChange(event, "abierto")}
                        >
                          Reabrir
                        </button>
                      ) : null}
                      {event.status !== "cancelado" ? (
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => void handleStatusChange(event, "cancelado")}
                        >
                          Cancelar
                        </button>
                      ) : null}
                      <button type="button" className="danger-button" onClick={() => void handleDelete(event)}>
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
