'use client';

import { motion } from 'motion/react';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  gradient?: { text: string; className: string };
}

export function AnimatedText({
  text,
  className = '',
  delay = 0,
  gradient,
}: AnimatedTextProps) {
  const words = text.split(' ');

  return (
    <motion.span
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.06, delayChildren: delay },
        },
      }}
      className={className}
    >
      {words.map((word, i) => {
        const isGradient = gradient && word === gradient.text;
        return (
          <motion.span
            key={i}
            variants={{
              hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
              visible: {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transition: { duration: 0.5 },
              },
            }}
            className={`inline-block ${i < words.length - 1 ? 'mr-[0.25em]' : ''} ${
              isGradient
                ? `bg-gradient-to-r ${gradient.className} bg-clip-text text-transparent`
                : ''
            }`}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.span>
  );
}
