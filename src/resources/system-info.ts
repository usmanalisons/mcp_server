import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import { platform, arch, version, cpus, totalmem, freemem } from 'os';

export const systemInfoResource: Resource = {
  uri: 'system://info',
  name: 'System Information',
  description: 'Current system information and statistics',
  mimeType: 'application/json',
};

export async function getSystemInfo(): Promise<string> {
  try {
    const systemInfo = {
      platform: platform(),
      architecture: arch(),
      nodeVersion: version,
      cpuCount: cpus().length,
      totalMemory: Math.round(totalmem() / 1024 / 1024 / 1024) + ' GB',
      freeMemory: Math.round(freemem() / 1024 / 1024 / 1024) + ' GB',
      uptime: Math.round(process.uptime()) + ' seconds',
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(systemInfo, null, 2);
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    }, null, 2);
  }
}