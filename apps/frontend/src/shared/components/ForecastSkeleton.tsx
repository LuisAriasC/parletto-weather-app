import { Skeleton } from '@/components/ui/skeleton';

export function ForecastSkeleton() {
  return (
    <div aria-label="Loading forecast" className="flex gap-3 overflow-x-auto pb-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-20 flex-shrink-0 rounded-xl" />
      ))}
    </div>
  );
}
