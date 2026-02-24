'use client';

interface GradientOrbProps {
  className?: string;
  color?: string;
  size?: number;
}

export function GradientOrb({
  className = '',
  color = 'bg-brand-300/20',
  size = 400,
}: GradientOrbProps) {
  return (
    <div
      className={`pointer-events-none absolute max-w-full rounded-full blur-[120px] ${color} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
