import { describe, it, expect } from '@jest/globals';
import { AdvisoryService } from '../advisory-service.js';

describe('AdvisoryService', () => {
  describe('getPerformanceOptimizations', () => {
    it('should return list rendering optimizations', () => {
      const result = AdvisoryService.getPerformanceOptimizations('list_rendering', 'both');

      expect(result).toContain('List Rendering Optimizations');
      expect(result).toContain('FlatList');
      expect(result).toContain('keyExtractor');
      expect(result).toContain('getItemLayout');
    });

    it('should return navigation optimizations', () => {
      const result = AdvisoryService.getPerformanceOptimizations('navigation', 'both');

      expect(result).toContain('Navigation Performance');
      expect(result).toContain('React Navigation');
      expect(result).toContain('lazy loading');
      expect(result).toContain('freezeOnBlur');
    });

    it('should return animation optimizations', () => {
      const result = AdvisoryService.getPerformanceOptimizations('animations', 'both');

      expect(result).toContain('Animation Performance');
      expect(result).toContain('Reanimated');
      expect(result).toContain('useSharedValue');
      expect(result).toContain('useAnimatedStyle');
    });

    it('should return memory management optimizations', () => {
      const result = AdvisoryService.getPerformanceOptimizations('memory_usage', 'both');

      expect(result).toContain('Memory Management');
      expect(result).toContain('event listeners');
      expect(result).toContain('cleanup');
      expect(result).toContain('memory leaks');
    });

    it('should return bundle size optimizations', () => {
      const result = AdvisoryService.getPerformanceOptimizations('bundle_size', 'both');

      expect(result).toContain('Bundle Size Optimization');
      expect(result).toContain('Metro');
      expect(result).toContain('Hermes');
      expect(result).toContain('code splitting');
    });

    it('should return startup time optimizations', () => {
      const result = AdvisoryService.getPerformanceOptimizations('startup_time', 'both');

      expect(result).toContain('Startup Time Optimization');
      expect(result).toContain('lazy loading');
      expect(result).toContain('Hermes');
      expect(result).toContain('initial bundle');
    });

    it('should include iOS-specific notes', () => {
      const result = AdvisoryService.getPerformanceOptimizations('list_rendering', 'ios');

      expect(result).toContain('Platform-Specific Notes');
      expect(result).toContain('IOS');
      expect(result).toContain('CADisplayLink');
      expect(result).toContain('memory warnings');
    });

    it('should include Android-specific notes', () => {
      const result = AdvisoryService.getPerformanceOptimizations('list_rendering', 'android');

      expect(result).toContain('Platform-Specific Notes');
      expect(result).toContain('ANDROID');
      expect(result).toContain('ProGuard');
      expect(result).toContain('background limitations');
    });

    it('should return default message for unknown scenario', () => {
      const result = AdvisoryService.getPerformanceOptimizations('unknown_scenario', 'both');

      expect(result).toContain('not available for this scenario');
    });

    it('should not include platform notes for both platforms', () => {
      const result = AdvisoryService.getPerformanceOptimizations('list_rendering', 'both');

      expect(result).not.toContain('Platform-Specific Notes (BOTH)');
    });
  });

  describe('getArchitectureAdvice', () => {
    it('should return simple app architecture advice', () => {
      const result = AdvisoryService.getArchitectureAdvice('simple_app', []);

      expect(result).toContain('Simple App Architecture');
      expect(result).toContain('components/');
      expect(result).toContain('screens/');
      expect(result).toContain('React Context');
      expect(result).toContain('Stack Navigator');
    });

    it('should return complex app architecture advice', () => {
      const result = AdvisoryService.getArchitectureAdvice('complex_app', []);

      expect(result).toContain('Complex App Architecture');
      expect(result).toContain('features/');
      expect(result).toContain('Redux Toolkit');
      expect(result).toContain('Zustand');
      expect(result).toContain('React Query');
    });

    it('should return enterprise architecture advice', () => {
      const result = AdvisoryService.getArchitectureAdvice('enterprise', []);

      expect(result).toContain('Enterprise App Architecture');
      expect(result).toContain('core/');
      expect(result).toContain('domain/');
      expect(result).toContain('Clean Architecture');
      expect(result).toContain('Domain-Driven Design');
      expect(result).toContain('SOLID');
    });

    it('should return general advice for unknown project type', () => {
      const result = AdvisoryService.getArchitectureAdvice('unknown_type', []);

      expect(result).toContain('General Architecture Advice');
      expect(result).toContain('Separation of Concerns');
      expect(result).toContain('Component Composition');
      expect(result).toContain('DRY');
    });

    it('should include authentication recommendations', () => {
      const result = AdvisoryService.getArchitectureAdvice('simple_app', ['authentication']);

      expect(result).toContain('Authentication Architecture');
      expect(result).toContain('token storage');
      expect(result).toContain('Keychain');
      expect(result).toContain('biometric');
    });

    it('should include offline support recommendations', () => {
      const result = AdvisoryService.getArchitectureAdvice('simple_app', ['offline_support']);

      expect(result).toContain('Offline-First Architecture');
      expect(result).toContain('AsyncStorage');
      expect(result).toContain('SQLite');
      expect(result).toContain('sync queue');
    });

    it('should include real-time recommendations', () => {
      const result = AdvisoryService.getArchitectureAdvice('simple_app', ['real_time']);

      expect(result).toContain('Real-Time Features');
      expect(result).toContain('WebSockets');
      expect(result).toContain('Firebase');
      expect(result).toContain('reconnection');
    });

    it('should include analytics recommendations', () => {
      const result = AdvisoryService.getArchitectureAdvice('simple_app', ['analytics']);

      expect(result).toContain('Analytics Integration');
      expect(result).toContain('abstraction layer');
      expect(result).toContain('event batching');
      expect(result).toContain('GDPR');
    });

    it('should include multiple feature recommendations', () => {
      const result = AdvisoryService.getArchitectureAdvice('complex_app', [
        'authentication',
        'offline_support',
        'analytics',
      ]);

      expect(result).toContain('Authentication Architecture');
      expect(result).toContain('Offline-First Architecture');
      expect(result).toContain('Analytics Integration');
    });
  });

  describe('getDebuggingGuidance', () => {
    it('should return crash debugging guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('crash', 'both');

      expect(result).toContain('Debugging App Crashes');
      expect(result).toContain('Check Logs');
      expect(result).toContain('error boundaries');
      expect(result).toContain('promise rejections');
    });

    it('should return performance debugging guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('performance', 'both');

      expect(result).toContain('Debugging Performance Issues');
      expect(result).toContain('React DevTools Profiler');
      expect(result).toContain('Flipper');
      expect(result).toContain('React.memo');
      expect(result).toContain('useMemo');
    });

    it('should return networking debugging guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('networking', 'both');

      expect(result).toContain('Debugging Network Issues');
      expect(result).toContain('CORS');
      expect(result).toContain('SSL/TLS');
      expect(result).toContain('axios');
      expect(result).toContain('interceptors');
    });

    it('should return build debugging guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('build', 'both');

      expect(result).toContain('Debugging Build Issues');
      expect(result).toContain('Dependency Conflicts');
      expect(result).toContain('Cache Issues');
      expect(result).toContain('node_modules');
      expect(result).toContain('pod install');
    });

    it('should return UI debugging guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('ui', 'both');

      expect(result).toContain('Debugging UI Issues');
      expect(result).toContain('Layout Issues');
      expect(result).toContain('Flexbox');
      expect(result).toContain('KeyboardAvoidingView');
      expect(result).toContain('Inspector');
    });

    it('should include iOS-specific crash guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('crash', 'ios');

      expect(result).toContain('iOS:');
      expect(result).toContain('Xcode');
      expect(result).toContain('Instruments');
      expect(result).toContain('Symbolicate');
    });

    it('should include Android-specific crash guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('crash', 'android');

      expect(result).toContain('Android:');
      expect(result).toContain('Logcat');
      expect(result).toContain('ANR');
      expect(result).toContain('Gradle');
    });

    it('should include iOS-specific networking guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('networking', 'ios');

      expect(result).toContain('iOS:');
      expect(result).toContain('App Transport Security');
      expect(result).toContain('Info.plist');
      expect(result).toContain('Charles Proxy');
    });

    it('should include Android-specific networking guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('networking', 'android');

      expect(result).toContain('Android:');
      expect(result).toContain('network security config');
      expect(result).toContain('usesCleartextTraffic');
      expect(result).toContain('Network Profiler');
    });

    it('should include iOS-specific build guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('build', 'ios');

      expect(result).toContain('iOS:');
      expect(result).toContain('DerivedData');
      expect(result).toContain('CocoaPods');
      expect(result).toContain('xcode-select');
    });

    it('should include Android-specific build guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('build', 'android');

      expect(result).toContain('Android:');
      expect(result).toContain('Gradle');
      expect(result).toContain('java -version');
      expect(result).toContain('cleanBuildCache');
    });

    it('should include iOS-specific UI guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('ui', 'ios');

      expect(result).toContain('iOS:');
      expect(result).toContain('safe area');
      expect(result).toContain('status bar');
      expect(result).toContain('device sizes');
    });

    it('should include Android-specific UI guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('ui', 'android');

      expect(result).toContain('Android:');
      expect(result).toContain('navigation bar');
      expect(result).toContain('screen densities');
      expect(result).toContain('hardware back button');
    });

    it('should return general guidance for unknown issue type', () => {
      const result = AdvisoryService.getDebuggingGuidance('unknown_issue', 'both');

      expect(result).toContain('General Debugging Guidance');
      expect(result).toContain('Step-by-Step Approach');
      expect(result).toContain('Reproduce the Issue');
      expect(result).toContain('React Native Debugger');
    });

    it('should include error message analysis when provided', () => {
      const errorMsg = 'TypeError: Cannot read property "foo" of undefined';
      const result = AdvisoryService.getDebuggingGuidance('crash', 'both', errorMsg);

      expect(result).toContain('Specific Error Analysis');
      expect(result).toContain(errorMsg);
      expect(result).toContain('Troubleshooting Steps');
    });

    it('should handle both platform without platform-specific notes in general guidance', () => {
      const result = AdvisoryService.getDebuggingGuidance('unknown_issue', 'both');

      expect(result).not.toContain('iOS:');
      expect(result).not.toContain('Android:');
    });
  });
});
