import { describe, it, expect } from '@jest/globals';
import { CodeQualityAnalyzer } from '../code-quality-analyzer.js';

describe('CodeQualityAnalyzer', () => {
  describe('analyzeFileCodeQuality', () => {
    describe('function length detection', () => {
      it('should detect functions longer than 50 lines', () => {
        const longFunction = `
function processData() {
${Array.from({ length: 55 }, (_, i) => `  console.log('Line ${i}');`).join('\n')}
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(longFunction, 'long.ts');

        expect(issues.length).toBeGreaterThan(0);
        const functionIssue = issues.find((i) => i.category === 'function_length');
        expect(functionIssue).toBeDefined();
        expect(functionIssue?.severity).toBe('medium');
        expect(functionIssue?.issue).toContain('longer than 50 lines');
      });

      it('should detect long arrow functions', () => {
        const longArrow = `
const processData = () => {
${Array.from({ length: 55 }, (_, i) => `  console.log('Line ${i}');`).join('\n')}
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(longArrow, 'arrow.ts');

        const functionIssue = issues.find((i) => i.category === 'function_length');
        expect(functionIssue).toBeDefined();
      });

      it('should detect long const function expressions', () => {
        const longConst = `
const myFunc = function() {
${Array.from({ length: 55 }, (_, i) => `  console.log('Line ${i}');`).join('\n')}
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(longConst, 'const.ts');

        const functionIssue = issues.find((i) => i.category === 'function_length');
        expect(functionIssue).toBeDefined();
      });

      it('should not flag short functions', () => {
        const shortFunction = `
function shortFunc() {
  console.log('Line 1');
  console.log('Line 2');
  return true;
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(shortFunction, 'short.ts');

        const functionIssue = issues.find((i) => i.category === 'function_length');
        expect(functionIssue).toBeUndefined();
      });

      it('should report the actual line count', () => {
        const longFunction = `
function processData() {
${Array.from({ length: 55 }, (_, i) => `  console.log('Line ${i}');`).join('\n')}
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(longFunction, 'long.ts');

        const functionIssue = issues.find((i) => i.category === 'function_length');
        expect(functionIssue?.issue).toMatch(/\(\d+ lines\)/);
      });
    });

    describe('props complexity detection', () => {
      it('should detect interfaces with more than 10 props', () => {
        const content = `
interface MyComponentProps {
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: string;
  prop5: number;
  prop6: boolean;
  prop7: string;
  prop8: number;
  prop9: boolean;
  prop10: string;
  prop11: number;
  prop12: boolean;
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'props.ts');

        expect(issues.length).toBeGreaterThan(0);
        const propsIssue = issues.find((i) => i.category === 'props_complexity');
        expect(propsIssue).toBeDefined();
        expect(propsIssue?.severity).toBe('medium');
        expect(propsIssue?.issue).toContain('12 props');
      });

      it('should not flag interfaces with 10 or fewer props', () => {
        const content = `
interface MyComponentProps {
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: string;
  prop5: number;
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'props.ts');

        const propsIssue = issues.find((i) => i.category === 'props_complexity');
        expect(propsIssue).toBeUndefined();
      });

      it('should detect multiple interfaces with too many props', () => {
        const content = `
interface FirstComponentProps {
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: string;
  prop5: number;
  prop6: boolean;
  prop7: string;
  prop8: number;
  prop9: boolean;
  prop10: string;
  prop11: number;
}

interface SecondComponentProps {
  a: string;
  b: number;
  c: boolean;
  d: string;
  e: number;
  f: boolean;
  g: string;
  h: number;
  i: boolean;
  j: string;
  k: number;
  l: boolean;
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'multi-props.ts');

        const propsIssues = issues.filter((i) => i.category === 'props_complexity');
        expect(propsIssues.length).toBe(2);
      });
    });

    describe('nested ternary detection', () => {
      it('should detect nested ternary operators', () => {
        const content = `
const value = condition1 ? value1 : condition2 ? value2 : value3;
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'ternary.ts');

        expect(issues.length).toBeGreaterThan(0);
        const ternaryIssue = issues.find((i) => i.category === 'readability');
        expect(ternaryIssue).toBeDefined();
        expect(ternaryIssue?.severity).toBe('low');
        expect(ternaryIssue?.issue).toContain('Nested ternary operators');
      });

      it('should detect nested ternary in JSX', () => {
        const content = `
return (
  <View>
    {condition1 ? <Text>A</Text> : condition2 ? <Text>B</Text> : <Text>C</Text>}
  </View>
);
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'jsx-ternary.tsx');

        const ternaryIssue = issues.find((i) => i.category === 'readability');
        expect(ternaryIssue).toBeDefined();
      });

      it('should not flag single ternary operators', () => {
        const content = `
const value = condition ? trueValue : falseValue;
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'simple-ternary.ts');

        const ternaryIssue = issues.find((i) => i.category === 'readability');
        expect(ternaryIssue).toBeUndefined();
      });
    });

    describe('magic numbers detection', () => {
      it('should detect multiple magic numbers', () => {
        const content = `
const width = 100;
const height = 200;
const padding = 16;
const margin = 24;
const fontSize = 14;
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'magic.ts');

        expect(issues.length).toBeGreaterThan(0);
        const magicIssue = issues.find((i) => i.category === 'magic_numbers');
        expect(magicIssue).toBeDefined();
        expect(magicIssue?.severity).toBe('low');
        expect(magicIssue?.issue).toContain('magic numbers');
      });

      it('should require more than 3 magic numbers to flag', () => {
        const content = `
const width = 100;
const height = 200;
const padding = 16;
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'few-magic.ts');

        const magicIssue = issues.find((i) => i.category === 'magic_numbers');
        expect(magicIssue).toBeUndefined();
      });

      it('should detect magic numbers in calculations', () => {
        const content = `
const area = width * height * 100;
const volume = area * 200;
const adjusted = volume + 50 - 25;
const final = adjusted / 75;
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'calc.ts');

        const magicIssue = issues.find((i) => i.category === 'magic_numbers');
        expect(magicIssue).toBeDefined();
      });

      it('should not count single-digit numbers as magic numbers', () => {
        const content = `
const a = 1;
const b = 2;
const c = 3;
const d = 4;
const e = 5;
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'single-digit.ts');

        const magicIssue = issues.find((i) => i.category === 'magic_numbers');
        expect(magicIssue).toBeUndefined();
      });
    });

    describe('error handling detection', () => {
      it('should detect fetch without error handling', () => {
        const content = `
async function fetchData() {
  const response = await fetch('https://api.example.com');
  const data = await response.json();
  return data;
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'no-error.ts');

        expect(issues.length).toBeGreaterThan(0);
        const errorIssue = issues.find((i) => i.category === 'error_handling');
        expect(errorIssue).toBeDefined();
        expect(errorIssue?.severity).toBe('medium');
        expect(errorIssue?.issue).toContain('without error handling');
      });

      it('should not flag fetch with try-catch', () => {
        const content = `
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'with-catch.ts');

        const errorIssue = issues.find((i) => i.category === 'error_handling');
        expect(errorIssue).toBeUndefined();
      });

      it('should not flag fetch with .catch()', () => {
        const content = `
function fetchData() {
  fetch('https://api.example.com')
    .then(response => response.json())
    .catch(error => console.error('Error:', error));
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'with-dot-catch.ts');

        const errorIssue = issues.find((i) => i.category === 'error_handling');
        expect(errorIssue).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle empty content', () => {
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality('', 'empty.ts');
        expect(issues).toEqual([]);
      });

      it('should handle content with only comments', () => {
        const content = `
// This is a comment
/* Multi-line comment */
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'comments.ts');
        expect(issues).toEqual([]);
      });

      it('should detect multiple issue types in same file', () => {
        const longFunction = Array.from(
          { length: 55 },
          (_, i) => `  console.log('Line ${i}');`
        ).join('\n');
        const content = `
interface MyProps {
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: string;
  prop5: number;
  prop6: boolean;
  prop7: string;
  prop8: number;
  prop9: boolean;
  prop10: string;
  prop11: number;
}

function longFunc() {
${longFunction}
}

const value = cond1 ? val1 : cond2 ? val2 : val3;

const width = 100;
const height = 200;
const padding = 16;
const margin = 24;

async function getData() {
  await fetch('https://api.example.com');
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'multiple.ts');

        expect(issues.length).toBeGreaterThanOrEqual(5);

        const categories = issues.map((i) => i.category);
        expect(categories).toContain('function_length');
        expect(categories).toContain('props_complexity');
        expect(categories).toContain('readability');
        expect(categories).toContain('magic_numbers');
        expect(categories).toContain('error_handling');
      });
    });
  });

  describe('analyzeFileRefactoring', () => {
    describe('duplicate imports detection', () => {
      it('should detect duplicate import statements', () => {
        const content = `
import React from 'react';
import { View } from 'react-native';
import React from 'react';
        `;
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring(content, 'duplicates.ts');

        expect(issues.length).toBeGreaterThan(0);
        const duplicateIssue = issues.find((i) => i.category === 'duplicate_code');
        expect(duplicateIssue).toBeDefined();
        expect(duplicateIssue?.severity).toBe('low');
        expect(duplicateIssue?.issue).toContain('Duplicate import');
      });

      it('should not flag unique imports', () => {
        const content = `
import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './components/Button';
        `;
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring(content, 'unique.ts');

        const duplicateIssue = issues.find((i) => i.category === 'duplicate_code');
        expect(duplicateIssue).toBeUndefined();
      });
    });

    describe('large file detection', () => {
      it('should detect files larger than 300 lines', () => {
        const content = Array.from({ length: 350 }, (_, i) => `console.log('Line ${i}');`).join(
          '\n'
        );
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring(content, 'large.ts');

        expect(issues.length).toBeGreaterThan(0);
        const sizeIssue = issues.find((i) => i.category === 'component_size');
        expect(sizeIssue).toBeDefined();
        expect(sizeIssue?.severity).toBe('medium');
        expect(sizeIssue?.issue).toContain('very large');
        expect(sizeIssue?.issue).toContain('350 lines');
      });

      it('should not flag files with 300 or fewer lines', () => {
        const content = Array.from({ length: 250 }, (_, i) => `console.log('Line ${i}');`).join(
          '\n'
        );
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring(content, 'medium.ts');

        const sizeIssue = issues.find((i) => i.category === 'component_size');
        expect(sizeIssue).toBeUndefined();
      });
    });

    describe('class component conversion detection', () => {
      it('should detect class components without lifecycle methods', () => {
        const content = `
import React from 'react';
import { View, Text } from 'react-native';

class MyComponent extends React.Component {
  render() {
    return (
      <View>
        <Text>Hello</Text>
      </View>
    );
  }
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring(content, 'class.tsx');

        expect(issues.length).toBeGreaterThan(0);
        const classIssue = issues.find((i) => i.category === 'modernization');
        expect(classIssue).toBeDefined();
        expect(classIssue?.severity).toBe('low');
        expect(classIssue?.issue).toContain('could be converted to functional');
      });

      it('should detect class components using "extends Component"', () => {
        const content = `
import React, { Component } from 'react';
import { View, Text } from 'react-native';

class MyComponent extends Component {
  render() {
    return <View><Text>Hello</Text></View>;
  }
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring(content, 'component.tsx');

        const classIssue = issues.find((i) => i.category === 'modernization');
        expect(classIssue).toBeDefined();
      });

      it('should not flag class components with componentDidMount', () => {
        const content = `
class MyComponent extends React.Component {
  componentDidMount() {
    console.log('Mounted');
  }
  render() {
    return <View />;
  }
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring(content, 'lifecycle.tsx');

        const classIssue = issues.find((i) => i.category === 'modernization');
        expect(classIssue).toBeUndefined();
      });

      it('should not flag class components with componentWillUnmount', () => {
        const content = `
class MyComponent extends React.Component {
  componentWillUnmount() {
    console.log('Unmounting');
  }
  render() {
    return <View />;
  }
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring(content, 'unmount.tsx');

        const classIssue = issues.find((i) => i.category === 'modernization');
        expect(classIssue).toBeUndefined();
      });

      it('should not flag class components with shouldComponentUpdate', () => {
        const content = `
class MyComponent extends React.Component {
  shouldComponentUpdate() {
    return true;
  }
  render() {
    return <View />;
  }
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring(content, 'should-update.tsx');

        const classIssue = issues.find((i) => i.category === 'modernization');
        expect(classIssue).toBeUndefined();
      });
    });

    describe('inline styles detection', () => {
      it('should detect excessive inline styles', () => {
        const content = `
export const MyComponent = () => (
  <View>
    <Text style={{ color: 'red' }}>Text 1</Text>
    <Text style={{ fontSize: 16 }}>Text 2</Text>
    <Text style={{ fontWeight: 'bold' }}>Text 3</Text>
    <Text style={{ marginTop: 10 }}>Text 4</Text>
  </View>
);
        `;
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring(content, 'inline.tsx');

        expect(issues.length).toBeGreaterThan(0);
        const styleIssue = issues.find((i) => i.category === 'style_organization');
        expect(styleIssue).toBeDefined();
        expect(styleIssue?.severity).toBe('low');
        expect(styleIssue?.issue).toContain('4 inline style objects');
        expect(styleIssue?.suggestion).toContain('StyleSheet.create()');
      });

      it('should not flag 3 or fewer inline styles', () => {
        const content = `
export const MyComponent = () => (
  <View>
    <Text style={{ color: 'red' }}>Text 1</Text>
    <Text style={{ fontSize: 16 }}>Text 2</Text>
    <Text style={{ fontWeight: 'bold' }}>Text 3</Text>
  </View>
);
        `;
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring(content, 'few-inline.tsx');

        const styleIssue = issues.find((i) => i.category === 'style_organization');
        expect(styleIssue).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle empty content', () => {
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring('', 'empty.ts');
        expect(issues).toEqual([]);
      });

      it('should handle content with no issues', () => {
        const content = `
import React from 'react';
import { View, Text } from 'react-native';

export const SmallComponent = () => (
  <View>
    <Text>Hello World</Text>
  </View>
);
        `;
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring(content, 'clean.tsx');
        expect(issues).toEqual([]);
      });

      it('should detect multiple refactoring issues', () => {
        const largeContent = Array.from(
          { length: 350 },
          (_, i) => `console.log('Line ${i}');`
        ).join('\n');
        const content = `
import React from 'react';
import { View } from 'react-native';
import React from 'react';

${largeContent}

class MyComponent extends React.Component {
  render() {
    return (
      <View>
        <Text style={{ color: 'red' }}>Text 1</Text>
        <Text style={{ fontSize: 16 }}>Text 2</Text>
        <Text style={{ fontWeight: 'bold' }}>Text 3</Text>
        <Text style={{ marginTop: 10 }}>Text 4</Text>
      </View>
    );
  }
}
        `;
        const issues = CodeQualityAnalyzer.analyzeFileRefactoring(content, 'multi-refactor.tsx');

        expect(issues.length).toBeGreaterThanOrEqual(4);

        const categories = issues.map((i) => i.category);
        expect(categories).toContain('duplicate_code');
        expect(categories).toContain('component_size');
        expect(categories).toContain('modernization');
        expect(categories).toContain('style_organization');
      });
    });
  });

  describe('suggestion messages', () => {
    it('should provide helpful suggestion for long functions', () => {
      const longFunction = `
function processData() {
${Array.from({ length: 55 }, (_, i) => `  console.log('Line ${i}');`).join('\n')}
}
      `;
      const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(longFunction, 'long.ts');

      const functionIssue = issues.find((i) => i.category === 'function_length');
      expect(functionIssue?.suggestion).toContain('smaller, focused functions');
    });

    it('should provide helpful suggestion for too many props', () => {
      const content = `
interface MyComponentProps {
  prop1: string; prop2: number; prop3: boolean; prop4: string; prop5: number;
  prop6: boolean; prop7: string; prop8: number; prop9: boolean; prop10: string;
  prop11: number;
}
      `;
      const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'props.ts');

      const propsIssue = issues.find((i) => i.category === 'props_complexity');
      expect(propsIssue?.suggestion).toContain('Group related props');
    });

    it('should provide helpful suggestion for nested ternary', () => {
      const content = `const value = a ? b : c ? d : e;`;
      const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'ternary.ts');

      const ternaryIssue = issues.find((i) => i.category === 'readability');
      expect(ternaryIssue?.suggestion).toContain('if-else statements');
    });

    it('should provide helpful suggestion for magic numbers', () => {
      const content = `const a = 100; const b = 200; const c = 300; const d = 400;`;
      const issues = CodeQualityAnalyzer.analyzeFileCodeQuality(content, 'magic.ts');

      const magicIssue = issues.find((i) => i.category === 'magic_numbers');
      expect(magicIssue?.suggestion).toContain('named constants');
    });
  });
});
