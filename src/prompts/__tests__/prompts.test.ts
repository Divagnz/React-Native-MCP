import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ReactNativePrompts } from '../index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * React Native Prompts Test Suite
 *
 * Tests the ReactNativePrompts class and its prompt registration functionality
 */
describe('ReactNativePrompts', () => {
  let mockServer: McpServer;
  let reactNativePrompts: ReactNativePrompts;

  beforeEach(() => {
    // Create a mock MCP server with spy methods
    mockServer = {
      tool: jest.fn(),
      prompt: jest.fn(),
      resource: jest.fn(),
    } as unknown as McpServer;

    reactNativePrompts = new ReactNativePrompts(mockServer);
  });

  describe('Constructor', () => {
    it('should create an instance of ReactNativePrompts', () => {
      expect(reactNativePrompts).toBeInstanceOf(ReactNativePrompts);
    });

    it('should accept an McpServer instance', () => {
      expect(() => new ReactNativePrompts(mockServer)).not.toThrow();
    });
  });

  describe('register() method', () => {
    it('should have a register method', () => {
      expect(typeof reactNativePrompts.register).toBe('function');
    });

    it('should register prompts with the server', () => {
      reactNativePrompts.register();

      // Verify that server.prompt() was called
      expect(mockServer.prompt).toHaveBeenCalled();
      expect((mockServer.prompt as any).mock.calls.length).toBeGreaterThan(0);
    });

    it('should register react-native-code-review prompt', () => {
      reactNativePrompts.register();

      const calls = (mockServer.prompt as any).mock.calls;
      const codeReviewCall = calls.find((call: any[]) => call[0] === 'react-native-code-review');

      expect(codeReviewCall).toBeDefined();
      expect(codeReviewCall[1]).toContain('Review');
    });

    it('should register react-native-architecture prompt', () => {
      reactNativePrompts.register();

      const calls = (mockServer.prompt as any).mock.calls;
      const architectureCall = calls.find((call: any[]) => call[0] === 'react-native-architecture');

      expect(architectureCall).toBeDefined();
      expect(architectureCall[1]).toContain('architecture');
    });

    it('should register at least 5 prompts', () => {
      reactNativePrompts.register();

      // We expect at least 5 prompts to be registered
      // (code-review, architecture, performance, debug, migration, testing)
      expect((mockServer.prompt as any).mock.calls.length).toBeGreaterThanOrEqual(5);
    });

    it('should not throw errors during registration', () => {
      expect(() => reactNativePrompts.register()).not.toThrow();
    });
  });

  describe('Prompt Schema Validation', () => {
    it('should register prompts with proper Zod schemas', () => {
      reactNativePrompts.register();

      const calls = (mockServer.prompt as any).mock.calls;

      // Verify each prompt has a schema object (3rd parameter)
      calls.forEach((call: any[]) => {
        expect(call[2]).toBeDefined(); // Schema parameter
        expect(typeof call[2]).toBe('object');
      });
    });

    it('should register prompts with async handler functions', () => {
      reactNativePrompts.register();

      const calls = (mockServer.prompt as any).mock.calls;

      // Verify each prompt has an async handler (4th parameter)
      calls.forEach((call: any[]) => {
        expect(call[3]).toBeDefined(); // Handler function
        expect(typeof call[3]).toBe('function');
      });
    });
  });

  describe('Critical Prompts Registration', () => {
    const criticalPrompts = [
      'react-native-code-review',
      'react-native-architecture',
      'react-native-performance',
      'react-native-debug',
      'react-native-migration',
      'react-native-testing',
    ];

    criticalPrompts.forEach((promptName) => {
      it(`should register ${promptName} prompt`, () => {
        reactNativePrompts.register();

        const calls = (mockServer.prompt as any).mock.calls;
        const promptCall = calls.find((call: any[]) => call[0] === promptName);

        expect(promptCall).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle server without prompt method gracefully', () => {
      const invalidServer = {} as McpServer;
      const prompts = new ReactNativePrompts(invalidServer);

      // This should throw because prompt() doesn't exist
      expect(() => prompts.register()).toThrow();
    });
  });
});
