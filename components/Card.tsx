import React from "react";

export function Card({
  title,
  subtitle,
  children,
  right,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
      {(title || subtitle || right) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && <div className="text-lg font-semibold">{title}</div>}
            {subtitle && (
              <div className="text-sm text-white/60 mt-1">{subtitle}</div>
            )}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}
