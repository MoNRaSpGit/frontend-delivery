import { API_BASE_URL } from "../../shared/config/api";
import type { DeliveryEvent, DeliveryEventStatus, DeliveryUser } from "./delivery.types";

function buildUrl(path: string) {
  return `${API_BASE_URL}/api/v1${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as Partial<T> & { message?: string | string[] };

  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new Error(message || `HTTP ${response.status}`);
  }

  return data as T;
}

export async function listUsers() {
  const response = await fetch(buildUrl("/delivery/users"));
  const data = await readJson<{ items: DeliveryUser[] }>(response);
  return data.items;
}

export async function listEvents() {
  const response = await fetch(buildUrl("/delivery/events"));
  const data = await readJson<{ items: DeliveryEvent[] }>(response);
  return data.items;
}

export async function createEvent(payload: {
  place: string;
  startsAt: string;
  notes?: string;
  slots: number;
  createdBy: number;
}) {
  const response = await fetch(buildUrl("/delivery/events"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: DeliveryEvent }>(response);
  return data.item;
}

export async function updateEvent(
  eventId: number,
  payload: Partial<{ place: string; startsAt: string; notes: string; slots: number; status: DeliveryEventStatus }>
) {
  const response = await fetch(buildUrl(`/delivery/events/${eventId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: DeliveryEvent }>(response);
  return data.item;
}

export async function deleteEvent(eventId: number) {
  const response = await fetch(buildUrl(`/delivery/events/${eventId}`), { method: "DELETE" });
  await readJson<{ ok: boolean }>(response);
}

export async function createSignup(eventId: number, userId: number) {
  const response = await fetch(buildUrl(`/delivery/events/${eventId}/signups`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });
  const data = await readJson<{ item: DeliveryEvent }>(response);
  return data.item;
}

export async function deleteSignup(eventId: number, userId: number) {
  const response = await fetch(buildUrl(`/delivery/events/${eventId}/signups/${userId}`), { method: "DELETE" });
  const data = await readJson<{ item: DeliveryEvent }>(response);
  return data.item;
}
