import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function WeatherSkeleton() {
  return (
    <Card aria-label="Loading weather">
      <CardContent className="pt-6">
        <div className="mb-5 flex items-start justify-between">
          <div className="space-y-2.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-14 w-28" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
