/**
 * ADB Client
 * Singleton client for executing ADB commands
 * @module tools/adb/core/adb-client
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { resolveADBPath, validateTimeout, validateDeviceId } from '../utils/index.js';
import {
  ADBError,
  DeviceNotFoundError,
  DeviceOfflineError,
  TimeoutError,
} from '../../../errors/index.js';
import type { DeviceInfo, DeviceState, ADBCommandOptions, ADBExecutionResult } from '../types.js';

const execAsync = promisify(exec);

/**
 * ADB Client - Singleton class for ADB operations
 */
export class ADBClient {
  private static instance: ADBClient | null = null;
  private adbPath: string;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.adbPath = resolveADBPath();
  }

  /**
   * Get the singleton instance of ADBClient
   */
  public static getInstance(): ADBClient {
    if (!ADBClient.instance) {
      ADBClient.instance = new ADBClient();
    }
    return ADBClient.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    ADBClient.instance = null;
  }

  /**
   * Get the ADB executable path
   */
  public getADBPath(): string {
    return this.adbPath;
  }

  /**
   * Execute an ADB command
   *
   * @param args - ADB command arguments
   * @param options - Execution options
   * @returns Execution result with stdout, stderr, and exit code
   */
  public async execute(
    args: string[],
    options: ADBCommandOptions = {}
  ): Promise<ADBExecutionResult> {
    const { device_id, timeout = this.DEFAULT_TIMEOUT, throw_on_error = true } = options;

    // Validate timeout
    const validatedTimeout = validateTimeout(timeout);

    // Build command
    const commandArgs = device_id ? ['-s', validateDeviceId(device_id), ...args] : args;

    const command = `"${this.adbPath}" ${commandArgs.join(' ')}`;

    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: validatedTimeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        encoding: 'utf-8',
      });

      const duration_ms = Date.now() - startTime;

      const result: ADBExecutionResult = {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exit_code: 0,
        duration_ms,
      };

      return result;
    } catch (error: unknown) {
      const duration_ms = Date.now() - startTime;

      // Handle timeout
      if (error instanceof Error && 'killed' in error && error.killed) {
        throw new TimeoutError(`ADB command timed out after ${validatedTimeout}ms`, {
          command: commandArgs.join(' '),
          timeout: validatedTimeout,
        });
      }

      // Handle exec error
      const execError = error as {
        code?: number;
        stdout?: string;
        stderr?: string;
        message: string;
      };

      const result: ADBExecutionResult = {
        success: false,
        stdout: (execError.stdout || '').trim(),
        stderr: (execError.stderr || '').trim(),
        exit_code: execError.code || 1,
        duration_ms,
      };

      // Parse stderr for common errors
      const stderr = result.stderr.toLowerCase();

      if (stderr.includes('device not found')) {
        throw new DeviceNotFoundError(device_id, {
          command: commandArgs.join(' '),
          stderr: result.stderr,
        });
      }

      if (stderr.includes('device offline')) {
        throw new DeviceOfflineError(device_id || 'unknown', {
          command: commandArgs.join(' '),
          stderr: result.stderr,
        });
      }

      if (throw_on_error) {
        throw new ADBError(`ADB command failed: ${result.stderr || result.stdout}`, {
          command: commandArgs.join(' '),
          exitCode: result.exit_code,
          stdout: result.stdout,
          stderr: result.stderr,
        });
      }

      return result;
    }
  }

  /**
   * Execute an ADB command with streaming output
   * Useful for logcat and other long-running commands
   *
   * @param args - ADB command arguments
   * @param onData - Callback for each line of output
   * @param options - Execution options
   * @returns Function to stop the stream
   */
  public executeStream(
    args: string[],
    onData: (line: string) => void,
    options: ADBCommandOptions = {}
  ): () => void {
    const { device_id } = options;

    // Build command
    const commandArgs = device_id ? ['-s', validateDeviceId(device_id), ...args] : args;

    const child = spawn(this.adbPath, commandArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let buffer = '';

    child.stdout.on('data', (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          onData(line.trim());
        }
      }
    });

    child.stderr.on('data', (data: Buffer) => {
      const errorMessage = data.toString().trim();
      if (errorMessage) {
        onData(`ERROR: ${errorMessage}`);
      }
    });

    child.on('error', (error: Error) => {
      onData(`PROCESS_ERROR: ${error.message}`);
    });

    // Return function to stop the stream
    return () => {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    };
  }

  /**
   * List all connected devices
   *
   * @param includeOffline - Whether to include offline devices
   * @returns Array of device information
   */
  public async listDevices(includeOffline = false): Promise<DeviceInfo[]> {
    const result = await this.execute(['devices', '-l']);

    const lines = result.stdout.split('\n').slice(1); // Skip "List of devices attached"
    const devices: DeviceInfo[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parse device line format:
      // <serial> <state> product:<product> model:<model> device:<device> transport_id:<id>
      const parts = line.trim().split(/\s+/);
      if (parts.length < 2) continue;

      const id = parts[0];
      const state = parts[1] as DeviceState;

      // Skip offline devices if not requested
      if (!includeOffline && state !== 'device') {
        continue;
      }

      const deviceInfo: DeviceInfo = { id, state };

      // Parse additional properties
      for (let i = 2; i < parts.length; i++) {
        const [key, value] = parts[i].split(':');
        if (key && value) {
          switch (key) {
            case 'product':
              deviceInfo.product = value;
              break;
            case 'model':
              deviceInfo.model = value;
              break;
            case 'device':
              deviceInfo.device = value;
              break;
          }
        }
      }

      devices.push(deviceInfo);
    }

    return devices;
  }

  /**
   * Get detailed device information
   *
   * @param deviceId - Optional device ID (uses first available if not specified)
   * @returns Detailed device information
   */
  public async getDeviceInfo(deviceId?: string): Promise<DeviceInfo> {
    // If no device ID specified, get first available device
    if (!deviceId) {
      const devices = await this.listDevices();
      if (devices.length === 0) {
        throw new DeviceNotFoundError();
      }
      deviceId = devices[0].id;
    } else {
      deviceId = validateDeviceId(deviceId);
    }

    const deviceInfo: DeviceInfo = {
      id: deviceId,
      state: 'device',
    };

    // Get device properties in parallel
    const propertyMap: Record<string, keyof DeviceInfo> = {
      'ro.product.model': 'model',
      'ro.product.manufacturer': 'manufacturer',
      'ro.build.version.release': 'android_version',
      'ro.build.version.sdk': 'api_level',
      'ro.product.cpu.abi': 'architecture',
      'ro.product.brand': 'brand',
      'ro.product.name': 'product',
      'ro.product.device': 'device',
    };

    const promises = Object.entries(propertyMap).map(async ([prop, key]) => {
      try {
        const result = await this.execute(['shell', 'getprop', prop], {
          device_id: deviceId,
          throw_on_error: false,
        });

        if (result.success && result.stdout) {
          const value = result.stdout.trim();
          if (key === 'api_level') {
            deviceInfo[key] = parseInt(value, 10);
          } else {
            // Type assertion is safe here as we're mapping known properties
            (deviceInfo as unknown as Record<string, string>)[key] = value;
          }
        }
      } catch {
        // Ignore errors for individual properties
      }
    });

    await Promise.all(promises);

    return deviceInfo;
  }

  /**
   * Check if a device is connected and online
   *
   * @param deviceId - Optional device ID
   * @returns True if device is connected and online
   */
  public async isDeviceOnline(deviceId?: string): Promise<boolean> {
    try {
      const devices = await this.listDevices();

      if (!deviceId) {
        return devices.length > 0;
      }

      const device = devices.find((d) => d.id === deviceId);
      return device?.state === 'device';
    } catch {
      return false;
    }
  }

  /**
   * Wait for a device to be online
   *
   * @param deviceId - Optional device ID
   * @param timeout - Maximum time to wait in milliseconds
   * @returns True if device came online, false if timeout
   */
  public async waitForDevice(deviceId?: string, timeout = 30000): Promise<boolean> {
    const args = deviceId
      ? ['-s', validateDeviceId(deviceId), 'wait-for-device']
      : ['wait-for-device'];

    try {
      await this.execute(args, { timeout });
      return true;
    } catch (error) {
      if (error instanceof TimeoutError) {
        return false;
      }
      throw error;
    }
  }
}

/**
 * Get the singleton ADB client instance
 */
export function getADBClient(): ADBClient {
  return ADBClient.getInstance();
}
