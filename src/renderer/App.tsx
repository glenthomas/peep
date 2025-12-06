import React, { useState, useEffect } from "react";
import CPUMonitor from "./components/CPUMonitor";
import MemoryMonitor from "./components/MemoryMonitor";
import DiskMonitor from "./components/DiskMonitor";
import NetworkMonitor from "./components/NetworkMonitor";
import ProcessList from "./components/ProcessList";
import BatteryMonitor from "./components/BatteryMonitor";

declare global {
  interface Window {
    electronAPI: {
      getSystemInfo: () => Promise<any>;
      getProcesses: (showThreads?: boolean) => Promise<any[]>;
      getBatteryInfo: () => Promise<any>;
      getOsInfo: () => Promise<any>;
      killProcess: (
        pid: number
      ) => Promise<{ success: boolean; message: string }>;
    };
  }
}

interface HistoricalData {
  timestamp: number;
  cpu: number;
  perCore?: number[];
  memory: number;
  swap: number;
  diskRead: number;
  diskWrite: number;
  networkRx: number;
  networkTx: number;
}

const App: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [batteryInfo, setBatteryInfo] = useState<any>(null);
  const [osInfo, setOsInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThreads, setShowThreads] = useState(false);
  
  // Track previous values for network rate calculation
  const [prevNetworkRx, setPrevNetworkRx] = useState<number>(0);
  const [prevNetworkTx, setPrevNetworkTx] = useState<number>(0);
  const [prevTimestamp, setPrevTimestamp] = useState<number>(Date.now());

  // Format uptime into human-readable string
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const [history, setHistory] = useState<HistoricalData[]>(() =>
    Array.from({ length: 900 }, (_, i) => ({
      timestamp: Date.now() - (900 - i) * 2000,
      cpu: 0,
      memory: 0,
      swap: 0,
      diskRead: 0,
      diskWrite: 0,
      networkRx: 0,
      networkTx: 0,
    }))
  );

  useEffect(() => {
    // Fetch OS info once on mount
    const fetchOsInfo = async () => {
      try {
        const info = await window.electronAPI.getOsInfo();
        setOsInfo(info);
      } catch (err) {
        console.error('Failed to fetch OS info:', err);
      }
    };
    fetchOsInfo();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [info, procs, battery] = await Promise.all([
          window.electronAPI.getSystemInfo(),
          window.electronAPI.getProcesses(showThreads),
          window.electronAPI.getBatteryInfo(),
        ]);

        setSystemInfo(info);
        setProcesses(procs);
        setBatteryInfo(battery);
        setLoading(false);

        // Network still needs rate calculation (cumulative totals)
        const currentTimestamp = Date.now();
        const timeDelta = (currentTimestamp - prevTimestamp) / 1000; // seconds
        
        const networkRx = info?.network?.rx ?? 0;
        const networkTx = info?.network?.tx ?? 0;
        
        // Calculate network bytes per second
        const networkRxRate = timeDelta > 0 ? (networkRx - prevNetworkRx) / timeDelta : 0;
        const networkTxRate = timeDelta > 0 ? (networkTx - prevNetworkTx) / timeDelta : 0;
        
        // Update previous values
        setPrevNetworkRx(networkRx);
        setPrevNetworkTx(networkTx);
        setPrevTimestamp(currentTimestamp);
        
        // Update systemInfo with network rates (disk values are already incremental)
        const updatedInfo = {
          ...info,
          network: {
            ...info?.network,
            rx: Math.max(0, networkRxRate),
            tx: Math.max(0, networkTxRate),
          },
        };
        setSystemInfo(updatedInfo);

        // Add to history (keep last 30 minutes at 2-second intervals = 900 data points)
        const newDataPoint: HistoricalData = {
          timestamp: currentTimestamp,
          cpu: info?.cpu?.usage ?? 0,
          perCore: info?.cpu?.perCore ?? [],
          memory: info?.memory ? (info.memory.used / info.memory.total) * 100 : 0,
          swap: info?.memory && info.memory.totalSwap > 0 ? (info.memory.usedSwap / info.memory.totalSwap) * 100 : 0,
          diskRead: info?.disk?.read ?? 0,
          diskWrite: info?.disk?.write ?? 0,
          networkRx: Math.max(0, networkRxRate),
          networkTx: Math.max(0, networkTxRate),
        };

        setHistory((prev) => {
          const updated = [...prev, newDataPoint];
          // Keep only last 900 data points (30 minutes)
          return updated.slice(-900);
        });
      } catch (err) {
        setError("Failed to fetch system information");
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, [showThreads]);

  if (loading) {
    return <div className="loading">Loading system information...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="app">
      <header className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5C7 5 2.73 8.11 1 12.5 2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
              fill="currentColor"
            />
          </svg>
          <div>
            <h3>Peep</h3>
          </div>
        </div>
        
        {/* Battery Status in Center */}
        {batteryInfo?.available && (() => {
          const percentage = Math.round(batteryInfo.percentage || 0);
          const state = batteryInfo.state || "Unknown";
          const isCharging = state.toLowerCase().includes("charging");
          const isFull = state.toLowerCase().includes("full");
          const getBatteryColor = (pct: number) => {
            if (pct > 60) return "var(--color-success)";
            if (pct > 20) return "var(--color-warning)";
            return "var(--color-danger)";
          };
          const getStateIcon = (st: string) => {
            const stateLower = st.toLowerCase();
            if (stateLower.includes("charging")) return "⚡";
            if (stateLower.includes("discharging")) return "🔋";
            if (stateLower.includes("full")) return "✓";
            return "•";
          };
          const formatTime = (minutes: number | undefined): string => {
            if (minutes === undefined || minutes === null || !isFinite(minutes) || minutes <= 0) {
              return "";
            }
            if (minutes < 1) return "< 1 min";
            const hours = Math.floor(minutes / 60);
            const mins = Math.floor(minutes % 60);
            if (hours > 0) return `${hours}h ${mins}m`;
            return `${mins}m`;
          };
          
          const timeInfo = isCharging && batteryInfo.timeToFull > 0
            ? formatTime(batteryInfo.timeToFull)
            : !isCharging && !isFull && batteryInfo.timeToEmpty > 0
            ? formatTime(batteryInfo.timeToEmpty)
            : "";
          
          return (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px",
              fontSize: "13px",
              color: "var(--color-text-primary)"
            }}>
              {/* Battery Icon */}
              <div style={{ 
                display: "flex", 
                alignItems: "center",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "3px",
                width: "32px",
                height: "16px",
                padding: "2px",
                position: "relative"
              }}>
                <div style={{
                  height: "100%",
                  width: `${percentage}%`,
                  backgroundColor: getBatteryColor(percentage),
                  borderRadius: "1px",
                  transition: "width 0.3s ease"
                }} />
                <div style={{
                  position: "absolute",
                  right: "-4px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "3px",
                  height: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  borderRadius: "0 2px 2px 0"
                }} />
              </div>
              
              {/* Battery Info */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: "600" }}>{percentage}%</span>
                <span>
                  {getStateIcon(state)} {state}
                </span>
                {timeInfo && (
                  <span style={{ fontSize: "12px" }}>
                    ({timeInfo})
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {osInfo && (
          <div style={{ 
            fontSize: "12px", 
            color: "var(--color-text-secondary)",
            opacity: 0.8,
            fontFamily: "'Orbitron', monospace",
            textAlign: "right"
          }}>
            <div>OS: {osInfo.name} {osInfo.version}</div>
            {osInfo.uptime && (
              <div style={{ marginTop: "4px" }}>
                Uptime: {formatUptime(osInfo.uptime)}
              </div>
            )}
          </div>
        )}

      </header>
      <main className="main-content">
        <div className="dashboard">
          <CPUMonitor data={systemInfo?.cpu} history={history} />
          <MemoryMonitor data={systemInfo?.memory} history={history} />
          <DiskMonitor data={systemInfo?.disk} history={history} />
          <NetworkMonitor data={systemInfo?.network} history={history} />
          {/* {batteryInfo?.available && <BatteryMonitor batteryInfo={batteryInfo} />} */}
        </div>
        <ProcessList
          processes={processes}
          showThreads={showThreads}
          onToggleThreads={() => setShowThreads(!showThreads)}
          onKillProcess={async (pid) => {
            const result = await window.electronAPI.killProcess(pid);
            if (result.success) {
              setProcesses(processes.filter((p) => p.pid !== pid));
            }
            return result;
          }}
        />
      </main>
    </div>
  );
};

export default App;
