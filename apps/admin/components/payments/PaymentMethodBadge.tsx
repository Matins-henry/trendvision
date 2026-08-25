'use client';

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'ONLINE';

interface PaymentMethodBadgeProps {
  method: string;
}

const METHOD_CONFIG: Record<PaymentMethod, { label: string; className: string }> = {
  CASH: {
    label: 'Cash',
    className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  },
  CARD: {
    label: 'Card',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  TRANSFER: {
    label: 'Transfer',
    className: 'bg-purple-100 text-purple-800 border border-purple-200',
  },
  ONLINE: {
    label: 'Online',
    className: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  },
};

export function PaymentMethodBadge({ method }: PaymentMethodBadgeProps) {
  const config = METHOD_CONFIG[method as PaymentMethod] ?? {
    label: method,
    className: 'bg-gray-100 text-gray-700 border border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}
