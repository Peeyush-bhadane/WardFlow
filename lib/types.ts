export type Role = 'nurse' | 'doctor' | 'admin' | 'head_doctor';

export type DailyStatus = 'temp_pending' | 'temp_done' | 'doctor_visited';

export interface User {
  id: string;
  name: string;
  role: Role;
  title: string;
}

export interface TemperatureReading {
  id: string;
  patientId: string;
  value: number; // in °C (e.g. 37.4)
  dateStr: string; // e.g. "2026-11-12"
  timeStr: string; // e.g. "09:15"
  nurseName: string;
  timestamp: number;
}

export interface DoctorVisit {
  id: string;
  patientId: string;
  dateStr: string; // "YYYY-MM-DD"
  timeStr: string; // "HH:MM"
  doctorName: string;
  notes: string;
  timestamp: number;
}

export interface Patient {
  id: string;
  bedCode: string; // e.g. "B-12"
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  admissionDate: string; // "YYYY-MM-DD"
  dischargeConfirmedByDoctor: boolean;
  notes?: string;
}

export interface ClosedCase {
  id: string;
  patientId: string;
  name: string;
  bedCode: string;
  outcome: 'cured' | 'deceased';
  admissionDate: string;
  dischargeDate: string;
  daysStayed: number;
  notes?: string;
}

export interface WardState {
  currentDateStr: string; // e.g. "2026-11-12"
  dayNumber: number; // e.g. 5
  patients: Patient[];
  temperatures: TemperatureReading[];
  doctorVisits: DoctorVisit[];
  closedCases: ClosedCase[];
}
