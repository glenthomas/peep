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

interface MemoryMonitorProps {
  data?: {
    total: number;
    used: number;
    free: number;
  };
  history?: Array<{
    timestamp: number;
    memory: number;
  }>;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const MemoryMonitor: React.FC<MemoryMonitorProps> = ({ data, history = [] }) => {
  const total = data?.total ?? 0;
  const used = data?.used ?? 0;
  const usagePercent = total > 0 ? (used / total) * 100 : 0;

  // Get last 5 minutes of data (150 data points at 2-second intervals)
  const recentHistory = useMemo(() => {
    return history.slice(-150);
  }, [history]);

  const chartData = useMemo(() => {
    return {
      labels: recentHistory.map((_, index) => {
        const minutesAgo = Math.floor((recentHistory.length - index - 1) * 2 / 60);
        return minutesAgo === 0 ? 'now' : `-${minutesAgo}m`;
      }),
      datasets: [
        {
          label: 'Memory Usage (%)',
          data: recentHistory.map((d) => d.memory),
          borderColor: 'rgb(118, 75, 162)',
          backgroundColor: 'rgba(118, 75, 162, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  }, [recentHistory]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
        },
      },
      y: {
        display: true,
        min: 0,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
        },
      },
    },
  };

  return (
    <div className="card">
      <h2>💾 Memory Usage</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
        <Gauge value={usagePercent} label="Current Usage" unit="%" />
        <div className="metric" style={{ border: 'none', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className="metric-label">Used / Total</span>
          <span className="metric-value" style={{ fontSize: '16px' }}>
            {formatBytes(used)} / {formatBytes(total)}
          </span>
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

export default MemoryMonitor;
