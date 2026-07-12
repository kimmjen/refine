import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * 기본 스켈레톤 컴포넌트
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "animate-pulse bg-muted rounded-xl",
        className
      )} 
    />
  );
}

/**
 * 링크 카드 스켈레톤
 */
export function LinkCardSkeleton() {
  return (
    <div className="bg-card rounded-3xl shadow-sm p-6 border border-border">
      {/* Header */}
      <div className="flex gap-4 items-start mb-4">
        {/* Icon */}
        <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
        
        {/* Title & Meta */}
        <div className="flex-1 min-w-0 pt-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-border">
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}

/**
 * 링크 카드 그리드 스켈레톤
 */
export function LinkGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <LinkCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 상세 페이지 스켈레톤
 */
export function LinkDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto mt-8">
      {/* Back button */}
      <Skeleton className="h-6 w-32 mb-6" />
      
      {/* Main Card */}
      <div className="bg-card rounded-3xl shadow-xl overflow-hidden">
        {/* Image */}
        <Skeleton className="w-full h-64 md:h-80 rounded-none" />
        
        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Badges */}
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          
          {/* Title */}
          <Skeleton className="h-8 w-3/4 mb-4" />
          
          {/* Meta */}
          <div className="flex gap-4 mb-6 pb-6 border-b border-border">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          
          {/* Description */}
          <div className="space-y-3 mb-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          {/* Button */}
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
