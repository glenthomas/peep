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

interface DiskMonitorProps {
  data?: {
    read: number;
    write: number;
  };
  history?: Array<{
    timestamp: number;
    diskRead: number;
    diskWrite: number;
  }>;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const DiskMonitor: React.FC<DiskMonitorProps> = ({ data, history = [] }) => {
  const read = data?.read ?? 0;
  const write = data?.write ?? 0;

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
          label: 'Read (B/s)',
          data: recentHistory.map((d) => d.diskRead),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: 'Write (B/s)',
          data: recentHistory.map((d) => d.diskWrite),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
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
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${formatBytes(context.parsed.y)}`;
          },
        },
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
        ticks: {
          callback: (value: any) => formatBytes(value),
        },
      },
    },
  };

  return (
    <div className="card">
      <h2>💿 Disk I/O</h2>
      <div className="metric">
        <span className="metric-label">Read Speed</span>
        <span className="metric-value">{formatBytes(read)}</span>
      </div>
      <div className="metric">
        <span className="metric-label">Write Speed</span>
        <span className="metric-value">{formatBytes(write)}</span>
      </div>
      <div className="metric">
        <span className="metric-label">Total Throughput</span>
        <span className="metric-value">{formatBytes(read + write)}</span>
      </div>
      {recentHistory.length > 0 && (
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default DiskMonitor;
