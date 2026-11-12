import React, { useState } from 'react';
import { Patient, ClosedCase } from '@/lib/types';
import {
  getFirstFreeBed,
  TOTAL_BEDS,
} from '@/lib/rules';
import {
  UserPlus,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Bed,
  Phone,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';

interface AdminViewProps {
  patients: Patient[];
  closedCases: ClosedCase[];
  currentDateStr: string;
  onAdmitPatient: (data: {
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    phone: string;
  }) => { success: boolean; error?: string; patient?: Patient };
  onFinalizeDischarge: (patientId: string) => { success: boolean; error?: string };
}

type AdminTab = 'admit' | 'discharge_list';

export function AdminView({
  patients,
  closedCases,
  currentDateStr,
  onAdmitPatient,
  onFinalizeDischarge,
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('admit');

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('+91 ');
  const [formError, setFormError] = useState<string | null>(null);
  const [admitSuccess, setAdmitSuccess] = useState<string | null>(null);

  // Check next free bed
  const occupiedBedCodes = patients.map((p) => p.bedCode);
  const nextFreeBed = getFirstFreeBed(occupiedBedCodes);
  const isFull = !nextFreeBed || patients.length >= TOTAL_BEDS;

  // Filter doctor-confirmed patients waiting for administrative checkout
  const confirmedDischargePatients = patients.filter(
    (p) => p.dischargeConfirmedByDoctor
  );

  const handleAdmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setAdmitSuccess(null);

    if (isFull) {
      setFormError('No beds free');
      return;
    }

    if (!name.trim()) {
      setFormError('Please enter the patient name');
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 115) {
      setFormError('Please enter a valid age');
      return;
    }

    if (!phone.trim() || phone.trim() === '+91') {
      setFormError('Please enter a valid phone number');
      return;
    }

    const res = onAdmitPatient({
      name: name.trim(),
      age: parsedAge,
      gender,
      phone: phone.trim(),
    });

    if (res.success && res.patient) {
      setAdmitSuccess(
        `Patient ${res.patient.name} admitted successfully and assigned bed ${res.patient.bedCode}.`
      );
      setName('');
      setAge('');
      setPhone('+91 ');
      setTimeout(() => {
        setAdmitSuccess(null);
      }, 5000);
    } else {
      setFormError(res.error || 'Failed to admit patient');
    }
  };

  const handleMarkDischarged = (patientId: string) => {
    const res = onFinalizeDischarge(patientId);
    if (!res.success) {
      alert(res.error || 'Failed to discharge patient');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Header Banner */}
      <div className="bg-clinical-card border border-clinical-border rounded-[6px] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-status-amber">
                Ward Operations
              </span>
              <span className="text-xs text-clinical-muted">• Administrator</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-clinical-text mt-1">
              Admission & Administrative Discharge
            </h1>
            <p className="text-xs text-clinical-muted mt-0.5">
              Manage facility intake and bed allocations across the 74-bed capacity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-[6px] bg-clinical-bg border border-clinical-border text-xs text-clinical-text">
              <span className="text-clinical-muted">Bed Status: </span>
              <span className="font-bold">{patients.length} / {TOTAL_BEDS}</span> occupied
            </div>
          </div>
        </div>
      </div>

      {/* Two Tabs: "Admit patient" & "Discharge list" */}
      <div className="flex gap-2 border-b border-clinical-border pb-2">
        <button
          onClick={() => setActiveTab('admit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-semibold transition-colors ${
            activeTab === 'admit'
              ? 'bg-clinical-teal text-white shadow-none'
              : 'bg-clinical-card border border-clinical-border text-clinical-text hover:bg-clinical-bg'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Admit patient</span>
        </button>

        <button
          onClick={() => setActiveTab('discharge_list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-semibold transition-colors ${
            activeTab === 'discharge_list'
              ? 'bg-clinical-teal text-white shadow-none'
              : 'bg-clinical-card border border-clinical-border text-clinical-text hover:bg-clinical-bg'
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Discharge list</span>
          {confirmedDischargePatients.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-status-green text-white font-mono">
              {confirmedDischargePatients.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ADMIT PATIENT FORM */}
      {activeTab === 'admit' && (
        <div className="max-w-xl bg-clinical-card border border-clinical-border rounded-[6px] p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-clinical-text">
              New Patient Intake
            </h2>
            <p className="text-xs text-clinical-muted mt-0.5">
              Assigned bed code is automatically calculated from the first available bed.
            </p>
          </div>

          {/* Bed Availability Callout */}
          {isFull ? (
            <div className="p-3.5 rounded-[6px] bg-status-redLight border border-status-redBorder text-xs text-status-red font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No beds free (74/74 occupied)</span>
            </div>
          ) : (
            <div className="p-3.5 rounded-[6px] bg-clinical-bg border border-clinical-border text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-clinical-teal" />
                <span className="text-clinical-muted">Next Free Bed Allocation:</span>
              </div>
              <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-clinical-tealLight text-clinical-teal">
                {nextFreeBed}
              </span>
            </div>
          )}

          {formError && (
            <div className="p-3 rounded-[6px] bg-status-redLight border border-status-redBorder text-xs text-status-red flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {admitSuccess && (
            <div className="p-3 rounded-[6px] bg-status-greenLight border border-status-greenBorder text-xs text-status-green flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{admitSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAdmitSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="patient-name"
                className="block text-xs font-semibold text-clinical-text mb-1"
              >
                Patient Full Name
              </label>
              <input
                id="patient-name"
                type="text"
                placeholder="e.g. Diya Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isFull}
                className="w-full text-xs p-2.5 rounded-[6px] border border-clinical-border bg-white text-clinical-text focus:outline-none disabled:bg-clinical-bg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="patient-age"
                  className="block text-xs font-semibold text-clinical-text mb-1"
                >
                  Age (years)
                </label>
                <input
                  id="patient-age"
                  type="number"
                  placeholder="35"
                  min="1"
                  max="115"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  disabled={isFull}
                  className="w-full text-xs p-2.5 rounded-[6px] border border-clinical-border bg-white text-clinical-text focus:outline-none disabled:bg-clinical-bg"
                />
              </div>

              <div>
                <label
                  htmlFor="patient-gender"
                  className="block text-xs font-semibold text-clinical-text mb-1"
                >
                  Gender
                </label>
                <select
                  id="patient-gender"
                  value={gender}
                  onChange={(e) =>
                    setGender(e.target.value as 'Male' | 'Female' | 'Other')
                  }
                  disabled={isFull}
                  className="w-full text-xs p-2.5 rounded-[6px] border border-clinical-border bg-white text-clinical-text focus:outline-none disabled:bg-clinical-bg"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="patient-phone"
                className="block text-xs font-semibold text-clinical-text mb-1"
              >
                Emergency Contact Phone
              </label>
              <input
                id="patient-phone"
                type="tel"
                placeholder="+91 98201 11201"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isFull}
                className="w-full text-xs p-2.5 rounded-[6px] border border-clinical-border bg-white text-clinical-text focus:outline-none font-mono disabled:bg-clinical-bg"
              />
            </div>

            <button
              type="submit"
              disabled={isFull}
              className={`w-full py-2.5 text-xs font-semibold rounded-[6px] transition-colors ${
                isFull
                  ? 'bg-clinical-bg border border-clinical-border text-clinical-muted cursor-not-allowed'
                  : 'bg-clinical-teal text-white hover:bg-clinical-tealHover'
              }`}
            >
              Admit Patient & Assign Bed {nextFreeBed || ''}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: DISCHARGE LIST */}
      {activeTab === 'discharge_list' && (
        <div className="bg-clinical-card border border-clinical-border rounded-[6px] overflow-hidden">
          <div className="p-4 bg-clinical-bg/50 border-b border-clinical-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-clinical-text">
                Doctor-Confirmed Discharge List
              </h2>
              <p className="text-xs text-clinical-muted">
                Patients who have fulfilled the 3-day fever-free protocol and received physician clearance.
              </p>
            </div>
            <span className="text-xs font-medium text-clinical-muted">
              {confirmedDischargePatients.length} awaiting checkout
            </span>
          </div>

          <div className="divide-y divide-clinical-border">
            {confirmedDischargePatients.length === 0 ? (
              <div className="py-12 text-center text-xs text-clinical-muted space-y-1">
                <ShieldCheck className="w-6 h-6 text-clinical-muted mx-auto mb-2" />
                <p className="font-semibold text-clinical-text">No patients pending discharge</p>
                <p>
                  When a doctor confirms discharge in the patient detail modal, the patient will appear here for administrative discharge.
                </p>
              </div>
            ) : (
              confirmedDischargePatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-clinical-bg/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-[6px] bg-status-greenLight border border-status-greenBorder text-status-green">
                      {patient.bedCode}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-clinical-text">
                        {patient.name}
                      </h3>
                      <p className="text-xs text-clinical-muted">
                        {patient.age}y {patient.gender} • Admitted {patient.admissionDate} • Phone: {patient.phone}
                      </p>
                      <p className="text-[11px] text-status-green font-medium mt-1">
                        Doctor verified: 3 fever-free days verified.
                      </p>
                    </div>
                  </div>

                  <div>
                    {/* "Mark discharged" button frees the bed and closes the case as Cured */}
                    <button
                      onClick={() => handleMarkDischarged(patient.id)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[6px] bg-status-green text-white hover:bg-[#256B42] transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Mark discharged</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
