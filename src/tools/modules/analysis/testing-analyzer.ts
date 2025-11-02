/**
 * Testing analysis utilities for React Native code
 */

export interface TestingIssue {
  file: string;
  type: string;
  severity: 'low';
  category: string;
  issue: string;
  suggestion: string;
}

export class TestingAnalyzer {
  /**
   * Analyze file for testing-related issues and suggestions
   */
  static analyzeFileTesting(content: string, fileName: string): TestingIssue[] {
    const suggestions: TestingIssue[] = [];

    // Components without tests
    if (
      (content.includes('export default') || content.includes('export const')) &&
      content.includes('React') &&
      !fileName.includes('.test.')
    ) {
      // This is a component file, check if test file exists
      suggestions.push({
        file: fileName,
        type: 'testing',
        severity: 'low',
        category: 'test_coverage',
        issue: 'Component may lack corresponding test file',
        suggestion: `Create ${fileName.replace(/\.(js|tsx?)$/, '.test.$1')} for this component`,
      });
    }

    // Missing test IDs for testing
    if (content.includes('<TouchableOpacity') && !content.includes('testID')) {
      suggestions.push({
        file: fileName,
        type: 'testing',
        severity: 'low',
        category: 'test_ids',
        issue: 'Interactive elements missing testID',
        suggestion: 'Add testID props for easier testing',
      });
    }

    // Complex components without prop validation
    if (
      content.includes('interface') &&
      content.includes('Props') &&
      !content.includes('PropTypes') &&
      !fileName.includes('.d.ts')
    ) {
      suggestions.push({
        file: fileName,
        type: 'testing',
        severity: 'low',
        category: 'prop_validation',
        issue: 'Component uses TypeScript but could benefit from runtime validation',
        suggestion: 'Consider PropTypes for runtime prop validation in development',
      });
    }

    return suggestions;
  }
}
