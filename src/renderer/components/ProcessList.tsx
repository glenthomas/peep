import React, { useState } from "react";

interface Process {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  user: string;
}

interface ProcessListProps {
  processes: Process[];
  onKillProcess: (
    pid: number
  ) => Promise<{ success: boolean; message: string }>;
}

const ProcessList: React.FC<ProcessListProps> = ({
  processes,
  onKillProcess,
}) => {
  const [sortBy, setSortBy] = useState<"cpu" | "memory" | "pid">("cpu");
  const [sortDesc, setSortDesc] = useState(true);

  const handleSort = (column: "cpu" | "memory" | "pid") => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
  };

  const handleKillProcess = async (pid: number, name: string) => {
    if (
      confirm(`Are you sure you want to kill process "${name}" (PID: ${pid})?`)
    ) {
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{ marginRight: "8px" }}
          >
            <path
              fill-rule="evenodd"
              d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2"
            />
          </svg>
          <h2>Running Processes ({processes.length})</h2>
        </div>
        <button
          className="kill-button"
          onClick={() => {
            const selectedPid = prompt("Enter PID to kill:");
            if (selectedPid) {
              const pid = parseInt(selectedPid, 10);
              const process = processes.find((p) => p.pid === pid);
              if (process) {
                handleKillProcess(pid, process.name);
              } else {
                alert("Process not found");
              }
            }
          }}
        >
          Kill Process
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort("pid")} style={{ cursor: "pointer" }}>
              PID {sortBy === "pid" && (sortDesc ? "↓" : "↑")}
            </th>
            <th>Name</th>
            <th>User</th>
            <th onClick={() => handleSort("cpu")} style={{ cursor: "pointer" }}>
              CPU % {sortBy === "cpu" && (sortDesc ? "↓" : "↑")}
            </th>
            <th
              onClick={() => handleSort("memory")}
              style={{ cursor: "pointer" }}
            >
              Memory % {sortBy === "memory" && (sortDesc ? "↓" : "↑")}
            </th>
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
            </tr>
          ))}
        </tbody>
      </table>
      {processes.length === 0 && (
        <p style={{ textAlign: "center", padding: "20px", color: "#999" }}>
          No processes found
        </p>
      )}
    </div>
  );
};

export default ProcessList;
