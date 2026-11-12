import {
  Patient,
  TemperatureReading,
  DoctorVisit,
  ClosedCase,
  DailyStatus,
} from './types';

export const TOTAL_BEDS = 74;
export const FEVER_THRESHOLD_CELSIUS = 38.0;
export const CRITICAL_TEMP_THRESHOLD = 40.0;
export const MIN_TEMP = 34.0;
export const MAX_TEMP = 43.0;
export const DISCHARGE_STREAK_REQUIREMENT = 3;
export const MORTALITY_BENCHMARK_PERCENT = 15;
export const MORTALITY_AMBER_PERCENT = 12;
export const MIN_CLOSED_CASES_FOR_MORTALITY = 20;

/**
 * Generates all 74 bed codes in standard clinical format:
 * A-01 to A-37, B-01 to B-37
 */
export function generateAllBedCodes(): string[] {
  const codes: string[] = [];
  for (let i = 1; i <= 37; i++) {
    codes.push(`A-${String(i).padStart(2, '0')}`);
  }
  for (let i = 1; i <= 37; i++) {
    codes.push(`B-${String(i).padStart(2, '0')}`);
  }
  return codes;
}

/**
 * Finds the first unoccupied bed code from the 74 beds.
 * Returns null if all 74 beds are taken.
 */
export function getFirstFreeBed(occupiedBedCodes: string[]): string | null {
  const allBeds = generateAllBedCodes();
  const occupiedSet = new Set(occupiedBedCodes);
  for (const bed of allBeds) {
    if (!occupiedSet.has(bed)) {
      return bed;
    }
  }
  return null;
}

/**
 * Gets a patient's temperature reading for a specific calendar date (if any).
 */
export function getTodayTemperature(
  patientId: string,
  temperatures: TemperatureReading[],
  currentDateStr: string
): TemperatureReading | undefined {
  return temperatures.find(
    (t) => t.patientId === patientId && t.dateStr === currentDateStr
  );
}

/**
 * Gets a patient's doctor visit for a specific calendar date (if any).
 */
export function getTodayDoctorVisit(
  patientId: string,
  doctorVisits: DoctorVisit[],
  currentDateStr: string
): DoctorVisit | undefined {
  return doctorVisits.find(
    (v) => v.patientId === patientId && v.dateStr === currentDateStr
  );
}

/**
 * Determines the patient's single status for today:
 * Temp pending (grey) -> Temp done (blue) -> Doctor visited (green)
 */
export function getTodayStatus(
  patientId: string,
  temperatures: TemperatureReading[],
  doctorVisits: DoctorVisit[],
  currentDateStr: string
): DailyStatus {
  const visited = getTodayDoctorVisit(patientId, doctorVisits, currentDateStr);
  if (visited) {
    return 'doctor_visited';
  }

  const temp = getTodayTemperature(patientId, temperatures, currentDateStr);
  if (temp) {
    return 'temp_done';
  }

  return 'temp_pending';
}

/**
 * Pure helper to subtract N days from a YYYY-MM-DD date string.
 */
export function subtractDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/**
 * Pure helper to add N days to a YYYY-MM-DD date string.
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * STREAK RULE:
 * Count consecutive calendar days where the day's highest reading is below 38.0 °C.
 * A fever (>= 38.0 °C) or a missing reading resets the streak to 0.
 *
 * If today has a reading:
 * - If today's max >= 38.0, streak is 0.
 * - If today's max < 38.0, streak includes today + consecutive fever-free prior days.
 * If today has NOT been measured yet:
 * - The streak represents the consecutive fever-free calendar days up through yesterday.
 * - (Recording a fever today will reset it; recording < 38.0 will add today).
 */
export function calculateFeverFreeStreak(
  patientId: string,
  temperatures: TemperatureReading[],
  currentDateStr: string
): number {
  const patientTemps = temperatures.filter((t) => t.patientId === patientId);
  if (patientTemps.length === 0) return 0;

  // Map each date to highest recorded temperature on that date
  const dayMaxTemps = new Map<string, number>();
  for (const t of patientTemps) {
    const existing = dayMaxTemps.get(t.dateStr);
    if (existing === undefined || t.value > existing) {
      dayMaxTemps.set(t.dateStr, t.value);
    }
  }

  // Check if today has a reading
  const todayMax = dayMaxTemps.get(currentDateStr);
  let streak = 0;
  let startDateToCheck = currentDateStr;

  if (todayMax !== undefined) {
    if (todayMax >= FEVER_THRESHOLD_CELSIUS) {
      return 0; // Fever today resets streak to 0 immediately
    }
    streak = 1;
    // Check backwards starting from yesterday
    startDateToCheck = subtractDays(currentDateStr, 1);
  } else {
    // Today has no reading yet: check consecutive streak up to yesterday
    startDateToCheck = subtractDays(currentDateStr, 1);
  }

  // Walk backwards day-by-day
  let checkDate = startDateToCheck;
  while (true) {
    const maxTemp = dayMaxTemps.get(checkDate);
    if (maxTemp === undefined) {
      // Missing reading on this calendar day breaks the streak
      break;
    }
    if (maxTemp >= FEVER_THRESHOLD_CELSIUS) {
      // Fever on this day breaks the streak
      break;
    }
    streak++;
    checkDate = subtractDays(checkDate, 1);
  }

  return streak;
}

/**
 * Checks whether a patient is eligible for discharge (streak >= 3).
 */
export function isEligibleForDischarge(streak: number): boolean {
  return streak >= DISCHARGE_STREAK_REQUIREMENT;
}

/**
 * Temperature input validation pure function.
 * Valid range: 34.0 to 43.0 °C.
 * Error if outside: "Please check the value".
 * 40.0 or above shows: "Critical, inform doctor".
 */
export interface TempValidationResult {
  isValid: boolean;
  error?: string;
  isCritical: boolean;
  value?: number;
}

export function validateTemperature(input: string | number): TempValidationResult {
  const num = typeof input === 'number' ? input : parseFloat(String(input).trim());
  if (isNaN(num)) {
    return {
      isValid: false,
      error: 'Please check the value',
      isCritical: false,
    };
  }

  // Round to 1 decimal place
  const rounded = Math.round(num * 10) / 10;

  if (rounded < MIN_TEMP || rounded > MAX_TEMP) {
    return {
      isValid: false,
      error: 'Please check the value',
      isCritical: false,
    };
  }

  return {
    isValid: true,
    isCritical: rounded >= CRITICAL_TEMP_THRESHOLD,
    value: rounded,
  };
}

/**
 * Doctor visit check: Doctor cannot visit before temperature is taken today.
 */
export function canDoctorVisit(
  patientId: string,
  temperatures: TemperatureReading[],
  currentDateStr: string
): { canVisit: boolean; reason?: string } {
  const todayTemp = getTodayTemperature(patientId, temperatures, currentDateStr);
  if (!todayTemp) {
    return {
      canVisit: false,
      reason: 'Temperature not taken yet',
    };
  }
  return { canVisit: true };
}

/**
 * Mortality Rate calculation:
 * mortality = deceased / (cured + deceased)
 * 15% benchmark.
 * Amber at 12% or above, red above 15%.
 * "Not enough data" if fewer than 20 closed cases.
 */
export interface MortalityStats {
  totalClosed: number;
  deceasedCount: number;
  curedCount: number;
  ratePercentage: number;
  status: 'normal' | 'amber' | 'red';
  hasEnoughData: boolean;
}

export function calculateMortality(closedCases: ClosedCase[]): MortalityStats {
  const totalClosed = closedCases.length;
  const deceasedCount = closedCases.filter((c) => c.outcome === 'deceased').length;
  const curedCount = closedCases.filter((c) => c.outcome === 'cured').length;

  const hasEnoughData = totalClosed >= MIN_CLOSED_CASES_FOR_MORTALITY;
  const ratePercentage = totalClosed > 0 ? (deceasedCount / totalClosed) * 100 : 0;

  let status: 'normal' | 'amber' | 'red' = 'normal';
  if (ratePercentage > MORTALITY_BENCHMARK_PERCENT) {
    status = 'red';
  } else if (ratePercentage >= MORTALITY_AMBER_PERCENT) {
    status = 'amber';
  }

  return {
    totalClosed,
    deceasedCount,
    curedCount,
    ratePercentage: Math.round(ratePercentage * 10) / 10,
    status,
    hasEnoughData,
  };
}

/**
 * Calculate occupancy statistics.
 */
export function calculateOccupancy(activePatientsCount: number, totalBeds: number = TOTAL_BEDS) {
  const occupied = activePatientsCount;
  const free = Math.max(0, totalBeds - occupied);
  const percentage = Math.round((occupied / totalBeds) * 100);
  return { occupied, free, total: totalBeds, percentage };
}

/**
 * Calculate average stay in days across closed cases.
 */
export function calculateAverageStay(closedCases: ClosedCase[]): number {
  if (closedCases.length === 0) return 0;
  const totalDays = closedCases.reduce((sum, c) => sum + (c.daysStayed || 0), 0);
  return Math.round((totalDays / closedCases.length) * 10) / 10;
}

/**
 * Today's completion stats:
 * - Temps done (count / total active)
 * - Doctor visits done (count / total active)
 * - Missed today list: active patients who missed temp or visit today
 */
export interface DailyCompletionStats {
  totalActive: number;
  tempsDoneCount: number;
  visitsDoneCount: number;
  missedTempsPatients: Patient[];
  missedVisitsPatients: Patient[];
}

export function calculateDailyCompletion(
  patients: Patient[],
  temperatures: TemperatureReading[],
  doctorVisits: DoctorVisit[],
  currentDateStr: string
): DailyCompletionStats {
  const totalActive = patients.length;
  let tempsDoneCount = 0;
  let visitsDoneCount = 0;
  const missedTempsPatients: Patient[] = [];
  const missedVisitsPatients: Patient[] = [];

  for (const patient of patients) {
    const hasTemp = getTodayTemperature(patient.id, temperatures, currentDateStr);
    const hasVisit = getTodayDoctorVisit(patient.id, doctorVisits, currentDateStr);

    if (hasTemp) {
      tempsDoneCount++;
    } else {
      missedTempsPatients.push(patient);
    }

    if (hasVisit) {
      visitsDoneCount++;
    } else {
      missedVisitsPatients.push(patient);
    }
  }

  return {
    totalActive,
    tempsDoneCount,
    visitsDoneCount,
    missedTempsPatients,
    missedVisitsPatients,
  };
}

/**
 * Sorts "Ready for me" doctor queue:
 * Has temperature recorded today, not yet visited by doctor, sorted by HIGHEST temp first.
 */
export function sortDoctorReadyQueue(
  patients: Patient[],
  temperatures: TemperatureReading[],
  doctorVisits: DoctorVisit[],
  currentDateStr: string
): Array<{ patient: Patient; todayTemp: TemperatureReading }> {
  const ready: Array<{ patient: Patient; todayTemp: TemperatureReading }> = [];

  for (const patient of patients) {
    const hasVisit = getTodayDoctorVisit(patient.id, doctorVisits, currentDateStr);
    if (hasVisit) continue; // Already visited

    const todayTemp = getTodayTemperature(patient.id, temperatures, currentDateStr);
    if (todayTemp) {
      ready.push({ patient, todayTemp });
    }
  }

  // Sort descending by temperature value
  ready.sort((a, b) => b.todayTemp.value - a.todayTemp.value);
  return ready;
}
