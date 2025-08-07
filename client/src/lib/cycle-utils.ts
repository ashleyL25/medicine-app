import { CycleTracking } from "@shared/schema";
import { differenceInDays, format } from "date-fns";

export function getCurrentCyclePhase(currentCycle?: CycleTracking | null): string {
  if (!currentCycle || !currentCycle.periodStartDate) {
    return "Track your cycle to see phase info";
  }

  const today = new Date();
  const cycleStartDate = new Date(currentCycle.periodStartDate);
  const daysSinceStart = differenceInDays(today, cycleStartDate);
  const cycleLength = currentCycle.cycleLength || 28;
  
  // Normalize to current cycle
  const cycleDay = ((daysSinceStart % cycleLength) + 1);

  if (cycleDay <= 5) {
    return `Menstrual Phase - Day ${cycleDay}`;
  } else if (cycleDay <= 13) {
    return `Follicular Phase - Day ${cycleDay}`;
  } else if (cycleDay <= 15) {
    return `Ovulation Phase - Day ${cycleDay}`;
  } else {
    return `Luteal Phase - Day ${cycleDay}`;
  }
}

export function getCurrentCycleDay(currentCycle?: CycleTracking | null): number | null {
  if (!currentCycle || !currentCycle.periodStartDate) return null;

  const today = new Date();
  const cycleStartDate = new Date(currentCycle.periodStartDate);
  const daysSinceStart = differenceInDays(today, cycleStartDate);
  const cycleLength = currentCycle.cycleLength || 28;
  
  return ((daysSinceStart % cycleLength) + 1);
}

export function shouldTakeMedication(frequency: string, cycleDay: number | null): boolean {
  if (!cycleDay) return true; // Default to true if no cycle data

  switch (frequency) {
    case "cycle-days-1-14":
      return cycleDay <= 14;
    case "cycle-days-15-28":
      return cycleDay > 14;
    case "during-period":
      return cycleDay <= 5;
    default:
      return true;
  }
}

export function getCurrentCycleDayForDate(date: Date, currentCycle?: CycleTracking | null): number | null {
  if (!currentCycle || !currentCycle.periodStartDate) return null;

  const cycleStartDate = new Date(currentCycle.periodStartDate);
  const daysSinceStart = differenceInDays(date, cycleStartDate);
  const cycleLength = currentCycle.cycleLength || 28;
  
  if (daysSinceStart < 0) return null; // Date is before cycle start
  
  return ((daysSinceStart % cycleLength) + 1);
}
