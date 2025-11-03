import { describe, it, expect } from '@jest/globals';
import { TestGenerationService } from '../test-generation-service.js';

describe('TestGenerationService', () => {
  describe('analyzeComponentStructure', () => {
    it('should analyze a simple component', () => {
      const componentCode = `
        export const MyButton = ({ onPress, title }) => (
          <TouchableOpacity onPress={onPress}>
            <Text>{title}</Text>
          </TouchableOpacity>
        );
      `;
      const result = TestGenerationService.analyzeComponentStructure(componentCode);

      expect(result).toBeDefined();
      expect(result.props).toBeDefined();
    });

    it('should handle components without props', () => {
      const componentCode = `export const SimpleView = () => <View><Text>Hello</Text></View>;`;
      const result = TestGenerationService.analyzeComponentStructure(componentCode);

      expect(result).toBeDefined();
    });
  });

  describe('generateMockValue', () => {
    it('should generate string mock value', () => {
      const result = TestGenerationService.generateMockValue('string');
      expect(typeof result).toBe('string');
      expect(result).toContain("'");
    });

    it('should generate number mock value', () => {
      const result = TestGenerationService.generateMockValue('number');
      expect(result).toMatch(/^\d+$/);
    });

    it('should generate boolean mock value', () => {
      const result = TestGenerationService.generateMockValue('boolean');
      expect(['true', 'false']).toContain(result);
    });
  });

  describe('inferEventType', () => {
    it('should infer press event', () => {
      const result = TestGenerationService.inferEventType('onPress');
      expect(result.toLowerCase()).toContain('press');
    });

    it('should infer change event', () => {
      const result = TestGenerationService.inferEventType('onChange');
      expect(result.toLowerCase()).toContain('change');
    });
  });

  describe('inferAccessibilityRole', () => {
    it('should infer button role', () => {
      const code = '<TouchableOpacity><Text>Click</Text></TouchableOpacity>';
      const result = TestGenerationService.inferAccessibilityRole(code);
      expect(result).toBe('button');
    });

    it('should infer text role', () => {
      const code = '<Text>Some text</Text>';
      const result = TestGenerationService.inferAccessibilityRole(code);
      expect(result).toBe('text');
    });
  });
});
