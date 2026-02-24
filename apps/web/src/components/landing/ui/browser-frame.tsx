'use client';

import Image from 'next/image';

interface BrowserFrameProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function BrowserFrame({
  src,
  alt,
  className = '',
  priority = false,
}: BrowserFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg ${className}`}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <div className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <div className="h-3 w-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="mx-auto flex h-6 w-48 items-center justify-center rounded-md bg-white/80 px-3 text-[11px] text-slate-400 sm:w-64">
          ContractorOS
        </div>
        <div className="w-[54px]" />
      </div>

      {/* Screenshot */}
      <div className="relative">
        <Image
          src={src}
          alt={alt}
          width={1440}
          height={900}
          quality={90}
          priority={priority}
          className="block w-full"
        />
      </div>
    </div>
  );
}
