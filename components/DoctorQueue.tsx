import React, { useState, useMemo } from 'react';
import { Patient, TemperatureReading, DoctorVisit, User } from '@/lib/types';
import {
  getTodayTemperature,
  getTodayDoctorVisit,
  calculateFeverFreeStreak,
} from '@/lib/rules';
import { PatientDetailModal } from './PatientDetailModal';
import {
  Clock,
  Thermometer,
  UserCheck,
  ChevronRight,
  Flame,
  CheckCircle2,
  Stethoscope,
  Search,
} from 'lucide-react';

interface DoctorQueueProps {
  patients: Patient[];
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

type TabType = 'ready' | 'not_measured' | 'seen';

export function DoctorQueue({
  patients,
  temperatures,
  doctorVisits,
  currentDateStr,
  currentUser,
  onMarkVisited,
  onConfirmDischarge,
  onMarkDeceased,
}: DoctorQueueProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ready');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Categorize patients into the 3 tabs
  const { readyList, notMeasuredList, seenList } = useMemo(() => {
    const ready: Array<{ patient: Patient; todayTemp: TemperatureReading }> = [];
    const notMeasured: Array<{ patient: Patient; latestReading?: TemperatureReading }> = [];
    const seen: Array<{ patient: Patient; todayTemp?: TemperatureReading; visit: DoctorVisit }> = [];

    for (const patient of patients) {
      const todayTemp = getTodayTemperature(patient.id, temperatures, currentDateStr);
      const todayVisit = getTodayDoctorVisit(patient.id, doctorVisits, currentDateStr);

      if (todayVisit) {
        seen.push({ patient, todayTemp, visit: todayVisit });
      } else if (todayTemp) {
        ready.push({ patient, todayTemp });
      } else {
        const pastTemps = temperatures
          .filter((t) => t.patientId === patient.id)
          .sort((a, b) => b.timestamp - a.timestamp);
        notMeasured.push({ patient, latestReading: pastTemps[0] });
      }
    }

    // REQUIREMENT: "Ready for me" sorted by HIGHEST temperature first
    ready.sort((a, b) => b.todayTemp.value - a.todayTemp.value);

    // Not measured: sort by bed code
    notMeasured.sort((a, b) =>
      a.patient.bedCode.localeCompare(b.patient.bedCode, undefined, { numeric: true })
    );

    // Seen: sort by visit time descending
    seen.sort((a, b) => b.visit.timestamp - a.visit.timestamp);

    return { readyList: ready, notMeasuredList: notMeasured, seenList: seen };
  }, [patients, temperatures, doctorVisits, currentDateStr]);

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDetailOpen(true);
  };

  const q = searchQuery.toLowerCase().trim();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Header Banner */}
      <div className="bg-clinical-card border border-clinical-border rounded-[6px] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-status-blue">
                Doctor Rounds
              </span>
              <span className="text-xs text-clinical-muted">• Attending Physician</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-clinical-text mt-1">
              Physician Consultation Queue
            </h1>
            <p className="text-xs text-clinical-muted mt-0.5">
              Patients with taken temperatures prioritized by severity. Select any patient to inspect chart, record visit, or evaluate discharge.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-[6px] bg-status-blueLight text-status-blue font-semibold border border-status-blueBorder">
              {readyList.length} Ready for Review
            </span>
          </div>
        </div>
      </div>

      {/* 3 Tabs: "Ready for me", "Not measured yet", "Seen today" */}
      <div className="flex flex-wrap gap-2 border-b border-clinical-border pb-2">
        <button
          onClick={() => setActiveTab('ready')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-semibold transition-colors ${
            activeTab === 'ready'
              ? 'bg-status-blue text-white shadow-none'
              : 'bg-clinical-card border border-clinical-border text-clinical-text hover:bg-clinical-bg'
          }`}
        >
          <Thermometer className="w-3.5 h-3.5" />
          <span>Ready for me</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'ready'
                ? 'bg-white/20 text-white'
                : 'bg-clinical-bg text-clinical-muted'
            }`}
          >
            {readyList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('not_measured')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-semibold transition-colors ${
            activeTab === 'not_measured'
              ? 'bg-status-grey text-white shadow-none'
              : 'bg-clinical-card border border-clinical-border text-clinical-text hover:bg-clinical-bg'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Not measured yet</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'not_measured'
                ? 'bg-white/20 text-white'
                : 'bg-clinical-bg text-clinical-muted'
            }`}
          >
            {notMeasuredList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('seen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-semibold transition-colors ${
            activeTab === 'seen'
              ? 'bg-status-green text-white shadow-none'
              : 'bg-clinical-card border border-clinical-border text-clinical-text hover:bg-clinical-bg'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Seen today</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'seen'
                ? 'bg-white/20 text-white'
                : 'bg-clinical-bg text-clinical-muted'
            }`}
          >
            {seenList.length}
          </span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-clinical-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Filter queue by room (e.g. B-04) or patient name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-clinical-card border border-clinical-border rounded-[6px] text-xs sm:text-sm text-clinical-text placeholder:text-clinical-muted focus:outline-none"
        />
      </div>

      {/* Tab Content List */}
      <div className="bg-clinical-card border border-clinical-border rounded-[6px] overflow-hidden">
        {/* Table Header */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2.5 bg-clinical-bg border-b border-clinical-border text-xs font-semibold text-clinical-muted uppercase tracking-wider">
          <div className="col-span-2">Bed / Room</div>
          <div className="col-span-3">Patient Profile</div>
          <div className="col-span-2">
            {activeTab === 'ready' ? "Today's Temperature (Sorted)" : 'Temperature'}
          </div>
          <div className="col-span-3">
            {activeTab === 'seen' ? 'Visit Note' : 'Fever-free Streak'}
          </div>
          <div className="col-span-2 text-right">Details</div>
        </div>

        <div className="divide-y divide-clinical-border">
          {/* TAB 1: READY FOR ME */}
          {activeTab === 'ready' && (
            readyList
              .filter(
                (item) =>
                  !q ||
                  item.patient.name.toLowerCase().includes(q) ||
                  item.patient.bedCode.toLowerCase().includes(q)
              )
              .map(({ patient, todayTemp }, idx) => {
                const streak = calculateFeverFreeStreak(
                  patient.id,
                  temperatures,
                  currentDateStr
                );
                const isCritical = todayTemp.value >= 40.0;
                const isFever = todayTemp.value >= 38.0;

                return (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientClick(patient)}
                    className="w-full text-left p-4 sm:py-3 sm:px-4 flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 items-start sm:items-center hover:bg-clinical-bg/50 cursor-pointer transition-colors"
                  >
                    <div className="sm:col-span-2 flex items-center justify-between w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-[6px] bg-status-blueLight border border-status-blueBorder text-status-blue">
                          {patient.bedCode}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] font-semibold text-status-red uppercase">
                            Priority #1
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3 min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-clinical-text truncate">
                        {patient.name}
                      </div>
                      <div className="text-[11px] text-clinical-muted">
                        {patient.age}y • {patient.gender}
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2">
                      <div
                        className={`font-mono font-bold text-sm px-2 py-0.5 rounded-[4px] flex items-center gap-1.5 ${
                          isCritical
                            ? 'bg-status-redLight text-status-red border border-status-redBorder'
                            : isFever
                            ? 'bg-status-amberLight text-status-amber border border-status-amberBorder'
                            : 'bg-clinical-bg text-clinical-text border border-clinical-border'
                        }`}
                      >
                        <Thermometer className="w-3.5 h-3.5" />
                        <span>{todayTemp.value.toFixed(1)} °C</span>
                      </div>
                      {isCritical && (
                        <span className="text-[10px] font-bold text-status-red">
                          Critical
                        </span>
                      )}
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-1.5 text-xs text-clinical-muted">
                      <Flame
                        className={`w-3.5 h-3.5 ${
                          streak >= 3
                            ? 'text-status-green'
                            : streak > 0
                            ? 'text-status-amber'
                            : 'text-clinical-muted'
                        }`}
                      />
                      <span className="font-medium text-clinical-text">
                        Day {streak} of 3 fever-free
                      </span>
                    </div>

                    <div className="sm:col-span-2 text-right flex items-center justify-end">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-blue">
                        <span>Review Chart</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })
          )}

          {/* TAB 2: NOT MEASURED YET */}
          {activeTab === 'not_measured' && (
            notMeasuredList
              .filter(
                (item) =>
                  !q ||
                  item.patient.name.toLowerCase().includes(q) ||
                  item.patient.bedCode.toLowerCase().includes(q)
              )
              .map(({ patient, latestReading }) => {
                const streak = calculateFeverFreeStreak(
                  patient.id,
                  temperatures,
                  currentDateStr
                );

                return (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientClick(patient)}
                    className="w-full text-left p-4 sm:py-3 sm:px-4 flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 items-start sm:items-center hover:bg-clinical-bg/50 cursor-pointer transition-colors bg-[#FAFAF8]"
                  >
                    <div className="sm:col-span-2">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-[6px] bg-clinical-bg border border-clinical-border text-clinical-muted">
                        {patient.bedCode}
                      </span>
                    </div>

                    <div className="sm:col-span-3 min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-clinical-text truncate">
                        {patient.name}
                      </div>
                      <div className="text-[11px] text-clinical-muted">
                        {patient.age}y • {patient.gender}
                      </div>
                    </div>

                    <div className="sm:col-span-2 text-xs text-status-grey font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending nurse log</span>
                    </div>

                    <div className="sm:col-span-3 text-xs text-clinical-muted">
                      <span>Streak: {streak}/3 days</span>
                      {latestReading && (
                        <span className="block text-[11px]">
                          Prev: {latestReading.value.toFixed(1)} °C ({latestReading.dateStr})
                        </span>
                      )}
                    </div>

                    <div className="sm:col-span-2 text-right flex items-center justify-end">
                      <span className="text-xs text-clinical-muted">
                        Awaiting temp
                      </span>
                    </div>
                  </div>
                );
              })
          )}

          {/* TAB 3: SEEN TODAY */}
          {activeTab === 'seen' && (
            seenList
              .filter(
                (item) =>
                  !q ||
                  item.patient.name.toLowerCase().includes(q) ||
                  item.patient.bedCode.toLowerCase().includes(q)
              )
              .map(({ patient, todayTemp, visit }) => (
                <div
                  key={patient.id}
                  onClick={() => handlePatientClick(patient)}
                  className="w-full text-left p-4 sm:py-3 sm:px-4 flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 items-start sm:items-center hover:bg-clinical-bg/50 cursor-pointer transition-colors"
                >
                  <div className="sm:col-span-2">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-[6px] bg-status-greenLight border border-status-greenBorder text-status-green">
                      {patient.bedCode}
                    </span>
                  </div>

                  <div className="sm:col-span-3 min-w-0">
                    <div className="font-semibold text-xs sm:text-sm text-clinical-text truncate">
                      {patient.name}
                    </div>
                    <div className="text-[11px] text-clinical-muted">
                      {patient.age}y • {patient.gender}
                    </div>
                  </div>

                  <div className="sm:col-span-2 text-xs font-mono">
                    {todayTemp ? (
                      <span className="font-semibold text-clinical-text">
                        {todayTemp.value.toFixed(1)} °C
                      </span>
                    ) : (
                      <span>-</span>
                    )}
                  </div>

                  <div className="sm:col-span-3 text-xs text-clinical-text min-w-0">
                    <p className="truncate text-xs font-medium">
                      &quot;{visit.notes || 'Routine check completed'}&quot;
                    </p>
                    <span className="text-[11px] text-clinical-muted">
                      Visited at {visit.timeStr} by {visit.doctorName}
                    </span>
                  </div>

                  <div className="sm:col-span-2 text-right flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-4 h-4 text-status-green" />
                    <span className="text-xs font-medium text-status-green">
                      Completed
                    </span>
                  </div>
                </div>
              ))
          )}

          {/* Empty tab state */}
          {((activeTab === 'ready' && readyList.length === 0) ||
            (activeTab === 'not_measured' && notMeasuredList.length === 0) ||
            (activeTab === 'seen' && seenList.length === 0)) && (
            <div className="py-12 text-center text-xs text-clinical-muted">
              No patients in this queue.
            </div>
          )}
        </div>
      </div>

      {/* Patient Detail Modal */}
      <PatientDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
        temperatures={temperatures}
        doctorVisits={doctorVisits}
        currentDateStr={currentDateStr}
        currentUser={currentUser}
        onMarkVisited={onMarkVisited}
        onConfirmDischarge={onConfirmDischarge}
        onMarkDeceased={onMarkDeceased}
      />
    </div>
  );
}
