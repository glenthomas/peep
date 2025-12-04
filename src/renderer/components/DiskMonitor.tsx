import React from 'react';

interface DiskMonitorProps {
  data?: {
    read: number;
    write: number;
  };
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const DiskMonitor: React.FC<DiskMonitorProps> = ({ data }) => {
  const read = data?.read ?? 0;
  const write = data?.write ?? 0;

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
    </div>
  );
};

export default DiskMonitor;
