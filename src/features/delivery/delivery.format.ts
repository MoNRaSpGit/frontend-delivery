// startsAt llega como "2026-09-18T20:00:00", SIN zona horaria -- a
// proposito (ver comentario en el backend, delivery.service.ts). Un string
// de fecha/hora sin "Z" ni offset, el motor de JS lo interpreta como hora
// LOCAL del navegador -- que es justo lo que queremos, porque
// administrador y deliverys estan todos en la misma zona real. Por eso acá
// no hay ninguna conversion de timezone: new Date(...) ya hace lo correcto.
export function formatEventDateTime(startsAt: string): string {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return startsAt;

  const formatted = date.toLocaleString("es-UY", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Para precargar un <input type="datetime-local"> al editar un evento
// existente: espera "YYYY-MM-DDTHH:mm" (sin segundos).
export function toDateTimeLocalValue(startsAt: string): string {
  return startsAt.slice(0, 16);
}
