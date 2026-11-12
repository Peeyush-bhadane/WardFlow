'use client';

import React, { useState, useEffect } from 'react';
import { useWardStore } from '@/lib/useWardStore';
import { TopBar } from '@/components/TopBar';
import { RoleSwitcherModal } from '@/components/RoleSwitcherModal';
import { NurseBoard } from '@/components/NurseBoard';
import { DoctorQueue } from '@/components/DoctorQueue';
import { AdminView } from '@/components/AdminView';
import { DashboardView } from '@/components/DashboardView';
import { User } from '@/lib/types';

export default function WardFlowApp() {
  const {
    state,
    currentUser,
    isMounted,
    wardStore,
    setCurrentUser,
    advanceToNextDay,
    resetToDefault,
  } = useWardStore();

  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<string>('nurse_board');

  // Synchronize default nav tab whenever the role changes
  useEffect(() => {
    switch (currentUser.role) {
      case 'nurse':
        setActiveNavTab('nurse_board');
        break;
      case 'doctor':
        setActiveNavTab('doctor_queue');
        break;
      case 'admin':
        setActiveNavTab('admin_portal');
        break;
      case 'head_doctor':
        setActiveNavTab('head_dashboard');
        break;
    }
  }, [currentUser.role]);

  // Loading state during SSR hydration
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-clinical-bg text-clinical-muted text-xs">
        Loading WardFlow Clinical System...
      </div>
    );
  }

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    setIsRoleSwitcherOpen(false);
  };

  return (
    <div className="min-h-screen bg-clinical-bg flex flex-col font-sans">
      {/* Top Header Bar */}
      <TopBar
        currentDateStr={state.currentDateStr}
        dayNumber={state.dayNumber}
        currentUser={currentUser}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        onAdvanceDay={advanceToNextDay}
        onResetDemo={resetToDefault}
        activeNavTab={activeNavTab}
        onSelectNavTab={setActiveNavTab}
      />

      {/* Main Screen Content */}
      <main className="flex-1 pb-16">
        {/* Role 1: Nurse - Today's Board */}
        {currentUser.role === 'nurse' && (
          <NurseBoard
            patients={state.patients}
            temperatures={state.temperatures}
            doctorVisits={state.doctorVisits}
            currentDateStr={state.currentDateStr}
            currentUser={currentUser}
            onSaveTemperature={(pId, val, nurse) =>
              wardStore.recordTemperature(pId, val, nurse)
            }
          />
        )}

        {/* Role 2: Doctor - Doctor Queue & Patient Detail */}
        {currentUser.role === 'doctor' && (
          <DoctorQueue
            patients={state.patients}
            temperatures={state.temperatures}
            doctorVisits={state.doctorVisits}
            currentDateStr={state.currentDateStr}
            currentUser={currentUser}
            onMarkVisited={(pId, doc, notes) =>
              wardStore.markDoctorVisited(pId, doc, notes)
            }
            onConfirmDischarge={(pId) => wardStore.confirmDischarge(pId)}
            onMarkDeceased={(pId, reason) =>
              wardStore.markDeceased(pId, reason)
            }
          />
        )}

        {/* Role 3: Admin - Admit Patient & Discharge List */}
        {currentUser.role === 'admin' && (
          <AdminView
            patients={state.patients}
            closedCases={state.closedCases}
            currentDateStr={state.currentDateStr}
            onAdmitPatient={(data) => wardStore.admitPatient(data)}
            onFinalizeDischarge={(pId) => wardStore.finalizeDischarge(pId)}
          />
        )}

        {/* Role 4: Head Doctor - Facility Dashboard */}
        {currentUser.role === 'head_doctor' && (
          <DashboardView
            patients={state.patients}
            temperatures={state.temperatures}
            doctorVisits={state.doctorVisits}
            closedCases={state.closedCases}
            currentDateStr={state.currentDateStr}
          />
        )}
      </main>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
}
