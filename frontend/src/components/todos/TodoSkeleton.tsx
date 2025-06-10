import { Skeleton } from "@/components/ui/skeleton"

export function TodoSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div className="flex items-center p-3 gap-3 border-b" key={i}>
          <Skeleton className="h-5 w-5 rounded-sm" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  )
} 