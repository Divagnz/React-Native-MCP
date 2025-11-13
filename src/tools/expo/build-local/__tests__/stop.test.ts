import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { stopLocalBuild } from '../stop.js';
import { sessionManager } from '../../core/shell-session-manager.js';

// Mock the session manager
jest.mock('../../core/shell-session-manager.js', () => ({
  sessionManager: {
    stopSession: jest.fn(),
  },
}));

describe('stopLocalBuild', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should stop build successfully', () => {
    const mockStopSession = sessionManager.stopSession as jest.MockedFunction<
      typeof sessionManager.stopSession
    >;
    mockStopSession.mockReturnValue({
      success: true,
    });

    const result = stopLocalBuild('test-session');

    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
    expect(mockStopSession).toHaveBeenCalledWith('test-session');
  });

  it('should handle session not found', () => {
    const mockStopSession = sessionManager.stopSession as jest.MockedFunction<
      typeof sessionManager.stopSession
    >;
    mockStopSession.mockReturnValue({
      success: false,
      error: 'Session not found',
    });

    const result = stopLocalBuild('non-existent-session');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Session not found');
  });

  it('should handle session stop failure', () => {
    const mockStopSession = sessionManager.stopSession as jest.MockedFunction<
      typeof sessionManager.stopSession
    >;
    mockStopSession.mockReturnValue({
      success: false,
      error: 'Failed to kill process',
    });

    const result = stopLocalBuild('test-session');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to kill process');
  });

  it('should handle exception during stop', () => {
    const mockStopSession = sessionManager.stopSession as jest.MockedFunction<
      typeof sessionManager.stopSession
    >;
    mockStopSession.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const result = stopLocalBuild('test-session');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unexpected error');
  });

  it('should call stopSession with correct session ID', () => {
    const mockStopSession = sessionManager.stopSession as jest.MockedFunction<
      typeof sessionManager.stopSession
    >;
    mockStopSession.mockReturnValue({
      success: true,
    });

    const sessionId = 'expo-build-android-123456789';
    stopLocalBuild(sessionId);

    expect(mockStopSession).toHaveBeenCalledTimes(1);
    expect(mockStopSession).toHaveBeenCalledWith(sessionId);
  });

  it('should return success message on successful stop', () => {
    const mockStopSession = sessionManager.stopSession as jest.MockedFunction<
      typeof sessionManager.stopSession
    >;
    mockStopSession.mockReturnValue({
      success: true,
    });

    const result = stopLocalBuild('test-session');

    expect(result.success).toBe(true);
    expect(result.message).toContain('cancelled');
  });
});
