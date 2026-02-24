'use client';

import { useEffect, useState } from 'react';
import Tilt from 'react-parallax-tilt';

interface TiltImageProps {
  children: React.ReactNode;
  className?: string;
  tiltMaxAngleX?: number;
  tiltMaxAngleY?: number;
  scale?: number;
}

export function TiltImage({
  children,
  className = '',
  tiltMaxAngleX = 6,
  tiltMaxAngleY = 6,
  scale = 1.02,
}: TiltImageProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(!window.matchMedia('(hover: hover)').matches);
  }, []);

  if (isTouchDevice) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Tilt
      tiltMaxAngleX={tiltMaxAngleX}
      tiltMaxAngleY={tiltMaxAngleY}
      scale={scale}
      transitionSpeed={400}
      className={className}
    >
      {children}
    </Tilt>
  );
}
