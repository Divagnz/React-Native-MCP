import { describe, it, expect } from '@jest/globals';
import { TestingAnalyzer } from '../testing-analyzer.js';

describe('TestingAnalyzer', () => {
  describe('analyzeFileTesting', () => {
    describe('test file detection', () => {
      it('should detect component with export default missing test', () => {
        const content = `
import React from 'react';
import { View, Text } from 'react-native';

export default function MyComponent() {
  return (
    <View>
      <Text>Hello</Text>
    </View>
  );
}
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'MyComponent.tsx');

        expect(issues.length).toBeGreaterThan(0);
        const testIssue = issues.find((i) => i.category === 'test_coverage');
        expect(testIssue).toBeDefined();
        expect(testIssue?.severity).toBe('low');
        expect(testIssue?.issue).toContain('may lack corresponding test file');
        expect(testIssue?.suggestion).toContain('.test.');
      });

      it('should detect component with export const missing test', () => {
        const content = `
import React from 'react';
import { View } from 'react-native';

export const MyComponent = () => {
  return <View />;
};
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'MyComponent.tsx');

        const testIssue = issues.find((i) => i.category === 'test_coverage');
        expect(testIssue).toBeDefined();
      });

      it('should not flag test files themselves', () => {
        const content = `
import React from 'react';
import { render } from '@testing-library/react-native';
import MyComponent from './MyComponent';

export const testSetup = () => {
  return render(<MyComponent />);
};
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'MyComponent.test.tsx');

        const testIssue = issues.find((i) => i.category === 'test_coverage');
        expect(testIssue).toBeUndefined();
      });

      it('should not flag non-React exports', () => {
        const content = `
export const API_URL = 'https://api.example.com';
export default API_URL;
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'config.ts');

        const testIssue = issues.find((i) => i.category === 'test_coverage');
        expect(testIssue).toBeUndefined();
      });

      it('should suggest correct test filename for .tsx files', () => {
        const content = `
import React from 'react';
export const MyComponent = () => <View />;
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'MyComponent.tsx');

        const testIssue = issues.find((i) => i.category === 'test_coverage');
        expect(testIssue?.suggestion).toContain('MyComponent.test.tsx');
      });

      it('should suggest correct test filename for .ts files', () => {
        const content = `
import React from 'react';
export default function useCustomHook() {
  return {};
}
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'useCustomHook.ts');

        const testIssue = issues.find((i) => i.category === 'test_coverage');
        expect(testIssue?.suggestion).toContain('useCustomHook.test.ts');
      });

      it('should suggest correct test filename for .js files', () => {
        const content = `
import React from 'react';
export const Component = () => <View />;
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Component.js');

        const testIssue = issues.find((i) => i.category === 'test_coverage');
        expect(testIssue?.suggestion).toContain('Component.test.js');
      });
    });

    describe('testID detection', () => {
      it('should detect TouchableOpacity without testID', () => {
        const content = `
import { TouchableOpacity, Text } from 'react-native';

export const MyButton = () => (
  <TouchableOpacity onPress={handlePress}>
    <Text>Click Me</Text>
  </TouchableOpacity>
);
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Button.tsx');

        expect(issues.length).toBeGreaterThan(0);
        const testIdIssue = issues.find((i) => i.category === 'test_ids');
        expect(testIdIssue).toBeDefined();
        expect(testIdIssue?.severity).toBe('low');
        expect(testIdIssue?.issue).toContain('missing testID');
        expect(testIdIssue?.suggestion).toContain('easier testing');
      });

      it('should not flag TouchableOpacity with testID', () => {
        const content = `
import { TouchableOpacity, Text } from 'react-native';

export const MyButton = () => (
  <TouchableOpacity onPress={handlePress} testID="submit-button">
    <Text>Click Me</Text>
  </TouchableOpacity>
);
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Button.tsx');

        const testIdIssue = issues.find((i) => i.category === 'test_ids');
        expect(testIdIssue).toBeUndefined();
      });

      it('should detect multiple TouchableOpacity without testID', () => {
        const content = `
import { TouchableOpacity, Text } from 'react-native';

export const MyButtons = () => (
  <View>
    <TouchableOpacity onPress={handlePress1}>
      <Text>Button 1</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={handlePress2}>
      <Text>Button 2</Text>
    </TouchableOpacity>
  </View>
);
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Buttons.tsx');

        // Should still report once per file
        const testIdIssues = issues.filter((i) => i.category === 'test_ids');
        expect(testIdIssues.length).toBe(1);
      });

      it('should not flag files without TouchableOpacity', () => {
        const content = `
import { View, Text } from 'react-native';

export const MyText = () => (
  <View>
    <Text>Hello World</Text>
  </View>
);
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Text.tsx');

        const testIdIssue = issues.find((i) => i.category === 'test_ids');
        expect(testIdIssue).toBeUndefined();
      });
    });

    describe('PropTypes validation detection', () => {
      it('should detect component with Props interface but no PropTypes', () => {
        const content = `
import React from 'react';
import { View, Text } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress: () => void;
}

export const MyComponent = (props: MyComponentProps) => (
  <View>
    <Text>{props.title}</Text>
  </View>
);
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Component.tsx');

        expect(issues.length).toBeGreaterThan(0);
        const propValidationIssue = issues.find((i) => i.category === 'prop_validation');
        expect(propValidationIssue).toBeDefined();
        expect(propValidationIssue?.severity).toBe('low');
        expect(propValidationIssue?.issue).toContain('runtime validation');
        expect(propValidationIssue?.suggestion).toContain('PropTypes');
      });

      it('should not flag component with PropTypes', () => {
        const content = `
import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress: () => void;
}

export const MyComponent = (props: MyComponentProps) => (
  <View>
    <Text>{props.title}</Text>
  </View>
);

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Component.tsx');

        const propValidationIssue = issues.find((i) => i.category === 'prop_validation');
        expect(propValidationIssue).toBeUndefined();
      });

      it('should not flag type declaration files', () => {
        const content = `
interface MyComponentProps {
  title: string;
  onPress: () => void;
}

export { MyComponentProps };
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'types.d.ts');

        const propValidationIssue = issues.find((i) => i.category === 'prop_validation');
        expect(propValidationIssue).toBeUndefined();
      });

      it('should not flag files without Props interface', () => {
        const content = `
import React from 'react';
import { View, Text } from 'react-native';

export const SimpleComponent = () => (
  <View>
    <Text>No Props</Text>
  </View>
);
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Simple.tsx');

        const propValidationIssue = issues.find((i) => i.category === 'prop_validation');
        expect(propValidationIssue).toBeUndefined();
      });

      it('should detect non-standard Props interface names', () => {
        const content = `
import React from 'react';

interface ButtonProps {
  label: string;
}

export const Button = (props: ButtonProps) => <Text>{props.label}</Text>;
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Button.tsx');

        const propValidationIssue = issues.find((i) => i.category === 'prop_validation');
        expect(propValidationIssue).toBeDefined();
      });
    });

    describe('edge cases', () => {
      it('should handle empty content', () => {
        const issues = TestingAnalyzer.analyzeFileTesting('', 'empty.ts');

        expect(issues).toEqual([]);
      });

      it('should handle non-React files', () => {
        const content = `
export const add = (a: number, b: number) => a + b;
export default add;
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'utils.ts');

        expect(issues).toEqual([]);
      });

      it('should detect multiple testing issues in same file', () => {
        const content = `
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress: () => void;
}

export const MyComponent = (props: MyComponentProps) => (
  <View>
    <TouchableOpacity onPress={props.onPress}>
      <Text>{props.title}</Text>
    </TouchableOpacity>
  </View>
);
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Component.tsx');

        expect(issues.length).toBe(3);

        // Should have all three categories
        const categories = issues.map((i) => i.category);
        expect(categories).toContain('test_coverage');
        expect(categories).toContain('test_ids');
        expect(categories).toContain('prop_validation');
      });

      it('should handle component with all testing best practices', () => {
        const content = `
import React from 'react';
import PropTypes from 'prop-types';
import { View, TouchableOpacity, Text } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress: () => void;
}

export const MyComponent = (props: MyComponentProps) => (
  <View testID="my-component">
    <TouchableOpacity onPress={props.onPress} testID="my-button">
      <Text>{props.title}</Text>
    </TouchableOpacity>
  </View>
);

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};
        `;
        // Note: This will still suggest test file, which is expected
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Component.tsx');

        const testIdIssue = issues.find((i) => i.category === 'test_ids');
        const propValidationIssue = issues.find((i) => i.category === 'prop_validation');

        expect(testIdIssue).toBeUndefined();
        expect(propValidationIssue).toBeUndefined();
      });

      it('should only suggest test coverage once per file', () => {
        const content = `
import React from 'react';

export const Component1 = () => <View />;
export const Component2 = () => <View />;
export const Component3 = () => <View />;
export default Component1;
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Components.tsx');

        const testCoverageIssues = issues.filter((i) => i.category === 'test_coverage');
        expect(testCoverageIssues.length).toBe(1);
      });
    });

    describe('suggestion messages', () => {
      it('should provide helpful suggestion for missing test file', () => {
        const content = `
import React from 'react';
export const MyComponent = () => <View />;
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'MyComponent.tsx');

        const testIssue = issues.find((i) => i.category === 'test_coverage');
        expect(testIssue?.suggestion).toContain('Create MyComponent.test.tsx');
      });

      it('should provide helpful suggestion for missing testID', () => {
        const content = `<TouchableOpacity onPress={handlePress} />`;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Button.tsx');

        const testIdIssue = issues.find((i) => i.category === 'test_ids');
        expect(testIdIssue?.suggestion).toContain('easier testing');
      });

      it('should provide helpful suggestion for PropTypes', () => {
        const content = `
interface MyProps {
  title: string;
}
export const Component = (props: MyProps) => <View />;
        `;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Component.tsx');

        const propIssue = issues.find((i) => i.category === 'prop_validation');
        expect(propIssue?.suggestion).toContain('PropTypes');
        expect(propIssue?.suggestion).toContain('runtime');
      });
    });

    describe('all issues have severity low', () => {
      it('should mark test coverage issue as low severity', () => {
        const content = `import React from 'react'; export const C = () => <View />;`;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'C.tsx');

        issues.forEach((issue) => {
          expect(issue.severity).toBe('low');
        });
      });

      it('should mark testID issue as low severity', () => {
        const content = `<TouchableOpacity onPress={handlePress} />`;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'Button.tsx');

        issues.forEach((issue) => {
          expect(issue.severity).toBe('low');
        });
      });

      it('should mark PropTypes issue as low severity', () => {
        const content = `interface Props { title: string; } export const C = (p: Props) => <View />;`;
        const issues = TestingAnalyzer.analyzeFileTesting(content, 'C.tsx');

        issues.forEach((issue) => {
          expect(issue.severity).toBe('low');
        });
      });
    });
  });
});
