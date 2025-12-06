import React from "react";

interface BatteryMonitorProps {
  batteryInfo: any;
}

const BatteryMonitor: React.FC<BatteryMonitorProps> = ({ batteryInfo }) => {
  if (!batteryInfo || !batteryInfo.available) {
    return null; // Don't render if no battery is available
  }

  const formatTime = (minutes: number | undefined): string => {
    if (minutes === undefined || minutes === null || !isFinite(minutes)) {
      return "Calculating...";
    }
    
    if (minutes < 1) {
      return "< 1 min";
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStateIcon = (state: string): string => {
    const stateLower = state.toLowerCase();
    if (stateLower.includes("charging")) return "⚡";
    if (stateLower.includes("discharging")) return "🔋";
    if (stateLower.includes("full")) return "✓";
    if (stateLower.includes("empty")) return "!";
    return "•";
  };

  const getStateColor = (state: string): string => {
    const stateLower = state.toLowerCase();
    if (stateLower.includes("charging")) return "var(--color-success)";
    if (stateLower.includes("full")) return "var(--color-success)";
    if (stateLower.includes("discharging")) return "var(--color-warning)";
    if (stateLower.includes("empty")) return "var(--color-danger)";
    return "var(--color-text-primary)";
  };

  const getBatteryColor = (percentage: number): string => {
    if (percentage > 60) return "var(--color-success)";
    if (percentage > 20) return "var(--color-warning)";
    return "var(--color-danger)";
  };

  const percentage = Math.round(batteryInfo.percentage || 0);
  const health = Math.round(batteryInfo.health || 0);
  const state = batteryInfo.state || "Unknown";

  return (
    <div className="monitor-card">
      <h2>Battery</h2>
      <div className="battery-container">
        <div className="battery-main">
          <div className="battery-icon">
            <div className="battery-body">
              <div 
                className="battery-level" 
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: getBatteryColor(percentage)
                }}
              />
            </div>
            <div className="battery-tip" />
          </div>
          <div className="battery-percentage">
            {percentage}%
          </div>
        </div>
        
        <div className="battery-info">
          <div className="battery-stat">
            <span className="label">Status:</span>
            <span 
              className="value" 
              style={{ color: getStateColor(state) }}
            >
              {getStateIcon(state)} {state}
            </span>
          </div>
          
          <div className="battery-stat">
            <span className="label">Health:</span>
            <span className="value">{health}%</span>
          </div>
          
          {batteryInfo.timeToFull !== undefined && batteryInfo.timeToFull > 0 && (
            <div className="battery-stat">
              <span className="label">Time to Full:</span>
              <span className="value">{formatTime(batteryInfo.timeToFull)}</span>
            </div>
          )}
          
          {batteryInfo.timeToEmpty !== undefined && batteryInfo.timeToEmpty > 0 && (
            <div className="battery-stat">
              <span className="label">Time Remaining:</span>
              <span className="value">{formatTime(batteryInfo.timeToEmpty)}</span>
            </div>
          )}
          
          {batteryInfo.energy !== undefined && batteryInfo.energyFull !== undefined && (
            <div className="battery-stat">
              <span className="label">Capacity:</span>
              <span className="value">
                {batteryInfo.energy.toFixed(1)} / {batteryInfo.energyFull.toFixed(1)} Wh
              </span>
            </div>
          )}
          
          {batteryInfo.temperature !== undefined && (
            <div className="battery-stat">
              <span className="label">Temperature:</span>
              <span className="value">{batteryInfo.temperature.toFixed(1)}°C</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatteryMonitor;