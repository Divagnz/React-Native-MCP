import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ComponentAnalyzer } from '../component-analyzer.js';
import { componentAnalysisCache } from '../../../../utils/cache.js';

// Mock the cache
jest.mock('../../../../utils/cache.js', () => ({
  componentAnalysisCache: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

describe('ComponentAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeComponent', () => {
    it('should return non-component message for non-React code', () => {
      const code = `
const foo = 'bar';
export default foo;
      `;

      const result = ComponentAnalyzer.analyzeComponent(code);

      expect(result).toContain('does not appear to be a React Native component');
    });

    it('should analyze a basic React Native component', () => {
      const code = `
import React from 'react';
import { View, Text } from 'react-native';

export default function MyComponent() {
  return (
    <View>
      <Text>Hello World</Text>
    </View>
  );
}
      `;

      const result = ComponentAnalyzer.analyzeComponent(code);

      expect(result).toContain('React Native Component Analysis');
      expect(result).toContain('No major issues found');
    });

    it('should detect missing useCallback for event handlers', () => {
      const code = `
import React, { useState, useEffect } from 'react';
import { View, Button } from 'react-native';

export default function MyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // some effect
  }, []);

  const handlePress = () => setCount(count + 1);

  return (
    <View>
      <Button title="Press" onPress={handlePress} />
    </View>
  );
}
      `;

      const result = ComponentAnalyzer.analyzeComponent(code);

      expect(result).toContain('useCallback');
      expect(result).toContain('re-renders');
    });

    it('should detect FlatList without keyExtractor', () => {
      const code = `
import React from 'react';
import { FlatList, Text } from 'react-native';

export default function MyComponent() {
  const data = [{ id: 1 }, { id: 2 }];

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <Text>{item.id}</Text>}
    />
  );
}
      `;

      const result = ComponentAnalyzer.analyzeComponent(code);

      expect(result).toContain('keyExtractor');
      expect(result).toContain('rendering issues');
    });

    it('should detect ScrollView with map', () => {
      const code = `
import React from 'react';
import { ScrollView, Text } from 'react-native';

export default function MyComponent() {
  const items = [1, 2, 3];

  return (
    <ScrollView>
      {items.map(item => <Text key={item}>{item}</Text>)}
    </ScrollView>
  );
}
      `;

      const result = ComponentAnalyzer.analyzeComponent(code);

      expect(result).toContain('ScrollView');
      expect(result).toContain('performance');
      expect(result).toContain('FlatList');
    });

    it('should recommend StyleSheet.create over inline styles', () => {
      const code = `
import React from 'react';
import { View, Text } from 'react-native';

export default function MyComponent() {
  return (
    <View style={{ padding: 10, backgroundColor: 'blue' }}>
      <Text>Hello</Text>
    </View>
  );
}
      `;

      const result = ComponentAnalyzer.analyzeComponent(code);

      expect(result).toContain('StyleSheet.create');
      expect(result).toContain('inline styles');
    });

    it('should praise use of StyleSheet.create', () => {
      const code = `
import React from 'react';
import { View, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1 }
});

export default function MyComponent() {
  return <View style={styles.container} />;
}
      `;

      const result = ComponentAnalyzer.analyzeComponent(code);

      expect(result).toContain('Good use of StyleSheet.create');
    });

    it('should detect hardcoded API keys', () => {
      const code = `
import React from 'react';
import { View } from 'react-native';

const API_KEY = 'abc123def456ghi789jkl012';

export default function MyComponent() {
  return <View />;
}
      `;

      const result = ComponentAnalyzer.analyzeComponent(code);

      expect(result).toContain('API key');
      expect(result).toContain('security risk');
    });

    it('should detect sensitive console logging', () => {
      const code = `
import React from 'react';
import { View } from 'react-native';

export default function MyComponent() {
  const password = 'secret123';
  console.log('Password:', password);
  return <View />;
}
      `;

      const result = ComponentAnalyzer.analyzeComponent(code);

      expect(result).toContain('Console logging');
      expect(result).toContain('sensitive');
    });

    it('should detect HTTP instead of HTTPS', () => {
      const code = `
import React from 'react';
import { View } from 'react-native';

export default function MyComponent() {
  fetch('http://api.example.com/data');
  return <View />;
}
      `;

      const result = ComponentAnalyzer.analyzeComponent(code);

      expect(result).toContain('HTTP');
      expect(result).toContain('HTTPS');
    });

    it('should detect setInterval without clearInterval', () => {
      const code = `
import React from 'react';
import { View } from 'react-native';

export default function MyComponent() {
  setInterval(() => console.log('tick'), 1000);
  return <View />;
}
      `;

      const result = ComponentAnalyzer.analyzeComponent(code);

      expect(result).toContain('setInterval');
      expect(result).toContain('memory leak');
      expect(result).toContain('clearInterval');
    });

    it('should include component type in analysis', () => {
      const code = `
import React from 'react';
import { View } from 'react-native';

export default function MyComponent() {
  return <View />;
}
      `;

      const result = ComponentAnalyzer.analyzeComponent(code, 'Screen');

      expect(result).toContain('Component Type:');
      expect(result).toContain('Screen');
    });

    it('should use cache for repeated analysis', () => {
      const mockGet = componentAnalysisCache.get as jest.MockedFunction<
        typeof componentAnalysisCache.get
      >;
      const mockSet = componentAnalysisCache.set as jest.MockedFunction<
        typeof componentAnalysisCache.set
      >;

      const code = `
import React from 'react';
import { View } from 'react-native';

export default function MyComponent() {
  return <View />;
}
      `;

      // First call - no cache
      mockGet.mockReturnValue(null);
      const result1 = ComponentAnalyzer.analyzeComponent(code);
      expect(mockSet).toHaveBeenCalled();

      // Second call - use cache
      mockGet.mockReturnValue(result1);
      const result2 = ComponentAnalyzer.analyzeComponent(code);
      expect(result2).toBe(result1);
    });
  });

  describe('addSecurityIssues', () => {
    it('should detect API key patterns', () => {
      const code = 'const apiKey = "sk_live_1234567890abcdef"';
      const issues: string[] = [];
      const suggestions: string[] = [];

      ComponentAnalyzer.addSecurityIssues(code, issues, suggestions);

      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((i) => i.includes('API Key'))).toBe(true);
    });

    it('should detect eval() usage', () => {
      const code = 'eval("console.log(\\"hello\\")")';
      const issues: string[] = [];
      const suggestions: string[] = [];

      ComponentAnalyzer.addSecurityIssues(code, issues, suggestions);

      expect(issues.some((i) => i.includes('eval()'))).toBe(true);
      expect(suggestions.some((s) => s.includes('JSON.parse()'))).toBe(true);
    });

    it('should detect dangerouslySetInnerHTML', () => {
      const code = '<div dangerouslySetInnerHTML={{ __html: content }} />';
      const issues: string[] = [];
      const suggestions: string[] = [];

      ComponentAnalyzer.addSecurityIssues(code, issues, suggestions);

      expect(issues.some((i) => i.includes('dangerouslySetInnerHTML'))).toBe(true);
      expect(issues.some((i) => i.includes('XSS'))).toBe(true);
    });

    it('should skip example/placeholder values', () => {
      const code = 'const apiKey = "your_api_key_here"';
      const issues: string[] = [];
      const suggestions: string[] = [];

      ComponentAnalyzer.addSecurityIssues(code, issues, suggestions);

      expect(issues.length).toBe(0);
    });
  });

  describe('addMemoryLeakIssues', () => {
    it('should detect addEventListener without removeEventListener', () => {
      const code = 'window.addEventListener("resize", handleResize)';
      const issues: string[] = [];
      const suggestions: string[] = [];

      ComponentAnalyzer.addMemoryLeakIssues(code, issues, suggestions);

      expect(issues.some((i) => i.includes('Event listeners'))).toBe(true);
      expect(suggestions.some((s) => s.includes('useEffect cleanup'))).toBe(true);
    });

    it('should detect large state objects', () => {
      const code = `
const [state, setState] = useState({
  field1: 'value1',
  field2: 'value2',
  field3: 'value3',
  field4: 'value4',
  field5: 'value5',
  field6: 'value6'
});
      `;
      const issues: string[] = [];
      const suggestions: string[] = [];

      ComponentAnalyzer.addMemoryLeakIssues(code, issues, suggestions);

      expect(suggestions.some((s) => s.includes('useReducer'))).toBe(true);
    });
  });

  describe('addPerformanceIssues', () => {
    it('should detect wildcard imports', () => {
      const code = 'import * as React from "react"';
      const issues: string[] = [];
      const suggestions: string[] = [];

      ComponentAnalyzer.addPerformanceIssues(code, issues, suggestions);

      expect(suggestions.some((s) => s.includes('named imports'))).toBe(true);
      expect(suggestions.some((s) => s.includes('tree shaking'))).toBe(true);
    });

    it('should detect animations without useNativeDriver', () => {
      const code = 'Animated.timing(value, { duration: 300 }).start()';
      const issues: string[] = [];
      const suggestions: string[] = [];

      ComponentAnalyzer.addPerformanceIssues(code, issues, suggestions);

      expect(suggestions.some((s) => s.includes('useNativeDriver'))).toBe(true);
    });

    it('should detect heavy libraries', () => {
      const code = 'import _ from "lodash"';
      const issues: string[] = [];
      const suggestions: string[] = [];

      ComponentAnalyzer.addPerformanceIssues(code, issues, suggestions);

      expect(suggestions.some((s) => s.includes('lodash'))).toBe(true);
      expect(suggestions.some((s) => s.includes('lighter alternatives'))).toBe(true);
    });
  });
});
