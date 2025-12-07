// Shared types between main, preload, and renderer processes

export interface CpuInfo {
  usage: number;
  cores: number;
  brand?: string;
  perCore?: number[];
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  totalSwap: number;
  usedSwap: number;
  freeSwap: number;
}

export interface DiskInfo {
  read: number;
  write: number;
  disks?: DiskDetails[];
}

export interface DiskDetails {
  name: string;
  mountPoint: string;
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  fileSystem: string;
}

export interface NetworkInfo {
  rx: number;
  tx: number;
  interfaces?: NetworkInterface[];
}

export interface NetworkInterface {
  name: string;
  type: string;
  received: number;
  transmitted: number;
  packetsReceived: number;
  packetsTransmitted: number;
}

export interface SystemInfo {
  cpu?: CpuInfo;
  memory?: MemoryInfo;
  disk?: DiskInfo;
  network: NetworkInfo;
}

export interface ProcessInfo {
  pid: number;
  ppid: number;
  name: string;
  cpu: number;
  memoryBytes: number;
  memoryPercentage: number;
  user: string;
  runTime: number;
  cpuTime: number;
  status: string;
  command: string;
  diskRead: number;
  diskWrite: number;
  isThread: boolean;
}

export interface BatteryInfo {
  available: boolean;
  percentage?: number;
  state?: string;
  timeToFull?: number;
  timeToEmpty?: number;
  health?: number;
  temperature?: number;
}

export interface OsInfo {
  name: string;
  version: string;
  kernelVersion: string;
  hostname: string;
  model?: string;
  marketingName?: string;
  uptime?: number;
}

export interface KillProcessResult {
  success: boolean;
  message: string;
}

export interface ElectronAPI {
  getSystemInfo: () => Promise<SystemInfo | null>;
  getProcesses: (showThreads?: boolean) => Promise<ProcessInfo[]>;
  getBatteryInfo: () => Promise<BatteryInfo>;
  getOsInfo: () => Promise<OsInfo>;
  killProcess: (pid: number) => Promise<KillProcessResult>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
