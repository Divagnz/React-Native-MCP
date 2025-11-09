/**
 * Expo Tools Registration
 *
 * Registers all 16 Expo CLI tools with the MCP server:
 * - 4 Dev Server tools (session-based)
 * - 3 Local Build tools (session-based)
 * - 3 Cloud Build tools (EAS)
 * - 4 Project Management tools
 * - 2 OTA Update tools
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Import tool implementations
import { startDevServer } from './dev/start.js';
import { sendDevCommand } from './dev/send.js';
import { readDevLogs } from './dev/read.js';
import { stopDevServer } from './dev/stop.js';

import { startLocalBuild } from './build-local/start.js';
import { readLocalBuildLogs } from './build-local/read.js';
import { stopLocalBuild } from './build-local/stop.js';

import { triggerEASBuild } from './build-cloud/build.js';
import { getEASBuildStatus } from './build-cloud/status.js';
import { submitToStore } from './build-cloud/submit.js';

import { createExpoApp } from './project/create.js';
import { runExpoDoctor } from './project/doctor.js';
import { installExpoPackages } from './project/install.js';
import { upgradeExpoSDK } from './project/upgrade.js';

import { publishEASUpdate } from './update/publish.js';
import { getEASUpdateStatus } from './update/status.js';

/**
 * Expo Tools class for registering all Expo-related MCP tools
 */
export class ExpoTools {
  constructor(private server: McpServer) {}

  /**
   * Register all Expo tools
   */
  register(): void {
    this.registerDevServerTools();
    this.registerLocalBuildTools();
    this.registerCloudBuildTools();
    this.registerProjectTools();
    this.registerUpdateTools();
  }

  /**
   * Register Dev Server tools (4 tools - session-based)
   */
  private registerDevServerTools(): void {
    // expo_dev_start
    this.server.tool(
      'expo_dev_start',
      'Start Expo development server with QR code for device testing',
      {
        platform: z
          .enum(['ios', 'android', 'web', 'all'])
          .optional()
          .describe('Platform to target (default: all)'),
        clear_cache: z.boolean().optional().describe('Clear Metro bundler cache'),
        port: z.number().optional().describe('Port number for dev server'),
        qr_format: z
          .enum(['terminal', 'svg', 'png', 'url'])
          .optional()
          .describe('QR code format (default: terminal)'),
        offline: z.boolean().optional().describe('Run in offline mode'),
      },
      async (config) => {
        const result = await startDevServer(config);
        return {
          content: [
            {
              type: 'text',
              text: result.success
                ? JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );

    // expo_dev_send
    this.server.tool(
      'expo_dev_send',
      'Send command to running Expo dev server (reload, clear cache, etc.)',
      {
        session_id: z.string().describe('Dev server session ID from expo_dev_start'),
        command: z
          .enum(['reload', 'clear_cache', 'toggle_inspector', 'toggle_performance_monitor', 'custom'])
          .describe('Command to send'),
        custom_input: z.string().optional().describe('Custom input when command is "custom"'),
      },
      async (input) => {
        const result = sendDevCommand(input);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message! : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );

    // expo_dev_read
    this.server.tool(
      'expo_dev_read',
      'Read logs from running Expo dev server',
      {
        session_id: z.string().describe('Dev server session ID'),
        tail: z.number().optional().describe('Number of recent log lines to return (default: 50)'),
      },
      async (input) => {
        const result = readDevLogs(input);
        return {
          content: [
            {
              type: 'text',
              text: result.success
                ? JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );

    // expo_dev_stop
    this.server.tool(
      'expo_dev_stop',
      'Stop running Expo dev server',
      {
        session_id: z.string().describe('Dev server session ID to stop'),
      },
      async ({ session_id }) => {
        const result = stopDevServer(session_id);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message! : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );
  }

  /**
   * Register Local Build tools (3 tools - session-based)
   */
  private registerLocalBuildTools(): void {
    // expo_build_local_start
    this.server.tool(
      'expo_build_local_start',
      'Start local native build (expo run:ios or expo run:android)',
      {
        platform: z.enum(['ios', 'android']).describe('Platform to build for'),
        device: z.string().optional().describe('Device name, ID, or "simulator"'),
        variant: z.enum(['debug', 'release']).optional().describe('Build variant (default: debug)'),
        clean: z.boolean().optional().describe('Clean build cache before building'),
      },
      async (config) => {
        const result = startLocalBuild(config);
        return {
          content: [
            {
              type: 'text',
              text: result.success
                ? JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );

    // expo_build_local_read
    this.server.tool(
      'expo_build_local_read',
      'Read logs and progress from running local build',
      {
        session_id: z.string().describe('Build session ID from expo_build_local_start'),
        tail: z.number().optional().describe('Number of recent log lines (default: 100)'),
      },
      async ({ session_id, tail }) => {
        const result = readLocalBuildLogs(session_id, tail);
        return {
          content: [
            {
              type: 'text',
              text: result.success
                ? JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );

    // expo_build_local_stop
    this.server.tool(
      'expo_build_local_stop',
      'Cancel running local build',
      {
        session_id: z.string().describe('Build session ID to cancel'),
      },
      async ({ session_id }) => {
        const result = stopLocalBuild(session_id);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.message! : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );
  }

  /**
   * Register Cloud Build tools (3 tools - EAS)
   */
  private registerCloudBuildTools(): void {
    // eas_build
    this.server.tool(
      'eas_build',
      'Trigger EAS cloud build for iOS/Android',
      {
        platform: z.enum(['ios', 'android', 'all']).describe('Platform to build'),
        profile: z.string().optional().describe('Build profile from eas.json (default: production)'),
        wait: z.boolean().optional().describe('Wait for build completion (default: false)'),
        non_interactive: z.boolean().optional().describe('Non-interactive mode'),
        clear_cache: z.boolean().optional().describe('Clear build cache'),
      },
      async (config) => {
        const result = await triggerEASBuild(config);
        return {
          content: [
            {
              type: 'text',
              text: result.success
                ? JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );

    // eas_build_status
    this.server.tool(
      'eas_build_status',
      'Check status of EAS cloud builds',
      {
        build_id: z.string().optional().describe('Specific build ID to check (or latest builds)'),
        limit: z.number().optional().describe('Number of builds to show (default: 5)'),
      },
      async ({ build_id, limit }) => {
        const result = await getEASBuildStatus(build_id, limit);
        return {
          content: [
            {
              type: 'text',
              text: result.success
                ? JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );

    // eas_submit
    this.server.tool(
      'eas_submit',
      'Submit build to app stores (App Store / Play Store)',
      {
        platform: z.enum(['ios', 'android']).describe('Platform to submit'),
        build_id: z.string().optional().describe('Build ID to submit'),
        profile: z.string().optional().describe('Submit profile from eas.json'),
        latest: z.boolean().optional().describe('Submit latest successful build'),
      },
      async (config) => {
        const result = await submitToStore(config);
        return {
          content: [
            {
              type: 'text',
              text: result.success
                ? JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );
  }

  /**
   * Register Project Management tools (4 tools)
   */
  private registerProjectTools(): void {
    // expo_create_app
    this.server.tool(
      'expo_create_app',
      'Create a new Expo/React Native project with template support',
      {
        project_name: z.string().describe('Name of the new project'),
        template: z.string().optional().describe('Project template (blank, tabs, bare, etc.)'),
        npm: z.boolean().optional().describe('Use npm instead of yarn'),
        install: z.boolean().optional().describe('Install dependencies (default: true)'),
        yes: z.boolean().optional().describe('Skip all prompts (default: false)'),
      },
      async (config) => {
        const result = await createExpoApp(config);
        return {
          content: [
            {
              type: 'text',
              text: result.success
                ? JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );

    // expo_doctor
    this.server.tool(
      'expo_doctor',
      'Diagnose Expo project issues and optionally fix them',
      {
        fix_issues: z.boolean().optional().describe('Automatically fix detected issues'),
      },
      async ({ fix_issues }) => {
        const result = await runExpoDoctor(fix_issues);
        return {
          content: [
            {
              type: 'text',
              text: result.success
                ? JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );

    // expo_install
    this.server.tool(
      'expo_install',
      'Install Expo-compatible packages with version compatibility checks',
      {
        packages: z.array(z.string()).describe('Package names to install'),
        check_compatibility: z.boolean().optional().describe('Check Expo SDK compatibility'),
        fix: z.boolean().optional().describe('Auto-fix dependency conflicts'),
      },
      async (config) => {
        const result = await installExpoPackages(config);
        return {
          content: [
            {
              type: 'text',
              text: result.success
                ? JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );

    // expo_upgrade
    this.server.tool(
      'expo_upgrade',
      'Upgrade Expo SDK and dependencies to newer version',
      {
        target_version: z.string().optional().describe('Target Expo SDK version (or latest)'),
        dry_run: z.boolean().optional().describe('Preview changes without applying'),
        npm: z.boolean().optional().describe('Use npm instead of yarn'),
      },
      async (config) => {
        const result = await upgradeExpoSDK(config);
        return {
          content: [
            {
              type: 'text',
              text: result.success
                ? JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );
  }

  /**
   * Register OTA Update tools (2 tools - EAS Update)
   */
  private registerUpdateTools(): void {
    // eas_update
    this.server.tool(
      'eas_update',
      'Publish over-the-air (OTA) update via EAS Update',
      {
        branch: z.string().describe('Branch name to publish to'),
        message: z.string().describe('Update message/description'),
        rollout_percentage: z
          .number()
          .optional()
          .describe('Gradual rollout percentage 0-100 (default: 100)'),
        runtime_version: z.string().optional().describe('Runtime version constraint'),
        platform: z.enum(['ios', 'android', 'all']).optional().describe('Target platform'),
      },
      async (config) => {
        const result = await publishEASUpdate(config);
        return {
          content: [
            {
              type: 'text',
              text: result.success
                ? JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );

    // eas_update_status
    this.server.tool(
      'eas_update_status',
      'Check status of published OTA updates',
      {
        branch: z.string().optional().describe('Filter by branch name'),
        limit: z.number().optional().describe('Number of updates to show (default: 10)'),
      },
      async ({ branch, limit }) => {
        const result = await getEASUpdateStatus(branch, limit);
        return {
          content: [
            {
              type: 'text',
              text: result.success
                ? JSON.stringify(result.data, null, 2)
                : `Error: ${result.error}`,
            },
          ],
          isError: !result.success,
        };
      }
    );
  }
}
