/**
 * Performance monitoring utility for tracking operation timing and resource usage
 */

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  memoryUsed?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceSummary {
  operation: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  lastExecuted: number;
}

/**
 * Performance monitor for tracking operation metrics
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics: number;
  private enabled: boolean;

  constructor(maxMetrics = 1000, enabled = true) {
    this.maxMetrics = maxMetrics;
    this.enabled = enabled;
  }

  /**
   * Record a performance metric
   */
  record(metric: PerformanceMetrics): void {
    if (!this.enabled) return;

    this.metrics.push(metric);

    // Trim old metrics if exceeding max
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific operation
   */
  getOperationMetrics(operation: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.operation === operation);
  }

  /**
   * Get summary statistics for an operation
   */
  getSummary(operation: string): PerformanceSummary | null {
    const metrics = this.getOperationMetrics(operation);
    if (metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration);
    const successful = metrics.filter(m => m.success).length;

    return {
      operation,
      count: metrics.length,
      totalDuration: durations.reduce((a, b) => a + b, 0),
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: successful / metrics.length,
      lastExecuted: metrics[metrics.length - 1].timestamp,
    };
  }

  /**
   * Get summaries for all operations
   */
  getAllSummaries(): PerformanceSummary[] {
    const operations = new Set(this.metrics.map(m => m.operation));
    return Array.from(operations)
      .map(op => this.getSummary(op))
      .filter((s): s is PerformanceSummary => s !== null);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get slow operations (above threshold)
   */
  getSlowOperations(thresholdMs: number): PerformanceMetrics[] {
    return this.metrics.filter(m => m.duration > thresholdMs);
  }

  /**
   * Get failed operations
   */
  getFailedOperations(): PerformanceMetrics[] {
    return this.metrics.filter(m => !m.success);
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summaries: this.getAllSummaries(),
      exportedAt: Date.now(),
    }, null, 2);
  }
}

/**
 * Timer for measuring operation duration
 */
export class PerformanceTimer {
  private startTime: number;
  private startMemory?: number;
  private operation: string;
  private monitor: PerformanceMonitor;
  private metadata: Record<string, any>;

  constructor(
    operation: string,
    monitor: PerformanceMonitor,
    metadata: Record<string, any> = {}
  ) {
    this.operation = operation;
    this.monitor = monitor;
    this.metadata = metadata;
    this.startTime = Date.now();

    // Record memory usage if available
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.startMemory = process.memoryUsage().heapUsed;
    }
  }

  /**
   * Stop timer and record metric
   */
  end(success = true, error?: string): number {
    const duration = Date.now() - this.startTime;
    let memoryUsed: number | undefined;

    if (this.startMemory && typeof process !== 'undefined' && process.memoryUsage) {
      memoryUsed = process.memoryUsage().heapUsed - this.startMemory;
    }

    this.monitor.record({
      operation: this.operation,
      duration,
      timestamp: Date.now(),
      memoryUsed,
      success,
      error,
      metadata: this.metadata,
    });

    return duration;
  }
}

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(
  operation: string,
  monitor?: PerformanceMonitor
) {
  const perfMonitor = monitor || globalPerformanceMonitor;

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const timer = new PerformanceTimer(
        `${operation}.${propertyKey}`,
        perfMonitor,
        { args: args.length }
      );

      try {
        const result = await originalMethod.apply(this, args);
        timer.end(true);
        return result;
      } catch (error) {
        timer.end(false, error instanceof Error ? error.message : String(error));
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Measure execution time of a function
 */
export async function measure<T>(
  operation: string,
  fn: () => Promise<T>,
  monitor?: PerformanceMonitor,
  metadata?: Record<string, any>
): Promise<T> {
  const perfMonitor = monitor || globalPerformanceMonitor;
  const timer = new PerformanceTimer(operation, perfMonitor, metadata);

  try {
    const result = await fn();
    timer.end(true);
    return result;
  } catch (error) {
    timer.end(false, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Measure execution time of a sync function
 */
export function measureSync<T>(
  operation: string,
  fn: () => T,
  monitor?: PerformanceMonitor,
  metadata?: Record<string, any>
): T {
  const perfMonitor = monitor || globalPerformanceMonitor;
  const timer = new PerformanceTimer(operation, perfMonitor, metadata);

  try {
    const result = fn();
    timer.end(true);
    return result;
  } catch (error) {
    timer.end(false, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Create a performance report
 */
export function generatePerformanceReport(
  monitor: PerformanceMonitor
): string {
  const summaries = monitor.getAllSummaries();

  if (summaries.length === 0) {
    return 'No performance data available';
  }

  // Sort by total duration (descending)
  summaries.sort((a, b) => b.totalDuration - a.totalDuration);

  let report = '# Performance Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `Total Operations: ${summaries.reduce((sum, s) => sum + s.count, 0)}\n`;
  report += `Unique Operations: ${summaries.length}\n\n`;

  report += `## Top Operations by Total Time\n\n`;
  report += `| Operation | Count | Avg (ms) | Min (ms) | Max (ms) | Success Rate |\n`;
  report += `|-----------|-------|----------|----------|----------|-------------|\n`;

  summaries.slice(0, 10).forEach(s => {
    report += `| ${s.operation} | ${s.count} | ${s.averageDuration.toFixed(2)} | ${s.minDuration.toFixed(2)} | ${s.maxDuration.toFixed(2)} | ${(s.successRate * 100).toFixed(1)}% |\n`;
  });

  // Show slow operations
  const slowOps = monitor.getSlowOperations(1000);
  if (slowOps.length > 0) {
    report += `\n## Slow Operations (>1000ms)\n\n`;
    report += `| Operation | Duration (ms) | Timestamp |\n`;
    report += `|-----------|---------------|----------|\n`;

    slowOps.slice(0, 10).forEach(m => {
      const date = new Date(m.timestamp).toISOString();
      report += `| ${m.operation} | ${m.duration.toFixed(2)} | ${date} |\n`;
    });
  }

  // Show failed operations
  const failedOps = monitor.getFailedOperations();
  if (failedOps.length > 0) {
    report += `\n## Failed Operations\n\n`;
    report += `| Operation | Duration (ms) | Error | Timestamp |\n`;
    report += `|-----------|---------------|-------|----------|\n`;

    failedOps.slice(0, 10).forEach(m => {
      const date = new Date(m.timestamp).toISOString();
      const error = m.error?.substring(0, 50) || 'Unknown';
      report += `| ${m.operation} | ${m.duration.toFixed(2)} | ${error} | ${date} |\n`;
    });
  }

  return report;
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor(1000, true);

// Export performance data on process exit (if available)
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    if (process.env.MCP_PERF_REPORT === 'true') {
      console.log('\n' + generatePerformanceReport(globalPerformanceMonitor));
    }
  });
}
