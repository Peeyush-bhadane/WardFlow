import React, { useMemo } from 'react';
import {
  Patient,
  TemperatureReading,
  DoctorVisit,
  ClosedCase,
} from '@/lib/types';
import {
  calculateMortality,
  calculateOccupancy,
  calculateAverageStay,
  calculateDailyCompletion,
  MORTALITY_BENCHMARK_PERCENT,
  MORTALITY_AMBER_PERCENT,
  TOTAL_BEDS,
  MIN_CLOSED_CASES_FOR_MORTALITY,
} from '@/lib/rules';
import {
  AlertTriangle,
  Bed,
  CalendarDays,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  UserX,
  Stethoscope,
  Activity,
} from 'lucide-react';

interface DashboardViewProps {
  patients: Patient[];
  temperatures: TemperatureReading[];
  doctorVisits: DoctorVisit[];
  closedCases: ClosedCase[];
  currentDateStr: string;
}

export function DashboardView({
  patients,
  temperatures,
  doctorVisits,
  closedCases,
  currentDateStr,
}: DashboardViewProps) {
  // 1. Mortality Metrics
  const mortality = useMemo(() => {
    return calculateMortality(closedCases);
  }, [closedCases]);

  // 2. Occupancy Metrics
  const occupancy = useMemo(() => {
    return calculateOccupancy(patients.length, TOTAL_BEDS);
  }, [patients.length]);

  // 3. Average Stay
  const avgStay = useMemo(() => {
    return calculateAverageStay(closedCases);
  }, [closedCases]);

  // 4. Today's Completion & Missed Today List
  const dailyStats = useMemo(() => {
    return calculateDailyCompletion(
      patients,
      temperatures,
      doctorVisits,
      currentDateStr
    );
  }, [patients, temperatures, doctorVisits, currentDateStr]);

  // Combined Missed Today List
  const missedTodayList = useMemo(() => {
    const list: Array<{
      patient: Patient;
      missedTemp: boolean;
      missedVisit: boolean;
    }> = [];

    for (const patient of patients) {
      const missedTemp = dailyStats.missedTempsPatients.some(
        (p) => p.id === patient.id
      );
      const missedVisit = dailyStats.missedVisitsPatients.some(
        (p) => p.id === patient.id
      );

      if (missedTemp || missedVisit) {
        list.push({ patient, missedTemp, missedVisit });
      }
    }

    // Sort by bed code
    return list.sort((a, b) =>
      a.patient.bedCode.localeCompare(b.patient.bedCode, undefined, { numeric: true })
    );
  }, [patients, dailyStats]);

  const tempsPercent =
    dailyStats.totalActive > 0
      ? Math.round((dailyStats.tempsDoneCount / dailyStats.totalActive) * 100)
      : 0;

  const visitsPercent =
    dailyStats.totalActive > 0
      ? Math.round((dailyStats.visitsDoneCount / dailyStats.totalActive) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Top Banner */}
      <div className="bg-clinical-card border border-clinical-border rounded-[6px] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-status-green">
                Facility Executive Overview
              </span>
              <span className="text-xs text-clinical-muted">• Head Doctor</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-clinical-text mt-1">
              Epidemic Ward Surveillance & Governance
            </h1>
            <p className="text-xs text-clinical-muted mt-0.5">
              Read-only aggregate metrics, mortality benchmark comparison, bed occupancy, and daily completion audits.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-[6px] bg-clinical-bg border border-clinical-border font-medium text-clinical-muted">
              Quarantine Protocol Active
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Mortality Rate & Benchmark Gauge */}
        <div className="bg-clinical-card border border-clinical-border rounded-[6px] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-clinical-muted uppercase tracking-wider">
                Mortality vs Benchmark
              </span>
              <span className="text-[11px] font-mono text-clinical-muted">
                Limit: {MORTALITY_BENCHMARK_PERCENT}%
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              {mortality.hasEnoughData ? (
                <>
                  <span
                    className={`text-3xl font-bold font-mono tracking-tight ${
                      mortality.status === 'red'
                        ? 'text-status-red'
                        : mortality.status === 'amber'
                        ? 'text-status-amber'
                        : 'text-status-green'
                    }`}
                  >
                    {mortality.ratePercentage.toFixed(1)}%
                  </span>
                  <span className="text-xs text-clinical-muted">
                    ({mortality.deceasedCount} / {mortality.totalClosed} closed)
                  </span>
                </>
              ) : (
                <div className="py-1">
                  <span className="text-base font-semibold text-status-amber px-2.5 py-1 rounded bg-status-amberLight border border-status-amberBorder inline-block">
                    Not enough data
                  </span>
                  <p className="text-[11px] text-clinical-muted mt-1">
                    Requires at least {MIN_CLOSED_CASES_FOR_MORTALITY} closed cases (Currently {mortality.totalClosed})
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mortality Gauge Bar with 15% marker line */}
          {mortality.hasEnoughData && (
            <div className="mt-4 pt-2 border-t border-clinical-border/60">
              <div className="relative w-full h-3 bg-clinical-bg border border-clinical-border rounded-[4px] overflow-hidden">
                {/* 15% line marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-clinical-text z-10"
                  style={{ left: `${(MORTALITY_BENCHMARK_PERCENT / 25) * 100}%` }}
                  title="15% Benchmark Line"
                />
                {/* Fill bar */}
                <div
                  className={`h-full transition-all duration-300 ${
                    mortality.status === 'red'
                      ? 'bg-status-red'
                      : mortality.status === 'amber'
                      ? 'bg-status-amber'
                      : 'bg-status-green'
                  }`}
                  style={{
                    width: `${Math.min(100, (mortality.ratePercentage / 25) * 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-clinical-muted mt-1.5">
                <span>0%</span>
                <span className="font-semibold text-clinical-text">
                  | 15% Benchmark
                </span>
                <span>25% Max</span>
              </div>
            </div>
          )}
        </div>

        {/* Metric 2: Occupancy X/74 */}
        <div className="bg-clinical-card border border-clinical-border rounded-[6px] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-clinical-muted uppercase tracking-wider">
                Bed Occupancy
              </span>
              <Bed className="w-4 h-4 text-clinical-teal" />
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-clinical-text">
                {occupancy.occupied}
              </span>
              <span className="text-sm font-semibold text-clinical-muted">
                / {occupancy.total} Beds
              </span>
            </div>
            <p className="text-xs text-clinical-muted mt-0.5">
              {occupancy.free} available beds for quarantine admission
            </p>
          </div>

          <div className="mt-4 pt-2 border-t border-clinical-border/60 space-y-1.5">
            <div className="w-full bg-clinical-bg border border-clinical-border h-2.5 rounded-[4px] overflow-hidden">
              <div
                className="bg-clinical-teal h-full transition-all duration-300"
                style={{ width: `${occupancy.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-clinical-muted">
              <span>Capacity utilization</span>
              <span className="font-mono font-semibold text-clinical-text">
                {occupancy.percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Average Stay */}
        <div className="bg-clinical-card border border-clinical-border rounded-[6px] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-clinical-muted uppercase tracking-wider">
                Average Stay
              </span>
              <CalendarDays className="w-4 h-4 text-status-blue" />
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-clinical-text">
                {avgStay}
              </span>
              <span className="text-sm font-semibold text-clinical-muted">
                Days
              </span>
            </div>
            <p className="text-xs text-clinical-muted mt-0.5">
              Calculated across {closedCases.length} finalized patient discharges
            </p>
          </div>

          <div className="mt-4 pt-2 border-t border-clinical-border/60 text-[11px] text-clinical-muted">
            <span>Minimum recovery quarantine: </span>
            <span className="font-semibold text-clinical-text">5-8 days avg</span>
          </div>
        </div>

        {/* Metric 4: Today's Completion */}
        <div className="bg-clinical-card border border-clinical-border rounded-[6px] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-clinical-muted uppercase tracking-wider">
                Today&apos;s Protocol Completion
              </span>
              <Activity className="w-4 h-4 text-status-green" />
            </div>

            <div className="mt-2 space-y-2">
              {/* Temps Done Progress */}
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-clinical-muted">Temps Recorded:</span>
                  <span className="font-mono font-semibold text-clinical-text">
                    {dailyStats.tempsDoneCount} / {dailyStats.totalActive} ({tempsPercent}%)
                  </span>
                </div>
                <div className="w-full bg-clinical-bg border border-clinical-border h-1.5 rounded-[2px] mt-1 overflow-hidden">
                  <div
                    className="bg-status-blue h-full"
                    style={{ width: `${tempsPercent}%` }}
                  />
                </div>
              </div>

              {/* Visits Done Progress */}
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-clinical-muted">Doctor Visits:</span>
                  <span className="font-mono font-semibold text-clinical-text">
                    {dailyStats.visitsDoneCount} / {dailyStats.totalActive} ({visitsPercent}%)
                  </span>
                </div>
                <div className="w-full bg-clinical-bg border border-clinical-border h-1.5 rounded-[2px] mt-1 overflow-hidden">
                  <div
                    className="bg-status-green h-full"
                    style={{ width: `${visitsPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-clinical-border/60 text-[11px] text-clinical-muted">
            <span>Missed today: </span>
            <span className="font-bold text-status-amber">
              {missedTodayList.length} patients
            </span>
          </div>
        </div>
      </div>

      {/* "Missed Today" List */}
      <div className="bg-clinical-card border border-clinical-border rounded-[6px] overflow-hidden">
        <div className="p-4 bg-clinical-bg/50 border-b border-clinical-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-amber" />
              <h2 className="text-sm font-bold text-clinical-text">
                Missed Today Protocol Exceptions
              </h2>
            </div>
            <p className="text-xs text-clinical-muted mt-0.5">
              Active quarantine patients with pending morning temperatures or pending doctor visits.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-[6px] bg-status-amberLight text-status-amber border border-status-amberBorder">
            {missedTodayList.length} Action Items
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-clinical-bg border-b border-clinical-border text-clinical-muted uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-4">Room / Bed</th>
                <th className="py-2.5 px-4">Patient Name</th>
                <th className="py-2.5 px-4">Age / Sex</th>
                <th className="py-2.5 px-4">Pending Item(s)</th>
                <th className="py-2.5 px-4">Emergency Contact</th>
                <th className="py-2.5 px-4 text-right">Admitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinical-border text-clinical-text">
              {missedTodayList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-status-green font-medium">
                    <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-status-green" />
                    All active patients have completed temperature readings and doctor visits today!
                  </td>
                </tr>
              ) : (
                missedTodayList.map(({ patient, missedTemp, missedVisit }) => (
                  <tr key={patient.id} className="hover:bg-clinical-bg/40">
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className="px-2 py-0.5 rounded bg-clinical-bg border border-clinical-border">
                        {patient.bedCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {patient.name}
                    </td>
                    <td className="py-3 px-4 text-clinical-muted">
                      {patient.age}y {patient.gender}
                    </td>
                    <td className="py-3 px-4 space-x-1.5">
                      {missedTemp && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-status-greyLight border border-status-greyBorder text-status-grey font-medium text-[11px]">
                          <Clock className="w-3 h-3" /> Temp Pending
                        </span>
                      )}
                      {missedVisit && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-status-blueLight border border-status-blueBorder text-status-blue font-medium text-[11px]">
                          <Stethoscope className="w-3 h-3" /> Doctor Visit Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-clinical-muted">
                      {patient.phone}
                    </td>
                    <td className="py-3 px-4 text-right text-clinical-muted font-mono">
                      {patient.admissionDate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
