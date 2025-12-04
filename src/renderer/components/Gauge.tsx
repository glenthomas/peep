import React from 'react';

interface GaugeProps {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  color?: string;
}

const Gauge: React.FC<GaugeProps> = ({ value, max = 100, label, unit = '%', color }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = 70;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on usage level
  const getColor = () => {
    if (color) return color;
    if (percentage < 50) return '#10b981'; // green
    if (percentage < 75) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="gauge-container">
      <svg height={radius * 2} width={radius * 2}>
        {/* Background circle */}
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ 
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%'
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="gauge-text">
        <div className="gauge-value">{value.toFixed(1)}{unit}</div>
        <div className="gauge-label">{label}</div>
      </div>
    </div>
  );
};

export default Gauge;
