export function ForecastSkeleton() {
  return (
    <div aria-label="Loading forecast" className="animate-pulse flex gap-3 overflow-x-auto pb-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 w-20 flex-shrink-0 rounded-xl bg-gray-100 dark:bg-gray-700" />
      ))}
    </div>
  );
}
