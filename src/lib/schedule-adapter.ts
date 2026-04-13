import { demoSchedule, integrationChecklist } from "@/lib/demo-data";
import type { ScheduleShift } from "@/types";

export async function getScaleShifts(): Promise<ScheduleShift[]> {
  return demoSchedule;
}

export function getShiftById(shiftId: string, shifts: ScheduleShift[]): ScheduleShift | undefined {
  return shifts.find((shift) => shift.id === shiftId);
}

export const scaleIntegrationChecklist = integrationChecklist;
