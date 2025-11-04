/**
 * File analysis service for React Native code
 * Analyzes file content and performance patterns
 */

import * as path from 'path';
import { fileAnalysisCache } from '../../../utils/cache.js';
import { measure, globalPerformanceMonitor } from '../../../utils/performance.js';
import * as crypto from 'crypto';

export class FileAnalysisService {
  // Pre-compiled regex patterns for better performance
  private static readonly PATTERNS = {
    reactImport: /import\s+.*React.*from\s+['"]react['"]/m,
    rnImport: /from\s+['"]react-native['"]/m,
    hasExport: /export\s+(?:default\s+)?(?:function|class|const)/m,
    jsxElements: /<[A-Z]\w*[\s\S]*?>/m,
    flatList: /<FlatList[\s\S]*?(?:\/\>|<\/FlatList>)/g,
    scrollViewMap: /<ScrollView[\s\S]*?>[\s\S]*?\.map\s*\([\s\S]*?<\/ScrollView>/g,
    useState: /useState\s*\(/,
    useEffect: /useEffect\s*\(/,
    useCallback: /useCallback\s*\(/,
    eventHandlers: /on(?:Press|Change|Submit|Focus|Blur)\s*=/,
    styleSheetCreate: /StyleSheet\.create\s*\(/,
    inlineStyles: /style\s*=\s*\{\{[^}]+\}\}/g,
    wildcardImports: /import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"]/g,
    setInterval: /setInterval\s*\(/,
    clearInterval: /clearInterval/,
    addEventListener: /addEventListener\s*\(/,
    removeEventListener: /removeEventListener/,
  };

  /**
   * Generate cache key from file path and content hash
   */
  private static getCacheKey(filePath: string, content: string): string {
    const contentHash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
    return `file:${filePath}:${contentHash}`;
  }

  static analyzeFileContent(content: string, filePath: string) {
    // Check cache first
    const cacheKey = this.getCacheKey(filePath, content);
    const cached = fileAnalysisCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Wrap analysis in performance monitoring
    const result = this.performAnalysis(content, filePath);

    // Cache the result
    fileAnalysisCache.set(cacheKey, result);

    return result;
  }

  private static performAnalysis(content: string, filePath: string) {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const fileName = path.basename(filePath);

    // More accurate React Native component detection using pre-compiled patterns
    const hasReactImport = this.PATTERNS.reactImport.test(content);
    const hasRNImport = this.PATTERNS.rnImport.test(content);
    const hasExport = this.PATTERNS.hasExport.test(content);
    const hasJSXElements = this.PATTERNS.jsxElements.test(content);

    const isComponent = (hasReactImport || hasRNImport) && hasExport && hasJSXElements;

    if (isComponent) {
      // Enhanced FlatList analysis using pre-compiled pattern
      const flatListMatches = content.match(this.PATTERNS.flatList);
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

      // More precise ScrollView + map detection using pre-compiled pattern
      if (this.PATTERNS.scrollViewMap.test(content)) {
        issues.push(
          `${fileName}: Using .map() inside ScrollView - consider FlatList for performance`
        );
      }

      // Enhanced hooks analysis using pre-compiled patterns
      const hasUseState = this.PATTERNS.useState.test(content);
      const hasUseEffect = this.PATTERNS.useEffect.test(content);
      const hasUseCallback = this.PATTERNS.useCallback.test(content);
      const hasEventHandlers = this.PATTERNS.eventHandlers.test(content);

      if (hasUseState && hasUseEffect && hasEventHandlers && !hasUseCallback) {
        issues.push(`${fileName}: Event handlers without useCallback may cause re-renders`);
      }

      // Improved style analysis using pre-compiled patterns
      const hasStyleSheetCreate = this.PATTERNS.styleSheetCreate.test(content);
      const hasInlineStyles = this.PATTERNS.inlineStyles.test(content);

      if (hasInlineStyles && !hasStyleSheetCreate) {
        suggestions.push(
          `${fileName}: Replace inline styles with StyleSheet.create for better performance`
        );
      }

      // Import optimization checks using pre-compiled pattern
      const wildcardImports = content.match(this.PATTERNS.wildcardImports);
      if (wildcardImports && wildcardImports.length > 0) {
        suggestions.push(`${fileName}: Consider using named imports instead of wildcard imports`);
      }

      // Memory leak detection using pre-compiled patterns
      if (this.PATTERNS.setInterval.test(content) && !this.PATTERNS.clearInterval.test(content)) {
        issues.push(`${fileName}: setInterval without clearInterval may cause memory leaks`);
      }

      if (
        this.PATTERNS.addEventListener.test(content) &&
        !this.PATTERNS.removeEventListener.test(content)
      ) {
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

  static analyzeFilePerformance(content: string, filePath: string, focusAreas: string[]) {
    // Check cache with focus areas in key
    const cacheKey = `${this.getCacheKey(filePath, content)}:perf:${focusAreas.sort().join(',')}`;
    const cached = fileAnalysisCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Perform analysis with performance monitoring
    const result = this.performPerformanceAnalysis(content, filePath, focusAreas);

    // Cache the result
    fileAnalysisCache.set(cacheKey, result);

    return result;
  }

  private static performPerformanceAnalysis(
    content: string,
    filePath: string,
    focusAreas: string[]
  ) {
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
        const libImportRegex = new RegExp(`import.*from\\s+['"]${lib}['"]`, 'g');
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
}
