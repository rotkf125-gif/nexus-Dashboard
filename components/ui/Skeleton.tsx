'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: boolean;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = true,
}: SkeletonProps) {
  const baseClass = animation ? 'skeleton' : 'bg-white/5';

  const variantClasses = {
    text: 'skeleton-text',
    circular: 'skeleton-circle',
    rectangular: '',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          height={14}
          className="mb-2"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton-card ${className}`} aria-hidden="true">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" height={16} className="mb-2" />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5, className = '' }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {/* Header */}
      <div className="flex gap-4 p-3 bg-black/20 rounded">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 / cols}%`} height={12} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3 border-b border-white/5">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width={`${100 / cols}%`}
              height={14}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <div className="flex items-end justify-around h-48 gap-2 p-4">
        {[60, 80, 45, 90, 70, 55, 85, 65].map((h, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width="10%"
            height={`${h}%`}
            className="rounded-t"
          />
        ))}
      </div>
      <div className="flex justify-between px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="text" width={24} height={10} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonDonut({ size = 120, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Skeleton variant="circular" width={size} height={size} />
      <div
        className="absolute bg-[var(--bg-color)]"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: '50%',
        }}
      />
    </div>
  );
}

export default Skeleton;
