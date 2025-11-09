/**
 * Expo Create App Tool
 *
 * Initialize new Expo/React Native projects with various templates.
 */

import { logger } from '../../../utils/logger.js';
import { expoExecutor } from '../core/expo-executor.js';
import { ExpoCreateConfig, ExpoCreateResult } from '../types.js';
import { TIMEOUTS } from '../constants.js';

export async function createExpoApp(config: ExpoCreateConfig): Promise<{
  success: boolean;
  data?: ExpoCreateResult;
  error?: string;
}> {
  try {
    const {
      project_name,
      template = 'blank',
      npm = false,
      install = true,
      yes = false,
    } = config;

    logger.info('Creating Expo app', {
      project_name,
      template,
      npm,
    });

    // Use create-expo-app (the official way to create Expo projects)
    const args = [project_name];

    // Add template flag
    if (template && template !== 'blank') {
      args.push('--template', template);
    }

    // Add package manager flag
    if (npm) {
      args.push('--npm');
    }

    // Add no-install flag if specified
    if (!install) {
      args.push('--no-install');
    }

    // Add yes flag to skip prompts
    if (yes) {
      args.push('--yes');
    }

    // Execute using npx create-expo-app
    const result = await expoExecutor.execute(
      ['npx', 'create-expo-app', ...args],
      {
        timeout: TIMEOUTS.UPGRADE, // Use upgrade timeout (5 minutes) for project creation
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.stderr || result.error || 'Failed to create Expo app',
      };
    }

    // Extract project information from output
    const projectPath = extractProjectPath(result.stdout, project_name);
    const sdkVersion = extractSDKVersion(result.stdout);
    const nextSteps = extractNextSteps(result.stdout);

    return {
      success: true,
      data: {
        project_name,
        project_path: projectPath,
        template,
        sdk_version: sdkVersion,
        installed: install,
        next_steps: nextSteps,
      },
    };
  } catch (error) {
    logger.error('Error creating Expo app', { error });
    return { success: false, error: String(error) };
  }
}

function extractProjectPath(output: string, projectName: string): string {
  // Look for "Created a new Expo app at" or similar messages
  const match = output.match(/(?:Created|Initialized).*?(?:at|in)[:\s]+([^\n]+)/i);
  if (match) {
    return match[1].trim();
  }
  // Default to current directory + project name
  return `./${projectName}`;
}

function extractSDKVersion(output: string): string {
  // Look for Expo SDK version mentions
  const match = output.match(/Expo SDK[:\s]+v?(\d+\.\d+\.\d+)/i) ||
                output.match(/expo@(\d+\.\d+\.\d+)/);
  return match ? match[1] : 'unknown';
}

function extractNextSteps(output: string): string[] {
  const steps: string[] = [];
  const lines = output.split('\n');
  let inNextSteps = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect "Next steps" or similar sections
    if (/next steps|to get started|getting started/i.test(trimmed)) {
      inNextSteps = true;
      continue;
    }

    // Collect steps (usually start with > or numbers or bullets)
    if (inNextSteps && (trimmed.startsWith('>') || /^\d+[\.\)]/.test(trimmed) || trimmed.startsWith('-'))) {
      steps.push(trimmed.replace(/^[>\d\.\)\-\s]+/, '').trim());
    }

    // Stop at empty line after we've collected some steps
    if (inNextSteps && steps.length > 0 && !trimmed) {
      break;
    }
  }

  // Default next steps if none found in output
  if (steps.length === 0) {
    steps.push(`cd ${extractProjectPath(output, 'project')}`);
    steps.push('npx expo start');
  }

  return steps;
}
