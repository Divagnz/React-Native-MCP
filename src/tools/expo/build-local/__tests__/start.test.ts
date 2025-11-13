import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { startLocalBuild } from '../start.js';
import { sessionManager } from '../../core/shell-session-manager.js';

// Mock the session manager
jest.mock('../../core/shell-session-manager.js', () => ({
  sessionManager: {
    startSession: jest.fn(),
  },
}));

describe('startLocalBuild', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start local build successfully with minimal config', () => {
    const mockStartSession = sessionManager.startSession as jest.MockedFunction<
      typeof sessionManager.startSession
    >;
    mockStartSession.mockReturnValue({
      success: true,
    });

    const result = startLocalBuild({
      platform: 'android',
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.platform).toBe('android');
    expect(result.data?.status).toBe('building');
    expect(result.data?.session_id).toMatch(/^expo-build-android-\d+$/);
    expect(mockStartSession).toHaveBeenCalledWith(
      expect.stringMatching(/^expo-build-android-\d+$/),
      expect.arrayContaining(['npx', 'expo', 'run:android']),
      expect.objectContaining({ cwd: expect.any(String) })
    );
  });

  it('should start iOS build', () => {
    const mockStartSession = sessionManager.startSession as jest.MockedFunction<
      typeof sessionManager.startSession
    >;
    mockStartSession.mockReturnValue({
      success: true,
    });

    const result = startLocalBuild({
      platform: 'ios',
    });

    expect(result.success).toBe(true);
    expect(result.data?.platform).toBe('ios');
    expect(mockStartSession).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['run:ios']),
      expect.any(Object)
    );
  });

  it('should include device option when specified', () => {
    const mockStartSession = sessionManager.startSession as jest.MockedFunction<
      typeof sessionManager.startSession
    >;
    mockStartSession.mockReturnValue({
      success: true,
    });

    startLocalBuild({
      platform: 'ios',
      device: 'iPhone 14',
    });

    expect(mockStartSession).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['--device', 'iPhone 14']),
      expect.any(Object)
    );
  });

  it('should include release variant when specified', () => {
    const mockStartSession = sessionManager.startSession as jest.MockedFunction<
      typeof sessionManager.startSession
    >;
    mockStartSession.mockReturnValue({
      success: true,
    });

    startLocalBuild({
      platform: 'android',
      variant: 'release',
    });

    expect(mockStartSession).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['--variant', 'release']),
      expect.any(Object)
    );
  });

  it('should include clean flag when specified', () => {
    const mockStartSession = sessionManager.startSession as jest.MockedFunction<
      typeof sessionManager.startSession
    >;
    mockStartSession.mockReturnValue({
      success: true,
    });

    startLocalBuild({
      platform: 'android',
      clean: true,
    });

    expect(mockStartSession).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['--clear']),
      expect.any(Object)
    );
  });

  it('should handle session start failure', () => {
    const mockStartSession = sessionManager.startSession as jest.MockedFunction<
      typeof sessionManager.startSession
    >;
    mockStartSession.mockReturnValue({
      success: false,
      error: 'Failed to spawn process',
    });

    const result = startLocalBuild({
      platform: 'ios',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to spawn process');
  });

  it('should handle exception during build start', () => {
    const mockStartSession = sessionManager.startSession as jest.MockedFunction<
      typeof sessionManager.startSession
    >;
    mockStartSession.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const result = startLocalBuild({
      platform: 'android',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unexpected error');
  });

  it('should generate session IDs with correct format', () => {
    const mockStartSession = sessionManager.startSession as jest.MockedFunction<
      typeof sessionManager.startSession
    >;
    mockStartSession.mockReturnValue({
      success: true,
    });

    const result = startLocalBuild({ platform: 'android' });

    expect(result.data?.session_id).toMatch(/^expo-build-android-\d+$/);
    expect(mockStartSession).toHaveBeenCalled();
  });
});
