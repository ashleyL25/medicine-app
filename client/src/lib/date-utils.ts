import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from "date-fns";

export function formatDate(date: Date): string {
  if (isToday(date)) {
    return "Today";
  } else if (isTomorrow(date)) {
    return "Tomorrow";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return format(date, "MMMM d, yyyy");
  }
}

export function formatDateShort(date: Date): string {
  if (isToday(date)) {
    return "Today";
  } else if (isTomorrow(date)) {
    return "Tomorrow";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return format(date, "MMM d");
  }
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getDayOfWeek(date: Date): string {
  return format(date, "EEEE");
}

export function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Morning";
  } else if (hour < 17) {
    return "Afternoon";
  } else {
    return "Evening";
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good Morning";
  } else if (hour < 17) {
    return "Good Afternoon";
  } else {
    return "Good Evening";
  }
}
