import * as React from 'react';
import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm', className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-1.5 px-6 pt-6', className)} {...props} />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('px-6 pb-6', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return <h3 className={cn('text-lg font-semibold leading-none', className)} {...props} />;
}

export { Card, CardHeader, CardContent, CardTitle };
