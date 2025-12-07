import React, { memo, useMemo, useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import '../chartConfig';
import { formatBytes, formatStorage } from '../../shared/utils';

interface NetworkInterface {
  name: string;
  type: string;
  received: number;
  transmitted: number;
  packetsReceived: number;
  packetsTransmitted: number;
}

interface NetworkMonitorProps {
  data?: {
    rx: number;
    tx: number;
    interfaces?: NetworkInterface[];
  };
  history?: Array<{
    timestamp: number;
    networkRx: number;
    networkTx: number;
  }>;
}

const NetworkMonitor: React.FC<NetworkMonitorProps> = ({ data, history = [] }) => {
  const rx = data?.rx ?? 0;
  const tx = data?.tx ?? 0;
  const incomingInterfaces = data?.interfaces ?? [];

  // Track interfaces that have ever had traffic (persist even when traffic stops)
  const [persistedInterfaces, setPersistedInterfaces] = useState<Map<string, NetworkInterface>>(new Map());

  useEffect(() => {
    // Update persisted interfaces with new data
    setPersistedInterfaces(prev => {
      const updated = new Map(prev);
      
      incomingInterfaces.forEach(iface => {
        // Only add interfaces that have had traffic (> 1KB)
        if ((iface.received + iface.transmitted) > 1_000) {
          updated.set(iface.name, iface);
        } else if (updated.has(iface.name)) {
          // Update existing interface even if traffic is now zero
          updated.set(iface.name, iface);
        }
      });
      
      return updated;
    });
  }, [incomingInterfaces]);

  // Convert map to array for rendering
  const interfaces = Array.from(persistedInterfaces.values());

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
          label: 'Download (B/s)',
          data: recentHistory.map((d) => d.networkRx),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: 'Upload (B/s)',
          data: recentHistory.map((d) => d.networkTx),
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
            return `${context.dataset.label}: ${formatBytes(context.parsed.y, { perSecond: true })}`;
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
          callback: (value: any) => formatBytes(Number(value), { perSecond: true }),
        },
      },
    },
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '8px' }}>
          <path d="M15.384 6.115a.485.485 0 0 0-.047-.736A12.44 12.44 0 0 0 8 3C5.259 3 2.723 3.882.663 5.379a.485.485 0 0 0-.048.736.52.52 0 0 0 .668.05A11.45 11.45 0 0 1 8 4c2.507 0 4.827.802 6.716 2.164.205.148.49.13.668-.049"/>
          <path d="M13.229 8.271a.482.482 0 0 0-.063-.745A9.46 9.46 0 0 0 8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065A8.46 8.46 0 0 1 8 7a8.46 8.46 0 0 1 4.576 1.336c.206.132.48.108.653-.065m-2.183 2.183c.226-.226.185-.605-.1-.75A6.5 6.5 0 0 0 8 9c-1.06 0-2.062.254-2.946.704-.285.145-.326.524-.1.75l.015.015c.16.16.407.19.611.09A5.5 5.5 0 0 1 8 10c.868 0 1.69.201 2.42.56.203.1.45.07.61-.091zM9.06 12.44c.196-.196.198-.52-.04-.66A2 2 0 0 0 8 11.5a2 2 0 0 0-1.02.28c-.238.14-.236.464-.04.66l.706.706a.5.5 0 0 0 .707 0l.707-.707z"/>
        </svg>
      <h2>Network I/O</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div className="metric">
            <span className="metric-label">Download (RX)</span>
            <span className="metric-value">{formatBytes(rx, { perSecond: true })}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Upload (TX)</span>
            <span className="metric-value">{formatBytes(tx, { perSecond: true })}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Total Bandwidth</span>
            <span className="metric-value">{formatBytes(rx + tx, { perSecond: true })}</span>
          </div>
        </div>
        
          <div>
            <h3 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--color-text-primary)', marginTop: 0 }}>Network Interfaces</h3>
            {interfaces.map((iface, index) => (
              <div key={index} style={{ marginBottom: '12px', fontSize: '12px' }}>
                <div style={{ color: 'var(--color-text-primary)', fontWeight: '500', marginBottom: '2px' }}>
                  {iface.name}
                </div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px', marginBottom: '4px', opacity: 0.8 }}>
                  {iface.type}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                  <span>RX: {formatStorage(iface.received)}</span>
                  <span>TX: {formatStorage(iface.transmitted)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '11px', opacity: 0.7 }}>
                  <span>↓ {iface.packetsReceived.toLocaleString()} pkts</span>
                  <span>↑ {iface.packetsTransmitted.toLocaleString()} pkts</span>
                </div>
              </div>
            ))}
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

export default memo(NetworkMonitor);
