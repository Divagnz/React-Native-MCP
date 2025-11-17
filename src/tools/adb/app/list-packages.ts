/**
 * ADB List Packages Tool
 * List installed packages on an Android device
 * @module tools/adb/app/list-packages
 */

import { z } from 'zod';
import { getADBClient } from '../core/index.js';
import { withErrorHandling, DeviceNotFoundError } from '../../../errors/index.js';

/**
 * Input schema for list_packages tool
 */
export const ListPackagesInputSchema = z.object({
  device_id: z
    .string()
    .optional()
    .describe('Target device ID (uses first available if not specified)'),
  filter: z.string().optional().describe('Filter packages by name (partial match)'),
  show_system: z.boolean().optional().describe('Include system packages (default: false)'),
  show_third_party: z.boolean().optional().describe('Include third-party packages (default: true)'),
  show_disabled: z.boolean().optional().describe('Include disabled packages (default: false)'),
});

export type ListPackagesInput = z.infer<typeof ListPackagesInputSchema>;

/**
 * Package information
 */
export interface PackageInfo {
  package_name: string;
  type: 'system' | 'third-party' | 'disabled';
}

/**
 * List installed packages on an Android device
 *
 * Common workflows:
 * - List user apps only: Default behavior (show_third_party=true, show_system=false)
 * - List all apps: Use show_system=true and show_third_party=true
 * - Find specific app: Use filter='com.example'
 *
 * @param input - Package listing configuration
 * @returns List of packages with metadata
 */
export async function listPackages(input: ListPackagesInput) {
  return withErrorHandling(async () => {
    const {
      device_id,
      filter,
      show_system = false,
      show_third_party = true,
      show_disabled = false,
    } = input;

    const client = getADBClient();

    // Get target device
    let targetDevice = device_id;
    if (!targetDevice) {
      const devices = await client.listDevices(false);
      if (devices.length === 0) {
        throw new DeviceNotFoundError('No devices connected');
      }
      targetDevice = devices[0].id;
    } else {
      // Verify device exists
      const devices = await client.listDevices(false);
      if (!devices.find((d) => d.id === targetDevice)) {
        throw new DeviceNotFoundError(`Device ${targetDevice} not found`);
      }
    }

    const packages: PackageInfo[] = [];

    // Build package list commands based on filter options
    const commands: Array<{ type: 'system' | 'third-party' | 'disabled'; args: string[] }> = [];

    if (show_third_party) {
      commands.push({
        type: 'third-party',
        args: ['-s', targetDevice, 'shell', 'pm', 'list', 'packages', '-3'],
      });
    }

    if (show_system) {
      commands.push({
        type: 'system',
        args: ['-s', targetDevice, 'shell', 'pm', 'list', 'packages', '-s'],
      });
    }

    if (show_disabled) {
      commands.push({
        type: 'disabled',
        args: ['-s', targetDevice, 'shell', 'pm', 'list', 'packages', '-d'],
      });
    }

    // Execute all commands
    for (const cmd of commands) {
      const result = await client.execute(cmd.args, {
        timeout: 30000,
        throw_on_error: false,
      });

      if (result.success) {
        // Parse package list (format: "package:com.example.app")
        const lines = result.stdout.split('\n');
        for (const line of lines) {
          const match = line.match(/^package:(.+)$/);
          if (match) {
            const packageName = match[1].trim();

            // Apply filter if specified
            if (!filter || packageName.includes(filter)) {
              // Avoid duplicates (e.g., disabled system packages)
              if (!packages.find((p) => p.package_name === packageName)) {
                packages.push({
                  package_name: packageName,
                  type: cmd.type,
                });
              }
            }
          }
        }
      }
    }

    // Sort packages alphabetically
    packages.sort((a, b) => a.package_name.localeCompare(b.package_name));

    // Generate summary
    const thirdPartyCount = packages.filter((p) => p.type === 'third-party').length;
    const systemCount = packages.filter((p) => p.type === 'system').length;
    const disabledCount = packages.filter((p) => p.type === 'disabled').length;

    return {
      packages,
      total: packages.length,
      third_party_count: thirdPartyCount,
      system_count: systemCount,
      disabled_count: disabledCount,
      device_id: targetDevice,
      summary: `Found ${packages.length} package(s): ${thirdPartyCount} third-party, ${systemCount} system, ${disabledCount} disabled`,
      filter_applied: filter || null,
    };
  }, 'list packages on device');
}
