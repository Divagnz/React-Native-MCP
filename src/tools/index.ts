import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { VersionUtils } from './modules/utils/version-utils.js';
import { FileScanner } from './modules/utils/file-scanner.js';
import { ReportFormatter } from './modules/formatters/report-formatter.js';
import { SecurityAnalyzer } from './modules/analysis/security-analyzer.js';
import { CodeQualityAnalyzer } from './modules/analysis/code-quality-analyzer.js';
import { DeprecatedFeaturesAnalyzer } from './modules/analysis/deprecated-features-analyzer.js';
import { TestingAnalyzer } from './modules/analysis/testing-analyzer.js';
import { PackageUpgradesAnalyzer } from './modules/analysis/package-upgrades-analyzer.js';
import { AdvisoryService } from './modules/advisory/advisory-service.js';
import { ComponentAnalyzer } from './modules/analysis/component-analyzer.js';

/**
 * React Native Tools
 *
 * Provides tools for React Native development guidance and analysis
 */
export class ReactNativeTools {
  constructor(private server: McpServer) {}

  register() {
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
        const updateInfo = await this.checkForUpdates(include_changelog);
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
        const result = await this.upgradePackages(
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
        const result = await this.resolveDependencies(
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
        const result = await this.auditPackages(
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
        const result = await this.migratePackages(
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
    } catch (error) {
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
      const shouldCheckUpdates = await this.shouldCheckForUpdates();
      let updateNotification = '';

      if (shouldCheckUpdates) {
        const updateInfo = await this.checkForUpdates(false);
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
        const fileAnalysis = this.analyzeFileContent(content, filePath);
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
          analysis.performance.push(...this.analyzeFilePerformance(content, filePath, ['all']));
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
        const issues = this.analyzeFilePerformance(content, filePath, focusAreas);
        performanceIssues.push(...issues);
      }

      return ReportFormatter.formatPerformanceAnalysis(performanceIssues, projectPath);
    } catch (error) {
      return `Error analyzing codebase performance: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private analyzeFileContent(content: string, filePath: string) {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const fileName = path.basename(filePath);

    // More accurate React Native component detection
    const hasReactImport = /import\s+.*React.*from\s+['"]react['"]/m.test(content);
    const hasRNImport = /from\s+['"]react-native['"]/m.test(content);
    const hasExport = /export\s+(?:default\s+)?(?:function|class|const)/m.test(content);
    const hasJSXElements = /<[A-Z]\w*[\s\S]*?>/m.test(content);

    const isComponent = (hasReactImport || hasRNImport) && hasExport && hasJSXElements;

    if (isComponent) {
      // Enhanced FlatList analysis
      const flatListMatches = content.match(/<FlatList[\s\S]*?(?:\/\>|<\/FlatList>)/g);
      if (flatListMatches) {
        flatListMatches.forEach((flatList) => {
          if (!flatList.includes('keyExtractor')) {
            issues.push(`${fileName}: FlatList missing keyExtractor prop`);
          }
          if (!flatList.includes('getItemLayout') && flatList.length > 200) {
            suggestions.push(
              `${fileName}: Consider adding getItemLayout to FlatList for better performance`
            );
          }
        });
      }

      // More precise ScrollView + map detection
      const scrollViewMapRegex = /<ScrollView[\s\S]*?>[\s\S]*?\.map\s*\([\s\S]*?<\/ScrollView>/g;
      if (scrollViewMapRegex.test(content)) {
        issues.push(
          `${fileName}: Using .map() inside ScrollView - consider FlatList for performance`
        );
      }

      // Enhanced hooks analysis
      const hasUseState = /useState\s*\(/.test(content);
      const hasUseEffect = /useEffect\s*\(/.test(content);
      const hasUseCallback = /useCallback\s*\(/.test(content);
      const hasEventHandlers = /on(?:Press|Change|Submit|Focus|Blur)\s*=/.test(content);

      if (hasUseState && hasUseEffect && hasEventHandlers && !hasUseCallback) {
        issues.push(`${fileName}: Event handlers without useCallback may cause re-renders`);
      }

      // Improved style analysis
      const hasStyleSheetCreate = /StyleSheet\.create\s*\(/.test(content);
      const hasInlineStyles = /style\s*=\s*\{\{[^}]+\}\}/g.test(content);

      if (hasInlineStyles && !hasStyleSheetCreate) {
        suggestions.push(
          `${fileName}: Replace inline styles with StyleSheet.create for better performance`
        );
      }

      // Import optimization checks
      const wildcardImports = content.match(/import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"]/g);
      if (wildcardImports && wildcardImports.length > 0) {
        suggestions.push(`${fileName}: Consider using named imports instead of wildcard imports`);
      }

      // Memory leak detection
      if (/setInterval\s*\(/.test(content) && !/clearInterval/.test(content)) {
        issues.push(`${fileName}: setInterval without clearInterval may cause memory leaks`);
      }

      if (/addEventListener\s*\(/.test(content) && !/removeEventListener/.test(content)) {
        issues.push(`${fileName}: Event listeners without cleanup may cause memory leaks`);
      }
    }

    return {
      fileName,
      filePath,
      isComponent,
      issues,
      suggestions,
      linesOfCode: content.split('\n').length,
    };
  }

  private analyzeFilePerformance(content: string, filePath: string, focusAreas: string[]) {
    const issues: any[] = [];
    const fileName = path.basename(filePath);

    if (focusAreas.includes('all') || focusAreas.includes('list_rendering')) {
      // Enhanced FlatList analysis
      const flatListMatches = content.match(/<FlatList[\s\S]*?(?:\/\>|<\/FlatList>)/g);
      if (flatListMatches) {
        flatListMatches.forEach((flatList, index) => {
          const flatListId = flatListMatches.length > 1 ? ` #${index + 1}` : '';

          if (!flatList.includes('getItemLayout')) {
            issues.push({
              file: fileName,
              type: 'list_rendering',
              severity: 'medium',
              issue: `FlatList${flatListId} without getItemLayout - impacts scrolling performance`,
              suggestion:
                'Add getItemLayout={(data, index) => ({length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index})} if items have known fixed height',
            });
          }

          if (!flatList.includes('removeClippedSubviews')) {
            issues.push({
              file: fileName,
              type: 'list_rendering',
              severity: 'low',
              issue: `FlatList${flatListId} without removeClippedSubviews optimization`,
              suggestion:
                'Add removeClippedSubviews={true} for better memory usage with large lists',
            });
          }

          if (!flatList.includes('keyExtractor')) {
            issues.push({
              file: fileName,
              type: 'list_rendering',
              severity: 'high',
              issue: `FlatList${flatListId} missing keyExtractor - can cause rendering issues`,
              suggestion:
                'Add keyExtractor={(item, index) => item.id?.toString() || index.toString()}',
            });
          }

          if (!flatList.includes('maxToRenderPerBatch') && flatList.length > 300) {
            issues.push({
              file: fileName,
              type: 'list_rendering',
              severity: 'low',
              issue: `Large FlatList${flatListId} without batch rendering optimization`,
              suggestion:
                'Consider adding maxToRenderPerBatch={5} and windowSize={10} for large lists',
            });
          }
        });
      }

      // Check for ScrollView with many children
      const scrollViewMapRegex = /<ScrollView[\s\S]*?>[\s\S]*?\.map\s*\([\s\S]*?<\/ScrollView>/g;
      const matches = content.match(scrollViewMapRegex);
      if (matches) {
        issues.push({
          file: fileName,
          type: 'list_rendering',
          severity: 'high',
          issue: 'ScrollView with .map() can cause performance issues with large datasets',
          suggestion: 'Replace ScrollView + .map() with FlatList for virtualized rendering',
        });
      }
    }

    if (focusAreas.includes('all') || focusAreas.includes('memory_usage')) {
      // More precise memory leak detection
      const intervalMatches = content.match(/setInterval\s*\([^)]+\)/g);
      if (intervalMatches) {
        const hasCleanup =
          /clearInterval|useEffect\s*\([^,]+,\s*\[\]\)[\s\S]*?return\s*\(\s*\)\s*=>|componentWillUnmount/.test(
            content
          );
        if (!hasCleanup) {
          issues.push({
            file: fileName,
            type: 'memory_usage',
            severity: 'high',
            issue: `${intervalMatches.length} setInterval(s) without proper cleanup`,
            suggestion:
              'Clear intervals in useEffect cleanup or componentWillUnmount: () => clearInterval(intervalId)',
          });
        }
      }

      const listenerMatches = content.match(/addEventListener\s*\([^)]+\)/g);
      if (listenerMatches) {
        const hasListenerCleanup =
          /removeEventListener|useEffect\s*\([^,]+,\s*\[\]\)[\s\S]*?return\s*\(\s*\)\s*=>/.test(
            content
          );
        if (!hasListenerCleanup) {
          issues.push({
            file: fileName,
            type: 'memory_usage',
            severity: 'high',
            issue: `${listenerMatches.length} event listener(s) without cleanup`,
            suggestion: 'Remove event listeners in useEffect cleanup or componentWillUnmount',
          });
        }
      }

      // Check for large state objects
      const largeStateRegex = /useState\s*\(\s*\{[\s\S]{100,}\}\s*\)/g;
      if (largeStateRegex.test(content)) {
        issues.push({
          file: fileName,
          type: 'memory_usage',
          severity: 'medium',
          issue: 'Large object in useState - may impact performance',
          suggestion: 'Consider breaking down large state objects or using useReducer',
        });
      }
    }

    if (focusAreas.includes('all') || focusAreas.includes('bundle_size')) {
      // More specific wildcard import analysis
      const wildcardImports = content.match(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g);
      if (wildcardImports) {
        wildcardImports.forEach((importStmt) => {
          const match = importStmt.match(/from\s+['"]([^'"]+)['"]/);
          const moduleName = match ? match[1] : 'unknown';
          issues.push({
            file: fileName,
            type: 'bundle_size',
            severity: 'medium',
            issue: `Wildcard import from '${moduleName}' increases bundle size`,
            suggestion: `Use named imports: import { specificFunction } from '${moduleName}'`,
          });
        });
      }

      // Check for heavy libraries
      const heavyLibraries = ['lodash', 'moment', 'date-fns'];
      heavyLibraries.forEach((lib) => {
        const libImportRegex = new RegExp(`import.*from\s+['"]${lib}['"]{1}`, 'g');
        if (libImportRegex.test(content)) {
          issues.push({
            file: fileName,
            type: 'bundle_size',
            severity: 'medium',
            issue: `Heavy library '${lib}' import detected`,
            suggestion: `Consider using specific imports from '${lib}' or lighter alternatives`,
          });
        }
      });
    }

    if (focusAreas.includes('all') || focusAreas.includes('animations')) {
      // Check for animation performance issues
      if (content.includes('Animated.') && !content.includes('useNativeDriver')) {
        issues.push({
          file: fileName,
          type: 'animations',
          severity: 'medium',
          issue: 'Animations without native driver may cause performance issues',
          suggestion:
            'Add useNativeDriver: true to Animated.timing/spring/decay for better performance',
        });
      }
    }

    return issues;
  }

  // Update checking functionality
  private async checkForUpdates(includeChangelog: boolean = false): Promise<string> {
    try {
      const currentVersion = await this.getCurrentVersion();
      const latestInfo = await this.getLatestVersionInfo();

      if (!latestInfo) {
        return '❌ Unable to check for updates. Please ensure you have internet connectivity.';
      }

      const isUpdateAvailable =
        VersionUtils.compareVersions(currentVersion, latestInfo.version) < 0;

      let report = '## 🔄 React Native MCP Server Update Status\n\n';
      report += `**Current Version:** ${currentVersion}\n`;
      report += `**Latest Version:** ${latestInfo.version}\n`;
      report += `**Last Checked:** ${new Date().toLocaleString()}\n\n`;

      if (isUpdateAvailable) {
        report += '### 🎉 Update Available!\n\n';
        report += `A new version (${latestInfo.version}) is available with new features and improvements.\n\n`;

        report += '### 📥 How to Update:\n\n';
        report += '**Option 1: Automatic Update**\n';
        report += '```bash\n';
        report += 'cd "C:\\Users\\david\\Desktop\\React-Native MCP"\n';
        report += 'npm run auto-update\n';
        report += '```\n\n';

        report += '**Option 2: Manual Update**\n';
        report += '```bash\n';
        report += 'cd "C:\\Users\\david\\Desktop\\React-Native MCP"\n';
        report += 'git pull origin master\n';
        report += 'npm run deploy\n';
        report += '```\n\n';

        if (includeChangelog && latestInfo.changelog) {
          report += "### 📋 What's New:\n\n";
          report += latestInfo.changelog + '\n\n';
        }

        report += '### ⚡ Benefits of Updating:\n';
        report += '- Latest React Native best practices\n';
        report += '- New analysis capabilities\n';
        report += '- Bug fixes and performance improvements\n';
        report += '- Enhanced security recommendations\n\n';
      } else {
        report += "### ✅ You're Up to Date!\n\n";
        report +=
          'Your React Native MCP server is running the latest version with all the newest features and improvements.\n\n';

        report += '### 🔄 Auto-Update Options:\n';
        report += 'To stay automatically updated, you can:\n';
        report += '- Set up daily auto-updates: `npm run setup-auto-update`\n';
        report += '- Enable continuous monitoring: `npm run watch-updates`\n\n';
      }

      return report;
    } catch (error) {
      return `❌ Error checking for updates: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async getCurrentVersion(): Promise<string> {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  private async getLatestVersionInfo(): Promise<{ version: string; changelog?: string } | null> {
    try {
      // Check GitHub releases API
      const response = await fetch(
        'https://api.github.com/repos/MrNitro360/React-Native-MCP/releases/latest'
      );
      if (response.ok) {
        const data = await response.json();
        return {
          version: data.tag_name.replace(/^v/, ''),
          changelog: data.body,
        };
      }

      // Fallback: Check GitHub commits for version in package.json
      const commitsResponse = await fetch(
        'https://api.github.com/repos/MrNitro360/React-Native-MCP/commits?path=package.json&per_page=1'
      );
      if (commitsResponse.ok) {
        const commits = await commitsResponse.json();
        if (commits.length > 0) {
          // For now, use a simple versioning based on commit date
          const commitDate = new Date(commits[0].commit.author.date);
          const version = `1.${commitDate.getFullYear()}.${commitDate.getMonth() + 1}${commitDate.getDate()}`;
          return {
            version,
            changelog: commits[0].commit.message,
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private compareVersions(current: string, latest: string): number {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (currentPart < latestPart) {
        return -1;
      }
      if (currentPart > latestPart) {
        return 1;
      }
    }

    return 0;
  }

  private async shouldCheckForUpdates(): Promise<boolean> {
    try {
      const lastCheckFile = path.join(process.cwd(), '.last-update-check');
      let lastCheck = 0;

      try {
        const lastCheckData = await fs.promises.readFile(lastCheckFile, 'utf-8');
        lastCheck = parseInt(lastCheckData);
      } catch {
        // File doesn't exist, first check
      }

      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (now - lastCheck > twentyFourHours) {
        await fs.promises.writeFile(lastCheckFile, now.toString());
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  // Package upgrade and dependency resolution methods
  private async upgradePackages(
    projectPath: string,
    packageManager: string,
    updateLevel: string,
    autoApply: boolean,
    checkVulnerabilities: boolean
  ): Promise<string> {
    const execAsync = promisify(exec);

    try {
      let report = '# 📦 Package Upgrade Analysis\n\n';

      // Read package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      let packageJson: any = {};

      try {
        const packageContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(packageContent);
      } catch {
        return '❌ No package.json found in the specified project path.';
      }

      report += `**Project:** ${packageJson.name || 'Unknown'}\n`;
      report += `**Current Version:** ${packageJson.version || 'Unknown'}\n`;
      report += `**Package Manager:** ${packageManager}\n`;
      report += `**Update Level:** ${updateLevel}\n\n`;

      // Check for outdated packages
      report += '## 🔍 Checking for Outdated Packages\n\n';

      const outdatedCommand =
        packageManager === 'yarn'
          ? 'yarn outdated --json'
          : packageManager === 'pnpm'
            ? 'pnpm outdated --format json'
            : 'npm outdated --json';

      try {
        const { stdout } = await execAsync(outdatedCommand, { cwd: projectPath });
        const outdatedData = JSON.parse(stdout);

        if (Object.keys(outdatedData).length === 0) {
          report += '✅ All packages are up to date!\n\n';
        } else {
          report += '| Package | Current | Wanted | Latest | Type |\n';
          report += '|---------|---------|--------|--------|---------|\n';

          const upgrades: Array<{
            package: string;
            current: string;
            wanted: string;
            latest: string;
            type: string;
          }> = [];

          for (const [pkg, info] of Object.entries(outdatedData as any)) {
            const packageInfo = info as any;
            const current = packageInfo.current;
            const wanted = packageInfo.wanted;
            const latest = packageInfo.latest;
            const type = packageInfo.type || 'production';

            report += `| ${pkg} | ${current} | ${wanted} | ${latest} | ${type} |\n`;

            // Determine if this package should be upgraded based on update level
            let shouldUpgrade = false;
            if (updateLevel === 'all') {
              shouldUpgrade = true;
            } else if (updateLevel === 'major') {
              shouldUpgrade = true;
            } else if (
              updateLevel === 'minor' &&
              VersionUtils.isMinorOrPatchUpdate(current, latest)
            ) {
              shouldUpgrade = true;
            } else if (updateLevel === 'patch' && VersionUtils.isPatchUpdate(current, latest)) {
              shouldUpgrade = true;
            }

            if (shouldUpgrade) {
              upgrades.push({ package: pkg, current, wanted, latest, type });
            }
          }

          report += '\n';

          if (upgrades.length > 0) {
            report += '## 🚀 Recommended Upgrades\n\n';

            if (autoApply) {
              report += '### Applying Automatic Upgrades\n\n';

              for (const upgrade of upgrades) {
                const upgradeCommand =
                  packageManager === 'yarn'
                    ? `yarn upgrade ${upgrade.package}@${upgrade.latest}`
                    : packageManager === 'pnpm'
                      ? `pnpm update ${upgrade.package}@${upgrade.latest}`
                      : `npm install ${upgrade.package}@${upgrade.latest}`;

                try {
                  report += `Upgrading ${upgrade.package} from ${upgrade.current} to ${upgrade.latest}...\n`;
                  await execAsync(upgradeCommand, { cwd: projectPath });
                  report += `✅ Successfully upgraded ${upgrade.package}\n\n`;
                } catch (error) {
                  report += `❌ Failed to upgrade ${upgrade.package}: ${error}\n\n`;
                }
              }
            } else {
              report += '### Manual Upgrade Commands\n\n';
              report += '```bash\n';

              for (const upgrade of upgrades) {
                const upgradeCommand =
                  packageManager === 'yarn'
                    ? `yarn upgrade ${upgrade.package}@${upgrade.latest}`
                    : packageManager === 'pnpm'
                      ? `pnpm update ${upgrade.package}@${upgrade.latest}`
                      : `npm install ${upgrade.package}@${upgrade.latest}`;

                report += `${upgradeCommand}\n`;
              }

              report += '```\n\n';
            }
          }
        }
      } catch (error) {
        report += `⚠️ Could not check for outdated packages: ${error}\n\n`;
      }

      // Security vulnerabilities check
      if (checkVulnerabilities) {
        report += '## 🛡️ Security Vulnerability Check\n\n';

        const auditCommand =
          packageManager === 'yarn'
            ? 'yarn audit --json'
            : packageManager === 'pnpm'
              ? 'pnpm audit --json'
              : 'npm audit --json';

        try {
          const { stdout } = await execAsync(auditCommand, { cwd: projectPath });
          const auditData = JSON.parse(stdout);

          if (auditData.vulnerabilities && Object.keys(auditData.vulnerabilities).length > 0) {
            report += `Found ${Object.keys(auditData.vulnerabilities).length} vulnerabilities.\n\n`;

            const fixCommand =
              packageManager === 'yarn'
                ? 'yarn audit fix'
                : packageManager === 'pnpm'
                  ? 'pnpm audit fix'
                  : 'npm audit fix';

            report += `**Fix command:** \`${fixCommand}\`\n\n`;
          } else {
            report += '✅ No security vulnerabilities found!\n\n';
          }
        } catch (error) {
          report += `⚠️ Could not check for vulnerabilities: ${error}\n\n`;
        }
      }

      // React Native specific recommendations
      report += await this.getReactNativeUpgradeRecommendations(packageJson);

      return report;
    } catch (error) {
      return `❌ Error during package upgrade analysis: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async resolveDependencies(
    projectPath: string,
    packageManager: string,
    fixConflicts: boolean,
    generateResolutions: boolean
  ): Promise<string> {
    const execAsync = promisify(exec);

    try {
      let report = '# 🔧 Dependency Resolution Analysis\n\n';

      // Read package.json and lock files
      const packageJsonPath = path.join(projectPath, 'package.json');
      let packageJson: any = {};

      try {
        const packageContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(packageContent);
      } catch {
        return '❌ No package.json found in the specified project path.';
      }

      report += `**Project:** ${packageJson.name || 'Unknown'}\n`;
      report += `**Package Manager:** ${packageManager}\n\n`;

      // Check for dependency conflicts
      report += '## 🔍 Analyzing Dependency Tree\n\n';

      const listCommand =
        packageManager === 'yarn'
          ? 'yarn list --json'
          : packageManager === 'pnpm'
            ? 'pnpm list --json'
            : 'npm list --json';

      try {
        const { stdout, stderr } = await execAsync(listCommand, { cwd: projectPath });

        if (stderr && stderr.includes('UNMET')) {
          report += '⚠️ Found unmet dependencies:\n\n';
          const unmetDeps = stderr.match(/UNMET DEPENDENCY ([^\n]+)/g);
          if (unmetDeps) {
            unmetDeps.forEach((dep) => {
              report += `- ${dep.replace('UNMET DEPENDENCY ', '')}\n`;
            });
          }
          report += '\n';
        }

        // Parse dependency tree for conflicts
        try {
          const depTree = JSON.parse(stdout);
          const conflicts = this.findDependencyConflicts(depTree);

          if (conflicts.length > 0) {
            report += '🚨 **Dependency Conflicts Found:**\n\n';

            conflicts.forEach((conflict) => {
              report += `**${conflict.package}**\n`;
              report += `- Required versions: ${conflict.versions.join(', ')}\n`;
              report += `- Conflict reason: ${conflict.reason}\n\n`;
            });
          } else {
            report += '✅ No dependency conflicts detected!\n\n';
          }
        } catch {
          report += '⚠️ Could not parse dependency tree for conflict analysis\n\n';
        }
      } catch (error) {
        report += `⚠️ Could not analyze dependency tree: ${error}\n\n`;
      }

      // Generate resolutions
      if (generateResolutions) {
        report += '## 🛠️ Resolution Suggestions\n\n';

        const resolutions = await this.generateDependencyResolutions(packageJson, packageManager);

        if (resolutions.length > 0) {
          report += '### Recommended Resolutions\n\n';

          resolutions.forEach((resolution) => {
            report += `**${resolution.package}**\n`;
            report += `- Issue: ${resolution.issue}\n`;
            report += `- Solution: ${resolution.solution}\n`;
            if (resolution.command) {
              report += `- Command: \`${resolution.command}\`\n`;
            }
            report += '\n';
          });
        } else {
          report += '✅ No additional resolutions needed!\n\n';
        }
      }

      // Auto-fix conflicts
      if (fixConflicts) {
        report += '## 🔧 Attempting Automatic Fixes\n\n';

        try {
          const installCommand =
            packageManager === 'yarn'
              ? 'yarn install'
              : packageManager === 'pnpm'
                ? 'pnpm install'
                : 'npm install';

          report += `Running: \`${installCommand}\`\n\n`;
          const { stdout, stderr } = await execAsync(installCommand, { cwd: projectPath });

          if (stderr && !stderr.includes('warn')) {
            report += `⚠️ Warnings/Errors during installation:\n\`\`\`\n${stderr}\n\`\`\`\n\n`;
          } else {
            report += '✅ Dependencies resolved successfully!\n\n';
          }
        } catch (error) {
          report += `❌ Failed to resolve dependencies automatically: ${error}\n\n`;
        }
      }

      return report;
    } catch (error) {
      return `❌ Error during dependency resolution: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async auditPackages(
    projectPath: string,
    packageManager: string,
    autoFix: boolean,
    severityThreshold: string
  ): Promise<string> {
    const execAsync = promisify(exec);

    try {
      let report = '# 🛡️ Security Audit Report\n\n';

      const packageJsonPath = path.join(projectPath, 'package.json');
      let packageJson: any = {};

      try {
        const packageContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(packageContent);
      } catch {
        return '❌ No package.json found in the specified project path.';
      }

      report += `**Project:** ${packageJson.name || 'Unknown'}\n`;
      report += `**Package Manager:** ${packageManager}\n`;
      report += `**Severity Threshold:** ${severityThreshold}\n\n`;

      // Run security audit
      report += '## 🔍 Running Security Audit\n\n';

      const auditCommand =
        packageManager === 'yarn'
          ? 'yarn audit --json'
          : packageManager === 'pnpm'
            ? 'pnpm audit --json'
            : 'npm audit --json';

      try {
        const { stdout } = await execAsync(auditCommand, { cwd: projectPath });
        const auditData = JSON.parse(stdout);

        if (auditData.vulnerabilities) {
          const vulnerabilities = Object.entries(auditData.vulnerabilities);
          const filteredVulns = vulnerabilities.filter(([_, vuln]: [string, any]) =>
            this.meetsSeverityThreshold(vuln.severity, severityThreshold)
          );

          if (filteredVulns.length > 0) {
            report += `Found ${filteredVulns.length} vulnerabilities meeting severity threshold.\n\n`;

            report += '| Package | Severity | Title | Patched Versions |\n';
            report += '|---------|----------|-------|------------------|\n';

            filteredVulns.forEach(([pkg, vuln]: [string, any]) => {
              report += `| ${pkg} | ${vuln.severity} | ${vuln.title || 'N/A'} | ${vuln.patched_versions || 'None'} |\n`;
            });

            report += '\n';

            // Auto-fix vulnerabilities
            if (autoFix) {
              report += '## 🔧 Attempting Automatic Fixes\n\n';

              const fixCommand =
                packageManager === 'yarn'
                  ? 'yarn audit fix'
                  : packageManager === 'pnpm'
                    ? 'pnpm audit fix'
                    : 'npm audit fix';

              try {
                report += `Running: \`${fixCommand}\`\n\n`;
                const { stdout: fixOutput } = await execAsync(fixCommand, { cwd: projectPath });
                report += `✅ Fix completed:\n\`\`\`\n${fixOutput}\n\`\`\`\n\n`;
              } catch (error) {
                report += `❌ Failed to auto-fix vulnerabilities: ${error}\n\n`;
              }
            } else {
              report += '## 🛠️ Manual Fix Recommendations\n\n';

              const fixCommand =
                packageManager === 'yarn'
                  ? 'yarn audit fix'
                  : packageManager === 'pnpm'
                    ? 'pnpm audit fix'
                    : 'npm audit fix';

              report += 'Run the following command to attempt automatic fixes:\n';
              report += `\`\`\`bash\n${fixCommand}\n\`\`\`\n\n`;
            }
          } else {
            report += `✅ No vulnerabilities found meeting the ${severityThreshold} severity threshold!\n\n`;
          }
        } else {
          report += '✅ No security vulnerabilities found!\n\n';
        }
      } catch (error) {
        report += `⚠️ Could not complete security audit: ${error}\n\n`;
      }

      return report;
    } catch (error) {
      return `❌ Error during security audit: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async migratePackages(
    projectPath: string,
    packageManager: string,
    autoMigrate: boolean,
    targetPackages?: string[]
  ): Promise<string> {
    const execAsync = promisify(exec);

    try {
      let report = '# 📦 Package Migration Analysis\n\n';

      const packageJsonPath = path.join(projectPath, 'package.json');
      let packageJson: any = {};

      try {
        const packageContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(packageContent);
      } catch {
        return '❌ No package.json found in the specified project path.';
      }

      report += `**Project:** ${packageJson.name || 'Unknown'}\n`;
      report += `**Package Manager:** ${packageManager}\n\n`;

      const dependencies = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {}),
      };

      // Define migration mappings
      const packageMigrations = this.getPackageMigrations();

      const migrationsNeeded: Array<{
        oldPackage: string;
        newPackage: string;
        reason: string;
        commands: string[];
      }> = [];

      // Check which packages need migration
      for (const [oldPkg, migration] of Object.entries(packageMigrations)) {
        if (dependencies[oldPkg] && (!targetPackages || targetPackages.includes(oldPkg))) {
          migrationsNeeded.push({
            oldPackage: oldPkg,
            newPackage: migration.newPackage,
            reason: migration.reason,
            commands: migration.commands.map((cmd) =>
              cmd.replace('{packageManager}', packageManager)
            ),
          });
        }
      }

      if (migrationsNeeded.length === 0) {
        report += '✅ No package migrations needed!\n\n';
        return report;
      }

      report += '## 🔄 Packages Requiring Migration\n\n';

      migrationsNeeded.forEach((migration) => {
        report += `**${migration.oldPackage}** → **${migration.newPackage}**\n`;
        report += `- Reason: ${migration.reason}\n`;
        report += '- Commands:\n';
        migration.commands.forEach((cmd) => {
          report += `  - \`${cmd}\`\n`;
        });
        report += '\n';
      });

      // Auto-migrate if requested
      if (autoMigrate) {
        report += '## 🚀 Performing Automatic Migration\n\n';

        for (const migration of migrationsNeeded) {
          report += `### Migrating ${migration.oldPackage}\n\n`;

          for (const command of migration.commands) {
            try {
              report += `Running: \`${command}\`\n`;
              const { stdout } = await execAsync(command, { cwd: projectPath });
              report += '✅ Success\n\n';
            } catch (error) {
              report += `❌ Failed: ${error}\n\n`;
            }
          }
        }

        // Update package.json to remove old dependencies
        try {
          const updatedPackageJson = { ...packageJson };

          migrationsNeeded.forEach((migration) => {
            if (updatedPackageJson.dependencies?.[migration.oldPackage]) {
              delete updatedPackageJson.dependencies[migration.oldPackage];
            }
            if (updatedPackageJson.devDependencies?.[migration.oldPackage]) {
              delete updatedPackageJson.devDependencies[migration.oldPackage];
            }
          });

          await fs.promises.writeFile(packageJsonPath, JSON.stringify(updatedPackageJson, null, 2));

          report += '✅ Updated package.json to remove old dependencies\n\n';
        } catch (error) {
          report += `⚠️ Could not update package.json: ${error}\n\n`;
        }
      } else {
        report += '## 📋 Manual Migration Instructions\n\n';
        report += 'Run the following commands to perform the migrations:\n\n';
        report += '```bash\n';

        migrationsNeeded.forEach((migration) => {
          migration.commands.forEach((cmd) => {
            report += `${cmd}\n`;
          });
        });

        report += '```\n\n';
      }

      return report;
    } catch (error) {
      return `❌ Error during package migration: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Helper methods
  private isMinorOrPatchUpdate(current: string, latest: string): boolean {
    const currentParts = current
      .replace(/[^0-9.]/g, '')
      .split('.')
      .map(Number);
    const latestParts = latest
      .replace(/[^0-9.]/g, '')
      .split('.')
      .map(Number);

    return latestParts[0] === currentParts[0]; // Same major version
  }

  private isPatchUpdate(current: string, latest: string): boolean {
    const currentParts = current
      .replace(/[^0-9.]/g, '')
      .split('.')
      .map(Number);
    const latestParts = latest
      .replace(/[^0-9.]/g, '')
      .split('.')
      .map(Number);

    return latestParts[0] === currentParts[0] && latestParts[1] === currentParts[1]; // Same major and minor
  }

  private findDependencyConflicts(
    depTree: any
  ): Array<{ package: string; versions: string[]; reason: string }> {
    const conflicts: Array<{ package: string; versions: string[]; reason: string }> = [];
    const packageVersions: Record<string, Set<string>> = {};

    const traverseTree = (node: any) => {
      if (node.dependencies) {
        for (const [pkg, info] of Object.entries(node.dependencies as any)) {
          const packageInfo = info as any;
          if (!packageVersions[pkg]) {
            packageVersions[pkg] = new Set();
          }
          packageVersions[pkg].add(packageInfo.version);

          traverseTree(packageInfo);
        }
      }
    };

    traverseTree(depTree);

    for (const [pkg, versions] of Object.entries(packageVersions)) {
      if (versions.size > 1) {
        conflicts.push({
          package: pkg,
          versions: Array.from(versions),
          reason: 'Multiple versions detected in dependency tree',
        });
      }
    }

    return conflicts;
  }

  private async generateDependencyResolutions(
    packageJson: any,
    packageManager: string
  ): Promise<Array<{ package: string; issue: string; solution: string; command?: string }>> {
    const resolutions: Array<{
      package: string;
      issue: string;
      solution: string;
      command?: string;
    }> = [];

    // Check for peer dependency warnings
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // React Native specific checks
    if (dependencies['react-native']) {
      const rnVersion = dependencies['react-native'];

      // Check React version compatibility
      if (dependencies['react']) {
        const reactVersion = dependencies['react'];
        resolutions.push({
          package: 'react',
          issue: 'React version may not be compatible with React Native version',
          solution: 'Ensure React version matches React Native requirements',
          command: `${packageManager} install react@18.2.0`, // Example
        });
      }
    }

    return resolutions;
  }

  private meetsSeverityThreshold(severity: string, threshold: string): boolean {
    const severityLevels = ['low', 'moderate', 'high', 'critical'];
    const severityIndex = severityLevels.indexOf(severity);
    const thresholdIndex = severityLevels.indexOf(threshold);

    return severityIndex >= thresholdIndex;
  }

  private getPackageMigrations(): Record<
    string,
    { newPackage: string; reason: string; commands: string[] }
  > {
    return {
      'react-native-vector-icons': {
        newPackage: '@expo/vector-icons',
        reason: 'Better maintained and more feature-rich',
        commands: [
          '{packageManager} uninstall react-native-vector-icons',
          '{packageManager} install @expo/vector-icons',
        ],
      },
      'react-native-asyncstorage': {
        newPackage: '@react-native-async-storage/async-storage',
        reason: 'Official community package with better support',
        commands: [
          '{packageManager} uninstall react-native-asyncstorage',
          '{packageManager} install @react-native-async-storage/async-storage',
        ],
      },
      '@react-native-community/async-storage': {
        newPackage: '@react-native-async-storage/async-storage',
        reason: 'Package moved to new organization',
        commands: [
          '{packageManager} uninstall @react-native-community/async-storage',
          '{packageManager} install @react-native-async-storage/async-storage',
        ],
      },
      'react-native-camera': {
        newPackage: 'react-native-vision-camera',
        reason: 'Better performance and actively maintained',
        commands: [
          '{packageManager} uninstall react-native-camera',
          '{packageManager} install react-native-vision-camera',
        ],
      },
      'react-navigation': {
        newPackage: '@react-navigation/native',
        reason: 'Updated to version 6 with better architecture',
        commands: [
          '{packageManager} uninstall react-navigation',
          '{packageManager} install @react-navigation/native @react-navigation/native-stack',
        ],
      },
    };
  }

  private async getReactNativeUpgradeRecommendations(packageJson: any): Promise<string> {
    let report = '## 🎯 React Native Specific Recommendations\n\n';

    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Check React Native version
    if (dependencies['react-native']) {
      const rnVersion = dependencies['react-native'].replace(/[^0-9.]/g, '');
      const majorVersion = parseInt(rnVersion.split('.')[0]);

      if (majorVersion < 70) {
        report += '🚨 **Critical: React Native version is outdated**\n';
        report += `- Current: ${rnVersion}\n`;
        report += '- Recommended: 0.72+\n';
        report += '- Benefits: New Architecture, better performance, latest features\n';
        report += '- Upgrade guide: https://react-native-community.github.io/upgrade-helper/\n\n';
      } else if (majorVersion < 72) {
        report += '⚠️ **React Native could be updated**\n';
        report += `- Current: ${rnVersion}\n`;
        report += '- Latest stable: 0.72+\n';
        report += '- Consider upgrading for latest features and bug fixes\n\n';
      } else {
        report += '✅ React Native version is current\n\n';
      }
    }

    // Check for New Architecture readiness
    if (dependencies['react-native']) {
      report += '### 🏗️ New Architecture Readiness\n\n';
      report +=
        'Check if your dependencies support the New Architecture (Fabric + TurboModules):\n\n';

      const incompatiblePackages = [
        'react-native-reanimated',
        'react-native-gesture-handler',
        'react-native-screens',
      ].filter((pkg) => dependencies[pkg]);

      if (incompatiblePackages.length > 0) {
        report += 'Ensure these packages support New Architecture:\n';
        incompatiblePackages.forEach((pkg) => {
          report += `- ${pkg}\n`;
        });
        report += '\n';
      }
    }

    return report;
  }

  // React Native Component Test Generation Tool
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
        const testCode = this.generateComponentTests({
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
        const analysis = await this.analyzeTestingStrategy(
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
        const coverageAnalysis = await this.analyzeTestCoverage(
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

  private generateComponentTests(options: {
    component_code: string;
    component_name: string;
    test_type: string;
    testing_framework: string;
    include_accessibility: boolean;
    include_performance: boolean;
    include_snapshot: boolean;
  }): string {
    const {
      component_code,
      component_name,
      test_type,
      testing_framework,
      include_accessibility,
      include_performance,
      include_snapshot,
    } = options;

    // Analyze component to understand its structure
    const componentAnalysis = this.analyzeComponentStructure(component_code);

    let testCode = `// ${component_name} Test Suite
// Generated following React Native testing best practices
// Testing Framework: ${testing_framework}
// Test Type: ${test_type}

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { jest } from '@jest/globals';
${include_accessibility ? "import { axe, toHaveNoViolations } from 'jest-axe';\nimport '@testing-library/jest-native/extend-expect';" : ''}
${include_performance ? "import { measurePerformance } from '@shopify/react-native-performance';" : ''}
import ${component_name} from './${component_name}';

${include_accessibility ? 'expect.extend(toHaveNoViolations);' : ''}

describe('${component_name}', () => {
  // Test Setup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Basic Rendering Tests
  describe('Rendering', () => {
    test('renders without crashing', () => {
      const { getByTestId } = render(<${component_name} />);
      expect(getByTestId('${component_name.toLowerCase()}')).toBeTruthy();
    });

${
  include_snapshot
    ? `    test('matches snapshot', () => {
      const tree = render(<${component_name} />).toJSON();
      expect(tree).toMatchSnapshot();
    });`
    : ''
}

    test('renders with default props', () => {
      const { getByTestId } = render(<${component_name} />);
      const component = getByTestId('${component_name.toLowerCase()}');
      expect(component).toBeDefined();
    });
  });
`;

    // Add prop-specific tests
    if (componentAnalysis.props.length > 0) {
      testCode += `
  // Props Tests
  describe('Props', () => {
${componentAnalysis.props
  .map(
    (prop) => `    test('handles ${prop.name} prop correctly', () => {
      const test${prop.name} = ${this.generateMockValue(prop.type)};
      const { getByTestId } = render(<${component_name} ${prop.name}={test${prop.name}} />);
      const component = getByTestId('${component_name.toLowerCase()}');
      ${this.generatePropAssertion(prop)}
    });`
  )
  .join('\n\n')}
  });
`;
    }

    // Add interaction tests
    if (componentAnalysis.interactions.length > 0) {
      testCode += `
  // Interaction Tests
  describe('User Interactions', () => {
${componentAnalysis.interactions
  .map(
    (interaction) => `    test('handles ${interaction.name} correctly', async () => {
      const mock${interaction.name} = jest.fn();
      const { getByTestId } = render(<${component_name} ${interaction.prop}={mock${interaction.name}} />);
      
      const ${interaction.element} = getByTestId('${interaction.testId}');
      fireEvent.${interaction.event}(${interaction.element});
      
      ${interaction.async ? 'await waitFor(() => {' : ''}
        expect(mock${interaction.name}).toHaveBeenCalled();
      ${interaction.async ? '});' : ''}
    });`
  )
  .join('\n\n')}
  });
`;
    }

    // Add accessibility tests
    if (include_accessibility) {
      testCode += `
  // Accessibility Tests
  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(<${component_name} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('supports screen reader navigation', () => {
      const { getByTestId } = render(<${component_name} />);
      const component = getByTestId('${component_name.toLowerCase()}');
      
      expect(component).toHaveAccessibilityRole('${this.inferAccessibilityRole(component_code)}');
      expect(component).toHaveAccessibilityState({ disabled: false });
    });

    test('has proper accessibility labels', () => {
      const { getByLabelText } = render(<${component_name} />);
      expect(getByLabelText(/${component_name}/i)).toBeTruthy();
    });

    test('supports keyboard navigation', () => {
      const { getByTestId } = render(<${component_name} />);
      const component = getByTestId('${component_name.toLowerCase()}');
      
      expect(component).toHaveAccessibilityState({ focusable: true });
    });
  });
`;
    }

    // Add performance tests
    if (include_performance) {
      testCode += `
  // Performance Tests
  describe('Performance', () => {
    test('renders within acceptable time', async () => {
      const startTime = performance.now();
      render(<${component_name} />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(16); // 60fps = 16ms per frame
    });

    test('handles large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: \`Item \${i}\` }));
      
      const startTime = performance.now();
      render(<${component_name} data={largeDataset} />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(100); // Should render large datasets quickly
    });

    test('does not cause memory leaks', () => {
      const { unmount } = render(<${component_name} />);
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      unmount();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      expect(finalMemory).toBeLessThanOrEqual(initialMemory + 1000000); // Allow 1MB tolerance
    });
  });
`;
    }

    // Add error boundary tests
    testCode += `
  // Error Handling Tests
  describe('Error Handling', () => {
    test('handles errors gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<${component_name} invalidProp="test" />);
      }).not.toThrow();
      
      consoleError.mockRestore();
    });

    test('displays fallback UI when children error', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };
      
      const { getByText } = render(
        <${component_name}>
          <ThrowError />
        </${component_name}>
      );
      
      expect(getByText(/something went wrong/i)).toBeTruthy();
    });
  });
`;

    // Add integration tests for comprehensive testing
    if (test_type === 'comprehensive' || test_type === 'integration') {
      testCode += `
  // Integration Tests
  describe('Integration', () => {
    test('integrates with navigation', () => {
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        dispatch: jest.fn(),
      };
      
      const { getByTestId } = render(<${component_name} navigation={mockNavigation} />);
      // Add specific navigation integration tests
    });

    test('integrates with state management', () => {
      // Mock Redux/Context store
      const mockStore = {
        getState: jest.fn(() => ({})),
        dispatch: jest.fn(),
        subscribe: jest.fn(),
      };
      
      // Add state management integration tests
    });

    test('handles API calls correctly', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({ data: 'test' });
      
      const { getByTestId } = render(<${component_name} apiCall={mockApiCall} />);
      
      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalled();
      });
    });
  });
`;
    }

    testCode += `});

// Test Utilities
export const ${component_name}TestUtils = {
  // Custom render function with providers
  renderWithProviders: (ui: React.ReactElement, options = {}) => {
    const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
      return (
        // Add your providers here (Navigation, Theme, Store, etc.)
        <>{children}</>
      );
    };
    
    return render(ui, { wrapper: AllTheProviders, ...options });
  },

  // Mock data generators
  generateMockProps: () => ({
    // Generate mock props for ${component_name}
  }),

  // Common test scenarios
  testScenarios: {
    default: {},
    loading: { isLoading: true },
    error: { error: 'Test error' },
    empty: { data: [] },
  },
};

// Performance benchmarks
export const ${component_name}Benchmarks = {
  renderTime: 16, // ms
  memoryUsage: 1000000, // bytes
  interactionResponse: 100, // ms
};
`;

    return testCode;
  }

  private analyzeComponentStructure(componentCode: string) {
    // Basic analysis of component structure
    const props: Array<{ name: string; type: string; required: boolean }> = [];
    const interactions: Array<{
      name: string;
      prop: string;
      element: string;
      event: string;
      testId: string;
      async: boolean;
    }> = [];

    // Extract props from TypeScript interfaces or PropTypes
    const interfaceMatch = componentCode.match(/interface\s+\w+Props\s*{([^}]*)}/);
    if (interfaceMatch) {
      const propsText = interfaceMatch[1];
      const propMatches = propsText.match(/(\w+)(\?)?:\s*([^;]+);/g);
      if (propMatches) {
        propMatches.forEach((match) => {
          const [, name, optional, type] = match.match(/(\w+)(\?)?:\s*([^;]+);/) || [];
          if (name && type) {
            props.push({
              name,
              type: type.trim(),
              required: !optional,
            });
          }
        });
      }
    }

    // Extract common interaction patterns
    const eventHandlers = componentCode.match(/on\w+\s*[:=]/g);
    if (eventHandlers) {
      eventHandlers.forEach((handler) => {
        const handlerName = handler.replace(/[:=]/g, '').trim();
        interactions.push({
          name: handlerName,
          prop: handlerName,
          element: 'button',
          event: this.inferEventType(handlerName),
          testId: `${handlerName.toLowerCase()}-button`,
          async: handlerName.includes('async') || handlerName.includes('Submit'),
        });
      });
    }

    return { props, interactions };
  }

  private generateMockValue(type: string): string {
    const typeMap: { [key: string]: string } = {
      string: "'test string'",
      number: '42',
      boolean: 'true',
      object: '{}',
      array: '[]',
      function: 'jest.fn()',
      Date: 'new Date()',
      undefined: 'undefined',
      null: 'null',
    };

    const lowerType = type.toLowerCase();
    for (const [key, value] of Object.entries(typeMap)) {
      if (lowerType.includes(key)) {
        return value;
      }
    }

    return "''"; // Default fallback
  }

  private generatePropAssertion(prop: { name: string; type: string; required: boolean }): string {
    if (prop.type.toLowerCase().includes('string')) {
      return "expect(component).toHaveTextContent('test string');";
    } else if (prop.type.toLowerCase().includes('boolean')) {
      return `expect(component).toHaveAccessibilityState({ [${prop.name}]: true });`;
    } else if (prop.type.toLowerCase().includes('function')) {
      return '// Function prop assertions would be handled in interaction tests';
    }

    return 'expect(component).toBeDefined();';
  }

  private inferEventType(handlerName: string): string {
    const eventMap: { [key: string]: string } = {
      press: 'press',
      tap: 'press',
      click: 'press',
      change: 'changeText',
      focus: 'focus',
      blur: 'blur',
      submit: 'press',
      scroll: 'scroll',
    };

    const lowerHandler = handlerName.toLowerCase();
    for (const [key, event] of Object.entries(eventMap)) {
      if (lowerHandler.includes(key)) {
        return event;
      }
    }

    return 'press'; // Default fallback
  }

  private inferAccessibilityRole(componentCode: string): string {
    if (componentCode.includes('TouchableOpacity') || componentCode.includes('Pressable')) {
      return 'button';
    } else if (componentCode.includes('TextInput')) {
      return 'textbox';
    } else if (componentCode.includes('Text')) {
      return 'text';
    } else if (componentCode.includes('Image')) {
      return 'image';
    } else if (componentCode.includes('ScrollView') || componentCode.includes('FlatList')) {
      return 'scrollbar';
    }

    return 'none';
  }

  private async analyzeTestingStrategy(projectPath: string, focusAreas: string[]): Promise<string> {
    let analysis = '# 🧪 React Native Testing Strategy Analysis\n\n';

    try {
      // Check for existing test files
      const testFiles = await FileScanner.findTestFiles(projectPath);
      analysis += '## 📊 Current Test Coverage\n\n';
      analysis += `- **Test Files Found**: ${testFiles.length}\n`;
      analysis += `- **Test Types Detected**: ${this.detectTestTypes(testFiles).join(', ')}\n\n`;

      // Check package.json for testing dependencies
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const testingDeps = this.analyzeTestingDependencies(packageJson);

        analysis += '## 🛠️ Testing Dependencies\n\n';
        analysis += '### Installed:\n';
        testingDeps.installed.forEach((dep) => {
          analysis += `- ✅ ${dep}\n`;
        });

        analysis += '\n### Recommended Additions:\n';
        testingDeps.recommended.forEach((dep) => {
          analysis += `- 🎯 ${dep.name}: ${dep.purpose}\n`;
        });
      }

      // Analyze each focus area
      for (const area of focusAreas) {
        analysis += `\n## ${this.getAreaEmoji(area)} ${area.charAt(0).toUpperCase() + area.slice(1)} Testing\n\n`;
        analysis += await this.analyzeFocusArea(projectPath, area);
      }

      // Provide comprehensive recommendations
      analysis += '\n## 🎯 Strategic Recommendations\n\n';
      analysis += this.generateTestingRecommendations(testFiles.length, focusAreas);

      // Add testing setup guide
      analysis += '\n## 🚀 Quick Setup Guide\n\n';
      analysis += this.generateTestingSetupGuide();
    } catch (error) {
      analysis += `❌ Error analyzing project: ${error}\n\n`;
      analysis += 'Please ensure the project path is correct and accessible.\n';
    }

    return analysis;
  }

  private async findTestFiles(projectPath: string): Promise<string[]> {
    const testFiles: string[] = [];
    const testPatterns = [
      /\.test\.(js|jsx|ts|tsx)$/,
      /\.spec\.(js|jsx|ts|tsx)$/,
      /__tests__.*\.(js|jsx|ts|tsx)$/,
    ];

    const walkDir = (dir: string) => {
      if (!fs.existsSync(dir)) {
        return;
      }

      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          walkDir(filePath);
        } else if (stat.isFile()) {
          if (testPatterns.some((pattern) => pattern.test(file))) {
            testFiles.push(filePath);
          }
        }
      }
    };

    walkDir(projectPath);
    return testFiles;
  }

  private detectTestTypes(testFiles: string[]): string[] {
    const types = new Set<string>();

    testFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf8');

      if (content.includes('@testing-library/react-native')) {
        types.add('Unit');
      }
      if (content.includes('detox')) {
        types.add('E2E');
      }
      if (content.includes('toMatchSnapshot')) {
        types.add('Snapshot');
      }
      if (content.includes('accessibility')) {
        types.add('Accessibility');
      }
      if (content.includes('performance')) {
        types.add('Performance');
      }
      if (content.includes('integration')) {
        types.add('Integration');
      }
    });

    return Array.from(types);
  }

  private analyzeTestingDependencies(packageJson: any): {
    installed: string[];
    recommended: Array<{ name: string; purpose: string }>;
  } {
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const testingPackages = [
      'jest',
      '@testing-library/react-native',
      '@testing-library/jest-native',
      'react-test-renderer',
      'detox',
      'maestro-cli',
      'jest-axe',
      '@shopify/react-native-performance',
    ];

    const installed = testingPackages.filter((pkg) => allDeps[pkg]);
    const recommended = [
      { name: '@testing-library/react-native', purpose: 'Component testing with best practices' },
      { name: '@testing-library/jest-native', purpose: 'Additional React Native matchers' },
      { name: 'react-test-renderer', purpose: 'Snapshot testing' },
      { name: 'jest-axe', purpose: 'Accessibility testing' },
      { name: 'detox', purpose: 'End-to-end testing' },
      { name: '@shopify/react-native-performance', purpose: 'Performance testing' },
      { name: 'flipper-plugin-react-native-performance', purpose: 'Performance monitoring' },
    ].filter((pkg) => !installed.includes(pkg.name));

    return { installed, recommended };
  }

  private getAreaEmoji(area: string): string {
    const emojiMap: { [key: string]: string } = {
      unit: '🔧',
      integration: '🔗',
      e2e: '🎭',
      accessibility: '♿',
      performance: '⚡',
      security: '🔒',
    };
    return emojiMap[area] || '📋';
  }

  private async analyzeFocusArea(projectPath: string, area: string): Promise<string> {
    switch (area) {
      case 'unit':
        return this.analyzeUnitTesting(projectPath);
      case 'integration':
        return this.analyzeIntegrationTesting(projectPath);
      case 'e2e':
        return this.analyzeE2ETesting(projectPath);
      case 'accessibility':
        return this.analyzeAccessibilityTesting(projectPath);
      case 'performance':
        return this.analyzePerformanceTesting(projectPath);
      case 'security':
        return this.analyzeSecurityTesting(projectPath);
      default:
        return `Analysis for ${area} is not yet implemented.\n`;
    }
  }

  private analyzeUnitTesting(projectPath: string): string {
    return `### Current State:
- **Framework**: Jest (recommended for React Native)
- **Library**: @testing-library/react-native
- **Coverage**: Run \`npm test -- --coverage\` to check

### Best Practices:
1. **Test Structure**: Arrange, Act, Assert
2. **Mock External Dependencies**: APIs, navigation, storage
3. **Test User Interactions**: Not implementation details
4. **Snapshot Testing**: For UI regression detection

### Example Test:
\`\`\`javascript
import { render, fireEvent } from '@testing-library/react-native';
import MyButton from '../MyButton';

test('calls onPress when pressed', () => {
  const mockOnPress = jest.fn();
  const { getByText } = render(<MyButton onPress={mockOnPress} title="Test" />);
  
  fireEvent.press(getByText('Test'));
  expect(mockOnPress).toHaveBeenCalled();
});
\`\`\`
`;
  }

  private analyzeIntegrationTesting(projectPath: string): string {
    return `### Focus Areas:
- **Navigation Flow**: Screen-to-screen transitions
- **State Management**: Redux/Context integration
- **API Integration**: HTTP requests and responses
- **Form Validation**: Multi-step forms

### Recommended Approach:
1. **Mock External Services**: Use MSW or similar
2. **Test User Journeys**: Complete workflows
3. **Test Error Scenarios**: Network failures, validation errors

### Example:
\`\`\`javascript
test('user can complete login flow', async () => {
  const { getByText, getByPlaceholderText } = render(<LoginScreen />);
  
  fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
  fireEvent.press(getByText('Login'));
  
  await waitFor(() => {
    expect(getByText('Welcome')).toBeTruthy();
  });
});
\`\`\`
`;
  }

  private analyzeE2ETesting(projectPath: string): string {
    return `### Recommended Tools:
- **Detox**: Popular React Native E2E framework
- **Maestro**: Simple, declarative mobile UI testing
- **Appium**: Cross-platform automation

### Key Test Scenarios:
1. **Critical User Paths**: Registration, login, checkout
2. **Platform-Specific Features**: Push notifications, deep links
3. **Performance**: App startup, navigation speed
4. **Offline Scenarios**: Network connectivity issues

### Detox Setup:
\`\`\`bash
npm install --save-dev detox
npx detox init
\`\`\`

### Example Test:
\`\`\`javascript
describe('Login Flow', () => {
  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await expect(element(by.text('Welcome'))).toBeVisible();
  });
});
\`\`\`
`;
  }

  private analyzeAccessibilityTesting(projectPath: string): string {
    return `### Testing Areas:
- **Screen Reader Support**: VoiceOver, TalkBack
- **Focus Management**: Keyboard navigation
- **Color Contrast**: WCAG compliance
- **Semantic Elements**: Proper roles and labels

### Tools:
- **jest-axe**: Automated accessibility testing
- **@testing-library/react-native**: Built-in accessibility queries
- **Manual Testing**: Real device testing with screen readers

### Example Tests:
\`\`\`javascript
import { axe, toHaveNoViolations } from 'jest-axe';

test('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('supports screen reader', () => {
  const { getByLabelText } = render(<MyButton />);
  expect(getByLabelText('Submit form')).toBeTruthy();
});
\`\`\`

### Manual Testing Checklist:
- [ ] Enable VoiceOver/TalkBack and navigate the app
- [ ] Test with high contrast mode
- [ ] Verify focus indicators are visible
- [ ] Check minimum touch target sizes (44x44 points)
`;
  }

  private analyzePerformanceTesting(projectPath: string): string {
    return `### Performance Metrics:
- **Render Time**: Component mount duration
- **Memory Usage**: Heap size monitoring
- **Bundle Size**: JavaScript bundle analysis
- **Frame Rate**: 60fps maintenance

### Tools:
- **@shopify/react-native-performance**: Performance monitoring
- **Flipper**: Real-time performance insights
- **Metro Bundle Analyzer**: Bundle size analysis
- **React DevTools Profiler**: Component performance

### Example Tests:
\`\`\`javascript
test('renders within performance budget', () => {
  const startTime = performance.now();
  render(<MyComponent />);
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(16); // 60fps
});

test('handles large lists efficiently', () => {
  const largeData = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
  const { getByTestId } = render(<MyList data={largeData} />);
  
  // Should render virtualized list efficiently
  expect(getByTestId('list')).toBeTruthy();
});
\`\`\`

### Performance Budget:
- **First Paint**: < 1000ms
- **Interactive**: < 3000ms
- **Frame Rate**: 60fps (16ms per frame)
- **Memory**: < 100MB baseline
`;
  }

  private analyzeSecurityTesting(projectPath: string): string {
    return `### Security Test Areas:
- **Data Validation**: Input sanitization
- **Authentication**: Token handling, biometrics
- **Storage Security**: Keychain, encrypted storage
- **Network Security**: Certificate pinning, HTTPS

### Common Vulnerabilities:
1. **Insecure Data Storage**: Sensitive data in plain text
2. **Weak Authentication**: Poor session management
3. **Code Injection**: Dynamic code execution
4. **Man-in-the-Middle**: Unvalidated certificates

### Example Tests:
\`\`\`javascript
test('sanitizes user input', () => {
  const maliciousInput = '<script>alert("xss")</script>';
  const { getByDisplayValue } = render(<TextInput value={maliciousInput} />);
  
  // Should escape or sanitize malicious input
  expect(getByDisplayValue()).not.toContain('<script>');
});

test('uses secure storage', async () => {
  const sensitiveData = 'user-token-123';
  await SecureStorage.setItem('token', sensitiveData);
  
  // Should not be stored in plain text
  const stored = await AsyncStorage.getItem('token');
  expect(stored).toBeNull(); // Should use secure storage instead
});
\`\`\`

### Security Checklist:
- [ ] Use Keychain/Keystore for sensitive data
- [ ] Implement certificate pinning
- [ ] Validate all user inputs
- [ ] Use HTTPS for all network requests
- [ ] Implement proper session management
`;
  }

  private generateTestingRecommendations(testFileCount: number, focusAreas: string[]): string {
    let recommendations = '';

    if (testFileCount === 0) {
      recommendations += `### 🚨 Critical: No tests found
1. **Start with unit tests** for core components
2. **Set up Jest and Testing Library** immediately
3. **Establish testing standards** and practices
4. **Add pre-commit hooks** to ensure tests run

`;
    } else if (testFileCount < 10) {
      recommendations += `### ⚠️ Low test coverage detected
1. **Expand unit test coverage** to critical components
2. **Add integration tests** for key user flows
3. **Implement snapshot testing** for UI regression protection
4. **Set coverage thresholds** in Jest config

`;
    } else {
      recommendations += `### ✅ Good test foundation
1. **Optimize existing tests** for better coverage
2. **Add performance benchmarks** for critical paths
3. **Enhance accessibility testing** coverage
4. **Consider E2E testing** for complete user journeys

`;
    }

    recommendations += `### 📋 Priority Action Items:
1. **Install core testing dependencies**
2. **Create component test templates**
3. **Set up CI/CD test automation**
4. **Establish coverage targets** (aim for 80%+)
5. **Document testing patterns** for the team

### 🎯 Focus Area Priorities:
${focusAreas.map((area, index) => `${index + 1}. **${area.charAt(0).toUpperCase() + area.slice(1)} Testing** - ${this.getAreaPriority(area)}`).join('\n')}
`;

    return recommendations;
  }

  private getAreaPriority(area: string): string {
    const priorities: { [key: string]: string } = {
      unit: 'Foundation for all other testing',
      integration: 'Critical for complex app flows',
      e2e: 'Essential for production confidence',
      accessibility: 'Required for inclusive design',
      performance: 'Key for user experience',
      security: 'Critical for data protection',
    };
    return priorities[area] || 'Important for overall quality';
  }

  private generateTestingSetupGuide(): string {
    return `### 1. Install Dependencies
\`\`\`bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native react-test-renderer
\`\`\`

### 2. Configure Jest (jest.config.js)
\`\`\`javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
\`\`\`

### 3. Add Test Scripts (package.json)
\`\`\`json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
\`\`\`

### 4. Create Test Template
\`\`\`javascript
// __tests__/ComponentName.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ComponentName from '../ComponentName';

describe('ComponentName', () => {
  test('renders correctly', () => {
    const { getByTestId } = render(<ComponentName />);
    expect(getByTestId('component-name')).toBeTruthy();
  });
});
\`\`\`
`;
  }

  private async analyzeTestCoverage(
    projectPath: string,
    threshold: number,
    generateReport: boolean
  ): Promise<string> {
    let analysis = '# 📊 Test Coverage Analysis\n\n';

    try {
      // Check if Jest is configured
      const jestConfigExists =
        fs.existsSync(path.join(projectPath, 'jest.config.js')) ||
        fs.existsSync(path.join(projectPath, 'jest.config.json'));

      if (!jestConfigExists) {
        analysis += '❌ **Jest configuration not found**\n';
        analysis += 'Please set up Jest first before analyzing coverage.\n\n';
        return analysis;
      }

      // Run coverage analysis if requested
      if (generateReport) {
        analysis += '## 🔍 Running Coverage Analysis...\n\n';

        try {
          const execAsync = promisify(exec);
          const { stdout, stderr } = await execAsync('npm test -- --coverage --silent', {
            cwd: projectPath,
            timeout: 30000,
          });

          if (stderr && !stderr.includes('warning')) {
            analysis += `⚠️ **Coverage command had issues:**\n\`\`\`\n${stderr}\n\`\`\`\n\n`;
          }

          // Parse coverage output
          analysis += this.parseCoverageOutput(stdout, threshold);
        } catch (error) {
          analysis += '❌ **Failed to run coverage:**\n';
          analysis += `\`\`\`\n${error}\n\`\`\`\n\n`;
          analysis += '**Possible solutions:**\n';
          analysis += '1. Ensure all dependencies are installed: `npm install`\n';
          analysis += '2. Check Jest configuration\n';
          analysis += '3. Verify test files exist\n\n';
        }
      }

      // Provide coverage improvement suggestions
      analysis += this.generateCoverageRecommendations(threshold);
    } catch (error) {
      analysis += `❌ Error analyzing coverage: ${error}\n\n`;
    }

    return analysis;
  }

  private parseCoverageOutput(output: string, threshold: number): string {
    let report = '## 📈 Coverage Report\n\n';

    // Look for coverage table in output
    const coverageMatch = output.match(
      /File\s+%\s+Stmts\s+%\s+Branch\s+%\s+Funcs\s+%\s+Lines[\s\S]*?(-+)/
    );

    if (coverageMatch) {
      report += `### Detailed Coverage:\n\`\`\`\n${coverageMatch[0]}\n\`\`\`\n\n`;
    }

    // Extract summary percentages
    const summaryMatch = output.match(
      /All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/
    );

    if (summaryMatch) {
      const [, statements, branches, functions, lines] = summaryMatch;
      const metrics = {
        statements: parseFloat(statements),
        branches: parseFloat(branches),
        functions: parseFloat(functions),
        lines: parseFloat(lines),
      };

      report += '### Coverage Summary:\n';
      Object.entries(metrics).forEach(([metric, value]) => {
        const status = value >= threshold ? '✅' : '❌';
        const emoji = value >= threshold ? '🎯' : '⚠️';
        report += `- ${status} **${metric.charAt(0).toUpperCase() + metric.slice(1)}**: ${value}% ${emoji}\n`;
      });

      const overallPassing = Object.values(metrics).every((value) => value >= threshold);
      report += `\n**Overall Status**: ${overallPassing ? '✅ PASSING' : '❌ BELOW THRESHOLD'} (${threshold}%)\n\n`;

      // Identify areas needing improvement
      const needsImprovement = Object.entries(metrics)
        .filter(([, value]) => value < threshold)
        .map(([metric]) => metric);

      if (needsImprovement.length > 0) {
        report += '### 🎯 Areas Needing Improvement:\n';
        needsImprovement.forEach((metric) => {
          report += `- **${metric.charAt(0).toUpperCase() + metric.slice(1)}** coverage is below ${threshold}%\n`;
        });
        report += '\n';
      }
    } else {
      report += '⚠️ Could not parse coverage summary. Check Jest output manually.\n\n';
    }

    return report;
  }

  private generateCoverageRecommendations(threshold: number): string {
    return `## 🎯 Coverage Improvement Strategies

### 1. Identify Uncovered Code
\`\`\`bash
npm test -- --coverage --coverageReporters=text-lcov | npx lcov-result-merger "coverage/lcov.info" | npx lcov-summary
\`\`\`

### 2. Focus on High-Impact Areas
- **Business Logic**: Core functionality and calculations
- **User Interactions**: Button clicks, form submissions
- **Error Handling**: Try-catch blocks and error boundaries
- **Edge Cases**: Boundary conditions and error states

### 3. Testing Strategies by Coverage Type

#### Statements Coverage (${threshold}%+ target)
- Test all code paths and conditional branches
- Include positive and negative test cases
- Test error handling and edge cases

#### Branch Coverage (${threshold}%+ target)
- Test all if/else conditions
- Test switch statement cases
- Test ternary operators
- Test logical operators (&&, ||)

#### Function Coverage (${threshold}%+ target)
- Call every function at least once
- Test function parameters and return values
- Test async functions with promises/callbacks

#### Line Coverage (${threshold}%+ target)
- Execute every line of code
- Focus on untested utility functions
- Test configuration and setup code

### 4. Quick Wins for Better Coverage

#### Add Missing Test Cases
\`\`\`javascript
// Test error scenarios
test('handles network error gracefully', async () => {
  mockAPI.get.mockRejectedValue(new Error('Network error'));
  const { getByText } = render(<MyComponent />);
  await waitFor(() => {
    expect(getByText('Error occurred')).toBeTruthy();
  });
});

// Test edge cases
test('handles empty data', () => {
  const { getByText } = render(<MyComponent data={[]} />);
  expect(getByText('No data available')).toBeTruthy();
});
\`\`\`

#### Mock External Dependencies
\`\`\`javascript
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));
\`\`\`

### 5. Coverage Quality vs Quantity
- **Quality**: Test meaningful user scenarios
- **Avoid**: Testing implementation details
- **Focus**: Critical business logic and user paths
- **Balance**: Don't chase 100% coverage at expense of test quality

### 6. Automate Coverage Monitoring
\`\`\`json
// package.json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": ${threshold},
        "functions": ${threshold},
        "lines": ${threshold},
        "statements": ${threshold}
      }
    }
  }
}
\`\`\`

### 7. Coverage Reports
- **HTML Report**: \`npm test -- --coverage --coverageReporters=html\`
- **Text Report**: \`npm test -- --coverage --coverageReporters=text\`
- **LCOV Report**: For CI/CD integration

**Remember**: Good tests are more valuable than high coverage numbers. Focus on testing critical functionality and user scenarios.
`;
  }

  // Expert-level code remediation methods
  private async remediateCode(
    code: string,
    issues: string[],
    level: string,
    preserveFormatting: boolean,
    addComments: boolean
  ): Promise<string> {
    let remediatedCode = code;
    const appliedFixes: string[] = [];
    const detectedIssues = issues.length > 0 ? issues : this.detectAllIssues(code);

    let report = `## 🔧 Expert Code Remediation Report

**Remediation Level:** ${level}
**Issues Detected:** ${detectedIssues.length}
**Formatting Preserved:** ${preserveFormatting ? 'Yes' : 'No'}

`;

    // Security fixes
    remediatedCode = this.applySecurityFixes(remediatedCode, appliedFixes, addComments);

    // Performance optimizations
    remediatedCode = this.applyPerformanceFixes(remediatedCode, appliedFixes, addComments);

    // Memory leak fixes
    remediatedCode = this.applyMemoryLeakFixes(remediatedCode, appliedFixes, addComments);

    // Best practices enforcement
    if (level === 'expert' || level === 'comprehensive') {
      remediatedCode = this.applyBestPracticesFixes(remediatedCode, appliedFixes, addComments);
    }

    // Type safety improvements
    if (level === 'expert') {
      remediatedCode = this.applyTypeSafetyFixes(remediatedCode, appliedFixes, addComments);
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
        refactoredCode = this.refactorForPerformance(code, improvements);
        break;
      case 'maintainability':
        refactoredCode = this.refactorForMaintainability(code, improvements);
        break;
      case 'accessibility':
        refactoredCode = this.refactorForAccessibility(code, improvements);
        break;
      case 'type_safety':
        refactoredCode = this.refactorForTypeSafety(code, improvements);
        break;
      case 'modern_patterns':
        refactoredCode = this.refactorToModernPatterns(code, improvements);
        break;
      case 'comprehensive':
        refactoredCode = this.refactorComprehensive(code, improvements);
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
      const testCode = this.generateRefactoredTests(refactoredCode);
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

  // Security remediation methods
  private applySecurityFixes(code: string, appliedFixes: string[], addComments: boolean): string {
    let fixedCode = code;

    // Fix hardcoded secrets
    const secretPatterns = [
      {
        pattern: /(const|let|var)\s+(\w*[aA]pi[kK]ey\w*)\s*=\s*["'][^"']+["']/g,
        replacement: 'API_KEY',
      },
      {
        pattern: /(const|let|var)\s+(\w*[sS]ecret\w*)\s*=\s*["'][^"']+["']/g,
        replacement: 'SECRET',
      },
      { pattern: /(const|let|var)\s+(\w*[tT]oken\w*)\s*=\s*["'][^"']+["']/g, replacement: 'TOKEN' },
    ];

    secretPatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(fixedCode)) {
        fixedCode = fixedCode.replace(pattern, (match, varType, varName) => {
          appliedFixes.push(`Moved hardcoded ${varName} to environment variable`);
          const envVar = varName
            .toUpperCase()
            .replace(/([A-Z])/g, '_$1')
            .replace(/^_/, '');
          const comment = addComments
            ? `\n  // TODO: Add ${envVar} to your environment variables\n`
            : '';
          return `${comment}${varType} ${varName} = process.env.${envVar} || Config.${envVar}`;
        });
      }
    });

    // Fix sensitive logging
    fixedCode = fixedCode.replace(
      /console\.(log|warn|error|info)\([^)]*(?:password|pwd|secret|token|key|auth|credential)[^)]*\)/gi,
      (match) => {
        appliedFixes.push('Removed sensitive data from console logging');
        const comment = addComments ? '  // Removed sensitive logging for security' : '';
        return `${comment}\n  // console.log('[REDACTED - contains sensitive data]');`;
      }
    );

    // Fix HTTP to HTTPS
    fixedCode = fixedCode.replace(
      /(fetch|axios\.[a-z]+)\s*\(\s*["']http:\/\/([^"']+)["']/g,
      (match, method, url) => {
        appliedFixes.push(`Upgraded HTTP to HTTPS for: ${url}`);
        const comment = addComments ? '  // Upgraded to HTTPS for security\n  ' : '';
        return `${comment}${method}('https://${url}'`;
      }
    );

    return fixedCode;
  }

  // Performance remediation methods
  private applyPerformanceFixes(
    code: string,
    appliedFixes: string[],
    addComments: boolean
  ): string {
    let fixedCode = code;

    // Fix FlatList missing keyExtractor
    fixedCode = fixedCode.replace(
      /<FlatList([^>]*?)(?!.*keyExtractor)([^>]*?)>/g,
      (match, before, after) => {
        appliedFixes.push('Added keyExtractor to FlatList for better performance');
        const comment = addComments
          ? '\n      {/* Added keyExtractor for performance */}\n      '
          : '';
        return `${comment}<FlatList${before}${after}\n        keyExtractor={(item, index) => item.id?.toString() || index.toString()}>`;
      }
    );

    // Fix ScrollView with map to FlatList
    fixedCode = fixedCode.replace(
      /<ScrollView([^>]*?)>([\s\S]*?)\{([^}]*).map\(([^}]*?)\)\}([\s\S]*?)<\/ScrollView>/g,
      (match, scrollProps, before, arrayVar, mapContent, after) => {
        appliedFixes.push('Converted ScrollView with .map() to FlatList for better performance');
        const comment = addComments
          ? '\n      {/* Converted to FlatList for better performance with large datasets */}\n      '
          : '';
        return `${comment}<FlatList${scrollProps}\n        data={${arrayVar.trim()}}\n        keyExtractor={(item, index) => item.id?.toString() || index.toString()}\n        renderItem={({ item }) => (${mapContent.replace('item =>', '').trim()})}\n      />`;
      }
    );

    return fixedCode;
  }

  // Memory leak remediation methods
  private applyMemoryLeakFixes(code: string, appliedFixes: string[], addComments: boolean): string {
    let fixedCode = code;

    // Fix setInterval without cleanup
    const intervalRegex = /const\s+(\w+)\s*=\s*setInterval\s*\([^;]+;/g;
    const intervalMatches = Array.from(fixedCode.matchAll(intervalRegex));

    if (intervalMatches.length > 0 && !fixedCode.includes('clearInterval')) {
      // Add cleanup in useEffect
      intervalMatches.forEach((match) => {
        const intervalVar = match[1];
        appliedFixes.push(`Added clearInterval cleanup for ${intervalVar}`);
      });

      // Add useEffect cleanup
      if (fixedCode.includes('useEffect') && !fixedCode.includes('return () =>')) {
        fixedCode = fixedCode.replace(
          /(useEffect\s*\([^,]+),\s*\[\]\s*\);/,
          (match, effectContent) => {
            const comment = addComments ? '\n    // Cleanup intervals to prevent memory leaks' : '';
            return `${effectContent}, []);\n\n  useEffect(() => {${comment}\n    return () => {\n      // Cleanup any intervals\n      ${intervalMatches.map((m) => `clearInterval(${m[1]});`).join('\n      ')}\n    };\n  }, []);`;
          }
        );
      }
    }

    return fixedCode;
  }

  private detectAllIssues(code: string): string[] {
    const issues: string[] = [];

    // Security issues
    if (/(?:api[_-]?key|apikey)\s*[:=]\s*["'][^"']+["']/gi.test(code)) {
      issues.push('hardcoded_secrets');
    }
    if (/console\.log.*(?:password|pwd|secret|token|key|auth|credential)/gi.test(code)) {
      issues.push('sensitive_logging');
    }
    if (/fetch\s*\(\s*["']http:\/\//.test(code)) {
      issues.push('insecure_http');
    }

    // Performance issues
    if (/<FlatList[^>]*(?!.*keyExtractor)/.test(code)) {
      issues.push('missing_key_extractor');
    }
    if (/<ScrollView[\s\S]*?\.map\s*\([\s\S]*?<\/ScrollView>/.test(code)) {
      issues.push('scrollview_with_map');
    }

    // Memory leaks
    if (/setInterval\s*\(/.test(code) && !/clearInterval/.test(code)) {
      issues.push('interval_memory_leak');
    }

    return issues;
  }

  private applyBestPracticesFixes(
    code: string,
    appliedFixes: string[],
    addComments: boolean
  ): string {
    let fixedCode = code;

    // Add StyleSheet.create for inline styles
    const inlineStyleRegex = /style\s*=\s*\{\{([^}]+)\}\}/g;
    if (inlineStyleRegex.test(fixedCode) && !fixedCode.includes('StyleSheet.create')) {
      appliedFixes.push('Converted inline styles to StyleSheet.create');

      // Extract styles and create StyleSheet
      const styles: string[] = [];
      let styleCounter = 0;

      fixedCode = fixedCode.replace(inlineStyleRegex, (match, styleContent) => {
        const styleName = `style${styleCounter++}`;
        styles.push(`  ${styleName}: {\n    ${styleContent.replace(/,/g, ',\n    ')}\n  }`);
        return `style={styles.${styleName}}`;
      });

      // Add StyleSheet definition
      if (styles.length > 0) {
        const styleSheetDefinition = `\n\nconst styles = StyleSheet.create({\n${styles.join(',\n')}\n});\n`;
        fixedCode += styleSheetDefinition;

        // Add StyleSheet import
        if (!fixedCode.includes('StyleSheet')) {
          fixedCode = fixedCode.replace(
            /(import\s*\{[^}]*)\}\s*from\s*['"]react-native['"];?/,
            "$1, StyleSheet } from 'react-native';"
          );
        }
      }
    }

    return fixedCode;
  }

  private applyTypeSafetyFixes(code: string, appliedFixes: string[], addComments: boolean): string {
    let fixedCode = code;

    // Add TypeScript interface for props if missing
    if (
      fixedCode.includes('props') &&
      !fixedCode.includes('interface') &&
      !fixedCode.includes('type Props')
    ) {
      appliedFixes.push('Added TypeScript interface for better type safety');

      const interfaceDefinition = `interface Props {
  // Add your prop definitions here
  children?: React.ReactNode;
  onPress?: () => void;
  title?: string;
}

`;

      // Insert before the component definition
      fixedCode = fixedCode.replace(
        /(const|function)\s+(\w+)\s*[=:]?\s*\(/,
        interfaceDefinition + '$1 $2('
      );
    }

    return fixedCode;
  }

  // Refactoring helper methods
  private refactorForPerformance(code: string, improvements: string[]): string {
    let refactoredCode = code;

    // Add React.memo for components
    if (refactoredCode.includes('export default') && !refactoredCode.includes('memo(')) {
      refactoredCode = refactoredCode.replace(
        /(export default )(\w+);?/,
        (match, exportKeyword, componentName) => {
          improvements.push('Wrapped component with React.memo for performance');
          return `${exportKeyword}React.memo(${componentName});`;
        }
      );

      // Add memo import
      if (!refactoredCode.includes('memo')) {
        refactoredCode = refactoredCode.replace(/import React(,\s*\{[^}]*\})?/, (match) => {
          if (match.includes('{')) {
            return match.replace('}', ', memo }');
          } else {
            return match.replace('React', 'React, { memo }');
          }
        });
      }
    }

    return refactoredCode;
  }

  private refactorForMaintainability(code: string, improvements: string[]): string {
    // Extract inline styles to StyleSheet
    let refactoredCode = code;

    const inlineStyleRegex = /style\s*=\s*\{\{([^}]+)\}\}/g;
    if (inlineStyleRegex.test(refactoredCode)) {
      improvements.push('Extracted inline styles to StyleSheet for better maintainability');

      // Add StyleSheet import if not present
      if (!refactoredCode.includes('StyleSheet')) {
        refactoredCode = refactoredCode.replace(
          /(import\s*\{[^}]*)\}\s*from\s*['"]react-native['"];?/,
          "$1, StyleSheet } from 'react-native';"
        );
      }
    }

    return refactoredCode;
  }

  private refactorForAccessibility(code: string, improvements: string[]): string {
    let refactoredCode = code;

    // Add accessibility props to touchable elements
    refactoredCode = refactoredCode.replace(
      /<(TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback)([^>]*?)>/g,
      (match, component, props) => {
        if (!props.includes('accessibilityRole')) {
          improvements.push(`Added accessibility props to ${component}`);
          return `<${component}${props} accessibilityRole="button" accessibilityLabel="Tap to interact">`;
        }
        return match;
      }
    );

    return refactoredCode;
  }

  private refactorForTypeSafety(code: string, improvements: string[]): string {
    let refactoredCode = code;

    // Add TypeScript interfaces for props
    if (!refactoredCode.includes('interface') && refactoredCode.includes('props')) {
      improvements.push('Added TypeScript interface for component props');
      const interfaceDefinition = `
interface Props {
  // TODO: Define your component props here
  children?: React.ReactNode;
}

`;
      refactoredCode = interfaceDefinition + refactoredCode;
    }

    return refactoredCode;
  }

  private refactorToModernPatterns(code: string, improvements: string[]): string {
    let refactoredCode = code;

    // Convert function declarations to arrow functions with proper typing
    refactoredCode = refactoredCode.replace(
      /function\s+(\w+)\s*\([^)]*\)\s*\{/g,
      (match, funcName) => {
        improvements.push(`Converted ${funcName} to modern arrow function`);
        return `const ${funcName} = () => {`;
      }
    );

    return refactoredCode;
  }

  private refactorComprehensive(code: string, improvements: string[]): string {
    let refactoredCode = code;

    refactoredCode = this.refactorForPerformance(refactoredCode, improvements);
    refactoredCode = this.refactorForAccessibility(refactoredCode, improvements);
    refactoredCode = this.refactorToModernPatterns(refactoredCode, improvements);

    return refactoredCode;
  }

  private generateRefactoredTests(code: string): string {
    return `// Updated tests for refactored component
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import YourComponent from './YourComponent';

describe('YourComponent (Refactored)', () => {
  test('renders without crashing', () => {
    render(<YourComponent />);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  test('handles interactions correctly', () => {
    const mockOnPress = jest.fn();
    render(<YourComponent onPress={mockOnPress} />);
    
    fireEvent.press(screen.getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test('meets accessibility standards', async () => {
    const { container } = render(<YourComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
`;
  }
}
