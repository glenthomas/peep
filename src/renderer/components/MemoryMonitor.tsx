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
    totalSwap: number;
    usedSwap: number;
    freeSwap: number;
  };
  history?: Array<{
    timestamp: number;
    memory: number;
    swap: number;
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
  
  const totalSwap = data?.totalSwap ?? 0;
  const usedSwap = data?.usedSwap ?? 0;
  const swapPercent = totalSwap > 0 ? (usedSwap / totalSwap) * 100 : 0;

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
        {
          label: 'Swap Usage (%)',
          data: recentHistory.map((d) => d.swap),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
        display: true,
        labels: {
          color: 'white',
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
          color: 'white',
          maxTicksLimit: 6,
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
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '8px' }}>
          <path d="M1 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4.586a1 1 0 0 0 .707-.293l.353-.353a.5.5 0 0 1 .708 0l.353.353a1 1 0 0 0 .707.293H15a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zm.5 1h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5m5 0h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5m4.5.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5zM2 10v2H1v-2zm2 0v2H3v-2zm2 0v2H5v-2zm3 0v2H8v-2zm2 0v2h-1v-2zm2 0v2h-1v-2zm2 0v2h-1v-2z"/>
        </svg>
        <h2>Memory Usage</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Gauge value={usagePercent} label="Current Usage" unit="%" />
        <Gauge value={swapPercent} label="Swap Usage" unit="%" />
        <div className="metric" style={{ border: 'none', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className="metric-label">Used / Total</span>
          <span className="metric-value" style={{ fontSize: '16px' }}>
            {formatBytes(used)} / {formatBytes(total)}
          </span>
          <div className="metric" style={{ border: 'none', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span className="metric-label">Swap / Total</span>
            <span className="metric-value" style={{ fontSize: '16px' }}>
              {formatBytes(usedSwap)} / {formatBytes(totalSwap)}
            </span>
          </div>
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
