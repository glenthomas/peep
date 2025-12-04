import React, { useState } from 'react';

interface Process {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  user: string;
}

interface ProcessListProps {
  processes: Process[];
  onKillProcess: (pid: number) => Promise<{ success: boolean; message: string }>;
}

const ProcessList: React.FC<ProcessListProps> = ({ processes, onKillProcess }) => {
  const [sortBy, setSortBy] = useState<'cpu' | 'memory' | 'pid'>('cpu');
  const [sortDesc, setSortDesc] = useState(true);

  const handleSort = (column: 'cpu' | 'memory' | 'pid') => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
  };

  const handleKillProcess = async (pid: number, name: string) => {
    if (confirm(`Are you sure you want to kill process "${name}" (PID: ${pid})?`)) {
      const result = await onKillProcess(pid);
      if (result.success) {
        alert(`Process killed successfully`);
      } else {
        alert(`Failed to kill process: ${result.message}`);
      }
    }
  };

  const sortedProcesses = [...processes].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortDesc ? bVal - aVal : aVal - bVal;
  });

  return (
    <div className="process-table">
      <h2>📋 Running Processes ({processes.length})</h2>
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('pid')} style={{ cursor: 'pointer' }}>
              PID {sortBy === 'pid' && (sortDesc ? '↓' : '↑')}
            </th>
            <th>Name</th>
            <th>User</th>
            <th onClick={() => handleSort('cpu')} style={{ cursor: 'pointer' }}>
              CPU % {sortBy === 'cpu' && (sortDesc ? '↓' : '↑')}
            </th>
            <th onClick={() => handleSort('memory')} style={{ cursor: 'pointer' }}>
              Memory % {sortBy === 'memory' && (sortDesc ? '↓' : '↑')}
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedProcesses.slice(0, 20).map((process) => (
            <tr key={process.pid}>
              <td>{process.pid}</td>
              <td>{process.name}</td>
              <td>{process.user}</td>
              <td>{process.cpu.toFixed(1)}%</td>
              <td>{process.memory.toFixed(1)}%</td>
              <td>
                <button
                  className="kill-button"
                  onClick={() => handleKillProcess(process.pid, process.name)}
                >
                  Kill
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {processes.length === 0 && (
        <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          No processes found
        </p>
      )}
    </div>
  );
};

export default ProcessList;
