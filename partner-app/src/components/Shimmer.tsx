export function ShimmerBlock({ className = '' }: { className?: string }) {
  return <div className={`shimmer-block ${className}`} />;
}

export function ShimmerSection({ rows = 4, kpis = 0 }: { rows?: number; kpis?: number }) {
  return (
    <div>
      {kpis > 0 && (
        <div className="grid grid-kpi" style={{ marginBottom: 16 }}>
          {Array.from({ length: kpis }).map((_, i) => (
            <ShimmerBlock key={i} className="shimmer-kpi" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <ShimmerBlock key={i} className="shimmer-row" />
      ))}
    </div>
  );
}
