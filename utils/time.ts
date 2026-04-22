import { Timestamp } from "firebase/firestore";

export function toDate(value?: Timestamp | Date | null): Date {
  if (!value) {
    return new Date(0);
  }

  if (value instanceof Date) {
    return value;
  }

  return value.toDate();
}

export function formatDateTime(value?: Timestamp | Date | null): string {
  const parsed = toDate(value);

  if (parsed.getTime() === 0) {
    return "just now";
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateOnly(value?: Timestamp | Date | null): string {
  const parsed = toDate(value);

  if (parsed.getTime() === 0) {
    return "date pending";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
