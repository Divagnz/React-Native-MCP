import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  PerformanceMonitor,
  PerformanceTimer,
  measure,
  measureSync,
  generatePerformanceReport,
} from '../performance';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor(100, true);
  });

  describe('basic operations', () => {
    it('should record metrics', () => {
      monitor.record({
        operation: 'test-op',
        duration: 100,
        timestamp: Date.now(),
        success: true,
      });

      const metrics = monitor.getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].operation).toBe('test-op');
      expect(metrics[0].duration).toBe(100);
    });

    it('should get metrics for specific operation', () => {
      monitor.record({
        operation: 'op1',
        duration: 100,
        timestamp: Date.now(),
        success: true,
      });
      monitor.record({
        operation: 'op2',
        duration: 200,
        timestamp: Date.now(),
        success: true,
      });

      const op1Metrics = monitor.getOperationMetrics('op1');
      expect(op1Metrics.length).toBe(1);
      expect(op1Metrics[0].operation).toBe('op1');
    });

    it('should clear all metrics', () => {
      monitor.record({
        operation: 'test',
        duration: 100,
        timestamp: Date.now(),
        success: true,
      });

      monitor.clear();

      expect(monitor.getMetrics().length).toBe(0);
    });

    it('should respect max metrics limit', () => {
      const smallMonitor = new PerformanceMonitor(2, true);

      smallMonitor.record({
        operation: 'op1',
        duration: 100,
        timestamp: Date.now(),
        success: true,
      });
      smallMonitor.record({
        operation: 'op2',
        duration: 200,
        timestamp: Date.now(),
        success: true,
      });
      smallMonitor.record({
        operation: 'op3',
        duration: 300,
        timestamp: Date.now(),
        success: true,
      });

      const metrics = smallMonitor.getMetrics();
      expect(metrics.length).toBe(2);
      expect(metrics[0].operation).toBe('op2'); // op1 should be evicted
    });
  });

  describe('enable/disable', () => {
    it('should not record when disabled', () => {
      monitor.setEnabled(false);

      monitor.record({
        operation: 'test',
        duration: 100,
        timestamp: Date.now(),
        success: true,
      });

      expect(monitor.getMetrics().length).toBe(0);
    });

    it('should check if enabled', () => {
      expect(monitor.isEnabled()).toBe(true);

      monitor.setEnabled(false);
      expect(monitor.isEnabled()).toBe(false);
    });
  });

  describe('summaries', () => {
    beforeEach(() => {
      // Add some test data
      monitor.record({
        operation: 'op1',
        duration: 100,
        timestamp: Date.now(),
        success: true,
      });
      monitor.record({
        operation: 'op1',
        duration: 200,
        timestamp: Date.now(),
        success: true,
      });
      monitor.record({
        operation: 'op1',
        duration: 300,
        timestamp: Date.now(),
        success: false,
      });
    });

    it('should generate summary for operation', () => {
      const summary = monitor.getSummary('op1');

      expect(summary).toBeDefined();
      expect(summary!.operation).toBe('op1');
      expect(summary!.count).toBe(3);
      expect(summary!.averageDuration).toBe(200);
      expect(summary!.minDuration).toBe(100);
      expect(summary!.maxDuration).toBe(300);
      expect(summary!.successRate).toBeCloseTo(0.667, 2);
    });

    it('should return null for non-existent operation', () => {
      const summary = monitor.getSummary('nonexistent');
      expect(summary).toBeNull();
    });

    it('should get all summaries', () => {
      monitor.record({
        operation: 'op2',
        duration: 150,
        timestamp: Date.now(),
        success: true,
      });

      const summaries = monitor.getAllSummaries();
      expect(summaries.length).toBe(2);
      expect(summaries.some((s) => s.operation === 'op1')).toBe(true);
      expect(summaries.some((s) => s.operation === 'op2')).toBe(true);
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      monitor.record({
        operation: 'fast',
        duration: 50,
        timestamp: Date.now(),
        success: true,
      });
      monitor.record({
        operation: 'slow',
        duration: 1500,
        timestamp: Date.now(),
        success: true,
      });
      monitor.record({
        operation: 'failed',
        duration: 100,
        timestamp: Date.now(),
        success: false,
        error: 'Test error',
      });
    });

    it('should get slow operations', () => {
      const slowOps = monitor.getSlowOperations(1000);
      expect(slowOps.length).toBe(1);
      expect(slowOps[0].operation).toBe('slow');
    });

    it('should get failed operations', () => {
      const failedOps = monitor.getFailedOperations();
      expect(failedOps.length).toBe(1);
      expect(failedOps[0].operation).toBe('failed');
      expect(failedOps[0].error).toBe('Test error');
    });
  });

  describe('export', () => {
    it('should export metrics as JSON', () => {
      monitor.record({
        operation: 'test',
        duration: 100,
        timestamp: Date.now(),
        success: true,
      });

      const exported = monitor.export();
      const data = JSON.parse(exported);

      expect(data.metrics).toBeDefined();
      expect(data.summaries).toBeDefined();
      expect(data.exportedAt).toBeDefined();
      expect(data.metrics.length).toBe(1);
    });
  });
});

describe('PerformanceTimer', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should measure duration', async () => {
    const timer = new PerformanceTimer('test-op', monitor);

    await new Promise((resolve) => setTimeout(resolve, 110));

    const duration = timer.end(true);

    expect(duration).toBeGreaterThanOrEqual(100);
    expect(monitor.getMetrics().length).toBe(1);
  });

  it('should record success status', () => {
    const timer = new PerformanceTimer('test-op', monitor);
    timer.end(true);

    const metrics = monitor.getMetrics();
    expect(metrics[0].success).toBe(true);
  });

  it('should record failure with error', () => {
    const timer = new PerformanceTimer('test-op', monitor);
    timer.end(false, 'Test error');

    const metrics = monitor.getMetrics();
    expect(metrics[0].success).toBe(false);
    expect(metrics[0].error).toBe('Test error');
  });

  it('should record metadata', () => {
    const timer = new PerformanceTimer('test-op', monitor, { userId: 123 });
    timer.end(true);

    const metrics = monitor.getMetrics();
    expect(metrics[0].metadata).toEqual({ userId: 123 });
  });
});

describe('measure helper functions', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('measure (async)', () => {
    it('should measure async function', async () => {
      const result = await measure(
        'test-async',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return 'result';
        },
        monitor
      );

      expect(result).toBe('result');
      const metrics = monitor.getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].operation).toBe('test-async');
      expect(metrics[0].success).toBe(true);
    });

    it('should handle async function errors', async () => {
      await expect(
        measure(
          'test-error',
          async () => {
            throw new Error('Test error');
          },
          monitor
        )
      ).rejects.toThrow('Test error');

      const metrics = monitor.getMetrics();
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].error).toBe('Test error');
    });

    it('should include metadata', async () => {
      await measure('test', async () => 'result', monitor, { custom: 'data' });

      const metrics = monitor.getMetrics();
      expect(metrics[0].metadata).toEqual({ custom: 'data' });
    });
  });

  describe('measureSync', () => {
    it('should measure sync function', () => {
      const result = measureSync(
        'test-sync',
        () => {
          let sum = 0;
          for (let i = 0; i < 1000; i++) {
            sum += i;
          }
          return sum;
        },
        monitor
      );

      expect(result).toBe(499500);
      const metrics = monitor.getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].operation).toBe('test-sync');
    });

    it('should handle sync function errors', () => {
      expect(() =>
        measureSync(
          'test-error',
          () => {
            throw new Error('Sync error');
          },
          monitor
        )
      ).toThrow('Sync error');

      const metrics = monitor.getMetrics();
      expect(metrics[0].success).toBe(false);
    });
  });
});

describe('generatePerformanceReport', () => {
  it('should generate report with metrics', () => {
    const monitor = new PerformanceMonitor();

    monitor.record({
      operation: 'op1',
      duration: 100,
      timestamp: Date.now(),
      success: true,
    });
    monitor.record({
      operation: 'op1',
      duration: 200,
      timestamp: Date.now(),
      success: true,
    });
    monitor.record({
      operation: 'slow-op',
      duration: 1500,
      timestamp: Date.now(),
      success: true,
    });
    monitor.record({
      operation: 'failed-op',
      duration: 50,
      timestamp: Date.now(),
      success: false,
      error: 'Error message',
    });

    const report = generatePerformanceReport(monitor);

    expect(report).toContain('Performance Report');
    expect(report).toContain('Total Operations: 4');
    expect(report).toContain('Unique Operations: 3');
    expect(report).toContain('op1');
    expect(report).toContain('Slow Operations');
    expect(report).toContain('slow-op');
    expect(report).toContain('Failed Operations');
    expect(report).toContain('failed-op');
  });

  it('should handle empty metrics', () => {
    const monitor = new PerformanceMonitor();
    const report = generatePerformanceReport(monitor);

    expect(report).toBe('No performance data available');
  });
});
