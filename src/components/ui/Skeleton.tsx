import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-xl bg-slate-200/90 dark:bg-slate-800',
        className
      )}
      {...props}
    />
  );
}

export function SellerCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 flex-1">
          <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <Skeleton className="h-5 w-28 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      </div>

      <div className="mt-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3 border-2 border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
        <Skeleton className="w-20 h-20 sm:w-24 rounded-2xl shrink-0" />
        <div className="flex-1 flex flex-col items-center gap-2 py-1">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-12 w-16 rounded-xl" />
          <Skeleton className="h-3.5 w-28 rounded-md" />
        </div>
        <Skeleton className="w-20 h-20 sm:w-24 rounded-2xl shrink-0" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <Skeleton className="h-[56px] rounded-xl" />
        <Skeleton className="h-[56px] rounded-xl" />
      </div>
    </div>
  );
}

export function ClientCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-3xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>

        <div className="mt-4 space-y-2">
          <Skeleton className="h-3.5 w-20 rounded-md" />
          <Skeleton className="h-6 w-4/5 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg mt-2" />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
