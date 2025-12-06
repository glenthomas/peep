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
      getProcesses: () => Promise<any[]>;
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
  const [history, setHistory] = useState<HistoricalData[]>(() =>
    Array.from({ length: 900 }, (_, i) => ({
      timestamp: Date.now() - (900 - i) * 2000,
      cpu: 0,
      memory: 0,
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
          window.electronAPI.getProcesses(),
          window.electronAPI.getBatteryInfo(),
        ]);

        setSystemInfo(info);
        setProcesses(procs);
        setBatteryInfo(battery);
        setLoading(false);

        // Add to history (keep last 30 minutes at 2-second intervals = 900 data points)
        const newDataPoint: HistoricalData = {
          timestamp: Date.now(),
          cpu: info?.cpu?.usage ?? 0,
          perCore: info?.cpu?.perCore ?? [],
          memory: info?.memory ? (info.memory.used / info.memory.total) * 100 : 0,
          diskRead: info?.disk?.read ?? 0,
          diskWrite: info?.disk?.write ?? 0,
          networkRx: info?.network?.rx ?? 0,
          networkTx: info?.network?.tx ?? 0,
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
  }, []);

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
        {osInfo && (
          <div style={{ 
            fontSize: "12px", 
            color: "var(--color-text-secondary)",
            opacity: 0.8,
            fontFamily: "'Orbitron', monospace"
          }}>
            {osInfo.name} {osInfo.version}
          </div>
        )}
      </header>
      <main className="main-content">
        <div className="dashboard">
          <CPUMonitor data={systemInfo?.cpu} history={history} />
          <MemoryMonitor data={systemInfo?.memory} history={history} />
          <DiskMonitor data={systemInfo?.disk} history={history} />
          <NetworkMonitor data={systemInfo?.network} history={history} />
          {batteryInfo?.available && <BatteryMonitor batteryInfo={batteryInfo} />}
        </div>
        <ProcessList
          processes={processes}
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
