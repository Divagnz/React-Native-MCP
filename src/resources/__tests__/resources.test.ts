import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ReactNativeResources } from '../index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * React Native Resources Test Suite
 *
 * Tests the ReactNativeResources class and its resource registration functionality
 */
describe('ReactNativeResources', () => {
  let mockServer: McpServer;
  let reactNativeResources: ReactNativeResources;

  beforeEach(() => {
    // Create a mock MCP server with spy methods
    mockServer = {
      tool: jest.fn(),
      prompt: jest.fn(),
      resource: jest.fn(),
    } as unknown as McpServer;

    reactNativeResources = new ReactNativeResources(mockServer);
  });

  describe('Constructor', () => {
    it('should create an instance of ReactNativeResources', () => {
      expect(reactNativeResources).toBeInstanceOf(ReactNativeResources);
    });

    it('should accept an McpServer instance', () => {
      expect(() => new ReactNativeResources(mockServer)).not.toThrow();
    });
  });

  describe('register() method', () => {
    it('should have a register method', () => {
      expect(typeof reactNativeResources.register).toBe('function');
    });

    it('should register resources with the server', () => {
      reactNativeResources.register();

      // Verify that server.resource() was called
      expect(mockServer.resource).toHaveBeenCalled();
      expect((mockServer.resource as any).mock.calls.length).toBeGreaterThan(0);
    });

    it('should register react-native-docs resource', () => {
      reactNativeResources.register();

      const calls = (mockServer.resource as any).mock.calls;
      const docsCall = calls.find((call: any[]) => call[0] === 'react-native-docs');

      expect(docsCall).toBeDefined();
      expect(docsCall[1]).toContain('reactnative.dev');
    });

    it('should register best-practices-guide resource', () => {
      reactNativeResources.register();

      const calls = (mockServer.resource as any).mock.calls;
      const bestPracticesCall = calls.find((call: any[]) => call[0] === 'best-practices-guide');

      expect(bestPracticesCall).toBeDefined();
      expect(bestPracticesCall[1]).toBe('rn://best-practices');
    });

    it('should register performance-guide resource', () => {
      reactNativeResources.register();

      const calls = (mockServer.resource as any).mock.calls;
      const performanceCall = calls.find((call: any[]) => call[0] === 'performance-guide');

      expect(performanceCall).toBeDefined();
      expect(performanceCall[1]).toBe('rn://performance');
    });

    it('should register common-patterns resource', () => {
      reactNativeResources.register();

      const calls = (mockServer.resource as any).mock.calls;
      const patternsCall = calls.find((call: any[]) => call[0] === 'common-patterns');

      expect(patternsCall).toBeDefined();
      expect(patternsCall[1]).toBe('rn://patterns');
    });

    it('should register platform-guide resource with template', () => {
      reactNativeResources.register();

      const calls = (mockServer.resource as any).mock.calls;
      const platformCall = calls.find((call: any[]) => call[0] === 'platform-guide');

      expect(platformCall).toBeDefined();
      // Platform guide uses ResourceTemplate
      expect(platformCall[1]).toBeDefined();
    });

    it('should register at least 5 resources', () => {
      reactNativeResources.register();

      // Expected resources: docs, best-practices, performance, patterns, platform
      expect((mockServer.resource as any).mock.calls.length).toBeGreaterThanOrEqual(5);
    });

    it('should not throw errors during registration', () => {
      expect(() => reactNativeResources.register()).not.toThrow();
    });
  });

  describe('Resource Metadata', () => {
    it('should register resources with proper metadata objects', () => {
      reactNativeResources.register();

      const calls = (mockServer.resource as any).mock.calls;

      // Each resource should have metadata (3rd parameter)
      calls.forEach((call: any[]) => {
        const metadata = call[2];
        expect(metadata).toBeDefined();
        expect(metadata).toHaveProperty('title');
        expect(metadata).toHaveProperty('description');
        expect(metadata).toHaveProperty('mimeType');
      });
    });

    it('should use text/markdown mime type for all resources', () => {
      reactNativeResources.register();

      const calls = (mockServer.resource as any).mock.calls;

      calls.forEach((call: any[]) => {
        const metadata = call[2];
        expect(metadata.mimeType).toBe('text/markdown');
      });
    });
  });

  describe('Resource Handlers', () => {
    it('should register resources with async handler functions', () => {
      reactNativeResources.register();

      const calls = (mockServer.resource as any).mock.calls;

      // Each resource should have an async handler (4th parameter)
      calls.forEach((call: any[]) => {
        expect(call[3]).toBeDefined();
        expect(typeof call[3]).toBe('function');
      });
    });
  });

  describe('Critical Resources Registration', () => {
    const criticalResources = [
      'react-native-docs',
      'best-practices-guide',
      'performance-guide',
      'common-patterns',
      'platform-guide',
    ];

    criticalResources.forEach((resourceName) => {
      it(`should register ${resourceName} resource`, () => {
        reactNativeResources.register();

        const calls = (mockServer.resource as any).mock.calls;
        const resourceCall = calls.find((call: any[]) => call[0] === resourceName);

        expect(resourceCall).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle server without resource method gracefully', () => {
      const invalidServer = {} as McpServer;
      const resources = new ReactNativeResources(invalidServer);

      // This should throw because resource() doesn't exist
      expect(() => resources.register()).toThrow();
    });
  });
});
