import React from 'react';

interface NetworkMonitorProps {
  data?: {
    rx: number;
    tx: number;
  };
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const NetworkMonitor: React.FC<NetworkMonitorProps> = ({ data }) => {
  const rx = data?.rx ?? 0;
  const tx = data?.tx ?? 0;

  return (
    <div className="card">
      <h2>🌐 Network I/O</h2>
      <div className="metric">
        <span className="metric-label">Download (RX)</span>
        <span className="metric-value">{formatBytes(rx)}</span>
      </div>
      <div className="metric">
        <span className="metric-label">Upload (TX)</span>
        <span className="metric-value">{formatBytes(tx)}</span>
      </div>
      <div className="metric">
        <span className="metric-label">Total Bandwidth</span>
        <span className="metric-value">{formatBytes(rx + tx)}</span>
      </div>
    </div>
  );
};

export default NetworkMonitor;
