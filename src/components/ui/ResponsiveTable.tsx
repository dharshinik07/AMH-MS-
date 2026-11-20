"use client";

import React from "react";

interface ResponsiveTableProps<T> {
  data: T[];
  renderDesktopTable: () => React.ReactNode;
  renderMobileCard: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  renderDesktopTable,
  renderMobileCard,
  emptyState,
  className = "",
}: ResponsiveTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={className}>
      {/* Mobile Card List (<768px) */}
      <div className="block md:hidden space-y-3">
        {data.map((item, idx) => renderMobileCard(item, idx))}
      </div>

      {/* Desktop Table (≥768px) */}
      <div className="hidden md:block overflow-x-auto card-ledger">
        {renderDesktopTable()}
      </div>
    </div>
  );
}
