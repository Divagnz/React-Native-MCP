/**
 * ADB Get Package Info Tool
 * Get detailed information about an installed package
 * @module tools/adb/app/get-package-info
 */

import { z } from 'zod';
import { getADBClient } from '../core/index.js';
import { validatePackageName } from '../utils/index.js';
import {
  withErrorHandling,
  ADBError,
  DeviceNotFoundError,
  PackageNotFoundError,
} from '../../../errors/index.js';

/**
 * Input schema for get_package_info tool
 */
export const GetPackageInfoInputSchema = z.object({
  package_name: z.string().describe('Package name to query (e.g., com.example.app)'),
  device_id: z
    .string()
    .optional()
    .describe('Target device ID (uses first available if not specified)'),
});

export type GetPackageInfoInput = z.infer<typeof GetPackageInfoInputSchema>;

/**
 * Detailed package information
 */
export interface DetailedPackageInfo {
  package_name: string;
  version_name?: string;
  version_code?: string;
  install_location?: string;
  first_install_time?: string;
  last_update_time?: string;
  data_dir?: string;
  apk_path?: string;
  uid?: string;
  target_sdk?: string;
  min_sdk?: string;
  permissions?: string[];
  is_system_app: boolean;
  is_enabled: boolean;
  device_id: string;
}

/**
 * Get detailed information about an installed package
 *
 * Retrieves comprehensive package metadata including:
 * - Version information
 * - Installation paths
 * - Installation and update timestamps
 * - SDK versions
 * - Permissions
 * - System/user app status
 *
 * @param input - Package info query configuration
 * @returns Detailed package information
 */
export async function getPackageInfo(input: GetPackageInfoInput) {
  return withErrorHandling(async () => {
    const { package_name, device_id } = input;

    // Validate package name
    validatePackageName(package_name);

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

    // Get package dump
    const dumpResult = await client.execute(
      ['-s', targetDevice, 'shell', 'dumpsys', 'package', package_name],
      {
        timeout: 30000,
        throw_on_error: false,
      }
    );

    if (!dumpResult.success || !dumpResult.stdout) {
      throw new PackageNotFoundError(package_name, targetDevice);
    }

    const output = dumpResult.stdout;

    // Check if package exists
    if (output.includes('Unable to find package')) {
      throw new PackageNotFoundError(package_name, targetDevice);
    }

    // Parse package information
    const info: DetailedPackageInfo = {
      package_name,
      device_id: targetDevice,
      is_system_app: false,
      is_enabled: true,
    };

    // Extract version information
    const versionNameMatch = output.match(/versionName=([^\s]+)/);
    if (versionNameMatch) info.version_name = versionNameMatch[1];

    const versionCodeMatch = output.match(/versionCode=(\d+)/);
    if (versionCodeMatch) info.version_code = versionCodeMatch[1];

    // Extract install location
    const installLocationMatch = output.match(/installLocation=([^\s]+)/);
    if (installLocationMatch) info.install_location = installLocationMatch[1];

    // Extract timestamps
    const firstInstallMatch = output.match(/firstInstallTime=([^\n]+)/);
    if (firstInstallMatch) info.first_install_time = firstInstallMatch[1].trim();

    const lastUpdateMatch = output.match(/lastUpdateTime=([^\n]+)/);
    if (lastUpdateMatch) info.last_update_time = lastUpdateMatch[1].trim();

    // Extract paths
    const dataDirMatch = output.match(/dataDir=([^\s]+)/);
    if (dataDirMatch) info.data_dir = dataDirMatch[1];

    const codePathMatch = output.match(/codePath=([^\s]+)/);
    if (codePathMatch) info.apk_path = codePathMatch[1];

    // Extract UID
    const uidMatch = output.match(/userId=(\d+)/);
    if (uidMatch) info.uid = uidMatch[1];

    // Extract SDK versions
    const targetSdkMatch = output.match(/targetSdk=(\d+)/);
    if (targetSdkMatch) info.target_sdk = targetSdkMatch[1];

    const minSdkMatch = output.match(/minSdk=(\d+)/);
    if (minSdkMatch) info.min_sdk = minSdkMatch[1];

    // Extract permissions
    const permissionsSection = output.match(
      /requested permissions:([\s\S]*?)(?=\n\s*\n|\ninstall permissions:)/
    );
    if (permissionsSection) {
      const permissions = permissionsSection[1]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('android.permission.'))
        .map((line) => line.split(':')[0]);
      if (permissions.length > 0) {
        info.permissions = permissions;
      }
    }

    // Check if system app
    if (info.apk_path && info.apk_path.includes('/system/')) {
      info.is_system_app = true;
    }

    // Check if enabled (look for "enabled" in package state)
    if (output.includes('enabled=1') || output.includes('ENABLED')) {
      info.is_enabled = true;
    } else if (output.includes('enabled=0') || output.includes('DISABLED')) {
      info.is_enabled = false;
    }

    return info;
  }, 'get package information');
}
