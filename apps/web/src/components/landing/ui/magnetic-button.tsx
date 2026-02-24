'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import Link from 'next/link';

interface MagneticButtonProps {
  children: React.ReactNode;
  href: string;
  variant?: 'primary' | 'secondary';
  className?: string;
  onClick?: () => void;
}

export function MagneticButton({
  children,
  href,
  variant = 'primary',
  className = '',
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  }

  function handleMouseLeave() {
    setIsHovering(false);
    x.set(0);
    y.set(0);
  }

  const base =
    variant === 'primary'
      ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg'
      : 'border border-slate-300 text-slate-700 hover:border-brand-400 hover:text-brand-600 bg-white/80';

  return (
    <motion.div style={{ x: springX, y: springY }} className="inline-block">
      <Link
        ref={ref}
        href={href}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          } else if (href.startsWith('#')) {
            e.preventDefault();
            const el = document.querySelector(href);
            el?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold transition-all duration-200 ${base} ${
          isHovering ? 'scale-[1.03]' : 'scale-100'
        } ${className}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}
