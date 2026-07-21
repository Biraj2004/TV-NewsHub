import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

interface BrandLogoProps {
  size?: number;
}

export function BrandLogo({ size = 22 }: BrandLogoProps) {
  return (
    <Svg
      viewBox="-3 -3 30 30"
      width={size}
      height={size}
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={-3} y={-3} width={30} height={30} fill="#000000" rx={4} ry={4} />
      <Path d="M2 12L7 2M7 12l5-10m0 10l5-10m0 10l5-10M4.5 7h15M12 16v6" />
    </Svg>
  );
}
