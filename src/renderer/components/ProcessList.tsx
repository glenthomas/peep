import React, { useState } from "react";

interface Process {
  pid: number;
  name: string;
  cpu: number;
  memoryBytes: number;
  memoryPercentage: number;
  user: string;
  runTime: number;
  status: string;
  command: string;
  diskRead: number;
  diskWrite: number;
}

interface ProcessListProps {
  processes: Process[];
  onKillProcess: (
    pid: number
  ) => Promise<{ success: boolean; message: string }>;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const formatRunTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return `${days}d ${hrs}h`;
};

const ProcessList: React.FC<ProcessListProps> = ({
  processes,
  onKillProcess,
}) => {
  const [sortBy, setSortBy] = useState<
    "cpu" | "memoryBytes" | "memoryPercentage" | "pid" | "name" | "user" | "runTime" | "status" | "command" | "diskRead" | "diskWrite"
  >("cpu");
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processToKill, setProcessToKill] = useState<{
    pid: number;
    name: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  
  // Column visibility state - command hidden by default
  const [visibleColumns, setVisibleColumns] = useState({
    pid: true,
    name: true,
    user: true,
    status: true,
    cpu: true,
    memory: true,
    memoryPercentage: true,
    runTime: true,
    command: false,
    diskRead: true,
    diskWrite: true,
  });

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const handleSort = (column: "cpu" | "memoryBytes" | "memoryPercentage" | "pid" | "name" | "user" | "runTime" | "status" | "command" | "diskRead" | "diskWrite") => {
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
      if (sortBy === "name" || sortBy === "user" || sortBy === "status") {
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
          <h2 style={{ margin: 0 }}>Processes ({sortedProcesses.length})</h2>
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
            <div style={{ position: "relative", marginLeft: "12px" }}>
              <button
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "6px",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Columns
                <span style={{ fontSize: "10px" }}>▼</span>
              </button>
              {showColumnDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    background: "var(--color-bg-secondary)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "6px",
                    padding: "8px",
                    zIndex: 1000,
                    minWidth: "150px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {Object.entries({
                    pid: "PID",
                    name: "Name",
                    user: "User",
                    status: "Status",
                    cpu: "CPU %",
                    memory: "Memory",
                    memoryPercentage: "Memory %",
                    runTime: "Runtime",
                    command: "Command",
                    diskRead: "Disk Read",
                    diskWrite: "Disk Write",
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "6px 8px",
                        cursor: "pointer",
                        fontSize: "12px",
                        color: "var(--color-text-secondary)",
                        borderRadius: "4px",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[key as keyof typeof visibleColumns]}
                        onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                        style={{ marginRight: "8px", cursor: "pointer" }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
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
            {visibleColumns.pid && (
              <th onClick={() => handleSort("pid")} style={{ cursor: "pointer" }}>
                PID {sortBy === "pid" && (sortDesc ? "↓" : "↑")}
              </th>
            )}
            {visibleColumns.name && (
              <th
                onClick={() => handleSort("name")}
                style={{ cursor: "pointer" }}
              >
                Name {sortBy === "name" && (sortDesc ? "↓" : "↑")}
              </th>
            )}
            {visibleColumns.user && (
              <th
                onClick={() => handleSort("user")}
                style={{ cursor: "pointer" }}
              >
                User {sortBy === "user" && (sortDesc ? "↓" : "↑")}
              </th>
            )}
            {visibleColumns.status && (
              <th
                onClick={() => handleSort("status")}
                style={{ cursor: "pointer" }}
              >
                Status {sortBy === "status" && (sortDesc ? "↓" : "↑")}
              </th>
            )}
            {visibleColumns.cpu && (
              <th onClick={() => handleSort("cpu")} style={{ cursor: "pointer" }}>
                CPU % {sortBy === "cpu" && (sortDesc ? "↓" : "↑")}
              </th>
            )}
            {visibleColumns.memory && (
              <th
                onClick={() => handleSort("memoryBytes")}
                style={{ cursor: "pointer" }}
              >
                Memory {sortBy === "memoryBytes" && (sortDesc ? "↓" : "↑")}
              </th>
            )}
            {visibleColumns.memoryPercentage && (
              <th
                onClick={() => handleSort("memoryPercentage")}
                style={{ cursor: "pointer" }}
              >
                Memory % {sortBy === "memoryPercentage" && (sortDesc ? "↓" : "↑")}
              </th>
            )}
            {visibleColumns.runTime && (
              <th
                onClick={() => handleSort("runTime")}
                style={{ cursor: "pointer" }}
              >
                Runtime {sortBy === "runTime" && (sortDesc ? "↓" : "↑")}
              </th>
            )}
            {visibleColumns.command && (
              <th
                onClick={() => handleSort("command")}
                style={{ cursor: "pointer" }}
              >
                Command {sortBy === "command" && (sortDesc ? "↓" : "↑")}
              </th>
            )}
            {visibleColumns.diskRead && (
              <th
                onClick={() => handleSort("diskRead")}
                style={{ cursor: "pointer" }}
              >
                Disk Read {sortBy === "diskRead" && (sortDesc ? "↓" : "↑")}
              </th>
            )}
            {visibleColumns.diskWrite && (
              <th
                onClick={() => handleSort("diskWrite")}
                style={{ cursor: "pointer" }}
              >
                Disk Write {sortBy === "diskWrite" && (sortDesc ? "↓" : "↑")}
              </th>
            )}
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
              {visibleColumns.pid && <td>{process.pid}</td>}
              {visibleColumns.name && <td>{process.name}</td>}
              {visibleColumns.user && <td>{process.user}</td>}
              {visibleColumns.status && <td>{process.status}</td>}
              {visibleColumns.cpu && <td>{process.cpu.toFixed(1)}%</td>}
              {visibleColumns.memory && <td>{formatBytes(process.memoryBytes)}</td>}
              {visibleColumns.memoryPercentage && <td>{process.memoryPercentage.toFixed(1)}%</td>}
              {visibleColumns.runTime && <td>{formatRunTime(process.runTime)}</td>}
              {visibleColumns.command && <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={process.command}>{process.command}</td>}
              {visibleColumns.diskRead && <td>{formatBytes(process.diskRead)}</td>}
              {visibleColumns.diskWrite && <td>{formatBytes(process.diskWrite)}</td>}
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
