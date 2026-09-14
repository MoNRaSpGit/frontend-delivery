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

// Mascara de fecha DD/MM/AAAA: el usuario solo tipea numeros, las barras se
// insertan solas a medida que completa dia/mes/anio. Se aplica sobre cada
// tecleo (oninput), asi que tambien "arregla" el valor si borra una barra.
export function maskDateInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  let result = day;
  if (month) result += `/${month}`;
  if (year) result += `/${year}`;
  return result;
}

// Arma el "YYYY-MM-DDTHH:mm" que espera el backend a partir de la fecha
// tipeada con mascara ("DD/MM/AAAA") y la hora (input type="time",
// "HH:mm"). Devuelve null si la fecha todavia esta incompleta.
export function buildStartsAtFromParts(dateText: string, timeText: string): string | null {
  const match = dateText.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match || !timeText) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}T${timeText}`;
}

// Inverso de buildStartsAtFromParts: separa un startsAt ("YYYY-MM-DDTHH:mm:ss")
// en {dateText, timeText} para precargar el formulario de edicion.
export function splitStartsAtIntoParts(startsAt: string): { dateText: string; timeText: string } {
  const [datePart, timePart] = startsAt.split("T");
  const [year, month, day] = (datePart ?? "").split("-");
  const timeText = (timePart ?? "").slice(0, 5);
  return { dateText: day && month && year ? `${day}/${month}/${year}` : "", timeText };
}

// Mismo criterio que formatEventDateTime: startsAt sin "Z" se interpreta
// como hora local del navegador, que coincide con la hora real de
// Montevideo para todos los usuarios de esta app.
export function isEventInPast(startsAt: string): boolean {
  return new Date(startsAt).getTime() < Date.now();
}
