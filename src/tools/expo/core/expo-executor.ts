/**
 * Expo Command Executor
 *
 * Executes one-shot Expo and EAS CLI commands with proper sanitization,
 * timeout handling, and environment variable management.
 */

import { spawn } from 'child_process';
import { logger } from '../../../utils/logger.js';
import { ExecuteOptions, ExecuteResult } from '../types.js';
import {
  EXPO_CLI,
  EXPO_COMMAND,
  EAS_COMMAND,
  TIMEOUTS,
  DANGEROUS_CHARS,
  PACKAGE_NAME_REGEX,
  ERROR_MESSAGES,
  ENV_VARS,
} from '../constants.js';

/**
 * Executes Expo/EAS CLI commands with security and error handling
 */
export class ExpoExecutor {
  private static instance: ExpoExecutor;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ExpoExecutor {
    if (!ExpoExecutor.instance) {
      ExpoExecutor.instance = new ExpoExecutor();
    }
    return ExpoExecutor.instance;
  }

  /**
   * Execute an Expo CLI command
   */
  public async executeExpo(
    args: string[],
    options: ExecuteOptions = {}
  ): Promise<ExecuteResult> {
    return this.execute([EXPO_CLI, EXPO_COMMAND, ...args], options);
  }

  /**
   * Execute an EAS CLI command
   */
  public async executeEAS(
    args: string[],
    options: ExecuteOptions = {}
  ): Promise<ExecuteResult> {
    return this.execute([EXPO_CLI, EAS_COMMAND, ...args], options);
  }

  /**
   * Execute a generic command with full control
   */
  public async execute(
    command: string[],
    options: ExecuteOptions = {}
  ): Promise<ExecuteResult> {
    const cwd = options.cwd || process.cwd();
    const timeout = options.timeout || TIMEOUTS.DEFAULT;

    // Sanitize command arguments
    const sanitizedCommand = this.sanitizeCommand(command);

    logger.info('Executing command', {
      command: sanitizedCommand.join(' '),
      cwd,
      timeout,
    });

    return new Promise((resolve) => {
      try {
        const env = this.prepareEnvironment(options.env);

        const proc = spawn(sanitizedCommand[0], sanitizedCommand.slice(1), {
          cwd,
          env,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: false, // Critical: no shell to prevent injection
        });

        let stdout = '';
        let stderr = '';
        let timeoutId: NodeJS.Timeout | null = null;
        let isTimedOut = false;

        // Set up timeout
        if (timeout > 0) {
          timeoutId = setTimeout(() => {
            isTimedOut = true;
            proc.kill('SIGTERM');
            setTimeout(() => {
              if (!proc.killed) {
                proc.kill('SIGKILL');
              }
            }, 2000);
          }, timeout);
        }

        // Capture stdout
        proc.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        // Capture stderr
        proc.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        // Handle stdin if provided
        if (options.input) {
          proc.stdin.write(options.input);
          proc.stdin.end();
        }

        // Handle process exit
        proc.on('close', (code: number | null) => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          if (isTimedOut) {
            logger.warn('Command timed out', {
              command: sanitizedCommand.join(' '),
              timeout,
            });
            resolve({
              success: false,
              stdout,
              stderr,
              exitCode: null,
              error: ERROR_MESSAGES.COMMAND_TIMEOUT(timeout),
            });
            return;
          }

          const success = code === 0;

          if (!success) {
            logger.warn('Command failed', {
              command: sanitizedCommand.join(' '),
              exitCode: code,
              stderr: stderr.substring(0, 200),
            });
          } else {
            logger.info('Command completed successfully', {
              command: sanitizedCommand.join(' '),
            });
          }

          resolve({
            success,
            stdout,
            stderr,
            exitCode: code,
          });
        });

        // Handle process errors
        proc.on('error', (error: Error) => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          logger.error('Command process error', {
            command: sanitizedCommand.join(' '),
            error: error.message,
          });

          resolve({
            success: false,
            stdout,
            stderr,
            exitCode: null,
            error: error.message,
          });
        });
      } catch (error) {
        logger.error('Failed to execute command', {
          command: command.join(' '),
          error: error instanceof Error ? error.message : String(error),
        });

        resolve({
          success: false,
          stdout: '',
          stderr: '',
          exitCode: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Sanitize command to prevent injection attacks
   */
  private sanitizeCommand(command: string[]): string[] {
    return command.map((arg) => {
      // Remove dangerous characters
      return arg.replace(DANGEROUS_CHARS, '');
    });
  }

  /**
   * Validate package name
   */
  public validatePackageName(name: string): boolean {
    return PACKAGE_NAME_REGEX.test(name);
  }

  /**
   * Sanitize package names
   */
  public sanitizePackageNames(packages: string[]): {
    valid: string[];
    invalid: string[];
  } {
    const valid: string[] = [];
    const invalid: string[] = [];

    packages.forEach((pkg) => {
      if (this.validatePackageName(pkg)) {
        valid.push(pkg);
      } else {
        invalid.push(pkg);
      }
    });

    return { valid, invalid };
  }

  /**
   * Prepare environment variables
   */
  private prepareEnvironment(
    customEnv?: Record<string, string>
  ): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      // Force color output
      FORCE_COLOR: '1',
      // Disable Expo telemetry
      [ENV_VARS.EXPO_NO_TELEMETRY]: '1',
      // Disable redirects for automation
      [ENV_VARS.EXPO_NO_REDIRECT]: '1',
    };

    // Add Expo/EAS tokens from environment if available
    if (process.env[ENV_VARS.EXPO_TOKEN]) {
      env[ENV_VARS.EXPO_TOKEN] = process.env[ENV_VARS.EXPO_TOKEN];
    }

    if (process.env[ENV_VARS.EAS_TOKEN]) {
      env[ENV_VARS.EAS_TOKEN] = process.env[ENV_VARS.EAS_TOKEN];
    }

    // Merge custom environment variables
    if (customEnv) {
      Object.assign(env, customEnv);
    }

    return env;
  }

  /**
   * Check if Expo CLI is available
   */
  public async checkExpoInstalled(): Promise<boolean> {
    try {
      const result = await this.execute([EXPO_CLI, EXPO_COMMAND, '--version'], {
        timeout: 5000,
      });
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Check if EAS CLI is available
   */
  public async checkEASInstalled(): Promise<boolean> {
    try {
      const result = await this.execute([EXPO_CLI, 'eas', '--version'], {
        timeout: 5000,
      });
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get Expo CLI version
   */
  public async getExpoVersion(): Promise<string | null> {
    try {
      const result = await this.execute([EXPO_CLI, EXPO_COMMAND, '--version'], {
        timeout: 5000,
      });
      if (result.success) {
        return result.stdout.trim();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get EAS CLI version
   */
  public async getEASVersion(): Promise<string | null> {
    try {
      const result = await this.execute([EXPO_CLI, 'eas', '--version'], {
        timeout: 5000,
      });
      if (result.success) {
        return result.stdout.trim();
      }
      return null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const expoExecutor = ExpoExecutor.getInstance();
