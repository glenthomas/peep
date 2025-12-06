import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import Gauge from './Gauge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CPUMonitorProps {
  data?: {
    usage: number;
    cores: number;
    perCore?: number[];
  };
  history?: Array<{
    timestamp: number;
    cpu: number;
    perCore?: number[];
  }>;
}

const CPUMonitor: React.FC<CPUMonitorProps> = ({ data, history = [] }) => {
  const [showPerCore, setShowPerCore] = React.useState(true);
  const usage = data?.usage ?? 0;
  const cores = data?.cores ?? 0;
  const perCore = data?.perCore ?? [];

  // Get last 5 minutes of data (150 data points at 2-second intervals)
  const recentHistory = useMemo(() => {
    return history.slice(-150);
  }, [history]);

  const chartData = useMemo(() => {
    if (showPerCore && perCore.length > 0) {
      // Generate per-core datasets with color palette
      const colorPalette = [
        { border: 'rgb(102, 126, 234)', background: 'rgba(102, 126, 234, 0.1)' },
        { border: 'rgb(237, 100, 166)', background: 'rgba(237, 100, 166, 0.1)' },
        { border: 'rgb(255, 159, 64)', background: 'rgba(255, 159, 64, 0.1)' },
        { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.1)' },
        { border: 'rgb(153, 102, 255)', background: 'rgba(153, 102, 255, 0.1)' },
        { border: 'rgb(255, 205, 86)', background: 'rgba(255, 205, 86, 0.1)' },
        { border: 'rgb(201, 203, 207)', background: 'rgba(201, 203, 207, 0.1)' },
        { border: 'rgb(54, 162, 235)', background: 'rgba(54, 162, 235, 0.1)' },
      ];
      
      // Generate additional colors for systems with many cores
      const getColor = (index: number) => {
        if (index < colorPalette.length) {
          return colorPalette[index];
        }
        // Generate color based on hue rotation for cores beyond the palette
        const hue = (index * 137.5) % 360; // Use golden angle for better distribution
        return {
          border: `hsl(${hue}, 70%, 60%)`,
          background: `hsla(${hue}, 70%, 60%, 0.1)`
        };
      };
      
      return {
        labels: recentHistory.map((_, index) => {
          const minutesAgo = Math.floor((recentHistory.length - index - 1) * 2 / 60);
          return minutesAgo === 0 ? 'now' : `-${minutesAgo}m`;
        }),
        datasets: perCore.map((_, coreIndex) => {
          const colors = getColor(coreIndex);
          return {
            label: `Core ${coreIndex}`,
            data: recentHistory.map((d) => d.perCore?.[coreIndex] ?? 0),
            borderColor: colors.border,
            backgroundColor: colors.background,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
          };
        }),
      };
    } else {
      // Global CPU usage
      return {
        labels: recentHistory.map((_, index) => {
          const minutesAgo = Math.floor((recentHistory.length - index - 1) * 2 / 60);
          return minutesAgo === 0 ? 'now' : `-${minutesAgo}m`;
        }),
        datasets: [
          {
            label: 'CPU Usage (%)',
            data: recentHistory.map((d) => d.cpu),
            borderColor: 'rgb(102, 126, 234)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      };
    }
  }, [recentHistory, showPerCore, perCore]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showPerCore,
        position: 'bottom' as const,
        labels: {
          color: 'white',
          boxWidth: 12,
          padding: 8,
          font: {
            size: 10,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 6,
          color: 'white',
        },
      },
      y: {
        display: true,
        min: 0,
        max: 100,
        ticks: {
          color: 'white',
          callback: (value: any) => `${value}%`,
        },
      },
    },
  }), [showPerCore]);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '8px' }}>
            <path d="M5 0a.5.5 0 0 1 .5.5V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2A2.5 2.5 0 0 1 14 4.5h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14a2.5 2.5 0 0 1-2.5 2.5v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14A2.5 2.5 0 0 1 2 11.5H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2A2.5 2.5 0 0 1 4.5 2V.5A.5.5 0 0 1 5 0m-.5 3A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3zM5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5zM6.5 6a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>
          </svg>
          <h2>CPU Usage</h2>
        </div>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          fontSize: '14px',
          gap: '8px'
        }}>
          <span>Per-Core</span>
          <input
            type="checkbox"
            role="switch"
            checked={showPerCore}
            onChange={(e) => setShowPerCore(e.target.checked)}
            aria-label="Toggle between global and per-core CPU usage view"
            aria-checked={showPerCore}
            style={{ 
              width: '40px',
              height: '20px',
              cursor: 'pointer',
              accentColor: 'rgb(102, 126, 234)'
            }}
          />
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Gauge value={usage} label="Current Usage" unit="%" />
        <div className="metric" style={{ border: 'none', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className="metric-label">CPU Cores</span>
          <span className="metric-value">{cores}</span>
        </div>
      </div>
      {recentHistory.length > 0 && (
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default CPUMonitor;
