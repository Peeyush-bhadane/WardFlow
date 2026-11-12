import React, { useState, useEffect } from 'react';
import { Patient, TemperatureReading, User } from '@/lib/types';
import {
  validateTemperature,
  getTodayTemperature,
  MIN_TEMP,
  MAX_TEMP,
} from '@/lib/rules';
import {
  Thermometer,
  AlertTriangle,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  History,
} from 'lucide-react';

interface RecordTempModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  temperatures: TemperatureReading[];
  currentDateStr: string;
  currentUser: User;
  onSaveTemperature: (
    patientId: string,
    value: number,
    nurseName: string
  ) => { success: boolean; error?: string };
}

export function RecordTempModal({
  isOpen,
  onClose,
  patient,
  temperatures,
  currentDateStr,
  currentUser,
  onSaveTemperature,
}: RecordTempModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Check if patient already has a reading today
  const existingTodayReading = patient
    ? getTodayTemperature(patient.id, temperatures, currentDateStr)
    : undefined;

  // Filter last 3 readings for this patient
  const patientPastReadings = patient
    ? temperatures
        .filter((t) => t.patientId === patient.id)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3)
    : [];

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setErrorMessage(null);
      setSaveSuccessMessage(null);
    }
  }, [isOpen, patient]);

  if (!isOpen || !patient) return null;

  const validation = validateTemperature(inputValue);
  const isInputEmpty = inputValue.trim() === '';

  const handleQuickSelect = (val: number) => {
    setInputValue(val.toFixed(1));
    setErrorMessage(null);
  };

  const handleSave = () => {
    if (existingTodayReading) {
      return;
    }

    if (isInputEmpty) {
      setErrorMessage('Please enter a temperature value');
      return;
    }

    const res = validateTemperature(inputValue);
    if (!res.isValid || res.value === undefined) {
      setErrorMessage(res.error || 'Please check the value');
      return;
    }

    const saveResult = onSaveTemperature(patient.id, res.value, currentUser.name);
    if (!saveResult.success) {
      setErrorMessage(saveResult.error || 'Could not save temperature');
      return;
    }

    setSaveSuccessMessage('Recorded successfully');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-3 sm:p-4">
      <div className="bg-clinical-card border border-clinical-border w-full max-w-md rounded-[6px] shadow-sm overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-clinical-border flex items-center justify-between bg-clinical-bg/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-clinical-tealLight text-clinical-teal flex items-center justify-center font-bold text-xs">
              {patient.bedCode}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-clinical-text">
                Record Temperature
              </h2>
              <p className="text-xs text-clinical-muted">
                {patient.name} • {patient.age}y {patient.gender}
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

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Duplicate Measurement Warning */}
          {existingTodayReading && (
            <div className="p-3.5 rounded-[6px] bg-status-blueLight border border-status-blueBorder text-xs text-status-blue flex items-start gap-2.5">
              <Clock className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">
                  Already measured at {existingTodayReading.timeStr} by {existingTodayReading.nurseName}
                </p>
                <p className="text-status-blue/80 mt-0.5">
                  Today&apos;s logged reading: <span className="font-bold">{existingTodayReading.value.toFixed(1)} °C</span>.
                  Secondary measurement prevented by protocol.
                </p>
              </div>
            </div>
          )}

          {/* Success Flash */}
          {saveSuccessMessage && (
            <div className="p-3 rounded-[6px] bg-status-greenLight border border-status-greenBorder text-xs text-status-green flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Critical Warning (>= 40.0 °C) */}
          {!existingTodayReading && !isInputEmpty && validation.isCritical && (
            <div className="p-3 rounded-[6px] bg-status-redLight border border-status-redBorder text-xs text-status-red flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="font-bold">Critical, inform doctor</span>
            </div>
          )}

          {/* Validation Error */}
          {errorMessage && (
            <div className="p-3 rounded-[6px] bg-status-redLight border border-status-redBorder text-xs text-status-red flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Big Number Input */}
          {!existingTodayReading ? (
            <div className="space-y-3">
              <label
                htmlFor="temp-input"
                className="block text-xs font-semibold uppercase tracking-wider text-clinical-muted"
              >
                Current Reading (°C)
              </label>

              <div className="relative flex items-center">
                <input
                  id="temp-input"
                  type="number"
                  step="0.1"
                  min={MIN_TEMP}
                  max={MAX_TEMP}
                  placeholder="37.0"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setErrorMessage(null);
                  }}
                  className={`w-full text-center text-4xl font-mono font-bold tracking-tight py-4 px-3 rounded-[6px] border bg-white focus:outline-none transition-colors ${
                    validation.isCritical
                      ? 'border-status-red text-status-red'
                      : !validation.isValid && !isInputEmpty
                      ? 'border-status-red text-status-red'
                      : 'border-clinical-border text-clinical-text'
                  }`}
                  autoFocus
                />
                <span className="absolute right-4 text-sm font-semibold text-clinical-muted pointer-events-none">
                  °C
                </span>
              </div>

              {/* Quick Select Buttons for rapid bedside logging */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[36.5, 37.0, 37.5, 38.0, 38.5, 39.0, 39.5, 40.0].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickSelect(val)}
                    className="py-1.5 text-xs font-medium rounded-[6px] border border-clinical-border bg-clinical-bg hover:bg-white text-clinical-text transition-colors"
                  >
                    {val.toFixed(1)}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-clinical-muted text-center">
                Protocol valid range: {MIN_TEMP} °C to {MAX_TEMP} °C
              </p>
            </div>
          ) : null}

          {/* Past 3 readings section */}
          <div className="pt-2 border-t border-clinical-border">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-clinical-muted mb-2">
              <History className="w-3.5 h-3.5" />
              <span>Last 3 Readings</span>
            </div>

            {patientPastReadings.length === 0 ? (
              <p className="text-xs text-clinical-muted italic">No previous readings recorded</p>
            ) : (
              <div className="space-y-1.5">
                {patientPastReadings.map((r) => {
                  const isFever = r.value >= 38.0;
                  const isCritical = r.value >= 40.0;
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-[6px] bg-clinical-bg border border-clinical-border/70"
                    >
                      <div className="flex items-center gap-2">
                        <Thermometer
                          className={`w-3.5 h-3.5 ${
                            isCritical
                              ? 'text-status-red'
                              : isFever
                              ? 'text-status-amber'
                              : 'text-clinical-muted'
                          }`}
                        />
                        <span className="font-mono font-semibold text-clinical-text">
                          {r.value.toFixed(1)} °C
                        </span>
                        {isFever && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-[4px] bg-status-amberLight text-status-amber font-medium">
                            Fever
                          </span>
                        )}
                      </div>
                      <div className="text-right text-[11px] text-clinical-muted">
                        <span>{r.dateStr}</span> • <span>{r.timeStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Big Save Button (48px tap target) */}
        <div className="p-4 border-t border-clinical-border bg-clinical-bg/50">
          {!existingTodayReading ? (
            <button
              onClick={handleSave}
              className="w-full h-12 flex items-center justify-center font-semibold text-sm rounded-[6px] bg-clinical-teal text-white hover:bg-clinical-tealHover transition-colors shadow-none cursor-pointer"
            >
              Save Temperature
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full h-12 flex items-center justify-center font-semibold text-sm rounded-[6px] bg-clinical-card border border-clinical-border text-clinical-text hover:bg-clinical-bg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
