import React from 'react';
import { DailyStatus } from '@/lib/types';
import { Clock, CheckCircle2, UserCheck } from 'lucide-react';

interface StatusChipProps {
  status: DailyStatus;
  size?: 'sm' | 'md';
}

export function StatusChip({ status, size = 'md' }: StatusChipProps) {
  if (status === 'doctor_visited') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-[6px] border border-status-greenBorder bg-status-greenLight text-status-green ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <UserCheck className="w-3.5 h-3.5" />
        Doctor visited
      </span>
    );
  }

  if (status === 'temp_done') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-[6px] border border-status-blueBorder bg-status-blueLight text-status-blue ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Temp done
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-[6px] border border-status-greyBorder bg-status-greyLight text-status-grey ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      Temp pending
    </span>
  );
}
