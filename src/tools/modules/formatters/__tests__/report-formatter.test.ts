import { describe, it, expect } from '@jest/globals';
import { ReportFormatter } from '../report-formatter.js';

describe('ReportFormatter', () => {
  describe('formatCodebaseAnalysis', () => {
    it('should format basic codebase analysis', () => {
      const analysis = {
        totalFiles: 10,
        components: [
          { fileName: 'Component1.tsx', isComponent: true, linesOfCode: 50 },
          { fileName: 'Component2.tsx', isComponent: true, linesOfCode: 75 },
          { fileName: 'utils.ts', isComponent: false, linesOfCode: 30 },
        ],
        issues: ['Issue 1', 'Issue 2'],
        suggestions: ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'],
      };

      const report = ReportFormatter.formatCodebaseAnalysis(analysis, '/test/project');

      expect(report).toContain('React Native Codebase Analysis');
      expect(report).toContain('Total Files Analyzed:** 10');
      expect(report).toContain('Components Found:** 2');
      expect(report).toContain('Issues Found (2)');
      expect(report).toContain('Issue 1');
      expect(report).toContain('Issue 2');
      expect(report).toContain('Suggestions (3)');
      expect(report).toContain('Suggestion 1');
      expect(report).toContain('Component1.tsx (50 lines)');
      expect(report).toContain('Component2.tsx (75 lines)');
      expect(report).toContain('Other Files (1)');
    });

    it('should handle analysis with no issues or suggestions', () => {
      const analysis = {
        totalFiles: 5,
        components: [{ fileName: 'Component.tsx', isComponent: true, linesOfCode: 100 }],
        issues: [],
        suggestions: [],
      };

      const report = ReportFormatter.formatCodebaseAnalysis(analysis, '/test/project');

      expect(report).not.toContain('Issues Found');
      expect(report).not.toContain('Suggestions');
      expect(report).toContain('Components Found:** 1');
    });

    it('should handle analysis with many non-component files', () => {
      const components = [];
      for (let i = 0; i < 15; i++) {
        components.push({ fileName: `file${i}.ts`, isComponent: false, linesOfCode: 20 });
      }

      const analysis = {
        totalFiles: 15,
        components,
        issues: [],
        suggestions: [],
      };

      const report = ReportFormatter.formatCodebaseAnalysis(analysis, '/test/project');

      expect(report).toContain('Other Files (15)');
      expect(report).toContain('... and 5 more files');
    });
  });

  describe('formatPerformanceAnalysis', () => {
    it('should format performance issues with severity grouping', () => {
      const issues = [
        {
          file: 'Component1.tsx',
          issue: 'High severity issue',
          suggestion: 'Fix this',
          severity: 'high',
          type: 'performance',
        },
        {
          file: 'Component2.tsx',
          issue: 'Medium severity issue',
          suggestion: 'Consider this',
          severity: 'medium',
          type: 'performance',
        },
        {
          file: 'Component3.tsx',
          issue: 'Low severity issue',
          suggestion: 'Nice to have',
          severity: 'low',
          type: 'performance',
        },
      ];

      const report = ReportFormatter.formatPerformanceAnalysis(issues, '/test/project');

      expect(report).toContain('React Native Performance Analysis');
      expect(report).toContain('Performance Issues Found:** 3');
      expect(report).toContain('🔴 High Priority Issues (1)');
      expect(report).toContain('Component1.tsx');
      expect(report).toContain('High severity issue');
      expect(report).toContain('🟡 Medium Priority Issues (1)');
      expect(report).toContain('Component2.tsx');
      expect(report).toContain('🟢 Low Priority Optimizations (1)');
      expect(report).toContain('Component3.tsx');
    });

    it('should show success message when no issues found', () => {
      const report = ReportFormatter.formatPerformanceAnalysis([], '/test/project');

      expect(report).toContain('✅ No major performance issues detected!');
      expect(report).toContain('good performance practices');
    });

    it('should show category breakdown for multiple types', () => {
      const issues = [
        {
          file: 'File1.tsx',
          issue: 'Issue 1',
          suggestion: 'Fix 1',
          severity: 'high',
          type: 'list_rendering',
        },
        {
          file: 'File2.tsx',
          issue: 'Issue 2',
          suggestion: 'Fix 2',
          severity: 'high',
          type: 'memory_usage',
        },
        {
          file: 'File3.tsx',
          issue: 'Issue 3',
          suggestion: 'Fix 3',
          severity: 'medium',
          type: 'list_rendering',
        },
      ];

      const report = ReportFormatter.formatPerformanceAnalysis(issues, '/test/project');

      expect(report).toContain('Issues by Category');
      expect(report).toContain('list rendering');
      expect(report).toContain('memory usage');
    });
  });

  describe('formatComprehensiveAnalysis', () => {
    it('should format comprehensive analysis with all categories', () => {
      const analysis = {
        totalFiles: 20,
        security: [
          {
            file: 'Auth.tsx',
            issue: 'Security issue',
            suggestion: 'Fix security',
            severity: 'critical',
            category: 'authentication',
          },
        ],
        performance: [
          {
            file: 'List.tsx',
            issue: 'Performance issue',
            suggestion: 'Optimize',
            severity: 'high',
            category: 'rendering',
          },
        ],
        codeQuality: [
          {
            file: 'Component.tsx',
            issue: 'Quality issue',
            suggestion: 'Improve',
            severity: 'medium',
            category: 'complexity',
          },
        ],
        refactoring: [],
        deprecated: [],
        accessibility: [],
        testing: [],
        upgrades: [],
      };

      const report = ReportFormatter.formatComprehensiveAnalysis(analysis, '/test/project');

      expect(report).toContain('Comprehensive React Native Codebase Analysis');
      expect(report).toContain('📊 Analysis Summary');
      expect(report).toContain('Security Issues:** 1');
      expect(report).toContain('Performance Issues:** 1');
      expect(report).toContain('Code Quality Issues:** 1');
      expect(report).toContain('🚨 Critical & High Priority Issues');
      expect(report).toContain('🛡️ Security Analysis');
      expect(report).toContain('📝 Code Quality');
      expect(report).toContain('🎯 Next Steps');
    });

    it('should show excellent message when no issues found', () => {
      const analysis = {
        totalFiles: 10,
        security: [],
        performance: [],
        codeQuality: [],
        refactoring: [],
        deprecated: [],
        accessibility: [],
        testing: [],
        upgrades: [],
      };

      const report = ReportFormatter.formatComprehensiveAnalysis(analysis, '/test/project');

      expect(report).toContain('✅ **Excellent!**');
      expect(report).toContain('best practices');
    });

    it('should format deprecated features section', () => {
      const analysis = {
        totalFiles: 5,
        security: [],
        performance: [],
        codeQuality: [],
        refactoring: [],
        deprecated: [
          {
            file: 'OldComponent.tsx',
            issue: 'Using deprecated API',
            suggestion: 'Migrate to new API',
            severity: 'high',
          },
        ],
        accessibility: [],
        testing: [],
        upgrades: [],
      };

      const report = ReportFormatter.formatComprehensiveAnalysis(analysis, '/test/project');

      expect(report).toContain('⚠️ Deprecated Features');
      expect(report).toContain('OldComponent.tsx');
      expect(report).toContain('Using deprecated API');
    });

    it('should format accessibility section', () => {
      const analysis = {
        totalFiles: 5,
        security: [],
        performance: [],
        codeQuality: [],
        refactoring: [],
        deprecated: [],
        accessibility: [
          {
            file: 'Button.tsx',
            issue: 'Missing accessibility label',
            suggestion: 'Add accessibilityLabel',
            severity: 'medium',
          },
        ],
        testing: [],
        upgrades: [],
      };

      const report = ReportFormatter.formatComprehensiveAnalysis(analysis, '/test/project');

      expect(report).toContain('♿ Accessibility Improvements');
      expect(report).toContain('Button.tsx');
      expect(report).toContain('Missing accessibility label');
    });

    it('should format testing section', () => {
      const analysis = {
        totalFiles: 5,
        security: [],
        performance: [],
        codeQuality: [],
        refactoring: [],
        deprecated: [],
        accessibility: [],
        testing: [
          {
            file: 'Component.tsx',
            issue: 'Missing test coverage',
            suggestion: 'Add unit tests',
            severity: 'low',
          },
        ],
        upgrades: [],
      };

      const report = ReportFormatter.formatComprehensiveAnalysis(analysis, '/test/project');

      expect(report).toContain('🧪 Testing Recommendations');
      expect(report).toContain('Component.tsx');
      expect(report).toContain('Missing test coverage');
    });

    it('should format upgrades section', () => {
      const analysis = {
        totalFiles: 5,
        security: [],
        performance: [],
        codeQuality: [],
        refactoring: [],
        deprecated: [],
        accessibility: [],
        testing: [],
        upgrades: [
          {
            file: 'package.json',
            issue: 'Outdated React Native version',
            suggestion: 'Upgrade to latest version',
            severity: 'high',
          },
        ],
      };

      const report = ReportFormatter.formatComprehensiveAnalysis(analysis, '/test/project');

      expect(report).toContain('📦 Package & Version Upgrades');
      expect(report).toContain('package.json');
      expect(report).toContain('Outdated React Native version');
    });

    it('should show severity emojis correctly', () => {
      const analysis = {
        totalFiles: 5,
        security: [
          {
            file: 'Critical.tsx',
            issue: 'Critical issue',
            suggestion: 'Fix now',
            severity: 'critical',
            category: 'auth',
          },
          {
            file: 'High.tsx',
            issue: 'High issue',
            suggestion: 'Fix soon',
            severity: 'high',
            category: 'data',
          },
          {
            file: 'Medium.tsx',
            issue: 'Medium issue',
            suggestion: 'Fix later',
            severity: 'medium',
            category: 'logging',
          },
        ],
        performance: [],
        codeQuality: [],
        refactoring: [],
        deprecated: [],
        accessibility: [],
        testing: [],
        upgrades: [],
      };

      const report = ReportFormatter.formatComprehensiveAnalysis(analysis, '/test/project');

      expect(report).toContain('🔴');
      expect(report).toContain('🟠');
      expect(report).toContain('🟡');
    });
  });
});
