import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { readLocalBuildLogs } from '../read.js';
import { sessionManager } from '../../core/shell-session-manager.js';
import { logParser } from '../../core/log-parser.js';

// Mock the session manager and log parser
jest.mock('../../core/shell-session-manager.js', () => ({
  sessionManager: {
    readOutput: jest.fn(),
  },
}));

jest.mock('../../core/log-parser.js', () => ({
  logParser: {
    isBuildComplete: jest.fn(),
    extractErrors: jest.fn(),
  },
}));

describe('readLocalBuildLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should read logs successfully', () => {
    const mockReadOutput = sessionManager.readOutput as jest.MockedFunction<
      typeof sessionManager.readOutput
    >;
    const mockIsBuildComplete = logParser.isBuildComplete as jest.MockedFunction<
      typeof logParser.isBuildComplete
    >;
    const mockExtractErrors = logParser.extractErrors as jest.MockedFunction<
      typeof logParser.extractErrors
    >;

    mockReadOutput.mockReturnValue({
      success: true,
      logs: [
        { timestamp: new Date(), level: 'info', message: 'Building...', raw: 'Building...' },
        { timestamp: new Date(), level: 'info', message: 'Compiling', raw: 'Compiling' },
      ],
      status: 'running',
    });
    mockIsBuildComplete.mockReturnValue({ complete: false, success: false });
    mockExtractErrors.mockReturnValue([]);

    const result = readLocalBuildLogs('test-session', 100);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.logs).toHaveLength(2);
    expect(result.data?.status).toBe('building');
  });

  it('should detect successful build completion', () => {
    const mockReadOutput = sessionManager.readOutput as jest.MockedFunction<
      typeof sessionManager.readOutput
    >;
    const mockIsBuildComplete = logParser.isBuildComplete as jest.MockedFunction<
      typeof logParser.isBuildComplete
    >;
    const mockExtractErrors = logParser.extractErrors as jest.MockedFunction<
      typeof logParser.extractErrors
    >;

    mockReadOutput.mockReturnValue({
      success: true,
      logs: [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Build succeeded',
          raw: 'Build succeeded',
        },
      ],
      status: 'running',
    });
    mockIsBuildComplete.mockReturnValue({ complete: true, success: true });
    mockExtractErrors.mockReturnValue([]);

    const result = readLocalBuildLogs('test-session');

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('success');
  });

  it('should detect failed build', () => {
    const mockReadOutput = sessionManager.readOutput as jest.MockedFunction<
      typeof sessionManager.readOutput
    >;
    const mockIsBuildComplete = logParser.isBuildComplete as jest.MockedFunction<
      typeof logParser.isBuildComplete
    >;
    const mockExtractErrors = logParser.extractErrors as jest.MockedFunction<
      typeof logParser.extractErrors
    >;

    mockReadOutput.mockReturnValue({
      success: true,
      logs: [
        { timestamp: new Date(), level: 'error', message: 'Build failed', raw: 'Build failed' },
      ],
      status: 'running',
    });
    mockIsBuildComplete.mockReturnValue({ complete: true, success: false });
    mockExtractErrors.mockReturnValue(['Compilation error']);

    const result = readLocalBuildLogs('test-session');

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('failed');
    expect(result.data?.errors).toHaveLength(1);
  });

  it('should detect cancelled build', () => {
    const mockReadOutput = sessionManager.readOutput as jest.MockedFunction<
      typeof sessionManager.readOutput
    >;
    const mockIsBuildComplete = logParser.isBuildComplete as jest.MockedFunction<
      typeof logParser.isBuildComplete
    >;
    const mockExtractErrors = logParser.extractErrors as jest.MockedFunction<
      typeof logParser.extractErrors
    >;

    mockReadOutput.mockReturnValue({
      success: true,
      logs: [{ timestamp: new Date(), level: 'info', message: 'Stopped', raw: 'Stopped' }],
      status: 'stopped',
    });
    mockIsBuildComplete.mockReturnValue({ complete: false, success: false });
    mockExtractErrors.mockReturnValue([]);

    const result = readLocalBuildLogs('test-session');

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('cancelled');
  });

  it('should handle session read failure', () => {
    const mockReadOutput = sessionManager.readOutput as jest.MockedFunction<
      typeof sessionManager.readOutput
    >;

    mockReadOutput.mockReturnValue({
      success: false,
      error: 'Session not found',
    });

    const result = readLocalBuildLogs('non-existent-session');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Session not found');
  });

  it('should handle custom tail parameter', () => {
    const mockReadOutput = sessionManager.readOutput as jest.MockedFunction<
      typeof sessionManager.readOutput
    >;
    const mockIsBuildComplete = logParser.isBuildComplete as jest.MockedFunction<
      typeof logParser.isBuildComplete
    >;
    const mockExtractErrors = logParser.extractErrors as jest.MockedFunction<
      typeof logParser.extractErrors
    >;

    mockReadOutput.mockReturnValue({
      success: true,
      logs: [{ timestamp: new Date(), level: 'info', message: 'Log', raw: 'Log' }],
      status: 'running',
    });
    mockIsBuildComplete.mockReturnValue({ complete: false, success: false });
    mockExtractErrors.mockReturnValue([]);

    readLocalBuildLogs('test-session', 50);

    expect(mockReadOutput).toHaveBeenCalledWith('test-session', 50);
  });

  it('should handle exception during log reading', () => {
    const mockReadOutput = sessionManager.readOutput as jest.MockedFunction<
      typeof sessionManager.readOutput
    >;

    mockReadOutput.mockImplementation(() => {
      throw new Error('Read error');
    });

    const result = readLocalBuildLogs('test-session');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Read error');
  });

  it('should not include errors array when no errors present', () => {
    const mockReadOutput = sessionManager.readOutput as jest.MockedFunction<
      typeof sessionManager.readOutput
    >;
    const mockIsBuildComplete = logParser.isBuildComplete as jest.MockedFunction<
      typeof logParser.isBuildComplete
    >;
    const mockExtractErrors = logParser.extractErrors as jest.MockedFunction<
      typeof logParser.extractErrors
    >;

    mockReadOutput.mockReturnValue({
      success: true,
      logs: [{ timestamp: new Date(), level: 'info', message: 'Building', raw: 'Building' }],
      status: 'running',
    });
    mockIsBuildComplete.mockReturnValue({ complete: false, success: false });
    mockExtractErrors.mockReturnValue([]);

    const result = readLocalBuildLogs('test-session');

    expect(result.success).toBe(true);
    expect(result.data?.errors).toBeUndefined();
  });
});
