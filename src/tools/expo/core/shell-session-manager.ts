/**
 * Shell Session Manager
 *
 * Manages persistent interactive shell sessions for Expo dev server and local builds.
 * Handles stdin/stdout/stderr communication, log buffering, and session lifecycle.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger.js';
import {
  Session,
  SessionStatus,
  LogEntry,
  LogLevel,
  ExecuteOptions,
} from '../types.js';
import {
  MAX_LOG_BUFFER_SIZE,
  LOG_TRIM_SIZE,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../constants.js';

/**
 * Manages multiple persistent shell sessions
 */
export class ShellSessionManager extends EventEmitter {
  private sessions: Map<string, Session> = new Map();
  private static instance: ShellSessionManager;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ShellSessionManager {
    if (!ShellSessionManager.instance) {
      ShellSessionManager.instance = new ShellSessionManager();
    }
    return ShellSessionManager.instance;
  }

  /**
   * Start a new persistent shell session
   */
  public startSession(
    id: string,
    command: string[],
    options: ExecuteOptions = {}
  ): {
    success: boolean;
    session?: Session;
    error?: string;
  } {
    // Check if session already exists
    if (this.sessions.has(id)) {
      logger.warn('Session already exists', { sessionId: id });
      return {
        success: false,
        error: ERROR_MESSAGES.SESSION_ALREADY_EXISTS(id),
      };
    }

    try {
      const cwd = options.cwd || process.cwd();
      const env = {
        ...process.env,
        ...options.env,
        // Ensure color output is enabled
        FORCE_COLOR: '1',
        // Disable Expo telemetry for cleaner logs
        EXPO_NO_TELEMETRY: '1',
      };

      logger.info('Starting shell session', {
        sessionId: id,
        command: command.join(' '),
        cwd,
      });

      // Spawn the process with pipes for stdin/stdout/stderr
      const proc = spawn(command[0], command.slice(1), {
        cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false, // Don't use shell to avoid command injection
      });

      // Create session object
      const session: Session = {
        id,
        process: proc,
        command,
        cwd,
        startTime: new Date(),
        logs: [],
        status: 'starting',
        metadata: {},
      };

      // Set up output handlers
      this.setupOutputHandlers(session);

      // Set up error and exit handlers
      this.setupProcessHandlers(session);

      // Store session
      this.sessions.set(id, session);

      // Emit session started event
      this.emit('session:started', { sessionId: id });

      // Update status to running after a short delay
      setTimeout(() => {
        if (this.sessions.has(id)) {
          session.status = 'running';
          this.emit('session:running', { sessionId: id });
        }
      }, 1000);

      return { success: true, session };
    } catch (error) {
      logger.error('Failed to start session', {
        sessionId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send input to a running session's stdin
   */
  public sendInput(
    sessionId: string,
    input: string
  ): { success: boolean; error?: string } {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        success: false,
        error: ERROR_MESSAGES.SESSION_NOT_FOUND(sessionId),
      };
    }

    if (session.status !== 'running') {
      return {
        success: false,
        error: ERROR_MESSAGES.SESSION_NOT_RUNNING(sessionId),
      };
    }

    try {
      // Write to stdin with newline
      session.process.stdin?.write(input + '\n');

      logger.debug('Sent input to session', {
        sessionId,
        input: input.substring(0, 50), // Log only first 50 chars
      });

      this.emit('session:input', { sessionId, input });

      return { success: true };
    } catch (error) {
      logger.error('Failed to send input to session', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Read recent output from session (non-blocking)
   */
  public readOutput(
    sessionId: string,
    tail?: number
  ): {
    success: boolean;
    logs?: LogEntry[];
    status?: SessionStatus;
    error?: string;
  } {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        success: false,
        error: ERROR_MESSAGES.SESSION_NOT_FOUND(sessionId),
      };
    }

    const logs = tail ? session.logs.slice(-tail) : session.logs;

    return {
      success: true,
      logs,
      status: session.status,
    };
  }

  /**
   * Get session status
   */
  public getStatus(sessionId: string): {
    success: boolean;
    status?: SessionStatus;
    uptime?: number;
    log_count?: number;
    error?: string;
  } {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        success: false,
        error: ERROR_MESSAGES.SESSION_NOT_FOUND(sessionId),
      };
    }

    const uptime = Date.now() - session.startTime.getTime();

    return {
      success: true,
      status: session.status,
      uptime,
      log_count: session.logs.length,
    };
  }

  /**
   * Stop a session gracefully
   */
  public stopSession(sessionId: string): { success: boolean; error?: string } {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        success: false,
        error: ERROR_MESSAGES.SESSION_NOT_FOUND(sessionId),
      };
    }

    try {
      logger.info('Stopping session', { sessionId });

      // Try graceful shutdown first (SIGTERM)
      session.process.kill('SIGTERM');

      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (this.sessions.has(sessionId)) {
          session.process.kill('SIGKILL');
        }
      }, 5000);

      // Update status
      session.status = 'stopped';

      // Remove from active sessions after a short delay
      setTimeout(() => {
        this.sessions.delete(sessionId);
        this.emit('session:removed', { sessionId });
      }, 6000);

      this.emit('session:stopped', { sessionId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to stop session', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all active sessions
   */
  public listSessions(): Array<{
    id: string;
    status: SessionStatus;
    uptime: number;
    log_count: number;
  }> {
    return Array.from(this.sessions.values()).map((session) => ({
      id: session.id,
      status: session.status,
      uptime: Date.now() - session.startTime.getTime(),
      log_count: session.logs.length,
    }));
  }

  /**
   * Stop all sessions
   */
  public stopAllSessions(): void {
    const sessionIds = Array.from(this.sessions.keys());
    sessionIds.forEach((id) => this.stopSession(id));
  }

  /**
   * Set up stdout/stderr handlers
   */
  private setupOutputHandlers(session: Session): void {
    // Handle stdout
    session.process.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      const level = this.detectLogLevel(text);
      this.addLog(session, level, text);
    });

    // Handle stderr
    session.process.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      // Expo/Metro outputs some info to stderr, so check content
      const level = this.detectLogLevel(text);
      this.addLog(session, level, text);
    });
  }

  /**
   * Set up process error and exit handlers
   */
  private setupProcessHandlers(session: Session): void {
    session.process.on('error', (error: Error) => {
      logger.error('Session process error', {
        sessionId: session.id,
        error: error.message,
      });
      session.status = 'error';
      this.addLog(session, 'error', `Process error: ${error.message}`);
      this.emit('session:error', { sessionId: session.id, error });
    });

    session.process.on('exit', (code: number | null, signal: string | null) => {
      logger.info('Session process exited', {
        sessionId: session.id,
        code,
        signal,
      });
      session.status = 'stopped';
      const message = signal
        ? `Process killed by signal ${signal}`
        : `Process exited with code ${code}`;
      this.addLog(session, 'info', message);
      this.emit('session:exit', { sessionId: session.id, code, signal });
    });
  }

  /**
   * Add log entry to session
   */
  private addLog(session: Session, level: LogLevel, message: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message: message.trim(),
      raw: message,
    };

    session.logs.push(logEntry);

    // Trim logs if buffer exceeded
    if (session.logs.length > MAX_LOG_BUFFER_SIZE) {
      session.logs = session.logs.slice(-LOG_TRIM_SIZE);
      logger.debug('Trimmed session logs', {
        sessionId: session.id,
        from: MAX_LOG_BUFFER_SIZE,
        to: LOG_TRIM_SIZE,
      });
    }

    // Emit log event
    this.emit('session:log', {
      sessionId: session.id,
      log: logEntry,
    });
  }

  /**
   * Detect log level from content
   */
  private detectLogLevel(text: string): LogLevel {
    const lower = text.toLowerCase();
    if (lower.includes('error') || lower.includes('fatal')) {
      return 'error';
    }
    if (lower.includes('warn') || lower.includes('warning')) {
      return 'warn';
    }
    if (lower.includes('debug')) {
      return 'debug';
    }
    return 'info';
  }
}

// Export singleton instance
export const sessionManager = ShellSessionManager.getInstance();
