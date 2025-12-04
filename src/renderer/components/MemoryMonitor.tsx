import React from 'react';

interface MemoryMonitorProps {
  data?: {
    total: number;
    used: number;
    free: number;
  };
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const MemoryMonitor: React.FC<MemoryMonitorProps> = ({ data }) => {
  const total = data?.total ?? 0;
  const used = data?.used ?? 0;
  const usagePercent = total > 0 ? (used / total) * 100 : 0;

  return (
    <div className="card">
      <h2>💾 Memory Usage</h2>
      <div className="metric">
        <span className="metric-label">Used / Total</span>
        <span className="metric-value">
          {formatBytes(used)} / {formatBytes(total)}
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${Math.min(usagePercent, 100)}%` }} />
      </div>
      <div className="metric" style={{ marginTop: '15px' }}>
        <span className="metric-label">Usage</span>
        <span className="metric-value">{usagePercent.toFixed(1)}%</span>
      </div>
    </div>
  );
};

export default MemoryMonitor;
