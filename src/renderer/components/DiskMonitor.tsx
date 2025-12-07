import React, { memo, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { formatThroughput, formatStorage } from '../../shared/utils';
import type { DiskInfo } from '../../shared/types';

interface DiskMonitorProps {
  data?: DiskInfo;
  history?: Array<{
    timestamp: number;
    diskRead: number;
    diskWrite: number;
  }>;
}

const DiskMonitor: React.FC<DiskMonitorProps> = ({ data, history = [] }) => {
  const read = data?.read ?? 0;
  const write = data?.write ?? 0;
  const disks = data?.disks ?? [];

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
        labels: {
          color: 'white',
        },
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${formatThroughput(context.parsed.y)}`;
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
          color: 'white',
          maxTicksLimit: 6,
        },
      },
      y: {
        display: true,
        min: 0,
        ticks: {
          color: 'white',
          callback: (value: any) => formatThroughput(value),
        },
      },
    },
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
      <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '8px' }}>
        <path d="M4.5 11a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M3 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"/>
        <path d="M16 11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V9.51c0-.418.105-.83.305-1.197l2.472-4.531A1.5 1.5 0 0 1 4.094 3h7.812a1.5 1.5 0 0 1 1.317.782l2.472 4.53c.2.368.305.78.305 1.198zM3.655 4.26 1.592 8.043Q1.79 8 2 8h12q.21 0 .408.042L12.345 4.26a.5.5 0 0 0-.439-.26H4.094a.5.5 0 0 0-.44.26zM1 10v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1"/>
      </svg>
      <h2>
        Disk I/O
      </h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div className="metric">
            <span className="metric-label">Read Speed</span>
            <span className="metric-value">{formatThroughput(read)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Write Speed</span>
            <span className="metric-value">{formatThroughput(write)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Total Throughput</span>
            <span className="metric-value">{formatThroughput(read + write)}</span>
          </div>
        </div>
        
        {disks.length > 0 && (
          <div>
            <h3 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--color-text-primary)', marginTop: 0 }}>Disk Usage</h3>
            {disks.map((disk, index) => {
              const usagePercent = disk.totalSpace > 0 ? (disk.usedSpace / disk.totalSpace) * 100 : 0;
              return (
                <div key={index} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {disk.mountPoint}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                      {usagePercent.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '6px', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${usagePercent}%`, 
                      height: '100%', 
                      backgroundColor: usagePercent > 90 ? 'var(--color-error)' : usagePercent > 70 ? 'var(--color-warning)' : 'var(--color-success)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                      {formatStorage(disk.usedSpace)} used
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                      {formatStorage(disk.totalSpace)} total
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {recentHistory.length > 0 && (
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default memo(DiskMonitor);
