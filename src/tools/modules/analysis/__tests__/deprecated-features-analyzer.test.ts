import { describe, it, expect } from '@jest/globals';
import { DeprecatedFeaturesAnalyzer } from '../deprecated-features-analyzer.js';

describe('DeprecatedFeaturesAnalyzer', () => {
  describe('analyzeFileDeprecated', () => {
    describe('deprecated React Native components', () => {
      it('should detect ListView usage', () => {
        const content = `
import { ListView } from 'react-native';

const MyList = () => <ListView dataSource={dataSource} />;
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, 'list.tsx');

        expect(issues.length).toBeGreaterThan(0);
        const listViewIssue = issues.find((i) => i.issue.includes('ListView'));
        expect(listViewIssue).toBeDefined();
        expect(listViewIssue?.severity).toBe('high');
        expect(listViewIssue?.category).toBe('deprecated_api');
        expect(listViewIssue?.suggestion).toContain('FlatList or SectionList');
      });

      it('should detect Navigator usage', () => {
        const content = `
import { Navigator } from 'react-native';

const MyNav = () => <Navigator />;
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, 'nav.tsx');

        const navIssue = issues.find((i) => i.issue.includes('Navigator'));
        expect(navIssue).toBeDefined();
        expect(navIssue?.severity).toBe('high');
        expect(navIssue?.suggestion).toContain('React Navigation');
      });

      it('should detect TabBarIOS usage', () => {
        const content = `
import { TabBarIOS } from 'react-native';

const MyTabs = () => <TabBarIOS />;
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, 'tabs.tsx');

        const tabBarIssue = issues.find((i) => i.issue.includes('TabBarIOS'));
        expect(tabBarIssue).toBeDefined();
        expect(tabBarIssue?.severity).toBe('high');
        expect(tabBarIssue?.suggestion).toContain('React Navigation Bottom Tabs');
      });

      it('should detect ToolbarAndroid usage', () => {
        const content = `
import { ToolbarAndroid } from 'react-native';

const MyToolbar = () => <ToolbarAndroid />;
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, 'toolbar.tsx');

        const toolbarIssue = issues.find((i) => i.issue.includes('ToolbarAndroid'));
        expect(toolbarIssue).toBeDefined();
        expect(toolbarIssue?.severity).toBe('medium');
        expect(toolbarIssue?.suggestion).toContain('React Navigation Header');
      });

      it('should detect ViewPagerAndroid usage', () => {
        const content = `
import { ViewPagerAndroid } from 'react-native';

const MyPager = () => <ViewPagerAndroid />;
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, 'pager.tsx');

        const pagerIssue = issues.find((i) => i.issue.includes('ViewPagerAndroid'));
        expect(pagerIssue).toBeDefined();
        expect(pagerIssue?.severity).toBe('medium');
        expect(pagerIssue?.suggestion).toContain('react-native-pager-view');
      });

      it('should detect DatePickerIOS usage', () => {
        const content = `
import { DatePickerIOS } from 'react-native';

const MyDatePicker = () => <DatePickerIOS />;
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, 'datepicker.tsx');

        const datePickerIssue = issues.find((i) => i.issue.includes('DatePickerIOS'));
        expect(datePickerIssue).toBeDefined();
        expect(datePickerIssue?.severity).toBe('medium');
        expect(datePickerIssue?.suggestion).toContain('@react-native-community/datetimepicker');
      });

      it('should detect PickerIOS usage', () => {
        const content = `
import { PickerIOS } from 'react-native';

const MyPicker = () => <PickerIOS />;
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, 'picker.tsx');

        const pickerIssue = issues.find((i) => i.issue.includes('PickerIOS'));
        expect(pickerIssue).toBeDefined();
        expect(pickerIssue?.severity).toBe('medium');
        expect(pickerIssue?.suggestion).toContain('@react-native-picker/picker');
      });

      it('should detect SliderIOS usage', () => {
        const content = `
import { SliderIOS } from 'react-native';

const MySlider = () => <SliderIOS />;
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, 'slider.tsx');

        const sliderIssue = issues.find((i) => i.issue.includes('SliderIOS'));
        expect(sliderIssue).toBeDefined();
        expect(sliderIssue?.severity).toBe('medium');
        expect(sliderIssue?.suggestion).toContain('@react-native-community/slider');
      });

      it('should detect SwitchIOS usage', () => {
        const content = `
import { SwitchIOS } from 'react-native';

const MySwitch = () => <SwitchIOS />;
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, 'switch-ios.tsx');

        const switchIssue = issues.find((i) => i.issue.includes('SwitchIOS'));
        expect(switchIssue).toBeDefined();
        expect(switchIssue?.severity).toBe('low');
        expect(switchIssue?.suggestion).toContain('Switch');
      });

      it('should detect SwitchAndroid usage', () => {
        const content = `
import { SwitchAndroid } from 'react-native';

const MySwitch = () => <SwitchAndroid />;
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(
          content,
          'switch-android.tsx'
        );

        const switchIssue = issues.find((i) => i.issue.includes('SwitchAndroid'));
        expect(switchIssue).toBeDefined();
        expect(switchIssue?.severity).toBe('low');
        expect(switchIssue?.suggestion).toContain('Switch');
      });
    });

    describe('deprecated React lifecycle methods', () => {
      it('should detect componentWillMount', () => {
        const content = `
class MyComponent extends React.Component {
  componentWillMount() {
    console.log('Mounting');
  }
  render() {
    return <View />;
  }
}
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, 'lifecycle.tsx');

        expect(issues.length).toBeGreaterThan(0);
        const lifecycleIssue = issues.find((i) => i.issue.includes('componentWillMount'));
        expect(lifecycleIssue).toBeDefined();
        expect(lifecycleIssue?.severity).toBe('high');
        expect(lifecycleIssue?.category).toBe('lifecycle');
        expect(lifecycleIssue?.suggestion).toContain('componentDidMount');
      });

      it('should detect componentWillReceiveProps', () => {
        const content = `
class MyComponent extends React.Component {
  componentWillReceiveProps(nextProps) {
    console.log('Receiving props');
  }
  render() {
    return <View />;
  }
}
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(
          content,
          'props-lifecycle.tsx'
        );

        const propsIssue = issues.find((i) => i.issue.includes('componentWillReceiveProps'));
        expect(propsIssue).toBeDefined();
        expect(propsIssue?.severity).toBe('high');
        expect(propsIssue?.category).toBe('lifecycle');
        expect(propsIssue?.suggestion).toContain('componentDidUpdate');
      });
    });

    describe('old React syntax', () => {
      it('should detect React.createClass', () => {
        const content = `
const MyComponent = React.createClass({
  render: function() {
    return <View />;
  }
});
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, 'old-syntax.tsx');

        expect(issues.length).toBeGreaterThan(0);
        const createClassIssue = issues.find((i) => i.issue.includes('React.createClass'));
        expect(createClassIssue).toBeDefined();
        expect(createClassIssue?.severity).toBe('critical');
        expect(createClassIssue?.category).toBe('syntax');
        expect(createClassIssue?.suggestion).toContain('ES6 class or functional component');
      });
    });

    describe('edge cases', () => {
      it('should return empty array for modern code', () => {
        const content = `
import React from 'react';
import { View, Text, FlatList } from 'react-native';

export const ModernComponent = () => {
  return (
    <View>
      <Text>Modern React Native</Text>
      <FlatList data={[]} renderItem={() => null} />
    </View>
  );
};
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, 'modern.tsx');

        expect(issues).toEqual([]);
      });

      it('should handle empty content', () => {
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated('', 'empty.ts');

        expect(issues).toEqual([]);
      });

      it('should detect multiple deprecated features in same file', () => {
        const content = `
import { ListView, Navigator, TabBarIOS } from 'react-native';

class MyComponent extends React.Component {
  componentWillMount() {
    console.log('Mounting');
  }

  componentWillReceiveProps(nextProps) {
    console.log('Props');
  }

  render() {
    return (
      <Navigator>
        <ListView dataSource={dataSource} />
        <TabBarIOS />
      </Navigator>
    );
  }
}

const OldComponent = React.createClass({
  render: function() {
    return <View />;
  }
});
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(content, 'multiple.tsx');

        expect(issues.length).toBeGreaterThanOrEqual(6);

        // Should detect all deprecated items
        expect(issues.some((i) => i.issue.includes('ListView'))).toBe(true);
        expect(issues.some((i) => i.issue.includes('Navigator'))).toBe(true);
        expect(issues.some((i) => i.issue.includes('TabBarIOS'))).toBe(true);
        expect(issues.some((i) => i.issue.includes('componentWillMount'))).toBe(true);
        expect(issues.some((i) => i.issue.includes('componentWillReceiveProps'))).toBe(true);
        expect(issues.some((i) => i.issue.includes('React.createClass'))).toBe(true);
      });

      it('should not flag modern component with modern lifecycle', () => {
        const content = `
class MyComponent extends React.Component {
  componentDidMount() {
    console.log('Mounted');
  }

  componentDidUpdate(prevProps) {
    console.log('Updated');
  }

  render() {
    return <View />;
  }
}
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileDeprecated(
          content,
          'modern-class.tsx'
        );

        expect(issues).toEqual([]);
      });
    });
  });

  describe('analyzeFileAccessibility', () => {
    describe('missing accessibilityLabel', () => {
      it('should detect TouchableOpacity without accessibilityLabel', () => {
        const content = `
import { TouchableOpacity, Text } from 'react-native';

const MyButton = () => (
  <TouchableOpacity onPress={handlePress}>
    <Text>Click Me</Text>
  </TouchableOpacity>
);
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(content, 'button.tsx');

        expect(issues.length).toBeGreaterThan(0);
        const labelIssue = issues.find(
          (i) => i.category === 'labels' && i.issue.includes('TouchableOpacity')
        );
        expect(labelIssue).toBeDefined();
        expect(labelIssue?.severity).toBe('medium');
        expect(labelIssue?.suggestion).toContain('screen readers');
      });

      it('should not flag TouchableOpacity with accessibilityLabel', () => {
        const content = `
import { TouchableOpacity, Text } from 'react-native';

const MyButton = () => (
  <TouchableOpacity onPress={handlePress} accessibilityLabel="Submit button">
    <Text>Click Me</Text>
  </TouchableOpacity>
);
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(
          content,
          'accessible-button.tsx'
        );

        const labelIssue = issues.find(
          (i) => i.category === 'labels' && i.issue.includes('TouchableOpacity')
        );
        expect(labelIssue).toBeUndefined();
      });

      it('should detect Image without accessibilityLabel', () => {
        const content = `
import { Image } from 'react-native';

const MyImage = () => (
  <Image source={{ uri: 'https://example.com/image.png' }} />
);
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(content, 'image.tsx');

        const imageIssue = issues.find((i) => i.category === 'labels' && i.issue.includes('Image'));
        expect(imageIssue).toBeDefined();
        expect(imageIssue?.severity).toBe('medium');
        expect(imageIssue?.suggestion).toContain('decorative');
      });

      it('should not flag Image with accessibilityLabel', () => {
        const content = `
import { Image } from 'react-native';

const MyImage = () => (
  <Image
    source={{ uri: 'https://example.com/image.png' }}
    accessibilityLabel="Company logo"
  />
);
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(
          content,
          'accessible-image.tsx'
        );

        const imageIssue = issues.find((i) => i.category === 'labels' && i.issue.includes('Image'));
        expect(imageIssue).toBeUndefined();
      });
    });

    describe('missing accessibilityRole', () => {
      it('should detect TouchableOpacity without accessibilityRole', () => {
        const content = `
import { TouchableOpacity } from 'react-native';

const MyButton = () => <TouchableOpacity onPress={handlePress} />;
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(content, 'no-role.tsx');

        const roleIssue = issues.find((i) => i.category === 'roles');
        expect(roleIssue).toBeDefined();
        expect(roleIssue?.severity).toBe('low');
        expect(roleIssue?.suggestion).toContain('accessibilityRole="button"');
      });

      it('should detect Pressable without accessibilityRole', () => {
        const content = `
import { Pressable } from 'react-native';

const MyButton = () => <Pressable onPress={handlePress} />;
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(
          content,
          'pressable.tsx'
        );

        const roleIssue = issues.find((i) => i.category === 'roles');
        expect(roleIssue).toBeDefined();
      });

      it('should not flag TouchableOpacity with accessibilityRole', () => {
        const content = `
import { TouchableOpacity } from 'react-native';

const MyButton = () => (
  <TouchableOpacity
    onPress={handlePress}
    accessibilityRole="button"
  />
);
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(
          content,
          'with-role.tsx'
        );

        const roleIssue = issues.find((i) => i.category === 'roles');
        expect(roleIssue).toBeUndefined();
      });

      it('should not flag Pressable with accessibilityRole', () => {
        const content = `
import { Pressable } from 'react-native';

const MyButton = () => (
  <Pressable
    onPress={handlePress}
    accessibilityRole="button"
  />
);
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(
          content,
          'pressable-role.tsx'
        );

        const roleIssue = issues.find((i) => i.category === 'roles');
        expect(roleIssue).toBeUndefined();
      });
    });

    describe('font scaling', () => {
      it('should detect Text with fontSize but no allowFontScaling', () => {
        const content = `
import { Text } from 'react-native';

const MyText = () => (
  <Text style={{ fontSize: 16 }}>Hello</Text>
);
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(content, 'font.tsx');

        const fontIssue = issues.find((i) => i.category === 'font_scaling');
        expect(fontIssue).toBeDefined();
        expect(fontIssue?.severity).toBe('low');
        expect(fontIssue?.suggestion).toContain('allowFontScaling');
      });

      it('should not flag Text with allowFontScaling', () => {
        const content = `
import { Text } from 'react-native';

const MyText = () => (
  <Text style={{ fontSize: 16 }} allowFontScaling>
    Hello
  </Text>
);
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(
          content,
          'font-scaling.tsx'
        );

        const fontIssue = issues.find((i) => i.category === 'font_scaling');
        expect(fontIssue).toBeUndefined();
      });

      it('should not flag Text without fontSize', () => {
        const content = `
import { Text } from 'react-native';

const MyText = () => <Text>Hello</Text>;
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(
          content,
          'plain-text.tsx'
        );

        const fontIssue = issues.find((i) => i.category === 'font_scaling');
        expect(fontIssue).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should return empty array for fully accessible code', () => {
        const content = `
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

export const AccessibleComponent = () => (
  <View>
    <TouchableOpacity
      onPress={handlePress}
      accessibilityLabel="Submit form"
      accessibilityRole="button"
    >
      <Text>Submit</Text>
    </TouchableOpacity>
    <Image
      source={require('./logo.png')}
      accessibilityLabel="Company logo"
    />
  </View>
);
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(
          content,
          'accessible.tsx'
        );

        expect(issues).toEqual([]);
      });

      it('should handle empty content', () => {
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility('', 'empty.ts');

        expect(issues).toEqual([]);
      });

      it('should detect multiple accessibility issues in same file', () => {
        const content = `
import { TouchableOpacity, Pressable, Image, Text } from 'react-native';

const MyComponent = () => (
  <View>
    <TouchableOpacity onPress={handlePress}>
      <Text>Button</Text>
    </TouchableOpacity>
    <Pressable onPress={handlePress2}>
      <Text>Another Button</Text>
    </Pressable>
    <Image source={{ uri: 'https://example.com/image.png' }} />
    <Text style={{ fontSize: 16 }}>Some Text</Text>
  </View>
);
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(
          content,
          'multiple-a11y.tsx'
        );

        expect(issues.length).toBeGreaterThanOrEqual(4);

        // Should have all categories
        const categories = issues.map((i) => i.category);
        expect(categories).toContain('labels');
        expect(categories).toContain('roles');
        expect(categories).toContain('font_scaling');
      });

      it('should not flag non-interactive elements', () => {
        const content = `
import { View, Text } from 'react-native';

const MyComponent = () => (
  <View>
    <Text>Hello World</Text>
  </View>
);
        `;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(
          content,
          'non-interactive.tsx'
        );

        expect(issues).toEqual([]);
      });
    });

    describe('suggestion messages', () => {
      it('should provide helpful suggestion for missing TouchableOpacity label', () => {
        const content = `<TouchableOpacity onPress={handlePress} />`;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(content, 'button.tsx');

        const labelIssue = issues.find((i) => i.issue.includes('TouchableOpacity'));
        expect(labelIssue?.suggestion).toContain('screen readers');
      });

      it('should provide helpful suggestion for missing Image label', () => {
        const content = `<Image source={{ uri: 'test.png' }} />`;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(content, 'image.tsx');

        const imageIssue = issues.find((i) => i.issue.includes('Image'));
        expect(imageIssue?.suggestion).toContain('decorative');
      });

      it('should provide helpful suggestion for missing role', () => {
        const content = `<TouchableOpacity onPress={handlePress} />`;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(content, 'role.tsx');

        const roleIssue = issues.find((i) => i.category === 'roles');
        expect(roleIssue?.suggestion).toContain('button');
      });

      it('should provide helpful suggestion for font scaling', () => {
        const content = `<Text style={{ fontSize: 16 }}>Text</Text>`;
        const issues = DeprecatedFeaturesAnalyzer.analyzeFileAccessibility(content, 'font.tsx');

        const fontIssue = issues.find((i) => i.category === 'font_scaling');
        expect(fontIssue?.suggestion).toContain('allowFontScaling');
      });
    });
  });
});
