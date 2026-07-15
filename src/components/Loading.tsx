export const Loading = ({ label = "Chargement..." }: { label?: string }) => (
  <div className="flex min-h-40 items-center justify-center">
    <div className="flex items-center gap-3 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800">
      <span className="h-3 w-3 animate-pulse rounded-full bg-brand-500" />
      {label}
    </div>
  </div>
);
