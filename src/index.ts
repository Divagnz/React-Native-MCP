#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ReactNativeTools } from './tools/index.js';
import { ReactNativeResources } from './resources/index.js';
import { ReactNativePrompts } from './prompts/index.js';
import { logger, logServerStartup, logServerShutdown, flushLogs } from './utils/logger.js';

/**
 * React Native MCP Server - v1.1.0
 * Enhanced with expert-level code remediation capabilities
 * React Native MCP Server
 *
 * This server provides React Native development guidance, best practices,
 * and tools based on the official React Native documentation.
 */

const VERSION = '1.1.0';
const SERVER_NAME = 'react-native-mcp-server';

// Create the MCP server instance
const server = new McpServer({
  name: SERVER_NAME,
  version: VERSION,
});

// Initialize tools, resources, and prompts
const tools = new ReactNativeTools(server);
const resources = new ReactNativeResources(server);
const prompts = new ReactNativePrompts(server);

// Register all components
tools.register();
resources.register();
prompts.register();

async function main() {
  // Log server startup to file
  logServerStartup(VERSION, {
    serverName: SERVER_NAME,
    nodeVersion: process.version,
    platform: process.platform,
    logLevel: process.env.MCP_LOG_LEVEL || 'info',
  });

  // Use stdio transport for command-line usage
  const transport = new StdioServerTransport();

  // Connect to the transport
  await server.connect(transport);

  // Server is now running
  // NOTE: We use console.error for critical messages as it goes to stderr
  // and doesn't interfere with MCP's stdout JSON-RPC protocol
  console.error('React Native MCP Server v' + VERSION + ' is running...');
  console.error('Logs are being written to: ./logs/');
}

// Handle graceful shutdown
async function shutdown(signal: string): Promise<void> {
  console.error(`Shutting down React Native MCP Server (${signal})...`);
  logServerShutdown(signal);

  try {
    // Flush logs before exiting
    await flushLogs();
    await server.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  console.error('Fatal error:', error.message);
  void shutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  console.error('Unhandled promise rejection:', reason);
});

// Start the server
main().catch((error) => {
  logger.error('Failed to start server', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  console.error('Failed to start React Native MCP Server:', error);
  process.exit(1);
});
