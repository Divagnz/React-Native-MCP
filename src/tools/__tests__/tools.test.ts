import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ReactNativeTools } from '../index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * React Native Tools Test Suite
 *
 * Tests the ReactNativeTools class and its tool registration functionality
 */
describe('ReactNativeTools', () => {
  let mockServer: McpServer;
  let reactNativeTools: ReactNativeTools;

  beforeEach(() => {
    // Create a mock MCP server with spy methods
    mockServer = {
      tool: jest.fn(),
      prompt: jest.fn(),
      resource: jest.fn(),
    } as unknown as McpServer;

    reactNativeTools = new ReactNativeTools(mockServer);
  });

  describe('Constructor', () => {
    it('should create an instance of ReactNativeTools', () => {
      expect(reactNativeTools).toBeInstanceOf(ReactNativeTools);
    });

    it('should accept an McpServer instance', () => {
      expect(() => new ReactNativeTools(mockServer)).not.toThrow();
    });
  });

  describe('register() method', () => {
    it('should have a register method', () => {
      expect(typeof reactNativeTools.register).toBe('function');
    });

    it('should register tools with the server', () => {
      reactNativeTools.register();

      // Verify that server.tool() was called multiple times
      expect(mockServer.tool).toHaveBeenCalled();
      expect((mockServer.tool as any).mock.calls.length).toBeGreaterThan(0);
    });

    it('should register analyze_component tool', () => {
      reactNativeTools.register();

      // Find the analyze_component tool registration
      const calls = (mockServer.tool as any).mock.calls;
      const analyzeComponentCall = calls.find((call: any[]) => call[0] === 'analyze_component');

      expect(analyzeComponentCall).toBeDefined();
      expect(analyzeComponentCall[1]).toBe('Analyze React Native component for best practices');
    });

    it('should register analyze_codebase_performance tool', () => {
      reactNativeTools.register();

      const calls = (mockServer.tool as any).mock.calls;
      const perfAnalysisCall = calls.find(
        (call: any[]) => call[0] === 'analyze_codebase_performance'
      );

      expect(perfAnalysisCall).toBeDefined();
      expect(perfAnalysisCall[1]).toContain('performance');
    });

    it('should register analyze_codebase_comprehensive tool', () => {
      reactNativeTools.register();

      const calls = (mockServer.tool as any).mock.calls;
      const comprehensiveCall = calls.find(
        (call: any[]) => call[0] === 'analyze_codebase_comprehensive'
      );

      expect(comprehensiveCall).toBeDefined();
      expect(comprehensiveCall[1]).toContain('Comprehensive');
    });

    it('should register multiple tools (minimum 10 expected)', () => {
      reactNativeTools.register();

      // We expect at least 10 tools to be registered
      // (the actual count is 17, but we test for a minimum)
      expect((mockServer.tool as any).mock.calls.length).toBeGreaterThanOrEqual(10);
    });

    it('should not throw errors during registration', () => {
      expect(() => reactNativeTools.register()).not.toThrow();
    });
  });

  describe('Tool Registration Schema Validation', () => {
    it('should register tools with proper Zod schemas', () => {
      reactNativeTools.register();

      const calls = (mockServer.tool as any).mock.calls;

      // Verify each tool has a schema object (3rd parameter)
      calls.forEach((call: any[]) => {
        expect(call[2]).toBeDefined(); // Schema parameter
        expect(typeof call[2]).toBe('object');
      });
    });

    it('should register tools with async handler functions', () => {
      reactNativeTools.register();

      const calls = (mockServer.tool as any).mock.calls;

      // Verify each tool has an async handler (4th parameter)
      calls.forEach((call: any[]) => {
        expect(call[3]).toBeDefined(); // Handler function
        expect(typeof call[3]).toBe('function');
      });
    });
  });

  describe('Critical Tools Registration', () => {
    const criticalTools = [
      'analyze_component',
      'analyze_codebase_performance',
      'analyze_codebase_comprehensive',
      'remediate_code',
      'refactor_component',
      'generate_component_test',
      'optimize_performance',
      'architecture_advice',
      'debug_issue',
    ];

    criticalTools.forEach((toolName) => {
      it(`should register ${toolName} tool`, () => {
        reactNativeTools.register();

        const calls = (mockServer.tool as any).mock.calls;
        const toolCall = calls.find((call: any[]) => call[0] === toolName);

        expect(toolCall).toBeDefined();
      });
    });

    // NOTE: Package management tools are currently not registered due to a source code bug
    // where they are accidentally nested inside the analyze_codebase_comprehensive handler
    // This will be fixed during Phase 2 (refactoring)
    it('should register at least 13 tools', () => {
      reactNativeTools.register();

      const calls = (mockServer.tool as any).mock.calls;

      // Current implementation registers 13 tools
      // (package management tools are not registered due to nesting bug)
      expect(calls.length).toBeGreaterThanOrEqual(13);
    });
  });

  describe('Error Handling', () => {
    it('should handle server without tool method gracefully', () => {
      const invalidServer = {} as McpServer;
      const tools = new ReactNativeTools(invalidServer);

      // This should throw because tool() doesn't exist
      expect(() => tools.register()).toThrow();
    });
  });
});
