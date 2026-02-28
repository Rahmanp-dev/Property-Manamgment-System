import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard() {
    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="flex flex-col space-y-1.5 p-6">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[200px]" />
            </div>
            <div className="p-6 pt-0">
                <Skeleton className="h-20 w-full rounded-md" />
            </div>
        </div>
    )
}

export function SkeletonTable() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-8 w-[100px]" />
            </div>
            <div className="rounded-md border p-4">
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[80px]" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
