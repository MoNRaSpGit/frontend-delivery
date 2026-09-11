// Senal global y liviana de "la app esta en uso ahora mismo", para que
// AppUpdateNotice sepa si puede aplicar una actualizacion sola (sin
// molestar) o si tiene que esperar. No es un context de React a proposito:
// no hace falta que nada vuelva a renderizar cuando cambia.
let activeUseCount = 0;
const activeReasons = new Set<string>();

export function setAppBusy(reasonKey: string, isBusy: boolean) {
  const hadReason = activeReasons.has(reasonKey);
  if (isBusy && !hadReason) {
    activeReasons.add(reasonKey);
    activeUseCount += 1;
  } else if (!isBusy && hadReason) {
    activeReasons.delete(reasonKey);
    activeUseCount = Math.max(0, activeUseCount - 1);
  }
}

export function isAppIdle() {
  if (activeUseCount > 0) return false;

  const active = document.activeElement;
  if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) {
    return false;
  }

  return true;
}
