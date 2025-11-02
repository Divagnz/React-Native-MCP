/**
 * Deprecated features and accessibility analysis for React Native code
 */

export interface DeprecatedIssue {
  file: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  suggestion: string;
}

export interface AccessibilityIssue {
  file: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  suggestion: string;
}

export class DeprecatedFeaturesAnalyzer {
  /**
   * Analyze file for deprecated React Native APIs and patterns
   */
  static analyzeFileDeprecated(content: string, fileName: string): DeprecatedIssue[] {
    const issues: DeprecatedIssue[] = [];

    // Deprecated React Native components/APIs
    const deprecatedAPIs = [
      { old: 'ListView', new: 'FlatList or SectionList', severity: 'high' as const },
      { old: 'Navigator', new: 'React Navigation', severity: 'high' as const },
      { old: 'TabBarIOS', new: 'React Navigation Bottom Tabs', severity: 'high' as const },
      { old: 'ToolbarAndroid', new: 'React Navigation Header', severity: 'medium' as const },
      { old: 'ViewPagerAndroid', new: 'react-native-pager-view', severity: 'medium' as const },
      {
        old: 'DatePickerIOS',
        new: '@react-native-community/datetimepicker',
        severity: 'medium' as const,
      },
      { old: 'PickerIOS', new: '@react-native-picker/picker', severity: 'medium' as const },
      { old: 'SliderIOS', new: '@react-native-community/slider', severity: 'medium' as const },
      { old: 'SwitchIOS', new: 'Switch', severity: 'low' as const },
      { old: 'SwitchAndroid', new: 'Switch', severity: 'low' as const },
    ];

    deprecatedAPIs.forEach((api) => {
      if (content.includes(api.old)) {
        issues.push({
          file: fileName,
          type: 'deprecated',
          severity: api.severity,
          category: 'deprecated_api',
          issue: `${api.old} is deprecated`,
          suggestion: `Replace ${api.old} with ${api.new}`,
        });
      }
    });

    // Deprecated React patterns
    if (content.includes('componentWillMount')) {
      issues.push({
        file: fileName,
        type: 'deprecated',
        severity: 'high',
        category: 'lifecycle',
        issue: 'componentWillMount is deprecated',
        suggestion: 'Use componentDidMount or useEffect hook',
      });
    }

    if (content.includes('componentWillReceiveProps')) {
      issues.push({
        file: fileName,
        type: 'deprecated',
        severity: 'high',
        category: 'lifecycle',
        issue: 'componentWillReceiveProps is deprecated',
        suggestion: 'Use componentDidUpdate or useEffect hook',
      });
    }

    // Old React Native versions syntax
    if (content.includes('React.createClass')) {
      issues.push({
        file: fileName,
        type: 'deprecated',
        severity: 'critical',
        category: 'syntax',
        issue: 'React.createClass is deprecated',
        suggestion: 'Convert to ES6 class or functional component',
      });
    }

    return issues;
  }

  /**
   * Analyze file for accessibility issues
   */
  static analyzeFileAccessibility(content: string, fileName: string): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Missing accessibility labels
    if (content.includes('<TouchableOpacity') && !content.includes('accessibilityLabel')) {
      issues.push({
        file: fileName,
        type: 'accessibility',
        severity: 'medium',
        category: 'labels',
        issue: 'TouchableOpacity missing accessibilityLabel',
        suggestion: 'Add accessibilityLabel for screen readers',
      });
    }

    if (content.includes('<Image') && !content.includes('accessibilityLabel')) {
      issues.push({
        file: fileName,
        type: 'accessibility',
        severity: 'medium',
        category: 'labels',
        issue: 'Image missing accessibilityLabel',
        suggestion: 'Add accessibilityLabel or mark as decorative',
      });
    }

    // Missing accessibility roles
    if (
      (content.includes('<TouchableOpacity') || content.includes('<Pressable')) &&
      !content.includes('accessibilityRole')
    ) {
      issues.push({
        file: fileName,
        type: 'accessibility',
        severity: 'low',
        category: 'roles',
        issue: 'Interactive element missing accessibilityRole',
        suggestion: 'Add accessibilityRole="button" for buttons',
      });
    }

    // Text without accessibility considerations
    if (
      content.includes('<Text') &&
      content.includes('fontSize') &&
      !content.includes('allowFontScaling')
    ) {
      issues.push({
        file: fileName,
        type: 'accessibility',
        severity: 'low',
        category: 'font_scaling',
        issue: 'Text component may not respect font scaling',
        suggestion: 'Consider allowFontScaling prop for accessibility',
      });
    }

    return issues;
  }
}
