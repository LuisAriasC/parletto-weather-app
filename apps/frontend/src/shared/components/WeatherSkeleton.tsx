export function WeatherSkeleton() {
  return (
    <div
      aria-label="Loading weather"
      className="animate-pulse rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-14 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-700" />
        ))}
      </div>
    </div>
  );
}
