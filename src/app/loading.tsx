'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-8 w-20" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-[126px] rounded-lg" />
                    <Skeleton className="h-[126px] rounded-lg" />
                    <Skeleton className="h-[126px] rounded-lg" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    <Skeleton className="h-[350px] lg:col-span-4 rounded-lg" />
                    <Skeleton className="h-[350px] lg:col-span-3 rounded-lg" />
                </div>
                <Skeleton className="h-[300px] rounded-lg" />
            </div>
      </div>
    );
}
