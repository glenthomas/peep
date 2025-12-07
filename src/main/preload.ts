import { contextBridge, ipcRenderer } from 'electron';
import type { SystemInfo, ProcessInfo, BatteryInfo, OsInfo, KillProcessResult } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: (): Promise<SystemInfo | null> => ipcRenderer.invoke('get-system-info'),
  getProcesses: (showThreads?: boolean): Promise<ProcessInfo[]> => ipcRenderer.invoke('get-processes', showThreads),
  getBatteryInfo: (): Promise<BatteryInfo> => ipcRenderer.invoke('get-battery-info'),
  getOsInfo: (): Promise<OsInfo> => ipcRenderer.invoke('get-os-info'),
  killProcess: (pid: number): Promise<KillProcessResult> =>
    ipcRenderer.invoke('kill-process', pid),
});
