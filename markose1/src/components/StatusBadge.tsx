import React from 'react';
import { OrderStatus } from '../types';
import { ORDER_STATUS_META } from '../lib/stateMachine';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDescription = false
}) => {
  const meta = ORDER_STATUS_META[status] || {
    labelAr: status,
    bgLight: 'bg-neutral-800',
    borderLight: 'border-neutral-700',
    textColor: 'text-neutral-300',
    descriptionAr: ''
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded border ${meta.bgLight} ${meta.borderLight} ${meta.textColor} ${sizeClasses[size]} whitespace-nowrap shrink-0`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
        <span>{meta.labelAr}</span>
      </span>
      {showDescription && meta.descriptionAr && (
        <span className="text-[11px] text-neutral-400 max-w-xs">{meta.descriptionAr}</span>
      )}
    </div>
  );
};
