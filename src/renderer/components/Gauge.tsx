import { get } from 'http';
import React, { memo } from 'react';

interface GaugeProps {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  color?: string;
}

// Generate a unique ID for each gauge instance to avoid filter conflicts
let gaugeIdCounter = 0;

const Gauge: React.FC<GaugeProps> = ({ value, max = 100, label, unit = '%', color }) => {
  const [filterId] = React.useState(() => `glow-${gaugeIdCounter++}`);
  const percentage = Math.min((value / max) * 100, 100);
  const size = 128; // Reduced from 160 (20% smaller)
  const strokeWidth = 11; // Reduced proportionally
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = strokeWidth / 2 + radius; // Position arc at top of reduced SVG
  const svgHeight = radius + strokeWidth + 22; // Just enough for arc + text below
  
  // Create semi-circle arc (180 degrees) - bottom half
  const startAngle = -90;
  const endAngle = 90;
  const angleRange = endAngle - startAngle;
  
  // Calculate arc path
  const createArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };
  
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };
  
  // Calculate pointer angle
  const pointerAngle = startAngle + (percentage / 100) * angleRange;
  const pointerEnd = polarToCartesian(centerX, centerY, radius - 10, pointerAngle);
  
  // Color based on usage level
  const getColor = () => {
    if (color) return color;
    if (percentage < 50) return '#10b981'; // green
    if (percentage < 75) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };
  
  const arcPath = createArc(startAngle, endAngle, radius);
  const progressEndAngle = startAngle + (percentage / 100) * angleRange;
  const progressPath = createArc(startAngle, progressEndAngle, radius);
  
  // Create colored segments for gradient effect
  const greenEndAngle = startAngle + (50 / 100) * angleRange;
  const yellowEndAngle = startAngle + (75 / 100) * angleRange;
  
  const greenPath = createArc(startAngle, greenEndAngle, radius);
  const yellowPath = createArc(greenEndAngle, yellowEndAngle, radius);
  const redPath = createArc(yellowEndAngle, endAngle, radius);

  const currentColor = color || getColor();

  return (
    <div className="gauge-container">
      <style>
        {`
          @keyframes gaugeGlowPulse {
            0%, 100% {
              opacity: 0.7;
            }
            50% {
              opacity: 1;
            }
          }
          .gauge-progress-glow {
            animation: gaugeGlowPulse 2s ease-in-out infinite;
          }
        `}
      </style>
      <svg 
        height={svgHeight} 
        width={size} 
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* Glow filter definition */}
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background arc */}
        <path
          d={arcPath}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
        />
        {/* Colored segments for gradient effect */}
        <path
          d={greenPath}
          fill="none"
          stroke="#10b981"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          opacity="0.3"
        />
        <path
          d={yellowPath}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={strokeWidth}
          opacity="0.3"
        />
        <path
          d={redPath}
          fill="none"
          stroke="#ef4444"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          opacity="0.3"
        />
        {/* Progress arc with glow */}
        <path
          d={progressPath}
          fill="none"
          stroke={currentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          filter={`url(#${filterId})`}
          className="gauge-progress-glow"
          style={{ transition: 'all 0.5s ease' }}
        />
        {/* Pointer */}
        <line
          x1={centerX}
          y1={centerY}
          x2={pointerEnd.x}
          y2={pointerEnd.y}
          stroke={'#7d8899'}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: 'all 0.5s ease' }}
        />
        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r="6"
          fill={'#7d8899'}
          style={{ transition: 'fill 0.5s ease' }}
        />
        {/* Value text */}
        <text
          x={centerX}
          y={centerY + 20}
          textAnchor="middle"
          className="gauge-value"
          style={{ fontSize: '16px', fontWeight: 600, fill: percentage < 50 ? 'var(--color-text-secondary)' : getColor() }}
        >
          {value.toFixed(1)}{unit}
        </text>
        <text
          x={centerX}
          y={centerY + 34}
          textAnchor="middle"
          className="gauge-label"
          style={{ fontSize: '10px', fill: 'var(--color-text-secondary)', opacity: 0.7 }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
};

export default memo(Gauge);