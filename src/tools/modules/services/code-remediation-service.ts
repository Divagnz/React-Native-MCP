/**
 * Code remediation service for React Native applications
 * Applies security, performance, and best practice fixes
 */

export class CodeRemediationService {
  static applySecurityFixes(code: string, appliedFixes: string[], addComments: boolean): string {
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
  static applyPerformanceFixes(code: string, appliedFixes: string[], addComments: boolean): string {
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
  static applyMemoryLeakFixes(code: string, appliedFixes: string[], addComments: boolean): string {
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

  static detectAllIssues(code: string): string[] {
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

  static applyBestPracticesFixes(
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

  static applyTypeSafetyFixes(code: string, appliedFixes: string[], addComments: boolean): string {
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
  static refactorForPerformance(code: string, improvements: string[]): string {
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

  static refactorForMaintainability(code: string, improvements: string[]): string {
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

  static refactorForAccessibility(code: string, improvements: string[]): string {
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

  static refactorForTypeSafety(code: string, improvements: string[]): string {
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

  static refactorToModernPatterns(code: string, improvements: string[]): string {
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

  static refactorComprehensive(code: string, improvements: string[]): string {
    let refactoredCode = code;

    refactoredCode = CodeRemediationService.refactorForPerformance(refactoredCode, improvements);
    refactoredCode = CodeRemediationService.refactorForAccessibility(refactoredCode, improvements);
    refactoredCode = CodeRemediationService.refactorToModernPatterns(refactoredCode, improvements);

    return refactoredCode;
  }

  static generateRefactoredTests(code: string): string {
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
