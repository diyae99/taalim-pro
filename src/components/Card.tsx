import type { HTMLAttributes, ReactNode } from "react";

export const Card = ({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) => (
  <div className={`rounded-2xl border border-brand-100 bg-white p-5 shadow-soft ${className}`} {...props}>
    {children}
  </div>
);
