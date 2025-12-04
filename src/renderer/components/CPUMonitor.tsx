import React from 'react';

interface CPUMonitorProps {
  data?: {
    usage: number;
    cores: number;
  };
}

const CPUMonitor: React.FC<CPUMonitorProps> = ({ data }) => {
  const usage = data?.usage ?? 0;
  const cores = data?.cores ?? 0;

  return (
    <div className="card">
      <h2>🖥️ CPU Usage</h2>
      <div className="metric">
        <span className="metric-label">Current Usage</span>
        <span className="metric-value">{usage.toFixed(1)}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${Math.min(usage, 100)}%` }} />
      </div>
      <div className="metric" style={{ marginTop: '15px' }}>
        <span className="metric-label">CPU Cores</span>
        <span className="metric-value">{cores}</span>
      </div>
    </div>
  );
};

export default CPUMonitor;
