/**
 * File analysis service for React Native code
 * Analyzes file content and performance patterns
 */

import * as path from 'path';

export class FileAnalysisService {
  static analyzeFileContent(content: string, filePath: string) {
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

  static analyzeFilePerformance(content: string, filePath: string, focusAreas: string[]) {
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
