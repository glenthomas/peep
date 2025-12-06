import { contextBridge, ipcRenderer } from 'electron';

export interface SystemInfo {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    read: number;
    write: number;
  };
  network: {
    rx: number;
    tx: number;
  };
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  user: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: (): Promise<SystemInfo | null> => ipcRenderer.invoke('get-system-info'),
  getProcesses: (): Promise<ProcessInfo[]> => ipcRenderer.invoke('get-processes'),
  getBatteryInfo: () => ipcRenderer.invoke('get-battery-info'),
  getOsInfo: () => ipcRenderer.invoke('get-os-info'),
  killProcess: (pid: number): Promise<{ success: boolean; message: string }> =>
    ipcRenderer.invoke('kill-process', pid),
});
