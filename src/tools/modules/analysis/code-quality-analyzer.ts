/**
 * Code quality analysis utilities for React Native code
 */

export interface CodeQualityIssue {
  file: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  suggestion: string;
}

export class CodeQualityAnalyzer {
  /**
   * Analyze file content for code quality issues
   */
  static analyzeFileCodeQuality(content: string, fileName: string): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];
    const lines = content.split('\n');

    // Long functions
    let functionLength = 0;
    let inFunction = false;
    for (const line of lines) {
      if (/(?:function|const\s+\w+\s*=|=>\s*{)/.test(line)) {
        inFunction = true;
        functionLength = 0;
      }
      if (inFunction) {
        functionLength++;
      }
      if (line.includes('}') && inFunction) {
        if (functionLength > 50) {
          issues.push({
            file: fileName,
            type: 'code_quality',
            severity: 'medium',
            category: 'function_length',
            issue: `Function longer than 50 lines (${functionLength} lines)`,
            suggestion: 'Break down large functions into smaller, focused functions',
          });
        }
        inFunction = false;
      }
    }

    // Too many props
    const propMatches = content.match(/interface\s+\w+Props\s*{([^}]+)}/g);
    if (propMatches) {
      propMatches.forEach((match) => {
        const propCount = (match.match(/\w+\s*:/g) || []).length;
        if (propCount > 10) {
          issues.push({
            file: fileName,
            type: 'code_quality',
            severity: 'medium',
            category: 'props_complexity',
            issue: `Component has ${propCount} props (consider reducing)`,
            suggestion: 'Group related props into objects or split component',
          });
        }
      });
    }

    // Nested ternary operators - look for lines with multiple ? operators
    const ternaryLines = content.split('\n').filter((line) => {
      const questionMarks = (line.match(/\?/g) || []).length;
      return questionMarks >= 2;
    });
    if (ternaryLines.length > 0) {
      issues.push({
        file: fileName,
        type: 'code_quality',
        severity: 'low',
        category: 'readability',
        issue: 'Nested ternary operators detected',
        suggestion: 'Use if-else statements or extract to functions for better readability',
      });
    }

    // Magic numbers
    const magicNumbers = content.match(/(?<![.\w])\d{2,}(?![.\w])/g);
    if (magicNumbers && magicNumbers.length > 3) {
      issues.push({
        file: fileName,
        type: 'code_quality',
        severity: 'low',
        category: 'magic_numbers',
        issue: 'Multiple magic numbers detected',
        suggestion: 'Extract numbers to named constants for better maintainability',
      });
    }

    // Missing error handling
    if (content.includes('fetch(') && !content.includes('catch')) {
      issues.push({
        file: fileName,
        type: 'code_quality',
        severity: 'medium',
        category: 'error_handling',
        issue: 'Network request without error handling',
        suggestion: 'Add try-catch or .catch() for proper error handling',
      });
    }

    return issues;
  }

  /**
   * Analyze file for refactoring opportunities
   */
  static analyzeFileRefactoring(content: string, fileName: string): CodeQualityIssue[] {
    const suggestions: CodeQualityIssue[] = [];

    // Duplicate code patterns
    const imports = content.match(/import.*from.*/g) || [];
    const uniqueImports = new Set(imports);
    if (imports.length !== uniqueImports.size) {
      suggestions.push({
        file: fileName,
        type: 'refactoring',
        severity: 'low',
        category: 'duplicate_code',
        issue: 'Duplicate import statements detected',
        suggestion: 'Consolidate duplicate imports',
      });
    }

    // Large components (file size)
    const lineCount = content.split('\n').length;
    if (lineCount > 300) {
      suggestions.push({
        file: fileName,
        type: 'refactoring',
        severity: 'medium',
        category: 'component_size',
        issue: `File is very large (${lineCount} lines)`,
        suggestion: 'Consider splitting into smaller, more focused components',
      });
    }

    // Class components that could be functional
    if (content.includes('extends React.Component') || content.includes('extends Component')) {
      const hasLifecycleMethods =
        /componentDidMount|componentWillUnmount|shouldComponentUpdate/.test(content);
      if (!hasLifecycleMethods) {
        suggestions.push({
          file: fileName,
          type: 'refactoring',
          severity: 'low',
          category: 'modernization',
          issue: 'Class component could be converted to functional component',
          suggestion: 'Convert to functional component with hooks for better performance',
        });
      }
    }

    // Inline styles that should be extracted
    const inlineStyleCount = (content.match(/style=\{\{/g) || []).length;
    if (inlineStyleCount > 3) {
      suggestions.push({
        file: fileName,
        type: 'refactoring',
        severity: 'low',
        category: 'style_organization',
        issue: `${inlineStyleCount} inline style objects detected`,
        suggestion: 'Extract styles to StyleSheet.create() for better performance',
      });
    }

    return suggestions;
  }
}
