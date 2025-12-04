import React, { useState, useEffect } from 'react';
import CPUMonitor from './components/CPUMonitor';
import MemoryMonitor from './components/MemoryMonitor';
import DiskMonitor from './components/DiskMonitor';
import NetworkMonitor from './components/NetworkMonitor';
import ProcessList from './components/ProcessList';

declare global {
  interface Window {
    electronAPI: {
      getSystemInfo: () => Promise<any>;
      getProcesses: () => Promise<any[]>;
      killProcess: (pid: number) => Promise<{ success: boolean; message: string }>;
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
        setError('Failed to fetch system information');
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
        <h1>⚡ Peep</h1>
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
              setProcesses(processes.filter(p => p.pid !== pid));
            }
            return result;
          }}
        />
      </main>
    </div>
  );
};

export default App;
