export type DeliveryZone = "corrientes" | "resistencia";

const ALLOWED_WEEKDAYS: Record<DeliveryZone, Set<number>> = {
  corrientes: new Set([0, 3, 5, 6]),
  resistencia: new Set([0, 6]),
};

export const ZONE_LABELS: Record<DeliveryZone, string> = {
  corrientes: "Corrientes",
  resistencia: "Resistencia",
};

export const ZONE_OPTIONS: DeliveryZone[] = ["corrientes", "resistencia"];

export function isDeliveryDayAllowed(date: Date, zone: DeliveryZone): boolean {
  return ALLOWED_WEEKDAYS[zone].has(date.getDay());
}

export function formatDeliveryDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export function formatDeliveryDateShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
