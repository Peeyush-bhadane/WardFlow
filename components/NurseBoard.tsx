import React, { useState, useMemo } from 'react';
import { Patient, TemperatureReading, DoctorVisit, User } from '@/lib/types';
import {
  getTodayStatus,
  getTodayTemperature,
  calculateDailyCompletion,
} from '@/lib/rules';
import { StatusChip } from './StatusChip';
import { RecordTempModal } from './RecordTempModal';
import { Search, Thermometer, ChevronRight, CheckCircle2 } from 'lucide-react';

interface NurseBoardProps {
  patients: Patient[];
  temperatures: TemperatureReading[];
  doctorVisits: DoctorVisit[];
  currentDateStr: string;
  currentUser: User;
  onSaveTemperature: (
    patientId: string,
    value: number,
    nurseName: string
  ) => { success: boolean; error?: string };
}

export function NurseBoard({
  patients,
  temperatures,
  doctorVisits,
  currentDateStr,
  currentUser,
  onSaveTemperature,
}: NurseBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Daily stats for top banner: "Temps done X / Y"
  const stats = useMemo(() => {
    return calculateDailyCompletion(
      patients,
      temperatures,
      doctorVisits,
      currentDateStr
    );
  }, [patients, temperatures, doctorVisits, currentDateStr]);

  // Filtered and sorted patient list: Pending first, then by room code
  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return patients
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.bedCode.toLowerCase().includes(q) ||
          p.phone.includes(q)
        );
      })
      .map((patient) => {
        const status = getTodayStatus(
          patient.id,
          temperatures,
          doctorVisits,
          currentDateStr
        );
        const todayTemp = getTodayTemperature(
          patient.id,
          temperatures,
          currentDateStr
        );

        // Get absolute latest reading (either today or previous)
        const patientReadings = temperatures
          .filter((t) => t.patientId === patient.id)
          .sort((a, b) => b.timestamp - a.timestamp);
        const latestReading = patientReadings[0];

        return {
          patient,
          status,
          todayTemp,
          latestReading,
        };
      })
      .sort((a, b) => {
        // Pending first, then sorted by bedCode
        if (a.status === 'temp_pending' && b.status !== 'temp_pending') return -1;
        if (a.status !== 'temp_pending' && b.status === 'temp_pending') return 1;
        return a.patient.bedCode.localeCompare(b.patient.bedCode, undefined, {
          numeric: true,
        });
      });
  }, [patients, temperatures, doctorVisits, currentDateStr, searchQuery]);

  const handleRowClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const progressPercent =
    stats.totalActive > 0
      ? Math.round((stats.tempsDoneCount / stats.totalActive) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Top Banner: Clinical status and exact required top text "Temps done 12 / 25" */}
      <div className="bg-clinical-card border border-clinical-border rounded-[6px] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-clinical-teal">
                Today&apos;s Board
              </span>
              <span className="text-xs text-clinical-muted">• Nurse Shift</span>
            </div>
            {/* Required top text */}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-clinical-text mt-1">
              Temps done {stats.tempsDoneCount} / {stats.totalActive}
            </h1>
            <p className="text-xs text-clinical-muted mt-0.5">
              Tap any pending patient to log temperature. Measured patients are automatically updated for the doctor.
            </p>
          </div>

          {/* Linear Progress Indicator */}
          <div className="sm:w-64 space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-clinical-muted">
              <span>Shift Progress</span>
              <span className="font-mono font-semibold text-clinical-text">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full bg-clinical-bg border border-clinical-border h-2.5 rounded-[4px] overflow-hidden">
              <div
                className="bg-clinical-teal h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search Filter Box */}
      <div className="relative">
        <Search className="w-4 h-4 text-clinical-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by room (e.g. B-04) or patient name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-clinical-card border border-clinical-border rounded-[6px] text-xs sm:text-sm text-clinical-text placeholder:text-clinical-muted focus:outline-none"
        />
      </div>

      {/* Patient List (Dense style, mobile-first with 48px min-height tap targets) */}
      <div className="bg-clinical-card border border-clinical-border rounded-[6px] overflow-hidden shadow-none">
        {/* Table Header (hidden on very small screens, visible on tablet/desktop) */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2.5 bg-clinical-bg border-b border-clinical-border text-xs font-semibold text-clinical-muted uppercase tracking-wider">
          <div className="col-span-2">Room / Bed</div>
          <div className="col-span-3">Patient Name</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Last Temp</div>
          <div className="col-span-2">Time & Nurse</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-clinical-border">
          {filteredPatients.length === 0 ? (
            <div className="py-12 text-center text-xs text-clinical-muted">
              No patients match &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredPatients.map(({ patient, status, todayTemp, latestReading }) => {
              const isMeasured = status !== 'temp_pending';
              const displayReading = todayTemp || latestReading;

              return (
                <div
                  key={patient.id}
                  onClick={() => handleRowClick(patient)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleRowClick(patient);
                    }
                  }}
                  className={`w-full text-left transition-colors cursor-pointer select-none min-h-[48px] sm:min-h-0 flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 px-4 py-3 sm:py-2.5 items-start sm:items-center ${
                    isMeasured
                      ? 'bg-[#FCFCFA] opacity-65 text-clinical-muted hover:opacity-90 hover:bg-clinical-bg/40'
                      : 'bg-white hover:bg-clinical-bg/50 text-clinical-text font-medium'
                  }`}
                >
                  {/* Room / Bed */}
                  <div className="sm:col-span-2 flex items-center justify-between w-full sm:w-auto">
                    <span className="inline-flex items-center justify-center font-mono font-bold text-xs px-2.5 py-1 rounded-[6px] bg-clinical-bg border border-clinical-border text-clinical-text">
                      {patient.bedCode}
                    </span>
                    {/* Status Chip on Mobile */}
                    <div className="sm:hidden">
                      <StatusChip status={status} size="sm" />
                    </div>
                  </div>

                  {/* Patient Name & Demographics */}
                  <div className="sm:col-span-3 min-w-0">
                    <div className="font-semibold text-xs sm:text-sm text-clinical-text truncate">
                      {patient.name}
                    </div>
                    <div className="text-[11px] text-clinical-muted">
                      {patient.age}y • {patient.gender} • Admitted {patient.admissionDate}
                    </div>
                  </div>

                  {/* Status Chip (Desktop) */}
                  <div className="hidden sm:block sm:col-span-2">
                    <StatusChip status={status} size="sm" />
                  </div>

                  {/* Last Temp */}
                  <div className="sm:col-span-2 flex items-center gap-1.5 text-xs">
                    {displayReading ? (
                      <>
                        <Thermometer
                          className={`w-3.5 h-3.5 shrink-0 ${
                            displayReading.value >= 40.0
                              ? 'text-status-red'
                              : displayReading.value >= 38.0
                              ? 'text-status-amber'
                              : 'text-clinical-muted'
                          }`}
                        />
                        <span className="font-mono font-semibold">
                          {displayReading.value.toFixed(1)} °C
                        </span>
                        {displayReading.value >= 38.0 && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-status-amberLight text-status-amber font-medium">
                            Fever
                          </span>
                        )}
                        {!todayTemp && (
                          <span className="text-[10px] text-clinical-muted">
                            (prev)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-clinical-muted italic">No readings</span>
                    )}
                  </div>

                  {/* Time & Nurse */}
                  <div className="sm:col-span-2 text-xs text-clinical-muted min-w-0 truncate">
                    {todayTemp ? (
                      <div>
                        <span className="font-medium text-clinical-text">
                          {todayTemp.timeStr}
                        </span>{' '}
                        <span>by {todayTemp.nurseName.replace('Nurse ', '')}</span>
                      </div>
                    ) : latestReading ? (
                      <span className="text-[11px]">
                        Last: {latestReading.dateStr}
                      </span>
                    ) : (
                      <span>-</span>
                    )}
                  </div>

                  {/* Action / Arrow */}
                  <div className="sm:col-span-1 text-right flex items-center justify-end">
                    {status === 'temp_pending' ? (
                      <span className="inline-flex items-center text-xs font-semibold text-clinical-teal hover:underline gap-0.5">
                        <span className="sm:hidden">Record</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs text-clinical-muted">
                        <CheckCircle2 className="w-4 h-4 text-status-green" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Record Temperature Modal */}
      <RecordTempModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
        temperatures={temperatures}
        currentDateStr={currentDateStr}
        currentUser={currentUser}
        onSaveTemperature={onSaveTemperature}
      />
    </div>
  );
}
