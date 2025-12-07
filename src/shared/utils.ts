// Shared utility functions

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @param options - Formatting options
 * @returns Formatted string (e.g., "1.5 GB" or "1.5 GB/s")
 */
export const formatBytes = (
  bytes: number,
  options: { perSecond?: boolean; decimals?: number } = {}
): string => {
  const { perSecond = false, decimals = 2 } = options;
  
  if (bytes === 0) return perSecond ? '0 B/s' : '0 B';
  if (bytes < 1) return perSecond ? `${bytes.toFixed(decimals)} B/s` : `${bytes.toFixed(decimals)} B`;
  
  const k = 1024;
  const sizes = perSecond 
    ? ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']
    : ['B', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const value = bytes / Math.pow(k, i);
  
  return `${value.toFixed(decimals)} ${sizes[i]}`;
};

/**
 * Format bytes for storage display (no /s suffix)
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places
 * @returns Formatted string (e.g., "1.5 GB")
 */
export const formatStorage = (bytes: number, decimals = 2): string => {
  return formatBytes(bytes, { perSecond: false, decimals });
};

/**
 * Format bytes per second for throughput display
 * @param bytesPerSecond - Number of bytes per second
 * @param decimals - Number of decimal places
 * @returns Formatted string (e.g., "1.5 GB/s")
 */
export const formatThroughput = (bytesPerSecond: number, decimals = 2): string => {
  return formatBytes(bytesPerSecond, { perSecond: true, decimals });
};

/**
 * Format a percentage value
 * @param value - The percentage value
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format runtime/uptime duration
 * @param seconds - Duration in seconds
 * @returns Human-readable duration string
 */
export const formatDuration = (seconds: number): string => {
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

/**
 * Format CPU time in HH:MM:SS.mmm format
 * @param seconds - CPU time in seconds
 * @returns Formatted CPU time string
 */
export const formatCpuTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

/**
 * Clamp a value between min and max
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Aliases for backward compatibility
export const formatRunTime = formatDuration;
export const formatUptime = formatDuration;
