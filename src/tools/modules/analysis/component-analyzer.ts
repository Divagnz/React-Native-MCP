/**
 * Component analysis for React Native components
 * Analyzes code for best practices, performance, security, and quality issues
 */

export class ComponentAnalyzer {
  /**
   * Analyze a React Native component for best practices and issues
   */
  static analyzeComponent(code: string, type?: string): string {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // More accurate React component detection
    const hasReactImport =
      /import\s+.*React.*from\s+['"]react['"]|from\s+['"]react-native['"]/.test(code);
    const hasExport =
      /export\s+default\s+(?:function|class|const)|export\s+(?:function|const)|export\s+default\s+\w+/.test(
        code
      );
    const hasJSXElements = /<[A-Z]\w*[\s\S]*?>/.test(code);
    const isReactComponent = hasReactImport && hasExport && hasJSXElements;

    if (!isReactComponent) {
      return '## Analysis Result\n\nThis does not appear to be a React Native component.';
    }

    // More precise hook usage analysis
    const hasUseState = /useState\s*\(/.test(code);
    const hasUseEffect = /useEffect\s*\(/.test(code);
    const hasUseCallback = /useCallback\s*\(/.test(code);
    const hasOnPress = /onPress\s*=/.test(code);

    if (hasUseState && hasUseEffect && hasOnPress && !hasUseCallback) {
      // Check if onPress is actually inside a function component
      const funcComponentRegex =
        /(?:function\s+\w+|const\s+\w+\s*=\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*=>))[\s\S]*?onPress/;
      if (funcComponentRegex.test(code)) {
        issues.push('Event handlers may cause unnecessary re-renders without useCallback');
        suggestions.push('Consider wrapping event handlers in useCallback to optimize performance');
      }
    }

    // More accurate FlatList analysis
    const flatListMatch = code.match(/<FlatList[\s\S]*?(?:\/\>|<\/FlatList>)/);
    if (flatListMatch) {
      const flatListProps = flatListMatch[0];
      if (!flatListProps.includes('keyExtractor')) {
        issues.push('FlatList missing keyExtractor prop which can cause rendering issues');
        suggestions.push(
          'Add keyExtractor={(item, index) => item.id || index.toString()} to FlatList'
        );
      }
      if (!flatListProps.includes('getItemLayout') && flatListProps.includes('data=')) {
        suggestions.push(
          'Consider adding getItemLayout if all items have the same height for better performance'
        );
      }
    }

    // More precise ScrollView with map detection
    const scrollViewWithMapRegex = /<ScrollView[\s\S]*?>[\s\S]*?\.map\s*\([\s\S]*?<\/ScrollView>/;
    if (scrollViewWithMapRegex.test(code)) {
      issues.push(
        'Using .map() inside ScrollView can cause performance issues with large datasets'
      );
      suggestions.push(
        'Replace ScrollView + .map() with FlatList for better performance with dynamic lists'
      );
    }

    // Style analysis improvements
    const hasStyleSheetCreate = /StyleSheet\.create\s*\(/.test(code);
    const hasInlineStyles = /style\s*=\s*\{\{/.test(code);

    if (hasInlineStyles && !hasStyleSheetCreate) {
      suggestions.push(
        'Consider using StyleSheet.create instead of inline styles for better performance'
      );
    }

    if (hasStyleSheetCreate) {
      suggestions.push('✅ Good use of StyleSheet.create for optimized styling');
    }

    // Security analysis - inline for immediate effect
    // Check for hardcoded secrets
    if (/(?:api[_-]?key|apikey)\s*[:=]\s*["'][^"']{10,}["']/gi.test(code)) {
      issues.push('Potential hardcoded API key detected - security risk');
      suggestions.push('Move API keys to environment variables or secure storage');
    }

    // Check for sensitive logging
    if (/console\.log.*(?:password|pwd|secret|token|key|auth|credential)/gi.test(code)) {
      issues.push('Console logging may expose sensitive data');
      suggestions.push('Remove or sanitize console statements containing sensitive information');
    }

    // Check for HTTP requests
    if (/fetch\s*\(\s*["']http:\/\//.test(code)) {
      issues.push('HTTP requests detected instead of HTTPS');
      suggestions.push('Use HTTPS for all network requests to ensure data encryption');
    }

    // Memory leak detection
    if (/setInterval\s*\(/.test(code) && !/clearInterval/.test(code)) {
      issues.push('setInterval without clearInterval - potential memory leak');
      suggestions.push('Clear intervals in useEffect cleanup or componentWillUnmount');
    }

    // Generate analysis report
    let analysis = '## React Native Component Analysis\\n\\n';

    if (type) {
      analysis += `**Component Type:** ${type}\\n\\n`;
    }

    if (issues.length > 0) {
      analysis += '### Issues Found:\\n';
      issues.forEach((issue, index) => {
        analysis += `${index + 1}. ${issue}\\n`;
      });
      analysis += '\\n';
    }

    if (suggestions.length > 0) {
      analysis += '### Suggestions:\\n';
      suggestions.forEach((suggestion, index) => {
        analysis += `${index + 1}. ${suggestion}\\n`;
      });
      analysis += '\\n';
    }

    if (issues.length === 0) {
      analysis += '### ✅ No major issues found\\n\\n';
    }

    analysis += '### Additional Best Practices:\\n';
    analysis += '- Use TypeScript for better type safety\\n';
    analysis += '- Implement proper error boundaries\\n';
    analysis += '- Follow React Native naming conventions\\n';
    analysis += '- Use memo() for expensive components\\n';
    analysis += '- Implement proper accessibility props\\n';

    return analysis;
  }

  /**
   * Add security issues to the issues and suggestions arrays
   */
  static addSecurityIssues(code: string, issues: string[], suggestions: string[]): void {
    // Enhanced secrets detection
    const secretPatterns = [
      { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][^"']{10,}["']/gi, type: 'API Key' },
      { pattern: /(?:secret|password|pwd)\s*[:=]\s*["'][^"']{6,}["']/gi, type: 'Secret/Password' },
      { pattern: /(?:token|auth[_-]?token)\s*[:=]\s*["'][^"']{10,}["']/gi, type: 'Auth Token' },
      {
        pattern: /(?:private[_-]?key|privatekey)\s*[:=]\s*["'][^"']{20,}["']/gi,
        type: 'Private Key',
      },
      { pattern: /["'][A-Za-z0-9+/]{40,}={0,2}["']/g, type: 'Base64 encoded secret' },
    ];

    secretPatterns.forEach(({ pattern, type }) => {
      const matches = code.match(pattern);
      if (matches) {
        const validMatches = matches.filter(
          (match) =>
            !match.includes('example') &&
            !match.includes('placeholder') &&
            !match.includes('your_') &&
            !match.includes('YOUR_') &&
            !match.includes('###')
        );

        if (validMatches.length > 0) {
          issues.push(`Potential hardcoded ${type} detected - security risk`);
          suggestions.push(`Move ${type.toLowerCase()} to environment variables or secure storage`);
        }
      }
    });

    // Sensitive logging detection
    const sensitiveLogPatterns = [
      /console\.log.*(?:password|pwd|secret|token|key|auth|credential)/gi,
      /console\.(?:warn|error|info).*(?:password|pwd|secret|token|key|auth|credential)/gi,
    ];

    if (sensitiveLogPatterns.some((pattern) => pattern.test(code))) {
      issues.push('Console logging may expose sensitive data');
      suggestions.push('Remove or sanitize console statements containing sensitive information');
    }

    // Code injection detection
    if (/eval\s*\(/.test(code)) {
      issues.push('eval() usage detected - critical security risk');
      suggestions.push('Replace eval() with safer alternatives like JSON.parse()');
    }

    // Network security
    if (/(?:fetch|axios\.(?:get|post|put|delete))\s*\(\s*["']http:\/\//.test(code)) {
      issues.push('HTTP requests detected instead of HTTPS');
      suggestions.push('Use HTTPS for all network requests to ensure data encryption');
    }

    // XSS vulnerabilities
    if (/dangerouslySetInnerHTML\s*=\s*\{\{/.test(code)) {
      issues.push('dangerouslySetInnerHTML usage detected - XSS risk');
      suggestions.push('Sanitize HTML content or use safer alternatives');
    }
  }

  /**
   * Add memory leak issues to the issues and suggestions arrays
   */
  static addMemoryLeakIssues(code: string, issues: string[], suggestions: string[]): void {
    // setInterval without clearInterval
    if (/setInterval\s*\(/.test(code) && !/clearInterval/.test(code)) {
      issues.push('setInterval without clearInterval - potential memory leak');
      suggestions.push('Clear intervals in useEffect cleanup or componentWillUnmount');
    }

    // addEventListener without removeEventListener
    if (/addEventListener\s*\(/.test(code) && !/removeEventListener/.test(code)) {
      issues.push('Event listeners without cleanup - potential memory leak');
      suggestions.push('Remove event listeners in useEffect cleanup or componentWillUnmount');
    }

    // Large state objects
    if (/useState\s*\(\s*\{[\s\S]{100,}\}\s*\)/.test(code)) {
      suggestions.push(
        'Large objects in useState detected - consider breaking down or using useReducer'
      );
    }
  }

  /**
   * Add performance issues to the issues and suggestions arrays
   */
  static addPerformanceIssues(code: string, issues: string[], suggestions: string[]): void {
    // Wildcard imports
    const wildcardImports = code.match(/import\s+\*\s+as\s+\w+\s+from\s+["'][^"']+["']/g);
    if (wildcardImports && wildcardImports.length > 0) {
      suggestions.push(
        'Consider using named imports instead of wildcard imports for better tree shaking'
      );
    }

    // Animation performance
    if (/Animated\./.test(code) && !/useNativeDriver/.test(code)) {
      suggestions.push('Add useNativeDriver: true to animations for better performance');
    }

    // Heavy libraries
    const heavyLibraries = ['lodash', 'moment'];
    heavyLibraries.forEach((lib) => {
      if (new RegExp(`import.*from\\s+["']${lib}["']`, 'g').test(code)) {
        suggestions.push(
          `Heavy library '${lib}' detected - consider lighter alternatives or specific imports`
        );
      }
    });
  }
}
