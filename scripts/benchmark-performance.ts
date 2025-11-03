#!/usr/bin/env ts-node
/**
 * Performance Benchmark Script
 * Measures performance improvements from Phase 5 optimizations
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileAnalysisService } from '../src/tools/modules/services/file-analysis-service';
import { ComponentAnalyzer } from '../src/tools/modules/analysis/component-analyzer';
import { PackageUpgradesAnalyzer } from '../src/tools/modules/analysis/package-upgrades-analyzer';
import { CacheManager } from '../src/utils/cache';
import { globalPerformanceMonitor, generatePerformanceReport } from '../src/utils/performance';

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  cacheHitRate?: number;
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  /**
   * Benchmark file analysis performance
   */
  async benchmarkFileAnalysis(iterations: number = 100): Promise<void> {
    console.log(`\n🔍 Benchmarking File Analysis (${iterations} iterations)...`);

    // Sample React Native component code
    const sampleCode = `
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView } from 'react-native';

export const MyComponent = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const handlePress = () => {
    console.log('pressed');
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data}
        renderItem={({ item }) => <Text>{item}</Text>}
      />
      <ScrollView>
        {data.map((item, index) => (
          <Text key={index}>{item}</Text>
        ))}
      </ScrollView>
    </View>
  );
};
`;

    const filePath = 'src/components/TestComponent.tsx';

    // Clear cache before benchmark
    CacheManager.clearAll();

    const times: number[] = [];

    // First run (cold cache)
    const coldStart = Date.now();
    FileAnalysisService.analyzeFileContent(sampleCode, filePath);
    const coldTime = Date.now() - coldStart;
    console.log(`  Cold cache: ${coldTime}ms`);

    // Warm cache runs
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      FileAnalysisService.analyzeFileContent(sampleCode, filePath);
      times.push(Date.now() - start);
    }

    const totalTime = times.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`  Warm cache average: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min: ${minTime}ms, Max: ${maxTime}ms`);
    console.log(`  Speed improvement: ${(coldTime / avgTime).toFixed(1)}x faster`);

    this.results.push({
      operation: 'File Analysis',
      iterations,
      totalTime,
      averageTime: avgTime,
      minTime,
      maxTime,
    });
  }

  /**
   * Benchmark component analysis performance
   */
  async benchmarkComponentAnalysis(iterations: number = 100): Promise<void> {
    console.log(`\n🧩 Benchmarking Component Analysis (${iterations} iterations)...`);

    const sampleCode = `
import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

const Button = ({ title, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 10 }}>
      <Text style={{ color: 'blue' }}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button;
`;

    CacheManager.clearAll();

    const times: number[] = [];

    // First run (cold cache)
    const coldStart = Date.now();
    ComponentAnalyzer.analyzeComponent(sampleCode);
    const coldTime = Date.now() - coldStart;
    console.log(`  Cold cache: ${coldTime}ms`);

    // Warm cache runs
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      ComponentAnalyzer.analyzeComponent(sampleCode);
      times.push(Date.now() - start);
    }

    const totalTime = times.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`  Warm cache average: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min: ${minTime}ms, Max: ${maxTime}ms`);
    console.log(`  Speed improvement: ${(coldTime / avgTime).toFixed(1)}x faster`);

    this.results.push({
      operation: 'Component Analysis',
      iterations,
      totalTime,
      averageTime: avgTime,
      minTime,
      maxTime,
    });
  }

  /**
   * Benchmark package upgrades analysis
   */
  async benchmarkPackageAnalysis(iterations: number = 100): Promise<void> {
    console.log(`\n📦 Benchmarking Package Analysis (${iterations} iterations)...`);

    const samplePackageJson = {
      dependencies: {
        'react': '^18.2.0',
        'react-native': '0.71.0',
        'lodash': '4.17.20',
        'axios': '1.4.0',
      },
      devDependencies: {
        'typescript': '4.9.0',
        '@types/react': '18.0.0',
      },
    };

    CacheManager.clearAll();

    const times: number[] = [];

    // First run (cold cache)
    const coldStart = Date.now();
    PackageUpgradesAnalyzer.analyzePackageUpgrades(samplePackageJson);
    const coldTime = Date.now() - coldStart;
    console.log(`  Cold cache: ${coldTime}ms`);

    // Warm cache runs
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      PackageUpgradesAnalyzer.analyzePackageUpgrades(samplePackageJson);
      times.push(Date.now() - start);
    }

    const totalTime = times.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`  Warm cache average: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min: ${minTime}ms, Max: ${maxTime}ms`);
    console.log(`  Speed improvement: ${(coldTime / avgTime).toFixed(1)}x faster`);

    this.results.push({
      operation: 'Package Analysis',
      iterations,
      totalTime,
      averageTime: avgTime,
      minTime,
      maxTime,
    });
  }

  /**
   * Display cache statistics
   */
  displayCacheStats(): void {
    console.log('\n📊 Cache Statistics:');
    console.log('==================');

    const stats = CacheManager.getAllStats();
    Object.entries(stats).forEach(([name, stat]) => {
      console.log(`\n${name}:`);
      console.log(`  Size: ${stat.size} entries`);
      console.log(`  Hits: ${stat.hits}`);
      console.log(`  Misses: ${stat.misses}`);
      console.log(`  Hit Rate: ${(stat.hitRate * 100).toFixed(1)}%`);
      console.log(`  Evictions: ${stat.evictions}`);
    });
  }

  /**
   * Display performance monitoring report
   */
  displayPerformanceReport(): void {
    console.log('\n⚡ Performance Monitoring Report:');
    console.log('=================================');
    console.log(generatePerformanceReport(globalPerformanceMonitor));
  }

  /**
   * Generate summary report
   */
  generateSummaryReport(): void {
    console.log('\n📈 Benchmark Summary:');
    console.log('====================\n');

    const table = this.results.map(r => ({
      Operation: r.operation,
      'Iterations': r.iterations,
      'Avg Time (ms)': r.averageTime.toFixed(2),
      'Min (ms)': r.minTime.toFixed(2),
      'Max (ms)': r.maxTime.toFixed(2),
    }));

    console.table(table);

    // Calculate overall improvement
    const totalIterations = this.results.reduce((sum, r) => sum + r.iterations, 0);
    const totalTime = this.results.reduce((sum, r) => sum + r.totalTime, 0);
    const overallAverage = totalTime / totalIterations;

    console.log(`\n✅ Overall Performance:`);
    console.log(`   Total operations: ${totalIterations}`);
    console.log(`   Average time per operation: ${overallAverage.toFixed(2)}ms`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
  }

  /**
   * Run all benchmarks
   */
  async runAll(): Promise<void> {
    console.log('🚀 Starting Performance Benchmarks');
    console.log('==================================');

    await this.benchmarkFileAnalysis(100);
    await this.benchmarkComponentAnalysis(100);
    await this.benchmarkPackageAnalysis(100);

    this.generateSummaryReport();
    this.displayCacheStats();
  }
}

// Run benchmarks
const benchmark = new PerformanceBenchmark();
benchmark.runAll().catch(console.error);
