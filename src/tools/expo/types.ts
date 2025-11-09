/**
 * Expo Tools Type Definitions
 *
 * Comprehensive TypeScript types for Expo CLI integration
 */

import { ChildProcess } from 'child_process';

// ============================================================================
// Session Management Types
// ============================================================================

export interface Session {
  id: string;
  process: ChildProcess;
  command: string[];
  cwd: string;
  startTime: Date;
  logs: LogEntry[];
  status: SessionStatus;
  metadata?: Record<string, unknown>;
}

export type SessionStatus = 'starting' | 'running' | 'stopped' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  raw: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// ============================================================================
// Command Execution Types
// ============================================================================

export interface ExecuteOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number; // milliseconds
  input?: string; // stdin input
}

export interface ExecuteResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

// ============================================================================
// QR Code Types
// ============================================================================

export type QRFormat = 'terminal' | 'svg' | 'png' | 'url';

export interface QRCodeResult {
  format: QRFormat;
  data: string; // ASCII art, base64, SVG string, or URL
  url: string; // Original URL
}

// ============================================================================
// Dev Server Types
// ============================================================================

export interface DevServerConfig {
  platform?: 'ios' | 'android' | 'web' | 'all';
  clear_cache?: boolean;
  port?: number;
  qr_format?: QRFormat;
  offline?: boolean;
}

export interface DevServerResult {
  session_id: string;
  qr_code: string;
  url: string;
  status: SessionStatus;
  platform: string;
  port?: number;
}

export type DevCommand =
  | 'reload'
  | 'clear_cache'
  | 'toggle_inspector'
  | 'toggle_performance_monitor'
  | 'custom';

export interface DevCommandInput {
  session_id: string;
  command: DevCommand;
  custom_input?: string;
}

export interface DevReadInput {
  session_id: string;
  tail?: number;
}

export interface DevReadResult {
  logs: LogEntry[];
  status: SessionStatus;
  total_lines: number;
}

// ============================================================================
// Local Build Types
// ============================================================================

export interface LocalBuildConfig {
  platform: 'ios' | 'android';
  device?: string; // Device name, ID, or 'simulator'
  variant?: 'debug' | 'release';
  clean?: boolean;
}

export interface LocalBuildResult {
  session_id: string;
  status: 'building' | 'success' | 'failed' | 'error';
  message: string;
  platform: string;
}

export interface LocalBuildReadResult {
  logs: string[];
  progress?: number; // 0-100 if detectable
  status: 'building' | 'success' | 'failed' | 'cancelled';
  errors?: string[];
}

// ============================================================================
// Cloud Build Types (EAS)
// ============================================================================

export interface EASBuildConfig {
  platform: 'ios' | 'android' | 'all';
  profile?: string; // build profile from eas.json
  wait?: boolean; // Wait for completion
  non_interactive?: boolean;
  clear_cache?: boolean;
}

export interface EASBuildResult {
  build_id: string | string[]; // Array if platform='all'
  status: BuildStatus;
  url: string;
  logs_url?: string;
  platform: string;
}

export type BuildStatus =
  | 'pending'
  | 'in-queue'
  | 'in-progress'
  | 'finished'
  | 'errored'
  | 'canceled';

export interface BuildInfo {
  id: string;
  status: BuildStatus;
  platform: string;
  created_at: string;
  completed_at?: string;
  app_version?: string;
  sdk_version?: string;
}

export interface EASBuildStatusResult {
  builds: BuildInfo[];
  total: number;
}

export interface EASSubmitConfig {
  platform: 'ios' | 'android';
  build_id?: string;
  profile?: string;
  latest?: boolean; // Use latest successful build
}

export interface EASSubmitResult {
  submission_id: string;
  status: string;
  message: string;
  platform: string;
}

// ============================================================================
// Project Management Types
// ============================================================================

export interface ExpoDoctorResult {
  issues: DoctorIssue[];
  summary: string;
  healthy: boolean;
}

export interface DoctorIssue {
  severity: 'info' | 'warning' | 'error';
  description: string;
  fix?: string;
  auto_fixable?: boolean;
}

export interface ExpoInstallConfig {
  packages: string[];
  check_compatibility?: boolean;
  fix?: boolean; // Auto-fix dependency conflicts
}

export interface ExpoInstallResult {
  installed: string[];
  failed: string[];
  warnings: string[];
  message: string;
}

export interface ExpoCreateConfig {
  project_name: string;
  template?: string; // blank, tabs, bare, etc.
  npm?: boolean; // Use npm instead of yarn
  install?: boolean; // Install dependencies (default: true)
  yes?: boolean; // Skip all prompts (default: false)
}

export interface ExpoCreateResult {
  project_name: string;
  project_path: string;
  template: string;
  sdk_version: string;
  installed: boolean;
  next_steps: string[];
}

export interface ExpoUpgradeConfig {
  target_version?: string;
  dry_run?: boolean;
  npm?: boolean; // Use npm instead of yarn
}

export interface ExpoUpgradeResult {
  current_version: string;
  target_version: string;
  changes: PackageChange[];
  breaking_changes?: string[];
  applied: boolean;
}

export interface PackageChange {
  package: string;
  from: string;
  to: string;
  breaking?: boolean;
}

// ============================================================================
// OTA Update Types (EAS Update)
// ============================================================================

export interface EASUpdateConfig {
  branch: string;
  message: string;
  rollout_percentage?: number; // 0-100 for gradual rollout
  runtime_version?: string;
  platform?: 'ios' | 'android' | 'all';
}

export interface EASUpdateResult {
  update_id: string;
  group_id: string;
  runtime_version: string;
  message: string;
  branch: string;
  rollout_percentage: number;
}

export interface UpdateInfo {
  id: string;
  branch: string;
  message: string;
  created_at: string;
  rollout_percentage: number;
  runtime_version: string;
  platform: string;
}

export interface EASUpdateStatusResult {
  updates: UpdateInfo[];
  branch?: string;
  total: number;
}

// ============================================================================
// Log Parser Types
// ============================================================================

export interface ParsedLog {
  type: 'metro' | 'native' | 'expo' | 'generic';
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface MetroProgress {
  completed: number;
  total: number;
  percentage: number;
  message: string;
}

export interface BuildProgress {
  stage: string;
  percentage?: number;
  message: string;
}

export interface ExtractedURL {
  url: string;
  type: 'expo' | 'metro' | 'dev-server';
  qr_compatible: boolean;
}
