import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

// Import the native module
let native: any;
try {
  native = require('../../native/index.node');
} catch (error) {
  console.error('Failed to load native module:', error);
  native = null;
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    title: 'Peep - System Monitor',
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for system monitoring
ipcMain.handle('get-system-info', async () => {
  try {
    if (!native) {
      return {
        cpu: { usage: 0, cores: 0 },
        memory: { total: 0, used: 0, free: 0 },
        disk: { read: 0, write: 0 },
        network: { rx: 0, tx: 0 },
      };
    }
    
    const systemInfo = native.getSystemInfo();
    return systemInfo;
  } catch (error) {
    console.error('Error getting system info:', error);
    return null;
  }
});

ipcMain.handle('get-processes', async () => {
  try {
    if (!native) {
      return [];
    }
    
    const processes = native.getProcesses();
    
    // Calculate memory percentage based on total system memory
    const systemInfo = native.getSystemInfo();
    const totalMemory = systemInfo.memory.total;
    
    return processes.map((proc: any) => ({
      ...proc,
      memory: totalMemory > 0 ? (proc.memory / totalMemory) * 100 : 0,
    }));
  } catch (error) {
    console.error('Error getting processes:', error);
    return [];
  }
});

ipcMain.handle('kill-process', async (_event, pid: number) => {
  try {
    if (!native) {
      return { success: false, message: 'Native module not loaded' };
    }
    
    const result = native.killProcess(pid);
    return result;
  } catch (error) {
    console.error('Error killing process:', error);
    return { success: false, message: 'Failed to kill process' };
  }
});

