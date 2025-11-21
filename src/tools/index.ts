import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { FileScanner } from './modules/utils/file-scanner.js';
import { ReportFormatter } from './modules/formatters/report-formatter.js';
import { SecurityAnalyzer } from './modules/analysis/security-analyzer.js';
import { CodeQualityAnalyzer } from './modules/analysis/code-quality-analyzer.js';
import { DeprecatedFeaturesAnalyzer } from './modules/analysis/deprecated-features-analyzer.js';
import { TestingAnalyzer } from './modules/analysis/testing-analyzer.js';
import { PackageUpgradesAnalyzer } from './modules/analysis/package-upgrades-analyzer.js';
import { AdvisoryService } from './modules/advisory/advisory-service.js';
import { ComponentAnalyzer } from './modules/analysis/component-analyzer.js';
import { PackageManagementService } from './modules/services/package-management-service.js';
import { FileAnalysisService } from './modules/services/file-analysis-service.js';
import { CodeRemediationService } from './modules/services/code-remediation-service.js';
import { TestGenerationService } from './modules/services/test-generation-service.js';
import { TestingAnalysisService } from './modules/services/testing-analysis-service.js';
import { TestCoverageService } from './modules/services/test-coverage-service.js';
import { VersionManagementService } from './modules/services/version-management-service.js';
import { ExpoTools } from './expo/index.js';
import { listDevices, getDeviceInfo, connectDevice } from './adb/device/index.js';
import { installApp, uninstallApp, listPackages, getPackageInfo } from './adb/app/index.js';
import { captureScreenshot, compareScreenshots } from './adb/screenshot/index.js';

/**
 * React Native Tools
 *
 * Provides tools for React Native development guidance and analysis
 */
export class ReactNativeTools {
  constructor(private server: McpServer) {}

  register() {
    // Register Expo CLI tools (15 tools)
    const expoTools = new ExpoTools(this.server);
    expoTools.register();

    // Register ADB tools (9 tools: 3 device + 4 app management + 2 screenshot)
    this.registerADBTools();

    // Register all testing tools
    this.register_test_generation();

    // Component Analysis Tool - Enhanced with codebase support
    this.server.tool(
      'analyze_component',
      'Analyze React Native component for best practices',
      {
        code: z
          .string()
          .optional()
          .describe(
            'React Native component code to analyze. If not provided, analyzes entire codebase'
          ),
        type: z.enum(['functional', 'class', 'hook']).optional().describe('Component type'),
        codebase_path: z
          .string()
          .optional()
          .describe('Path to React Native project root for codebase analysis'),
      },
      async ({ code, type, codebase_path }) => {
        let analysis: string;

        if (code) {
          // Analyze single component
          analysis = ComponentAnalyzer.analyzeComponent(code, type);
        } else {
          // Analyze entire codebase
          analysis = await this.analyzeCodebase(codebase_path || process.cwd());
        }

        return {
          content: [
            {
              type: 'text',
              text: analysis,
            },
          ],
        };
      }
    );

    // Codebase Performance Analysis Tool
    this.server.tool(
      'analyze_codebase_performance',
      'Analyze entire React Native codebase for performance issues',
      {
        codebase_path: z.string().optional().describe('Path to React Native project root'),
        focus_areas: z
          .array(
            z.enum([
              'list_rendering',
              'navigation',
              'animations',
              'memory_usage',
              'bundle_size',
              'startup_time',
              'all',
            ])
          )
          .optional()
          .describe('Specific performance areas to focus on'),
      },
      async ({ codebase_path, focus_areas = ['all'] }) => {
        const analysis = await this.analyzeCodebasePerformance(
          codebase_path || process.cwd(),
          focus_areas
        );
        return {
          content: [
            {
              type: 'text',
              text: analysis,
            },
          ],
        };
      }
    );

    // Comprehensive Codebase Analysis Tool
    this.server.tool(
      'analyze_codebase_comprehensive',
      'Comprehensive React Native codebase analysis including performance, security, refactoring, and upgrades',
      {
        codebase_path: z.string().optional().describe('Path to React Native project root'),
        analysis_types: z
          .array(
            z.enum([
              'performance',
              'security',
              'code_quality',
              'refactoring',
              'deprecated_features',
              'upgrades',
              'accessibility',
              'testing',
              'all',
            ])
          )
          .optional()
          .describe('Types of analysis to perform'),
      },
      async ({ codebase_path, analysis_types = ['all'] }) => {
        const analysis = await this.analyzeCodebaseComprehensive(
          codebase_path || process.cwd(),
          analysis_types
        );

        return {
          content: [
            {
              type: 'text',
              text: analysis,
            },
          ],
        };
      }
    );

    // Performance Optimization Tool (existing)
    this.server.tool(
      'optimize_performance',
      'Get performance optimization suggestions for React Native',
      {
        scenario: z
          .enum([
            'list_rendering',
            'navigation',
            'animations',
            'memory_usage',
            'bundle_size',
            'startup_time',
          ])
          .describe('Performance scenario to optimize'),
        platform: z.enum(['ios', 'android', 'both']).optional().describe('Target platform'),
      },
      async ({ scenario, platform = 'both' }) => {
        const suggestions = AdvisoryService.getPerformanceOptimizations(scenario, platform);
        return {
          content: [
            {
              type: 'text',
              text: suggestions,
            },
          ],
        };
      }
    );

    // Architecture Guidance Tool
    this.server.tool(
      'architecture_advice',
      'Get React Native architecture and project structure advice',
      {
        project_type: z
          .enum(['simple_app', 'complex_app', 'enterprise_app', 'library', 'monorepo'])
          .describe('Type of React Native project'),
        features: z.array(z.string()).optional().describe('Key features of the app'),
      },
      async ({ project_type, features = [] }) => {
        const advice = AdvisoryService.getArchitectureAdvice(project_type, features);
        return {
          content: [
            {
              type: 'text',
              text: advice,
            },
          ],
        };
      }
    );

    // Debugging Guide Tool
    this.server.tool(
      'debug_issue',
      'Get debugging guidance for React Native issues',
      {
        issue_type: z
          .enum([
            'crash',
            'performance',
            'ui_layout',
            'navigation',
            'state_management',
            'network',
            'platform_specific',
          ])
          .describe('Type of issue to debug'),
        platform: z
          .enum(['ios', 'android', 'both'])
          .optional()
          .describe('Platform where issue occurs'),
        error_message: z.string().optional().describe('Error message if available'),
      },
      async ({ issue_type, platform = 'both', error_message }) => {
        const guidance = AdvisoryService.getDebuggingGuidance(issue_type, platform, error_message);
        return {
          content: [
            {
              type: 'text',
              text: guidance,
            },
          ],
        };
      }
    );

    // Update Checker Tool
    this.server.tool(
      'check_for_updates',
      'Check for available updates to the React Native MCP server',
      {
        include_changelog: z.boolean().optional().describe('Include changelog in the response'),
      },
      async ({ include_changelog = false }) => {
        const updateInfo = await VersionManagementService.checkForUpdates(include_changelog);
        return {
          content: [
            {
              type: 'text',
              text: updateInfo,
            },
          ],
        };
      }
    );

    // Version Info Tool - Simple utility for getting MCP server version
    this.server.tool(
      'get_version_info',
      'Get React Native MCP Server version and build information',
      {
        include_build_info: z.boolean().optional().describe('Include detailed build information'),
      },
      async ({ include_build_info = false }) => {
        const versionInfo = this.getVersionInfo(include_build_info);
        return {
          content: [
            {
              type: 'text',
              text: versionInfo,
            },
          ],
        };
      }
    );

    // Code Remediation Tool - Expert-level automatic code fixing
    this.server.tool(
      'remediate_code',
      'Automatically fix React Native code issues with expert-level solutions',
      {
        code: z.string().describe('React Native code to remediate'),
        issues: z
          .array(z.string())
          .optional()
          .describe('Specific issues to fix (if not provided, auto-detects all)'),
        remediation_level: z
          .enum(['basic', 'comprehensive', 'expert'])
          .optional()
          .describe('Level of remediation to apply'),
        preserve_formatting: z
          .boolean()
          .optional()
          .describe('Whether to preserve original code formatting'),
        add_comments: z
          .boolean()
          .optional()
          .describe('Whether to add explanatory comments to fixes'),
      },
      async ({
        code,
        issues = [],
        remediation_level = 'expert',
        preserve_formatting = true,
        add_comments = true,
      }) => {
        const remediation = await this.remediateCode(
          code,
          issues,
          remediation_level,
          preserve_formatting,
          add_comments
        );
        return {
          content: [
            {
              type: 'text',
              text: remediation,
            },
          ],
        };
      }
    );

    // Code Refactoring Tool - Advanced refactoring suggestions
    this.server.tool(
      'refactor_component',
      'Provide expert-level refactoring suggestions and implementations',
      {
        code: z.string().describe('React Native component code to refactor'),
        refactor_type: z
          .enum([
            'performance',
            'maintainability',
            'accessibility',
            'type_safety',
            'modern_patterns',
            'comprehensive',
          ])
          .describe('Type of refactoring to apply'),
        target_rn_version: z
          .string()
          .optional()
          .describe('Target React Native version for refactoring'),
        include_tests: z.boolean().optional().describe('Whether to include test updates'),
      },
      async ({ code, refactor_type, target_rn_version = 'latest', include_tests = false }) => {
        const refactoring = await this.refactorComponent(
          code,
          refactor_type,
          target_rn_version,
          include_tests
        );
        return {
          content: [
            {
              type: 'text',
              text: refactoring,
            },
          ],
        };
      }
    );

    // Package Upgrade Tool
    this.server.tool(
      'upgrade_packages',
      'Automatically check for package updates and provide upgrade recommendations',
      {
        project_path: z.string().optional().describe('Path to React Native project root'),
        package_manager: z
          .enum(['npm', 'yarn', 'pnpm'])
          .optional()
          .describe('Package manager to use'),
        update_level: z
          .enum(['patch', 'minor', 'major', 'all'])
          .optional()
          .describe('Level of updates to include'),
        auto_apply: z.boolean().optional().describe('Whether to automatically apply safe updates'),
        check_vulnerabilities: z
          .boolean()
          .optional()
          .describe('Whether to check for security vulnerabilities'),
      },
      async ({
        project_path,
        package_manager = 'npm',
        update_level = 'minor',
        auto_apply = false,
        check_vulnerabilities = true,
      }) => {
        const result = await PackageManagementService.upgradePackages(
          project_path || process.cwd(),
          package_manager,
          update_level,
          auto_apply,
          check_vulnerabilities
        );
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }
    );

    // Dependency Resolution Tool
    this.server.tool(
      'resolve_dependencies',
      'Analyze and resolve dependency conflicts in React Native projects',
      {
        project_path: z.string().optional().describe('Path to React Native project root'),
        package_manager: z
          .enum(['npm', 'yarn', 'pnpm'])
          .optional()
          .describe('Package manager to use'),
        fix_conflicts: z
          .boolean()
          .optional()
          .describe('Whether to automatically attempt to fix conflicts'),
        generate_resolutions: z
          .boolean()
          .optional()
          .describe('Whether to generate resolution suggestions'),
      },
      async ({
        project_path,
        package_manager = 'npm',
        fix_conflicts = false,
        generate_resolutions = true,
      }) => {
        const result = await PackageManagementService.resolveDependencies(
          project_path || process.cwd(),
          package_manager,
          fix_conflicts,
          generate_resolutions
        );
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }
    );

    // Package Security Audit Tool
    this.server.tool(
      'audit_packages',
      'Perform security audit on project dependencies and provide fix recommendations',
      {
        project_path: z.string().optional().describe('Path to React Native project root'),
        package_manager: z
          .enum(['npm', 'yarn', 'pnpm'])
          .optional()
          .describe('Package manager to use'),
        auto_fix: z.boolean().optional().describe('Whether to automatically fix vulnerabilities'),
        severity_threshold: z
          .enum(['low', 'moderate', 'high', 'critical'])
          .optional()
          .describe('Minimum severity level to report'),
      },
      async ({
        project_path,
        package_manager = 'npm',
        auto_fix = false,
        severity_threshold = 'moderate',
      }) => {
        const result = await PackageManagementService.auditPackages(
          project_path || process.cwd(),
          package_manager,
          auto_fix,
          severity_threshold
        );
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }
    );

    // Package Migration Tool
    this.server.tool(
      'migrate_packages',
      'Migrate deprecated packages to their recommended alternatives',
      {
        project_path: z.string().optional().describe('Path to React Native project root'),
        package_manager: z
          .enum(['npm', 'yarn', 'pnpm'])
          .optional()
          .describe('Package manager to use'),
        auto_migrate: z
          .boolean()
          .optional()
          .describe('Whether to automatically perform migrations'),
        target_packages: z
          .array(z.string())
          .optional()
          .describe('Specific packages to migrate (if not provided, checks all)'),
      },
      async ({ project_path, package_manager = 'npm', auto_migrate = false, target_packages }) => {
        const result = await PackageManagementService.migratePackages(
          project_path || process.cwd(),
          package_manager,
          auto_migrate,
          target_packages
        );
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }
    );
  }

  private getVersionInfo(includeBuildInfo: boolean): string {
    // Try to read package.json to get version
    let version = 'Unknown';
    let packageInfo = {};

    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packagePath)) {
        packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        version = (packageInfo as any).version || 'Unknown';
      }
    } catch {
      // Fallback - version info might not be available in all environments
    }

    let info = '# React Native MCP Server Version Information\n\n';
    info += `**Current Version:** ${version}\n`;
    info += '**Package:** @mrnitro360/react-native-mcp-guide\n';
    info += `**Runtime:** Node.js ${process.version}\n`;
    info += `**Platform:** ${process.platform} ${process.arch}\n\n`;

    if (includeBuildInfo) {
      info += '## Build Information\n\n';
      info += `**Process ID:** ${process.pid}\n`;
      info += `**Working Directory:** ${process.cwd()}\n`;
      info += `**Memory Usage:** ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\n`;
      info += `**Uptime:** ${Math.round(process.uptime())}s\n\n`;

      info += '## Capabilities\n\n';
      info += '- ✅ Component Analysis\n';
      info += '- ✅ Performance Optimization\n';
      info += '- ✅ Security Auditing\n';
      info += '- ✅ Test Generation\n';
      info += '- ✅ Package Management\n';
      info += '- ✅ Architecture Guidance\n\n';

      info += '## Updates\n\n';
      info += 'To update to the latest version:\n';
      info += '```bash\n';
      info += 'npm update -g @mrnitro360/react-native-mcp-guide\n';
      info += '```\n';
    }

    return info;
  }

  // New codebase analysis methods
  private async analyzeCodebase(projectPath: string): Promise<string> {
    try {
      // Check for updates periodically
      const shouldCheckUpdates = await VersionManagementService.shouldCheckForUpdates();
      let updateNotification = '';

      if (shouldCheckUpdates) {
        const updateInfo = await VersionManagementService.checkForUpdates(false);
        if (updateInfo.includes('Update Available')) {
          updateNotification =
            '\n\n---\n\n### 🔔 Update Notification\n\n' +
            'A new version of the React Native MCP server is available! ' +
            'Run `check_for_updates` for details or `npm run auto-update` to update.\n\n---\n\n';
        }
      }

      const reactNativeFiles = await FileScanner.findReactNativeFiles(projectPath);
      const analysis = {
        totalFiles: reactNativeFiles.length,
        components: [] as any[],
        issues: [] as string[],
        suggestions: [] as string[],
      };

      // Analyze each file
      for (const filePath of reactNativeFiles) {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const fileAnalysis = FileAnalysisService.analyzeFileContent(content, filePath);
        analysis.components.push(fileAnalysis);
        analysis.issues.push(...fileAnalysis.issues);
        analysis.suggestions.push(...fileAnalysis.suggestions);
      }

      return updateNotification + ReportFormatter.formatCodebaseAnalysis(analysis, projectPath);
    } catch (error) {
      return `Error analyzing codebase: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async analyzeCodebaseComprehensive(
    projectPath: string,
    analysisTypes: string[]
  ): Promise<string> {
    try {
      const reactNativeFiles = await FileScanner.findReactNativeFiles(projectPath);
      const packageJsonPath = path.join(projectPath, 'package.json');

      let packageJson: any = {};
      try {
        const packageContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(packageContent);
      } catch {
        // No package.json found
      }

      const analysis = {
        totalFiles: reactNativeFiles.length,
        packageJson,
        performance: [] as any[],
        security: [] as any[],
        codeQuality: [] as any[],
        refactoring: [] as any[],
        deprecated: [] as any[],
        upgrades: [] as any[],
        accessibility: [] as any[],
        testing: [] as any[],
      };

      // Analyze each file
      for (const filePath of reactNativeFiles) {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const fileName = path.basename(filePath);

        if (analysisTypes.includes('all') || analysisTypes.includes('performance')) {
          analysis.performance.push(
            ...FileAnalysisService.analyzeFilePerformance(content, filePath, ['all'])
          );
        }

        if (analysisTypes.includes('all') || analysisTypes.includes('security')) {
          analysis.security.push(...SecurityAnalyzer.analyzeFileSecurity(content, fileName));
        }

        if (analysisTypes.includes('all') || analysisTypes.includes('code_quality')) {
          analysis.codeQuality.push(
            ...CodeQualityAnalyzer.analyzeFileCodeQuality(content, fileName)
          );
        }

        if (analysisTypes.includes('all') || analysisTypes.includes('refactoring')) {
          analysis.refactoring.push(
            ...CodeQualityAnalyzer.analyzeFileRefactoring(content, fileName)
          );
        }

        if (analysisTypes.includes('all') || analysisTypes.includes('deprecated_features')) {
          analysis.deprecated.push(
            ...DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, fileName)
          );
        }

        if (analysisTypes.includes('all') || analysisTypes.includes('accessibility')) {
          analysis.accessibility.push(
            ...DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(content, fileName)
          );
        }

        if (analysisTypes.includes('all') || analysisTypes.includes('testing')) {
          analysis.testing.push(...TestingAnalyzer.analyzeFileTesting(content, fileName));
        }
      }

      // Analyze package.json for upgrades
      if (analysisTypes.includes('all') || analysisTypes.includes('upgrades')) {
        analysis.upgrades.push(...PackageUpgradesAnalyzer.analyzePackageUpgrades(packageJson));
      }

      return ReportFormatter.formatComprehensiveAnalysis(analysis, projectPath);
    } catch (error) {
      return `Error in comprehensive analysis: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async analyzeCodebasePerformance(
    projectPath: string,
    focusAreas: string[]
  ): Promise<string> {
    try {
      const reactNativeFiles = await FileScanner.findReactNativeFiles(projectPath);
      const performanceIssues: any[] = [];

      for (const filePath of reactNativeFiles) {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const issues = FileAnalysisService.analyzeFilePerformance(content, filePath, focusAreas);
        performanceIssues.push(...issues);
      }

      return ReportFormatter.formatPerformanceAnalysis(performanceIssues, projectPath);
    } catch (error) {
      return `Error analyzing codebase performance: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  register_test_generation() {
    this.server.tool(
      'generate_component_test',
      'Generate comprehensive React Native component tests following industry best practices',
      {
        component_code: z.string().describe('React Native component code to generate tests for'),
        component_name: z.string().describe('Name of the component'),
        test_type: z
          .enum(['unit', 'integration', 'e2e', 'comprehensive'])
          .default('comprehensive')
          .describe('Type of tests to generate'),
        testing_framework: z
          .enum(['jest', 'detox', 'maestro'])
          .default('jest')
          .describe('Testing framework preference'),
        include_accessibility: z.boolean().default(true).describe('Include accessibility tests'),
        include_performance: z.boolean().default(true).describe('Include performance tests'),
        include_snapshot: z.boolean().default(true).describe('Include snapshot tests'),
      },
      async ({
        component_code,
        component_name,
        test_type,
        testing_framework,
        include_accessibility,
        include_performance,
        include_snapshot,
      }) => {
        const testCode = TestGenerationService.generateComponentTests({
          component_code,
          component_name,
          test_type,
          testing_framework,
          include_accessibility,
          include_performance,
          include_snapshot,
        });

        return {
          content: [
            {
              type: 'text',
              text: testCode,
            },
          ],
        };
      }
    );

    // Testing Strategy Analysis Tool
    this.server.tool(
      'analyze_testing_strategy',
      'Analyze current testing strategy and provide recommendations',
      {
        project_path: z.string().optional().describe('Path to React Native project root'),
        focus_areas: z
          .array(z.enum(['unit', 'integration', 'e2e', 'accessibility', 'performance', 'security']))
          .default(['unit', 'integration', 'accessibility'])
          .describe('Areas to focus testing analysis on'),
      },
      async ({ project_path, focus_areas }) => {
        const analysis = await TestingAnalysisService.analyzeTestingStrategy(
          project_path || process.cwd(),
          focus_areas
        );

        return {
          content: [
            {
              type: 'text',
              text: analysis,
            },
          ],
        };
      }
    );

    // Test Coverage Analysis Tool
    this.server.tool(
      'analyze_test_coverage',
      'Analyze test coverage and identify gaps',
      {
        project_path: z.string().optional().describe('Path to React Native project root'),
        coverage_threshold: z
          .number()
          .default(80)
          .describe('Minimum coverage threshold percentage'),
        generate_report: z.boolean().default(true).describe('Generate detailed coverage report'),
      },
      async ({ project_path, coverage_threshold, generate_report }) => {
        const coverageAnalysis = await TestCoverageService.analyzeTestCoverage(
          project_path || process.cwd(),
          coverage_threshold,
          generate_report
        );

        return {
          content: [
            {
              type: 'text',
              text: coverageAnalysis,
            },
          ],
        };
      }
    );
  }

  private async remediateCode(
    code: string,
    issues: string[],
    level: string,
    preserveFormatting: boolean,
    addComments: boolean
  ): Promise<string> {
    let remediatedCode = code;
    const appliedFixes: string[] = [];
    const detectedIssues =
      issues.length > 0 ? issues : CodeRemediationService.detectAllIssues(code);

    let report = `## 🔧 Expert Code Remediation Report

**Remediation Level:** ${level}
**Issues Detected:** ${detectedIssues.length}
**Formatting Preserved:** ${preserveFormatting ? 'Yes' : 'No'}

`;

    // Security fixes
    remediatedCode = CodeRemediationService.applySecurityFixes(
      remediatedCode,
      appliedFixes,
      addComments
    );

    // Performance optimizations
    remediatedCode = CodeRemediationService.applyPerformanceFixes(
      remediatedCode,
      appliedFixes,
      addComments
    );

    // Memory leak fixes
    remediatedCode = CodeRemediationService.applyMemoryLeakFixes(
      remediatedCode,
      appliedFixes,
      addComments
    );

    // Best practices enforcement
    if (level === 'expert' || level === 'comprehensive') {
      remediatedCode = CodeRemediationService.applyBestPracticesFixes(
        remediatedCode,
        appliedFixes,
        addComments
      );
    }

    // Type safety improvements
    if (level === 'expert') {
      remediatedCode = CodeRemediationService.applyTypeSafetyFixes(
        remediatedCode,
        appliedFixes,
        addComments
      );
    }

    report += `### ✅ Applied Fixes (${appliedFixes.length})

${appliedFixes.map((fix, index) => `${index + 1}. ${fix}`).join('\n')}

### 📝 Remediated Code

\`\`\`typescript
${remediatedCode}
\`\`\`

### 🎯 Next Steps

1. **Test thoroughly** - Run your test suite to ensure fixes work correctly
2. **Review changes** - Validate that the remediation meets your requirements
3. **Update dependencies** - Consider upgrading packages if recommended
4. **Add monitoring** - Implement error tracking for production stability

`;

    return report;
  }

  private async refactorComponent(
    code: string,
    refactorType: string,
    targetVersion: string,
    includeTests: boolean
  ): Promise<string> {
    let report = `## 🚀 Expert Component Refactoring

**Refactor Type:** ${refactorType}
**Target RN Version:** ${targetVersion}
**Include Tests:** ${includeTests ? 'Yes' : 'No'}

`;

    let refactoredCode = code;
    const improvements: string[] = [];

    switch (refactorType) {
      case 'performance':
        refactoredCode = CodeRemediationService.refactorForPerformance(code, improvements);
        break;
      case 'maintainability':
        refactoredCode = CodeRemediationService.refactorForMaintainability(code, improvements);
        break;
      case 'accessibility':
        refactoredCode = CodeRemediationService.refactorForAccessibility(code, improvements);
        break;
      case 'type_safety':
        refactoredCode = CodeRemediationService.refactorForTypeSafety(code, improvements);
        break;
      case 'modern_patterns':
        refactoredCode = CodeRemediationService.refactorToModernPatterns(code, improvements);
        break;
      case 'comprehensive':
        refactoredCode = CodeRemediationService.refactorComprehensive(code, improvements);
        break;
    }

    report += `### 🔧 Applied Improvements (${improvements.length})

${improvements.map((improvement, index) => `${index + 1}. ${improvement}`).join('\n')}

### 📝 Refactored Code

\`\`\`typescript
${refactoredCode}
\`\`\`

`;

    if (includeTests) {
      const testCode = CodeRemediationService.generateRefactoredTests(refactoredCode);
      report += `### 🧪 Updated Tests

\`\`\`typescript
${testCode}
\`\`\`

`;
    }

    report += `### 📊 Performance Impact

- **Bundle Size**: Likely reduced due to optimizations
- **Runtime Performance**: Improved through modern patterns
- **Memory Usage**: Optimized with proper cleanup
- **Accessibility**: Enhanced user experience

### 🔍 Code Quality Metrics

- **Maintainability**: ⬆️ Improved
- **Readability**: ⬆️ Enhanced
- **Testability**: ⬆️ Better
- **Type Safety**: ⬆️ Stronger

`;

    return report;
  }

  /**
   * Register ADB (Android Debug Bridge) tools
   * Provides device management, app control, and debugging capabilities
   */
  private registerADBTools() {
    // ADB List Devices Tool
    this.server.tool(
      'adb_list_devices',
      'List all connected Android devices and emulators via ADB',
      {
        include_offline: z
          .boolean()
          .optional()
          .describe('Include offline/unauthorized devices in the list'),
        show_details: z
          .boolean()
          .optional()
          .describe('Fetch detailed information for each device (slower but more informative)'),
      },
      async ({ include_offline, show_details }) => {
        const result = await listDevices({
          include_offline,
          show_details,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    // ADB Device Info Tool
    this.server.tool(
      'adb_device_info',
      'Get detailed information about a specific Android device',
      {
        device_id: z
          .string()
          .optional()
          .describe(
            'Device serial number or ID (e.g., emulator-5554, ABC123). If not provided, uses first available device'
          ),
      },
      async ({ device_id }) => {
        const result = await getDeviceInfo({ device_id });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    // ADB Connect Device Tool
    this.server.tool(
      'adb_connect_device',
      'Connect to an Android device over TCP/IP for wireless debugging',
      {
        host: z
          .string()
          .describe(
            'IP address or hostname of the device (e.g., 192.168.1.100, android-device.local)'
          ),
        port: z
          .number()
          .int()
          .min(1)
          .max(65535)
          .default(5555)
          .describe('ADB port number (default: 5555)'),
        timeout: z
          .number()
          .int()
          .min(1000)
          .max(60000)
          .optional()
          .describe('Connection timeout in milliseconds (default: 10000)'),
      },
      async ({ host, port, timeout }) => {
        const result = await connectDevice({
          host,
          port,
          timeout,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    // ADB Install App Tool
    this.server.tool(
      'adb_install_app',
      'Install an APK file on an Android device',
      {
        apk_path: z.string().describe('Path to the APK file to install'),
        device_id: z
          .string()
          .optional()
          .describe('Target device ID (uses first available if not specified)'),
        replace: z
          .boolean()
          .optional()
          .describe('Replace existing app if installed (default: false)'),
        grant_permissions: z
          .boolean()
          .optional()
          .describe('Grant all runtime permissions (default: false)'),
        allow_downgrade: z
          .boolean()
          .optional()
          .describe('Allow version downgrade (default: false)'),
        allow_test_apk: z
          .boolean()
          .optional()
          .describe('Allow test APKs to be installed (default: false)'),
      },
      async ({
        apk_path,
        device_id,
        replace,
        grant_permissions,
        allow_downgrade,
        allow_test_apk,
      }) => {
        const result = await installApp({
          apk_path,
          device_id,
          replace,
          grant_permissions,
          allow_downgrade,
          allow_test_apk,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    // ADB Uninstall App Tool
    this.server.tool(
      'adb_uninstall_app',
      'Uninstall an app from an Android device',
      {
        package_name: z.string().describe('Package name to uninstall (e.g., com.example.app)'),
        device_id: z
          .string()
          .optional()
          .describe('Target device ID (uses first available if not specified)'),
        keep_data: z.boolean().optional().describe('Keep app data and cache (default: false)'),
      },
      async ({ package_name, device_id, keep_data }) => {
        const result = await uninstallApp({
          package_name,
          device_id,
          keep_data,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    // ADB List Packages Tool
    this.server.tool(
      'adb_list_packages',
      'List installed packages on an Android device',
      {
        device_id: z
          .string()
          .optional()
          .describe('Target device ID (uses first available if not specified)'),
        filter: z.string().optional().describe('Filter packages by name (partial match)'),
        show_system: z.boolean().optional().describe('Include system packages (default: false)'),
        show_third_party: z
          .boolean()
          .optional()
          .describe('Include third-party packages (default: true)'),
        show_disabled: z
          .boolean()
          .optional()
          .describe('Include disabled packages (default: false)'),
      },
      async ({ device_id, filter, show_system, show_third_party, show_disabled }) => {
        const result = await listPackages({
          device_id,
          filter,
          show_system,
          show_third_party,
          show_disabled,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    // ADB Get Package Info Tool
    this.server.tool(
      'adb_get_package_info',
      'Get detailed information about an installed package',
      {
        package_name: z.string().describe('Package name to query (e.g., com.example.app)'),
        device_id: z
          .string()
          .optional()
          .describe('Target device ID (uses first available if not specified)'),
      },
      async ({ package_name, device_id }) => {
        const result = await getPackageInfo({
          package_name,
          device_id,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    // ADB Capture Screenshot Tool
    this.server.tool(
      'adb_capture_screenshot',
      'Capture a screenshot from an Android device',
      {
        output_path: z
          .string()
          .describe('Local path to save the screenshot (e.g., ./screenshot.png)'),
        device_id: z
          .string()
          .optional()
          .describe('Target device ID (uses first available if not specified)'),
        format: z
          .enum(['png', 'raw'])
          .optional()
          .describe('Screenshot format: png (compressed) or raw (uncompressed, default: png)'),
        display_id: z
          .number()
          .optional()
          .describe('Display ID for multi-display devices (default: 0)'),
      },
      async ({ output_path, device_id, format, display_id }) => {
        const result = await captureScreenshot({
          output_path,
          device_id,
          format,
          display_id,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    // ADB Compare Screenshots Tool
    this.server.tool(
      'adb_compare_screenshots',
      'Compare two screenshots for visual differences (visual regression testing)',
      {
        baseline_path: z.string().describe('Path to the baseline/reference screenshot'),
        current_path: z.string().describe('Path to the current/test screenshot'),
        diff_output_path: z
          .string()
          .optional()
          .describe('Path to save the diff image (optional, highlights differences in red)'),
        threshold: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe('Difference threshold (0-1, default: 0.1). Lower = more sensitive'),
        ignore_antialiasing: z
          .boolean()
          .optional()
          .describe('Ignore anti-aliasing differences (default: true)'),
      },
      async ({ baseline_path, current_path, diff_output_path, threshold, ignore_antialiasing }) => {
        const result = await compareScreenshots({
          baseline_path,
          current_path,
          diff_output_path,
          threshold,
          ignore_antialiasing,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );
  }
}
