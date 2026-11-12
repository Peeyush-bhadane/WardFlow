import React from 'react';
import { User } from '@/lib/types';
import {
  Calendar,
  FastForward,
  RotateCcw,
  UserCheck,
  Stethoscope,
  Activity,
  UserCog,
  ShieldAlert,
} from 'lucide-react';

interface TopBarProps {
  currentDateStr: string;
  dayNumber: number;
  currentUser: User;
  onOpenRoleSwitcher: () => void;
  onAdvanceDay: () => void;
  onResetDemo: () => void;
  activeNavTab: string;
  onSelectNavTab: (tab: string) => void;
}

export function TopBar({
  currentDateStr,
  dayNumber,
  currentUser,
  onOpenRoleSwitcher,
  onAdvanceDay,
  onResetDemo,
  activeNavTab,
  onSelectNavTab,
}: TopBarProps) {
  // Format readable date: e.g. "12 Nov 2026"
  const formatDisplayDate = (dStr: string) => {
    try {
      const [y, m, d] = dStr.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return dStr;
    }
  };

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'nurse':
        return <Activity className="w-3.5 h-3.5 text-clinical-teal" />;
      case 'doctor':
        return <Stethoscope className="w-3.5 h-3.5 text-status-blue" />;
      case 'admin':
        return <UserCog className="w-3.5 h-3.5 text-status-amber" />;
      case 'head_doctor':
        return <ShieldAlert className="w-3.5 h-3.5 text-status-green" />;
    }
  };

  // Determine allowed navigation tabs for current role
  // "Show only the navigation each role is allowed to use."
  const getNavTabsForRole = (role: User['role']) => {
    switch (role) {
      case 'nurse':
        return [{ id: 'nurse_board', label: "Today's Board" }];
      case 'doctor':
        return [{ id: 'doctor_queue', label: 'Doctor Queue' }];
      case 'admin':
        return [{ id: 'admin_portal', label: 'Ward Operations' }];
      case 'head_doctor':
        return [{ id: 'head_dashboard', label: 'Facility Dashboard' }];
    }
  };

  const tabs = getNavTabsForRole(currentUser.role);

  return (
    <header className="bg-clinical-card border-b border-clinical-border sticky top-0 z-40">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Logo & Facility Tag */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-clinical-teal text-white flex items-center justify-center font-bold text-sm rounded-[6px]">
                W
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-clinical-text">
                  WardFlow
                </span>
                <span className="hidden sm:inline-block text-[11px] text-clinical-muted ml-2 pl-2 border-l border-clinical-border font-medium">
                  Quarantine Centre • 74 Beds
                </span>
              </div>
            </div>
          </div>

          {/* Simulation Controls: Day Counter, Advance Day, Reset */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-clinical-bg border border-clinical-border text-xs text-clinical-text font-medium">
              <Calendar className="w-3.5 h-3.5 text-clinical-muted" />
              <span>Day {dayNumber}</span>
              <span className="text-clinical-muted font-normal hidden md:inline">
                ({formatDisplayDate(currentDateStr)})
              </span>
            </div>

            <button
              onClick={onAdvanceDay}
              title="Starts a new day (resets daily statuses to Temp pending)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-clinical-teal text-white hover:bg-clinical-tealHover transition-colors shadow-none"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Advance to next day</span>
              <span className="sm:hidden">Next day</span>
            </button>

            <button
              onClick={onResetDemo}
              title="Reset data back to pristine seed state"
              className="p-1.5 text-clinical-muted hover:text-clinical-text rounded-[6px] border border-clinical-border bg-white hover:bg-clinical-bg transition-colors"
              aria-label="Reset demo data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User info & Switch Role Button */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-clinical-text leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[11px] text-clinical-muted leading-tight">
                {currentUser.title.split('(')[0].trim()}
              </span>
            </div>

            <button
              onClick={onOpenRoleSwitcher}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[6px] border border-clinical-border bg-white hover:bg-clinical-bg text-clinical-text transition-colors"
            >
              {getRoleIcon(currentUser.role)}
              <span className="hidden sm:inline">Switch role</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (filtered by active role) */}
        <div className="flex border-t border-clinical-border/60">
          <nav className="flex space-x-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeNavTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectNavTab(tab.id)}
                  className={`py-2 text-xs font-semibold border-b-2 transition-colors ${
                    isActive
                      ? 'border-clinical-teal text-clinical-teal'
                      : 'border-transparent text-clinical-muted hover:text-clinical-text'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
