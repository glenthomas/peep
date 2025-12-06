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
  const [sortBy, setSortBy] = useState<
    "cpu" | "memory" | "pid" | "name" | "user"
  >("cpu");
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processToKill, setProcessToKill] = useState<{
    pid: number;
    name: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSort = (column: "cpu" | "memory" | "pid" | "name" | "user") => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
  };

  const handleKillProcess = async (pid: number, name: string) => {
    setProcessToKill({ pid, name });
    setShowConfirmDialog(true);
  };

  const confirmKill = async () => {
    if (processToKill) {
      const result = await onKillProcess(processToKill.pid);
      if (result.success) {
        setSelectedPid(null);
      } else {
        alert(`Failed to kill process: ${result.message}`);
      }
    }
    setShowConfirmDialog(false);
    setProcessToKill(null);
  };

  const cancelKill = () => {
    setShowConfirmDialog(false);
    setProcessToKill(null);
  };

  const sortedProcesses = [...processes]
    .filter((process) => {
      if (!searchQuery) return true;
      return process.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      // Handle string sorting for name and user
      if (sortBy === "name" || sortBy === "user") {
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (sortDesc) {
          return bStr.localeCompare(aStr);
        } else {
          return aStr.localeCompare(bStr);
        }
      }

      // Handle numeric sorting for cpu, memory, pid
      return sortDesc
        ? (bVal as number) - (aVal as number)
        : (aVal as number) - (bVal as number);
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
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{ marginRight: "8px", display: "block" }}
          >
            <path
              fillRule="evenodd"
              d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2"
            />
          </svg>
          <h2 style={{ margin: 0 }}>Running Processes ({sortedProcesses.length})</h2>
          <div
            style={{
              marginLeft: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <div style={{ position: "relative", flex: "0 1 300px" }}>
              <input
                type="text"
                placeholder="Filter"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="clear-search"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
        <button
          className="kill-button"
          onClick={() => {
            if (selectedPid !== null) {
              const process = processes.find((p) => p.pid === selectedPid);
              if (process) {
                handleKillProcess(selectedPid, process.name);
              }
            } else {
              alert("Please select a process first");
            }
          }}
          disabled={selectedPid === null}
          style={{
            padding: "8px 18px",
            fontSize: "14px",
            fontWeight: "500",
            border: "none",
            cursor: selectedPid === null ? "not-allowed" : "pointer",
            opacity: selectedPid === null ? 0.5 : 1,
            position: "relative",
          }}
        >
          <span style={{ position: "relative", zIndex: 2 }}>Kill Process</span>
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort("pid")} style={{ cursor: "pointer" }}>
              PID {sortBy === "pid" && (sortDesc ? "↓" : "↑")}
            </th>
            <th
              onClick={() => handleSort("name")}
              style={{ cursor: "pointer" }}
            >
              Name {sortBy === "name" && (sortDesc ? "↓" : "↑")}
            </th>
            <th
              onClick={() => handleSort("user")}
              style={{ cursor: "pointer" }}
            >
              User {sortBy === "user" && (sortDesc ? "↓" : "↑")}
            </th>
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
          {sortedProcesses.map((process) => (
            <tr
              key={process.pid}
              onClick={() => setSelectedPid(process.pid)}
              style={{
                backgroundColor:
                  selectedPid === process.pid
                    ? "rgba(102, 126, 234, 0.2)"
                    : "transparent",
                cursor: "pointer",
              }}
            >
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

      {showConfirmDialog && processToKill && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3>Confirm Kill Process</h3>
            <p>
              Are you sure you want to kill process{" "}
              <strong>"{processToKill.name}"</strong> (PID: {processToKill.pid}
              )?
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={cancelKill}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={confirmKill}>
                Kill Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessList;
