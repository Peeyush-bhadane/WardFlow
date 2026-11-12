'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Patient, TemperatureReading, DoctorVisit, User } from '@/lib/types';
import {
  calculateFeverFreeStreak,
  isEligibleForDischarge,
  canDoctorVisit,
  getTodayTemperature,
  getTodayDoctorVisit,
  FEVER_THRESHOLD_CELSIUS,
  DISCHARGE_STREAK_REQUIREMENT,
} from '@/lib/rules';
import {
  X,
  Stethoscope,
  CheckCircle,
  AlertOctagon,
  Calendar,
  Phone,
  User as UserIcon,
  Flame,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface PatientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  temperatures: TemperatureReading[];
  doctorVisits: DoctorVisit[];
  currentDateStr: string;
  currentUser: User;
  onMarkVisited: (
    patientId: string,
    doctorName: string,
    notes: string
  ) => { success: boolean; error?: string };
  onConfirmDischarge: (patientId: string) => { success: boolean; error?: string };
  onMarkDeceased: (
    patientId: string,
    reason: string
  ) => { success: boolean; error?: string };
}

export function PatientDetailModal({
  isOpen,
  onClose,
  patient,
  temperatures,
  doctorVisits,
  currentDateStr,
  currentUser,
  onMarkVisited,
  onConfirmDischarge,
  onMarkDeceased,
}: PatientDetailModalProps) {
  const [notes, setNotes] = useState('');
  const [showDeceasedConfirm, setShowDeceasedConfirm] = useState(false);
  const [deceasedReason, setDeceasedReason] = useState('Severe viral pneumonia complication');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const todayTemp = patient
    ? getTodayTemperature(patient.id, temperatures, currentDateStr)
    : undefined;

  const todayVisit = patient
    ? getTodayDoctorVisit(patient.id, doctorVisits, currentDateStr)
    : undefined;

  // Streak calculation
  const streak = useMemo(() => {
    if (!patient) return 0;
    return calculateFeverFreeStreak(patient.id, temperatures, currentDateStr);
  }, [patient, temperatures, currentDateStr]);

  const eligibleForDischarge = isEligibleForDischarge(streak);
  const doctorVisitCheck = patient
    ? canDoctorVisit(patient.id, temperatures, currentDateStr)
    : { canVisit: false };

  // Prepare chart data for Recharts
  const chartData = useMemo(() => {
    if (!patient) return [];
    return temperatures
      .filter((t) => t.patientId === patient.id)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((t) => ({
        label: `${t.dateStr.slice(5)} ${t.timeStr}`,
        temp: t.value,
        date: t.dateStr,
        time: t.timeStr,
        nurse: t.nurseName,
      }));
  }, [patient, temperatures]);

  useEffect(() => {
    if (patient) {
      setNotes(todayVisit?.notes || patient.notes || '');
      setShowDeceasedConfirm(false);
      setActionFeedback(null);
    }
  }, [patient, todayVisit]);

  if (!isOpen || !patient) return null;

  const handleMarkVisited = () => {
    if (!doctorVisitCheck.canVisit) return;

    const res = onMarkVisited(patient.id, currentUser.name, notes.trim());
    if (res.success) {
      setActionFeedback({
        type: 'success',
        message: 'Patient marked as visited for today.',
      });
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setActionFeedback({
        type: 'error',
        message: res.error || 'Failed to mark visited',
      });
    }
  };

  const handleConfirmDischarge = () => {
    if (!eligibleForDischarge) return;

    const res = onConfirmDischarge(patient.id);
    if (res.success) {
      setActionFeedback({
        type: 'success',
        message: 'Discharge confirmed by doctor. Patient sent to Admin discharge list.',
      });
      setTimeout(() => {
        onClose();
      }, 800);
    } else {
      setActionFeedback({
        type: 'error',
        message: res.error || 'Failed to confirm discharge',
      });
    }
  };

  const handleMarkDeceased = () => {
    const res = onMarkDeceased(patient.id, deceasedReason.trim());
    if (res.success) {
      setShowDeceasedConfirm(false);
      onClose();
    } else {
      setActionFeedback({
        type: 'error',
        message: res.error || 'Failed to record deceased case',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-3 sm:p-4">
      <div className="bg-clinical-card border border-clinical-border w-full max-w-2xl rounded-[6px] shadow-sm overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-clinical-border flex items-center justify-between bg-clinical-bg/50">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm px-3 py-1 rounded-[6px] bg-clinical-teal text-white">
              {patient.bedCode}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-clinical-text">
                  {patient.name}
                </h2>
                {patient.dischargeConfirmedByDoctor && (
                  <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-status-blueLight text-status-blue border border-status-blueBorder font-medium">
                    Doctor Approved for Discharge
                  </span>
                )}
              </div>
              <p className="text-xs text-clinical-muted">
                {patient.age} yrs • {patient.gender} • Admitted {patient.admissionDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-clinical-muted hover:text-clinical-text rounded-[6px] hover:bg-clinical-bg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action feedback banner */}
        {actionFeedback && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 ${
              actionFeedback.type === 'success'
                ? 'bg-status-greenLight text-status-green border-b border-status-greenBorder'
                : 'bg-status-redLight text-status-red border-b border-status-redBorder'
            }`}
          >
            {actionFeedback.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Top Row: Demographics & Streak Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Demographics Card */}
            <div className="p-3.5 rounded-[6px] bg-clinical-bg border border-clinical-border space-y-1.5 text-xs">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-clinical-muted block">
                Patient Information
              </span>
              <div className="flex items-center justify-between text-clinical-text">
                <span className="flex items-center gap-1.5 text-clinical-muted">
                  <UserIcon className="w-3.5 h-3.5" /> Age & Sex:
                </span>
                <span className="font-medium">
                  {patient.age} yrs, {patient.gender}
                </span>
              </div>
              <div className="flex items-center justify-between text-clinical-text">
                <span className="flex items-center gap-1.5 text-clinical-muted">
                  <Phone className="w-3.5 h-3.5" /> Emergency Contact:
                </span>
                <span className="font-mono">{patient.phone}</span>
              </div>
              <div className="flex items-center justify-between text-clinical-text">
                <span className="flex items-center gap-1.5 text-clinical-muted">
                  <Calendar className="w-3.5 h-3.5" /> Quarantine Day:
                </span>
                <span className="font-medium">Day 5</span>
              </div>
            </div>

            {/* STREAK RULE CARD: "Day X of 3 fever-free" */}
            <div className="p-3.5 rounded-[6px] bg-clinical-bg border border-clinical-border flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-clinical-muted block">
                  Discharge Readiness Protocol
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Flame
                    className={`w-4 h-4 ${
                      streak >= DISCHARGE_STREAK_REQUIREMENT
                        ? 'text-status-green'
                        : streak > 0
                        ? 'text-status-amber'
                        : 'text-clinical-muted'
                    }`}
                  />
                  <span className="font-bold text-sm text-clinical-text">
                    Day {streak} of {DISCHARGE_STREAK_REQUIREMENT} fever-free
                  </span>
                </div>
                <p className="text-[11px] text-clinical-muted mt-0.5">
                  Consecutive calendar days below {FEVER_THRESHOLD_CELSIUS.toFixed(1)} °C.
                  Any fever or missing day resets to 0.
                </p>
              </div>

              {/* Progress dots */}
              <div className="flex items-center gap-2 mt-3">
                {[1, 2, 3].map((step) => {
                  const isReached = streak >= step;
                  return (
                    <div
                      key={step}
                      className={`flex-1 h-2 rounded-[4px] border ${
                        isReached
                          ? 'bg-status-green border-status-green'
                          : 'bg-white border-clinical-border'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recharts Temperature History Line Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-clinical-muted">
                Temperature Progression (°C)
              </span>
              <div className="flex items-center gap-3 text-[11px] text-clinical-muted">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-clinical-teal inline-block" />
                  <span>Reading</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-status-red inline-block" />
                  <span>38.0 °C Fever Threshold</span>
                </div>
              </div>
            </div>

            <div className="h-52 w-full bg-white border border-clinical-border rounded-[6px] p-2">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-clinical-muted">
                  No readings logged yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 12, right: 16, left: -20, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3E1DA" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#5B6B75"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[35.5, 41.5]}
                      ticks={[36, 37, 38, 39, 40, 41]}
                      stroke="#5B6B75"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-clinical-card border border-clinical-border rounded-[6px] p-2 text-xs shadow-none">
                              <p className="font-bold text-clinical-text">
                                {data.temp.toFixed(1)} °C
                              </p>
                              <p className="text-[11px] text-clinical-muted">
                                {data.date} at {data.time}
                              </p>
                              <p className="text-[11px] text-clinical-muted">
                                By {data.nurse}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* 38.0 °C Dashed Fever Threshold */}
                    <ReferenceLine
                      y={FEVER_THRESHOLD_CELSIUS}
                      stroke="#B3372E"
                      strokeDasharray="4 4"
                      label={{
                        value: '38.0 °C',
                        position: 'insideTopRight',
                        fill: '#B3372E',
                        fontSize: 10,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#0F6B6B"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#0F6B6B' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Doctor Clinical Notes Box */}
          <div className="space-y-1.5">
            <label
              htmlFor="doctor-notes"
              className="block text-xs font-semibold uppercase tracking-wider text-clinical-muted"
            >
              Doctor Clinical Notes & Observations
            </label>
            <textarea
              id="doctor-notes"
              rows={3}
              placeholder="e.g. Patient alert, chest sounds clear, continue hydration..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-[6px] border border-clinical-border bg-white text-clinical-text focus:outline-none placeholder:text-clinical-muted"
            />
          </div>

          {/* Deceased Confirmation Warning Dialog (Inline) */}
          {showDeceasedConfirm && (
            <div className="p-4 rounded-[6px] bg-status-redLight border border-status-redBorder space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertOctagon className="w-5 h-5 text-status-red shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-status-red">
                    Confirm Deceased Status for {patient.name} ({patient.bedCode})
                  </h4>
                  <p className="text-[11px] text-clinical-text/80 mt-0.5">
                    This will immediately vacate bed {patient.bedCode}, close this case as deceased, and impact the facility mortality benchmark.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-status-red mb-1">
                  Primary Cause / Clinical Note:
                </label>
                <input
                  type="text"
                  value={deceasedReason}
                  onChange={(e) => setDeceasedReason(e.target.value)}
                  className="w-full text-xs p-2 rounded-[6px] border border-status-redBorder bg-white text-clinical-text focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowDeceasedConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-[6px] bg-white border border-clinical-border text-clinical-text hover:bg-clinical-bg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkDeceased}
                  className="px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-status-red text-white hover:bg-[#9B2E26]"
                >
                  Confirm Deceased
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-clinical-border bg-clinical-bg/50 flex flex-wrap items-center justify-between gap-3">
          {/* Mark Deceased button */}
          {!showDeceasedConfirm && (
            <button
              onClick={() => setShowDeceasedConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[6px] text-status-red hover:bg-status-redLight border border-status-redBorder transition-colors"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Mark deceased</span>
            </button>
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Mark Visited Button */}
            <div className="relative group">
              <button
                onClick={handleMarkVisited}
                disabled={!doctorVisitCheck.canVisit}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[6px] transition-colors ${
                  todayVisit
                    ? 'bg-status-greenLight text-status-green border border-status-greenBorder hover:bg-status-greenLight/80'
                    : doctorVisitCheck.canVisit
                    ? 'bg-clinical-teal text-white hover:bg-clinical-tealHover'
                    : 'bg-clinical-bg border border-clinical-border text-clinical-muted cursor-not-allowed opacity-60'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>{todayVisit ? 'Update Visit Notes' : 'Mark visited'}</span>
              </button>
              {!doctorVisitCheck.canVisit && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-clinical-text text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-sm pointer-events-none">
                  {doctorVisitCheck.reason || 'Temperature not taken yet'}
                </div>
              )}
            </div>

            {/* Confirm Discharge Button (only enabled when streak is 3) */}
            <div className="relative group">
              <button
                onClick={handleConfirmDischarge}
                disabled={!eligibleForDischarge || patient.dischargeConfirmedByDoctor}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[6px] transition-colors ${
                  patient.dischargeConfirmedByDoctor
                    ? 'bg-status-blueLight text-status-blue border border-status-blueBorder cursor-default'
                    : eligibleForDischarge
                    ? 'bg-status-green text-white hover:bg-[#256B42]'
                    : 'bg-clinical-bg border border-clinical-border text-clinical-muted cursor-not-allowed opacity-60'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>
                  {patient.dischargeConfirmedByDoctor
                    ? 'Discharge Confirmed'
                    : 'Confirm discharge'}
                </span>
              </button>
              {!eligibleForDischarge && !patient.dischargeConfirmedByDoctor && (
                <div className="absolute bottom-full mb-1 right-0 hidden group-hover:block bg-clinical-text text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-sm pointer-events-none">
                  Requires 3 consecutive fever-free days (Currently {streak}/3)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
