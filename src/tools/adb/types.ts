/**
 * ADB Tools Type Definitions
 * @module tools/adb/types
 */

/**
 * Device state as reported by ADB
 */
export type DeviceState = 'device' | 'offline' | 'unauthorized' | 'bootloader' | 'recovery';

/**
 * Screenshot format
 */
export type ScreenshotFormat = 'png' | 'jpg';

/**
 * Logcat priority levels
 */
export type LogcatPriority = 'V' | 'D' | 'I' | 'W' | 'E' | 'F' | 'S';

/**
 * Android device information
 */
export interface DeviceInfo {
  id: string;
  state: DeviceState;
  model?: string;
  manufacturer?: string;
  android_version?: string;
  api_level?: number;
  architecture?: string;
  brand?: string;
  product?: string;
  device?: string;
}

/**
 * Screenshot metadata
 */
export interface ScreenshotMetadata {
  timestamp: string;
  device_id: string;
  device_model?: string;
  app_package?: string;
  app_activity?: string;
  screen_density?: number;
  screen_resolution?: string;
  orientation?: 'portrait' | 'landscape';
  battery_level?: number;
  memory_available?: number;
}

/**
 * Screenshot comparison result
 */
export interface ScreenshotComparisonResult {
  identical: boolean;
  diff_percentage: number;
  diff_pixels: number;
  total_pixels: number;
  diff_image_path?: string;
  baseline_path: string;
  current_path: string;
  metadata: {
    baseline: ScreenshotMetadata;
    current: ScreenshotMetadata;
  };
}

/**
 * Visual regression test result
 */
export interface VisualRegressionResult {
  test_name: string;
  passed: boolean;
  threshold_percentage: number;
  actual_diff_percentage: number;
  comparison: ScreenshotComparisonResult;
  timestamp: string;
}

/**
 * Logcat entry
 */
export interface LogcatEntry {
  timestamp: string;
  pid: number;
  tid: number;
  priority: LogcatPriority;
  tag: string;
  message: string;
}

/**
 * Package information
 */
export interface PackageInfo {
  package_name: string;
  version_code: number;
  version_name: string;
  install_location: string;
  data_directory: string;
  apk_path: string;
  uid: number;
}

/**
 * ADB command execution options
 */
export interface ADBCommandOptions {
  device_id?: string;
  timeout?: number;
  throw_on_error?: boolean;
}

/**
 * Screenshot capture options
 */
export interface ScreenshotOptions {
  device_id?: string;
  output_path?: string;
  filename?: string;
  format?: ScreenshotFormat;
  capture_metadata?: boolean;
  auto_organize?: boolean;
  app_package?: string;
}

/**
 * Screenshot comparison options
 */
export interface ScreenshotComparisonOptions {
  threshold?: number;
  generate_diff?: boolean;
  diff_output_path?: string;
  highlight_color?: [number, number, number];
}

/**
 * Batch screenshot options
 */
export interface BatchScreenshotOptions {
  device_id?: string;
  output_dir?: string;
  count: number;
  interval?: number;
  format?: ScreenshotFormat;
  prefix?: string;
}

/**
 * Screenshot annotation options
 */
export interface ScreenshotAnnotationOptions {
  annotations: Array<{
    type: 'text' | 'arrow' | 'box' | 'circle';
    position: { x: number; y: number };
    text?: string;
    color?: string;
    size?: number;
  }>;
  output_path?: string;
}

/**
 * Port forwarding configuration
 */
export interface PortForwardConfig {
  local_port: number;
  remote_port: number;
  protocol?: 'tcp' | 'udp';
}

/**
 * Logcat filter options
 */
export interface LogcatFilterOptions {
  device_id?: string;
  tags?: string[];
  priority?: LogcatPriority;
  filter_spec?: string;
  format?: 'brief' | 'process' | 'tag' | 'raw' | 'time' | 'threadtime' | 'long';
  max_count?: number;
  grep?: string;
}

/**
 * Screen recording options
 */
export interface ScreenRecordOptions {
  device_id?: string;
  output_path?: string;
  duration?: number;
  bit_rate?: number;
  size?: string;
  show_touches?: boolean;
  rotate?: boolean;
}

/**
 * ADB execution result
 */
export interface ADBExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
  duration_ms: number;
}
