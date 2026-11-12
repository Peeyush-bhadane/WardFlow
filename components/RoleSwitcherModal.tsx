import React from 'react';
import { User } from '@/lib/types';
import { DEMO_USERS } from '@/lib/store';
import { Stethoscope, UserCog, Activity, ShieldAlert, ArrowRight, X } from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentUser: User;
  onSelectUser: (user: User) => void;
  isInitialLogin?: boolean;
}

export function RoleSwitcherModal({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  isInitialLogin = false,
}: RoleSwitcherModalProps) {
  if (!isOpen) return null;

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'nurse':
        return <Activity className="w-5 h-5 text-clinical-teal" />;
      case 'doctor':
        return <Stethoscope className="w-5 h-5 text-status-blue" />;
      case 'admin':
        return <UserCog className="w-5 h-5 text-status-amber" />;
      case 'head_doctor':
        return <ShieldAlert className="w-5 h-5 text-status-green" />;
    }
  };

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'nurse':
        return 'Nurse';
      case 'doctor':
        return 'Doctor';
      case 'admin':
        return 'Admin';
      case 'head_doctor':
        return 'Head Doctor';
    }
  };

  const getRoleScope = (role: User['role']) => {
    switch (role) {
      case 'nurse':
        return "Today's Board & temperature recording";
      case 'doctor':
        return 'Doctor queue, patient detail, visit & discharge confirmation';
      case 'admin':
        return 'Patient admission (74 beds) & administrative discharge';
      case 'head_doctor':
        return 'Read-only clinical dashboard & mortality metrics';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div className="bg-clinical-card border border-clinical-border w-full max-w-xl rounded-[6px] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-clinical-border flex items-center justify-between bg-clinical-bg/50">
          <div>
            <h2 className="text-base font-semibold text-clinical-text">
              {isInitialLogin ? 'Select Demo Profile' : 'Switch Active Role'}
            </h2>
            <p className="text-xs text-clinical-muted mt-0.5">
              Simulated quarantine staff roles with tailored permissions
            </p>
          </div>
          {!isInitialLogin && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-clinical-muted hover:text-clinical-text rounded-[6px] hover:bg-clinical-bg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User List */}
        <div className="p-6 space-y-3">
          {DEMO_USERS.map((user) => {
            const isSelected = currentUser.id === user.id;
            return (
              <button
                key={user.id}
                onClick={() => {
                  onSelectUser(user);
                  if (onClose) onClose();
                }}
                className={`w-full text-left p-4 rounded-[6px] border transition-all flex items-start gap-4 ${
                  isSelected
                    ? 'border-clinical-teal bg-clinical-tealLight/40'
                    : 'border-clinical-border bg-white hover:border-clinical-muted/40 hover:bg-clinical-bg/40'
                }`}
              >
                <div className="p-2.5 rounded-[6px] bg-clinical-bg border border-clinical-border mt-0.5">
                  {getRoleIcon(user.role)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-clinical-text">
                      {user.name}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-[6px] bg-clinical-bg border border-clinical-border text-clinical-muted">
                      {getRoleBadge(user.role)}
                    </span>
                    {isSelected && (
                      <span className="text-[11px] font-medium text-clinical-teal ml-auto">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-clinical-muted mt-0.5">{user.title}</p>
                  <p className="text-xs text-clinical-text/80 mt-1.5 flex items-center gap-1">
                    <span className="text-clinical-muted">Scope:</span>
                    {getRoleScope(user.role)}
                  </p>
                </div>

                <div className="self-center pl-2">
                  <ArrowRight className="w-4 h-4 text-clinical-muted" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-clinical-bg border-t border-clinical-border text-[11px] text-clinical-muted flex items-center justify-between">
          <span>WardFlow Quarantine Facility • 74 Beds</span>
          <span>No passwords required in demo mode</span>
        </div>
      </div>
    </div>
  );
}
