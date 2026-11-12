import {
  Patient,
  TemperatureReading,
  DoctorVisit,
  ClosedCase,
  WardState,
  User,
  Role,
} from './types';
import {
  subtractDays,
  addDays,
  getFirstFreeBed,
} from './rules';

export const DEMO_USERS: User[] = [
  {
    id: 'user_nurse_1',
    name: 'Nurse Priya Sharma',
    role: 'nurse',
    title: 'General Ward Nurse (Shift A)',
  },
  {
    id: 'user_doctor_1',
    name: 'Dr. Rajesh Verma',
    role: 'doctor',
    title: 'Attending Physician (Quarantine Ward)',
  },
  {
    id: 'user_admin_1',
    name: 'Amit Patel',
    role: 'admin',
    title: 'Ward Operations Administrator',
  },
  {
    id: 'user_head_doctor_1',
    name: 'Dr. Sunita Rao',
    role: 'head_doctor',
    title: 'Head of Quarantine Facility',
  },
];

const LOCAL_STORAGE_KEY = 'wardflow_state_v1';
const CURRENT_USER_KEY = 'wardflow_current_user_v1';
const STORE_EVENT_NAME = 'wardflow_state_changed';

/**
 * Generate pristine seed data.
 * Day 5 (2026-11-12)
 * Exactly 25 active patients with realistic 4-day history.
 * Exactly 12 have temp taken today ("Temps done 12 / 25").
 * Exactly 2 (Diya Patel in B-04 and Vikram Singh in A-12) have 3 fever-free days (< 38.0°C).
 * 22 completed historical cases (19 cured, 3 deceased = 13.6% mortality, amber indicator).
 */
export function getInitialSeedData(): WardState {
  const currentDateStr = '2026-11-12';
  const dayNumber = 5;

  const d1 = subtractDays(currentDateStr, 4); // 2026-11-08
  const d2 = subtractDays(currentDateStr, 3); // 2026-11-09
  const d3 = subtractDays(currentDateStr, 2); // 2026-11-10
  const d4 = subtractDays(currentDateStr, 1); // 2026-11-11
  const d5 = currentDateStr;                 // 2026-11-12 (Today)

  const patients: Patient[] = [
    { id: 'p_01', bedCode: 'A-01', name: 'Aarav Sharma', age: 42, gender: 'Male', phone: '+91 98201 11201', admissionDate: d1, dischargeConfirmedByDoctor: false },
    { id: 'p_02', bedCode: 'A-02', name: 'Ananya Iyer', age: 31, gender: 'Female', phone: '+91 98450 22340', admissionDate: d2, dischargeConfirmedByDoctor: false },
    { id: 'p_03', bedCode: 'A-03', name: 'Rajesh Kulkarni', age: 58, gender: 'Male', phone: '+91 94220 33451', admissionDate: d1, dischargeConfirmedByDoctor: false },
    { id: 'p_04', bedCode: 'B-04', name: 'Diya Patel', age: 28, gender: 'Female', phone: '+91 98791 44562', admissionDate: d1, dischargeConfirmedByDoctor: false },
    { id: 'p_05', bedCode: 'A-05', name: 'Pooja Nair', age: 24, gender: 'Female', phone: '+91 94471 55673', admissionDate: d2, dischargeConfirmedByDoctor: false },
    { id: 'p_06', bedCode: 'A-06', name: 'Kabir Das', age: 37, gender: 'Male', phone: '+91 98110 66784', admissionDate: d1, dischargeConfirmedByDoctor: false },
    { id: 'p_07', bedCode: 'A-07', name: 'Meera Joshi', age: 62, gender: 'Female', phone: '+91 98221 77895', admissionDate: d1, dischargeConfirmedByDoctor: false },
    { id: 'p_08', bedCode: 'A-09', name: 'Rohan Gupta', age: 45, gender: 'Male', phone: '+91 98990 88906', admissionDate: d3, dischargeConfirmedByDoctor: false },
    { id: 'p_09', bedCode: 'B-01', name: 'Suresh Menon', age: 51, gender: 'Male', phone: '+91 98460 99017', admissionDate: d2, dischargeConfirmedByDoctor: false },
    { id: 'p_10', bedCode: 'B-02', name: 'Kavita Reddy', age: 39, gender: 'Female', phone: '+91 98480 12345', admissionDate: d1, dischargeConfirmedByDoctor: false },
    { id: 'p_11', bedCode: 'A-12', name: 'Vikram Singh', age: 35, gender: 'Male', phone: '+91 98101 23456', admissionDate: d1, dischargeConfirmedByDoctor: false },
    { id: 'p_12', bedCode: 'B-06', name: 'Arjun Rao', age: 29, gender: 'Male', phone: '+91 99001 34567', admissionDate: d3, dischargeConfirmedByDoctor: false },
    { id: 'p_13', bedCode: 'B-07', name: 'Deepa Shenoy', age: 34, gender: 'Female', phone: '+91 98205 45678', admissionDate: d2, dischargeConfirmedByDoctor: false },
    { id: 'p_14', bedCode: 'B-09', name: 'Siddharth Varma', age: 47, gender: 'Male', phone: '+91 98490 56789', admissionDate: d1, dischargeConfirmedByDoctor: false },
    { id: 'p_15', bedCode: 'B-11', name: 'Sunita Choudhury', age: 53, gender: 'Female', phone: '+91 94350 67890', admissionDate: d4, dischargeConfirmedByDoctor: false },
    { id: 'p_16', bedCode: 'B-12', name: 'Manoj Bhatt', age: 66, gender: 'Male', phone: '+91 98250 78901', admissionDate: d2, dischargeConfirmedByDoctor: false },
    { id: 'p_17', bedCode: 'A-15', name: 'Neha Deshmukh', age: 27, gender: 'Female', phone: '+91 98230 89012', admissionDate: d3, dischargeConfirmedByDoctor: false },
    { id: 'p_18', bedCode: 'A-18', name: 'Harish Pillai', age: 38, gender: 'Male', phone: '+91 94470 90123', admissionDate: d1, dischargeConfirmedByDoctor: false },
    { id: 'p_19', bedCode: 'A-20', name: 'Sneha Agarwal', age: 41, gender: 'Female', phone: '+91 98102 01234', admissionDate: d2, dischargeConfirmedByDoctor: false },
    { id: 'p_20', bedCode: 'B-15', name: 'Ashok Pandey', age: 60, gender: 'Male', phone: '+91 94150 12345', admissionDate: d3, dischargeConfirmedByDoctor: false },
    { id: 'p_21', bedCode: 'B-18', name: 'Geeta Saxena', age: 50, gender: 'Female', phone: '+91 98910 23456', admissionDate: d1, dischargeConfirmedByDoctor: false },
    { id: 'p_22', bedCode: 'B-21', name: 'Nikhil Mukherjee', age: 33, gender: 'Male', phone: '+91 98300 34567', admissionDate: d2, dischargeConfirmedByDoctor: false },
    { id: 'p_23', bedCode: 'B-22', name: 'Rashmi Sen', age: 44, gender: 'Female', phone: '+91 98310 45678', admissionDate: d3, dischargeConfirmedByDoctor: false },
    { id: 'p_24', bedCode: 'A-25', name: 'Pradeep Hegde', age: 56, gender: 'Male', phone: '+91 98800 56789', admissionDate: d1, dischargeConfirmedByDoctor: false },
    { id: 'p_25', bedCode: 'B-25', name: 'Kiran Kapoor', age: 48, gender: 'Male', phone: '+91 98112 67890', admissionDate: d4, dischargeConfirmedByDoctor: false },
  ];

  const temperatures: TemperatureReading[] = [];
  const doctorVisits: DoctorVisit[] = [];

  let readingCounter = 1;
  const addReading = (pId: string, val: number, date: string, time: string, nurse: string = 'Nurse Priya Sharma') => {
    temperatures.push({
      id: `t_${String(readingCounter++).padStart(4, '0')}`,
      patientId: pId,
      value: val,
      dateStr: date,
      timeStr: time,
      nurseName: nurse,
      timestamp: new Date(`${date}T${time}:00`).getTime(),
    });
  };

  let visitCounter = 1;
  const addVisit = (pId: string, date: string, time: string, notes: string) => {
    doctorVisits.push({
      id: `v_${String(visitCounter++).padStart(4, '0')}`,
      patientId: pId,
      dateStr: date,
      timeStr: time,
      doctorName: 'Dr. Rajesh Verma',
      notes,
      timestamp: new Date(`${date}T${time}:00`).getTime(),
    });
  };

  // 1. Diya Patel (p_04): Streak of 3 fever-free days (d2: 36.8, d3: 36.6, d4: 36.7, d5 today: 36.5) -> streak 3+
  addReading('p_04', 38.4, d1, '09:00');
  addReading('p_04', 36.8, d2, '09:10');
  addReading('p_04', 36.6, d3, '08:45');
  addReading('p_04', 36.7, d4, '09:20');
  addReading('p_04', 36.5, d5, '08:30'); // Today (1)

  // 2. Vikram Singh (p_11): Streak of 3 fever-free days (d2: 36.9, d3: 36.7, d4: 36.6, d5 today: 36.8) -> streak 3+
  addReading('p_11', 38.6, d1, '08:30');
  addReading('p_11', 36.9, d2, '09:15');
  addReading('p_11', 36.7, d3, '09:00');
  addReading('p_11', 36.6, d4, '08:45');
  addReading('p_11', 36.8, d5, '08:50'); // Today (2)

  // 3. Aarav Sharma (p_01): Fever on d3, improving d4, measured today
  addReading('p_01', 38.2, d1, '09:10');
  addReading('p_01', 38.9, d2, '08:40');
  addReading('p_01', 39.1, d3, '09:15');
  addReading('p_01', 37.4, d4, '08:50');
  addReading('p_01', 37.2, d5, '09:05'); // Today (3)

  // 4. Ananya Iyer (p_02): Spiked fever today
  addReading('p_02', 37.2, d2, '09:30');
  addReading('p_02', 37.5, d3, '09:00');
  addReading('p_02', 38.1, d4, '09:10');
  addReading('p_02', 39.2, d5, '09:12'); // Today (4)

  // 5. Rajesh Kulkarni (p_03): Critical temperature today (40.2°C)
  addReading('p_03', 38.0, d1, '10:00');
  addReading('p_03', 38.5, d2, '09:40');
  addReading('p_03', 39.0, d3, '09:20');
  addReading('p_03', 39.6, d4, '09:30');
  addReading('p_03', 40.2, d5, '09:15'); // Today (5) - CRITICAL

  // 6. Pooja Nair (p_05): Normal temp today
  addReading('p_05', 38.2, d2, '09:00');
  addReading('p_05', 37.8, d3, '09:15');
  addReading('p_05', 37.4, d4, '09:00');
  addReading('p_05', 37.1, d5, '09:20'); // Today (6)

  // 7. Meera Joshi (p_07): Temp done and Doctor visited today
  addReading('p_07', 38.5, d1, '08:45');
  addReading('p_07', 38.1, d2, '09:00');
  addReading('p_07', 37.6, d3, '09:10');
  addReading('p_07', 37.2, d4, '08:40');
  addReading('p_07', 37.0, d5, '08:15'); // Today (7)
  addVisit('p_07', d5, '10:15', 'Patient reports mild fatigue, chest clear, maintaining good O2 saturation.');

  // 8. Kavita Reddy (p_10): Moderate fever today
  addReading('p_10', 38.7, d1, '09:20');
  addReading('p_10', 38.2, d2, '09:15');
  addReading('p_10', 37.9, d3, '09:30');
  addReading('p_10', 37.5, d4, '09:05');
  addReading('p_10', 37.8, d5, '09:25'); // Today (8)

  // 9. Arjun Rao (p_12): High fever today (38.8)
  addReading('p_12', 38.9, d3, '09:40');
  addReading('p_12', 38.4, d4, '09:20');
  addReading('p_12', 38.8, d5, '09:30'); // Today (9)

  // 10. Deepa Shenoy (p_13): Temp done and Doctor visited today
  addReading('p_13', 38.0, d2, '08:50');
  addReading('p_13', 37.5, d3, '09:00');
  addReading('p_13', 37.1, d4, '09:10');
  addReading('p_13', 36.8, d5, '08:20'); // Today (10)
  addVisit('p_13', d5, '10:30', 'Day 2 fever-free. Appetite returning, continue current isolation protocol.');

  // 11. Siddharth Varma (p_14): Temp done today
  addReading('p_14', 38.3, d1, '09:30');
  addReading('p_14', 37.9, d2, '09:10');
  addReading('p_14', 37.4, d3, '09:25');
  addReading('p_14', 37.0, d4, '09:15');
  addReading('p_14', 37.0, d5, '09:35'); // Today (11)

  // 12. Sneha Agarwal (p_19): Temp done and Doctor visited today
  addReading('p_19', 38.5, d2, '09:10');
  addReading('p_19', 38.0, d3, '09:00');
  addReading('p_19', 37.3, d4, '09:20');
  addReading('p_19', 37.1, d5, '08:10'); // Today (12)
  addVisit('p_19', d5, '10:45', 'Stable vitals, encouraging oral hydration, monitor closely.');

  // The remaining 13 patients (p_06, p_08, p_09, p_15, p_16, p_17, p_18, p_20, p_21, p_22, p_23, p_24, p_25)
  // have historical readings for d1-d4, but NO reading on d5 (today) yet!
  // This makes exactly 12 / 25 temps done today!

  addReading('p_06', 38.6, d1, '09:00');
  addReading('p_06', 38.2, d2, '09:30');
  addReading('p_06', 37.9, d3, '09:10');
  addReading('p_06', 37.5, d4, '09:20');

  addReading('p_08', 38.8, d3, '09:15');
  addReading('p_08', 38.4, d4, '09:00');

  addReading('p_09', 38.4, d2, '09:10');
  addReading('p_09', 38.0, d3, '09:25');
  addReading('p_09', 37.6, d4, '09:00');

  addReading('p_15', 38.7, d4, '10:00');

  addReading('p_16', 38.9, d2, '09:35');
  addReading('p_16', 38.5, d3, '09:15');
  addReading('p_16', 38.2, d4, '09:40');

  addReading('p_17', 37.9, d3, '09:00');
  addReading('p_17', 37.3, d4, '08:50');

  addReading('p_18', 38.5, d1, '09:15');
  addReading('p_18', 38.0, d2, '09:20');
  addReading('p_18', 37.5, d3, '09:10');
  addReading('p_18', 37.2, d4, '09:00');

  addReading('p_20', 38.6, d3, '09:30');
  addReading('p_20', 38.1, d4, '09:15');

  addReading('p_21', 38.7, d1, '09:00');
  addReading('p_21', 38.3, d2, '09:10');
  addReading('p_21', 37.8, d3, '09:25');
  addReading('p_21', 37.4, d4, '09:00');

  addReading('p_22', 38.1, d2, '09:20');
  addReading('p_22', 37.7, d3, '09:10');
  addReading('p_22', 37.2, d4, '09:05');

  addReading('p_23', 38.8, d3, '09:45');
  addReading('p_23', 38.3, d4, '09:30');

  addReading('p_24', 38.4, d1, '09:10');
  addReading('p_24', 38.0, d2, '09:15');
  addReading('p_24', 37.6, d3, '09:00');
  addReading('p_24', 37.1, d4, '08:55');

  addReading('p_25', 39.0, d4, '10:15');

  // Closed historical cases: 22 cases total (19 cured, 3 deceased)
  // Deceased / Total = 3 / 22 = 13.6% (Between 12% and 15% -> Amber range)
  const closedCases: ClosedCase[] = [
    { id: 'c_01', patientId: 'old_01', name: 'Ramesh Chawla', bedCode: 'A-08', outcome: 'cured', admissionDate: '2026-10-20', dischargeDate: '2026-10-28', daysStayed: 8, notes: 'Completed 3 fever-free days.' },
    { id: 'c_02', patientId: 'old_02', name: 'Sunil Gavaskar', bedCode: 'A-10', outcome: 'cured', admissionDate: '2026-10-21', dischargeDate: '2026-10-30', daysStayed: 9, notes: 'Discharged in stable condition.' },
    { id: 'c_03', patientId: 'old_03', name: 'Bhupendra Patel', bedCode: 'A-11', outcome: 'deceased', admissionDate: '2026-10-22', dischargeDate: '2026-10-27', daysStayed: 5, notes: 'Acute respiratory distress syndrome.' },
    { id: 'c_04', patientId: 'old_04', name: 'Lakshmi Narayanan', bedCode: 'A-13', outcome: 'cured', admissionDate: '2026-10-22', dischargeDate: '2026-10-31', daysStayed: 9, notes: 'Full recovery, no fever for 4 days.' },
    { id: 'c_05', patientId: 'old_05', name: 'Fatima Sheikh', bedCode: 'A-14', outcome: 'cured', admissionDate: '2026-10-23', dischargeDate: '2026-10-30', daysStayed: 7, notes: 'Discharged.' },
    { id: 'c_06', patientId: 'old_06', name: 'Govind Swamy', bedCode: 'A-16', outcome: 'cured', admissionDate: '2026-10-24', dischargeDate: '2026-11-01', daysStayed: 8, notes: 'Cured.' },
    { id: 'c_07', patientId: 'old_07', name: 'Shalini Verma', bedCode: 'A-17', outcome: 'cured', admissionDate: '2026-10-25', dischargeDate: '2026-11-02', daysStayed: 8, notes: 'Cured.' },
    { id: 'c_08', patientId: 'old_08', name: 'Tariq Ahmed', bedCode: 'A-19', outcome: 'deceased', admissionDate: '2026-10-25', dischargeDate: '2026-10-29', daysStayed: 4, notes: 'Septic complication.' },
    { id: 'c_09', patientId: 'old_09', name: 'Indira Sengupta', bedCode: 'B-03', outcome: 'cured', admissionDate: '2026-10-26', dischargeDate: '2026-11-04', daysStayed: 9, notes: 'Recovered fully.' },
    { id: 'c_10', patientId: 'old_10', name: 'Gautam Gambhir', bedCode: 'B-05', outcome: 'cured', admissionDate: '2026-10-27', dischargeDate: '2026-11-03', daysStayed: 7, notes: 'Cured.' },
    { id: 'c_11', patientId: 'old_11', name: 'Aparna Sen', bedCode: 'B-08', outcome: 'cured', admissionDate: '2026-10-28', dischargeDate: '2026-11-05', daysStayed: 8, notes: 'Cured.' },
    { id: 'c_12', patientId: 'old_12', name: 'Naveen Jindal', bedCode: 'B-10', outcome: 'cured', admissionDate: '2026-10-28', dischargeDate: '2026-11-06', daysStayed: 9, notes: 'Cured.' },
    { id: 'c_13', patientId: 'old_13', name: 'Manish Sisodia', bedCode: 'B-13', outcome: 'cured', admissionDate: '2026-10-29', dischargeDate: '2026-11-06', daysStayed: 8, notes: 'Cured.' },
    { id: 'c_14', patientId: 'old_14', name: 'Padma Lakshmi', bedCode: 'B-14', outcome: 'cured', admissionDate: '2026-10-30', dischargeDate: '2026-11-07', daysStayed: 8, notes: 'Cured.' },
    { id: 'c_15', patientId: 'old_15', name: 'Kamal Haasan', bedCode: 'B-16', outcome: 'deceased', admissionDate: '2026-10-30', dischargeDate: '2026-11-04', daysStayed: 5, notes: 'Severe viral pneumonia.' },
    { id: 'c_16', patientId: 'old_16', name: 'Vandana Shiva', bedCode: 'B-17', outcome: 'cured', admissionDate: '2026-10-31', dischargeDate: '2026-11-08', daysStayed: 8, notes: 'Cured.' },
    { id: 'c_17', patientId: 'old_17', name: 'Devendra Fadnavis', bedCode: 'B-19', outcome: 'cured', admissionDate: '2026-11-01', dischargeDate: '2026-11-09', daysStayed: 8, notes: 'Cured.' },
    { id: 'c_18', patientId: 'old_18', name: 'Urmila Matondkar', bedCode: 'B-20', outcome: 'cured', admissionDate: '2026-11-02', dischargeDate: '2026-11-09', daysStayed: 7, notes: 'Cured.' },
    { id: 'c_19', patientId: 'old_19', name: 'Sudha Murthy', bedCode: 'B-23', outcome: 'cured', admissionDate: '2026-11-02', dischargeDate: '2026-11-10', daysStayed: 8, notes: 'Cured.' },
    { id: 'c_20', patientId: 'old_20', name: 'Chetan Bhagat', bedCode: 'B-24', outcome: 'cured', admissionDate: '2026-11-03', dischargeDate: '2026-11-11', daysStayed: 8, notes: 'Cured.' },
    { id: 'c_21', patientId: 'old_21', name: 'Rohit Bal', bedCode: 'A-21', outcome: 'cured', admissionDate: '2026-11-03', dischargeDate: '2026-11-11', daysStayed: 8, notes: 'Cured.' },
    { id: 'c_22', patientId: 'old_22', name: 'Shashi Tharoor', bedCode: 'A-22', outcome: 'cured', admissionDate: '2026-11-04', dischargeDate: '2026-11-12', daysStayed: 8, notes: 'Cured.' },
  ];

  return {
    currentDateStr,
    dayNumber,
    patients,
    temperatures,
    doctorVisits,
    closedCases,
  };
}

/**
 * Single store manager for localStorage.
 */
class WardStore {
  private state: WardState;

  constructor() {
    this.state = getInitialSeedData();
    if (typeof window !== 'undefined') {
      this.load();
    }
  }

  private notify() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(STORE_EVENT_NAME));
    }
  }

  private load(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.patients) && parsed.currentDateStr) {
          this.state = parsed;
          return;
        }
      }
    } catch {
      // Fallback to initial seed
    }
    this.state = getInitialSeedData();
    this.save();
  }

  private save(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state));
      this.notify();
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  }

  public getState(): WardState {
    return this.state;
  }

  public resetToDefault(): void {
    this.state = getInitialSeedData();
    this.save();
  }

  /**
   * Records a patient temperature reading.
   * Enforces one measurement per day rule.
   */
  public recordTemperature(
    patientId: string,
    value: number,
    nurseName: string,
    timeStr?: string
  ): { success: boolean; error?: string } {
    const today = this.state.currentDateStr;
    const existing = this.state.temperatures.find(
      (t) => t.patientId === patientId && t.dateStr === today
    );

    if (existing) {
      return {
        success: false,
        error: `Already measured at ${existing.timeStr} by ${existing.nurseName}`,
      };
    }

    const now = new Date();
    const formattedTime =
      timeStr ||
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newReading: TemperatureReading = {
      id: `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      patientId,
      value,
      dateStr: today,
      timeStr: formattedTime,
      nurseName,
      timestamp: Date.now(),
    };

    this.state.temperatures = [newReading, ...this.state.temperatures];
    this.save();
    return { success: true };
  }

  /**
   * Marks a patient as visited by the doctor today.
   */
  public markDoctorVisited(
    patientId: string,
    doctorName: string,
    notes: string = ''
  ): { success: boolean; error?: string } {
    const today = this.state.currentDateStr;
    const hasTemp = this.state.temperatures.some(
      (t) => t.patientId === patientId && t.dateStr === today
    );

    if (!hasTemp) {
      return {
        success: false,
        error: 'Temperature not taken yet',
      };
    }

    // Check if already visited today
    const existingVisitIndex = this.state.doctorVisits.findIndex(
      (v) => v.patientId === patientId && v.dateStr === today
    );

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (existingVisitIndex >= 0) {
      // Update existing visit notes
      this.state.doctorVisits[existingVisitIndex].notes = notes;
      this.state.doctorVisits[existingVisitIndex].doctorName = doctorName;
    } else {
      const newVisit: DoctorVisit = {
        id: `v_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        patientId,
        dateStr: today,
        timeStr,
        doctorName,
        notes,
        timestamp: Date.now(),
      };
      this.state.doctorVisits = [newVisit, ...this.state.doctorVisits];
    }

    // Also update patient notes
    const patient = this.state.patients.find((p) => p.id === patientId);
    if (patient && notes) {
      patient.notes = notes;
    }

    this.save();
    return { success: true };
  }

  /**
   * Doctor confirms discharge for a patient (only when streak >= 3).
   */
  public confirmDischarge(patientId: string): { success: boolean; error?: string } {
    const patient = this.state.patients.find((p) => p.id === patientId);
    if (!patient) return { success: false, error: 'Patient not found' };

    patient.dischargeConfirmedByDoctor = true;
    this.save();
    return { success: true };
  }

  /**
   * Marks a patient as deceased.
   * Closes the case immediately and frees the bed.
   */
  public markDeceased(
    patientId: string,
    reason: string = 'Cardiac/respiratory arrest'
  ): { success: boolean; error?: string } {
    const patientIndex = this.state.patients.findIndex((p) => p.id === patientId);
    if (patientIndex === -1) return { success: false, error: 'Patient not found' };

    const patient = this.state.patients[patientIndex];
    const today = this.state.currentDateStr;

    // Calculate days stayed
    const [y1, m1, d1] = patient.admissionDate.split('-').map(Number);
    const [y2, m2, d2] = today.split('-').map(Number);
    const msDiff = Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1);
    const daysStayed = Math.max(1, Math.round(msDiff / (1000 * 60 * 60 * 24)));

    const closed: ClosedCase = {
      id: `c_${Date.now()}`,
      patientId: patient.id,
      name: patient.name,
      bedCode: patient.bedCode,
      outcome: 'deceased',
      admissionDate: patient.admissionDate,
      dischargeDate: today,
      daysStayed,
      notes: reason,
    };

    // Remove from active patients
    this.state.patients.splice(patientIndex, 1);
    this.state.closedCases = [closed, ...this.state.closedCases];

    this.save();
    return { success: true };
  }

  /**
   * Admin admits a new patient and assigns first free bed from the 74 beds.
   */
  public admitPatient(data: {
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    phone: string;
  }): { success: boolean; error?: string; patient?: Patient } {
    const occupiedBeds = this.state.patients.map((p) => p.bedCode);
    const freeBed = getFirstFreeBed(occupiedBeds);

    if (!freeBed) {
      return {
        success: false,
        error: 'No beds free',
      };
    }

    const newPatient: Patient = {
      id: `p_${Date.now()}`,
      bedCode: freeBed,
      name: data.name.trim(),
      age: data.age,
      gender: data.gender,
      phone: data.phone.trim(),
      admissionDate: this.state.currentDateStr,
      dischargeConfirmedByDoctor: false,
    };

    this.state.patients.push(newPatient);
    this.save();
    return { success: true, patient: newPatient };
  }

  /**
   * Admin finalizes discharge for doctor-confirmed patients.
   * Frees the bed and closes the case as 'cured'.
   */
  public finalizeDischarge(patientId: string): { success: boolean; error?: string } {
    const patientIndex = this.state.patients.findIndex((p) => p.id === patientId);
    if (patientIndex === -1) return { success: false, error: 'Patient not found' };

    const patient = this.state.patients[patientIndex];
    if (!patient.dischargeConfirmedByDoctor) {
      return { success: false, error: 'Discharge has not been confirmed by a doctor yet' };
    }

    const today = this.state.currentDateStr;
    const [y1, m1, d1] = patient.admissionDate.split('-').map(Number);
    const [y2, m2, d2] = today.split('-').map(Number);
    const msDiff = Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1);
    const daysStayed = Math.max(1, Math.round(msDiff / (1000 * 60 * 60 * 24)));

    const closed: ClosedCase = {
      id: `c_${Date.now()}`,
      patientId: patient.id,
      name: patient.name,
      bedCode: patient.bedCode,
      outcome: 'cured',
      admissionDate: patient.admissionDate,
      dischargeDate: today,
      daysStayed,
      notes: 'Discharged after passing 3-day fever-free protocol.',
    };

    this.state.patients.splice(patientIndex, 1);
    this.state.closedCases = [closed, ...this.state.closedCases];

    this.save();
    return { success: true };
  }

  /**
   * DEMO BUTTON: "Advance to next day"
   * Moves date forward by 1 calendar day.
   * All daily statuses reset to "Temp pending" because tomorrow has no readings or visits yet.
   */
  public advanceToNextDay(): void {
    const nextDate = addDays(this.state.currentDateStr, 1);
    this.state.currentDateStr = nextDate;
    this.state.dayNumber += 1;
    this.save();
  }

  /**
   * Current active demo user management.
   */
  public getCurrentUser(): User {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(CURRENT_USER_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.id && parsed.role) {
            return parsed;
          }
        }
      } catch {
        // default
      }
    }
    return DEMO_USERS[0]; // Nurse Priya by default
  }

  public setCurrentUser(user: User): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        this.notify();
      } catch (err) {
        console.error('Failed to store current user', err);
      }
    }
  }
}

export const wardStore = new WardStore();

export { STORE_EVENT_NAME };
