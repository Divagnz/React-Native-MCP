/**
 * Expo Doctor Tool
 *
 * Diagnose and optionally fix Expo project issues.
 */

import { logger } from '../../../utils/logger.js';
import { expoExecutor } from '../core/expo-executor.js';
import { ExpoDoctorResult, DoctorIssue } from '../types.js';
import { TIMEOUTS } from '../constants.js';

export async function runExpoDoctor(fixIssues: boolean = false): Promise<{
  success: boolean;
  data?: ExpoDoctorResult;
  error?: string;
}> {
  try {
    logger.info('Running expo doctor', { fixIssues });

    const args = ['doctor'];
    if (fixIssues) args.push('--fix-dependencies');

    const result = await expoExecutor.executeExpo(args, {
      timeout: TIMEOUTS.DEFAULT,
    });

    const issues = parseDoctorOutput(result.stdout + result.stderr);
    const healthy = result.success && issues.length === 0;

    return {
      success: true,
      data: {
        issues,
        summary: generateSummary(issues, healthy),
        healthy,
      },
    };
  } catch (error) {
    logger.error('Error running expo doctor', { error });
    return { success: false, error: String(error) };
  }
}

function parseDoctorOutput(output: string): DoctorIssue[] {
  const issues: DoctorIssue[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (line.includes('✖') || line.includes('error')) {
      issues.push({ severity: 'error', description: line.trim() });
    } else if (line.includes('⚠') || line.includes('warning')) {
      issues.push({ severity: 'warning', description: line.trim() });
    } else if (line.includes('ℹ') || line.includes('info')) {
      issues.push({ severity: 'info', description: line.trim() });
    }
  }

  return issues;
}

function generateSummary(issues: DoctorIssue[], healthy: boolean): string {
  if (healthy) return 'Project is healthy - no issues found';
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  return `Found ${errors} error(s) and ${warnings} warning(s)`;
}
