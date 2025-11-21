/**
 * ADB Connect Device Tool
 * Connect to an Android device over TCP/IP (wireless debugging)
 * @module tools/adb/device/connect-device
 */

import { z } from 'zod';
import { getADBClient } from '../core/index.js';
import { validatePort } from '../utils/index.js';
import { withErrorHandling, ADBError } from '../../../errors/index.js';

/**
 * Input schema for connect_device tool
 */
export const ConnectDeviceInputSchema = z.object({
  host: z.string().describe('IP address or hostname of the device (e.g., 192.168.1.100)'),
  port: z
    .number()
    .int()
    .min(1)
    .max(65535)
    .optional()
    .default(5555)
    .describe('ADB port (default: 5555)'),
  timeout: z
    .number()
    .int()
    .min(1000)
    .max(60000)
    .optional()
    .describe('Connection timeout in milliseconds (default: 10000)'),
});

export type ConnectDeviceInput = {
  host: string;
  port?: number;
  timeout?: number;
};

/**
 * Connect to an Android device over TCP/IP
 *
 * Useful for wireless debugging. The device must have TCP/IP debugging enabled.
 * Common workflow:
 * 1. Connect device via USB
 * 2. Run: adb tcpip 5555
 * 3. Disconnect USB
 * 4. Use this tool to connect wirelessly
 *
 * @param input - Connection configuration
 * @returns Connection result and instructions
 */
export async function connectDevice(input: ConnectDeviceInput) {
  return withErrorHandling(async () => {
    const { host, port = 5555, timeout = 10000 } = input;

    // Validate port
    validatePort(port);

    // Validate host format (IP/hostname validation - no consecutive dots)
    const hostRegex =
      /^(?:(?:\d{1,3}\.){3}\d{1,3}|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)$/;
    if (!hostRegex.test(host)) {
      throw new ADBError('Invalid host format. Must be an IP address or hostname', {
        host,
      });
    }

    const client = getADBClient();
    const connectionString = `${host}:${port}`;

    // Try to connect
    const result = await client.execute(['connect', connectionString], {
      timeout,
      throw_on_error: false,
    });

    const output = result.stdout.toLowerCase();

    // Parse connection result - check "already connected" first before "connected to"
    if (output.includes('already connected')) {
      return {
        success: true,
        device_id: connectionString,
        message: `Already connected to ${connectionString}`,
        connection_string: connectionString,
        was_already_connected: true,
      };
    } else if (output.includes('connected to')) {
      return {
        success: true,
        device_id: connectionString,
        message: `Successfully connected to ${connectionString}`,
        connection_string: connectionString,
        instructions: [
          'Device is now connected wirelessly',
          `You can disconnect USB cable if still connected`,
          `To disconnect: use ADB with disconnect command targeting ${connectionString}`,
        ],
      };
    } else if (output.includes('failed to connect') || output.includes('cannot connect')) {
      throw new ADBError(
        `Failed to connect to ${connectionString}. Ensure device has wireless debugging enabled`,
        {
          host,
          port,
          error_output: result.stdout || result.stderr,
          troubleshooting: [
            '1. Ensure device is on the same network',
            '2. Enable TCP/IP mode on device: adb tcpip 5555 (requires USB first)',
            '3. Check firewall settings',
            '4. Verify the IP address is correct',
            '5. Ensure port 5555 is not blocked',
          ],
        }
      );
    }

    // Unknown response
    throw new ADBError(`Unexpected response from ADB connect command`, {
      host,
      port,
      response: result.stdout || result.stderr,
    });
  }, 'connect to device over TCP/IP');
}
