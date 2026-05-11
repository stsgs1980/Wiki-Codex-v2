'use client';

import React from 'react';

interface NeuroLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap: Record<'sm' | 'md' | 'lg', number> = {
  sm: 28,
  md: 40,
  lg: 56,
};

const CORAL = '#FA3913';
const FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export function NeuroLogo({
  className,
  showTagline = false,
  size = 'sm',
}: NeuroLogoProps) {
  const height = sizeMap[size];
  const viewBox = showTagline ? '0 0 458 191' : '0 0 458 144';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      height={height}
      className={className}
      role="img"
      aria-label="NEURO"
    >
      {/* R coral box – shadow for subtle depth */}
      <rect x="232" y="4" width="144" height="144" fill="#d42f0e" rx="2" />
      {/* R coral box – main */}
      <rect x="226" y="0" width="144" height="144" fill={CORAL} rx="2" />

      {/* N */}
      <text
        x="41.5"
        y="126"
        textAnchor="middle"
        fontFamily={FONT_STACK}
        fontSize="120"
        fontWeight="700"
        fill="currentColor"
      >
        N
      </text>

      {/* E */}
      <text
        x="117"
        y="126"
        textAnchor="middle"
        fontFamily={FONT_STACK}
        fontSize="120"
        fontWeight="700"
        fill="currentColor"
      >
        E
      </text>

      {/* U */}
      <text
        x="190"
        y="126"
        textAnchor="middle"
        fontFamily={FONT_STACK}
        fontSize="120"
        fontWeight="700"
        fill="currentColor"
      >
        U
      </text>

      {/* R (white on coral) */}
      <text
        x="298"
        y="72"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={FONT_STACK}
        fontSize="96"
        fontWeight="700"
        fill="#FFFFFF"
      >
        R
      </text>

      {/* O */}
      <text
        x="412.5"
        y="126"
        textAnchor="middle"
        fontFamily={FONT_STACK}
        fontSize="120"
        fontWeight="700"
        fill="currentColor"
      >
        O
      </text>

      {/* Tagline – only rendered when showTagline is true */}
      {showTagline && (
        <text
          x="229"
          y="171"
          textAnchor="middle"
          fontFamily={FONT_STACK}
          fontSize="12"
          fontWeight="300"
          letterSpacing="2.5"
          fill="currentColor"
        >
          INTELLIGENCE THAT WORKS FOR YOU
        </text>
      )}
    </svg>
  );
}
