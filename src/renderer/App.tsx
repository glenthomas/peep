import React, { useState, useEffect } from "react";
import CPUMonitor from "./components/CPUMonitor";
import MemoryMonitor from "./components/MemoryMonitor";
import DiskMonitor from "./components/DiskMonitor";
import NetworkMonitor from "./components/NetworkMonitor";
import ProcessList from "./components/ProcessList";

declare global {
  interface Window {
    electronAPI: {
      getSystemInfo: () => Promise<any>;
      getProcesses: () => Promise<any[]>;
      killProcess: (
        pid: number
      ) => Promise<{ success: boolean; message: string }>;
    };
  }
}

const App: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [info, procs] = await Promise.all([
          window.electronAPI.getSystemInfo(),
          window.electronAPI.getProcesses(),
        ]);

        setSystemInfo(info);
        setProcesses(procs);
        setLoading(false);
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
      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <svg
            width="32"
            height="32"
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
            <h1>Peep</h1>
          </div>
          </div>
          <p>System Monitor - Real-time performance insights</p>
      </header>
      <main className="main-content">
        <div className="dashboard">
          <CPUMonitor data={systemInfo?.cpu} />
          <MemoryMonitor data={systemInfo?.memory} />
          <DiskMonitor data={systemInfo?.disk} />
          <NetworkMonitor data={systemInfo?.network} />
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
