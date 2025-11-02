/**
 * Advisory service for React Native development guidance
 * Provides performance optimizations, architecture advice, and debugging guidance
 */

export class AdvisoryService {
  /**
   * Get performance optimization guidance for specific scenarios
   */
  static getPerformanceOptimizations(scenario: string, platform: string): string {
    const optimizations: Record<string, string> = {
      list_rendering: `
## List Rendering Optimizations

### FlatList Best Practices:
- Use \`keyExtractor\` for unique keys
- Implement \`getItemLayout\` for fixed-size items
- Use \`removeClippedSubviews\` for long lists
- Set \`maxToRenderPerBatch\` and \`windowSize\`
- Use \`memo\` for list item components

### Example:
\`\`\`jsx
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  renderItem={({ item }) => <MemoizedItem item={item} />}
/>
\`\`\`
      `,
      navigation: `
## Navigation Performance

### React Navigation Optimizations:
- Use lazy loading for screens
- Implement proper screen options
- Use \`useFocusEffect\` instead of \`useEffect\`
- Optimize header components
- Use \`freezeOnBlur\` for heavy screens

### Example:
\`\`\`jsx
const Stack = createNativeStackNavigator();

<Stack.Navigator screenOptions={{ lazy: true }}>
  <Stack.Screen
    name="Heavy"
    component={HeavyScreen}
    options={{ freezeOnBlur: true }}
  />
</Stack.Navigator>
\`\`\`
      `,
      animations: `
## Animation Performance

### Use Native Animations:
- Prefer Reanimated 3 over Animated API
- Use \`useSharedValue\` and \`useAnimatedStyle\`
- Run animations on UI thread
- Avoid animating layout properties

### Example:
\`\`\`jsx
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const offset = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: offset.value }],
}));

// Trigger animation
offset.value = withSpring(100);
\`\`\`
      `,
      memory_usage: `
## Memory Management

### Best Practices:
- Remove event listeners in useEffect cleanup
- Avoid memory leaks with proper cleanup
- Use image optimization
- Implement proper cache management
- Monitor memory usage with Flipper

### Example:
\`\`\`jsx
useEffect(() => {
  const subscription = someService.subscribe(handler);

  return () => {
    subscription.unsubscribe();
  };
}, []);
\`\`\`
      `,
      bundle_size: `
## Bundle Size Optimization

### Techniques:
- Use Metro bundle analyzer
- Implement code splitting
- Remove unused dependencies
- Use Hermes engine
- Enable minification in production

### Commands:
\`\`\`bash
# Analyze bundle
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android-bundle.js --assets-dest android-assets

# Enable Hermes (android/app/build.gradle)
project.ext.react = [
  enableHermes: true
]
\`\`\`
      `,
      startup_time: `
## Startup Time Optimization

### Strategies:
- Minimize initial bundle size
- Use lazy loading
- Optimize splash screen
- Reduce initial renders
- Use Hermes for faster startup

### Implementation:
- Move heavy computations to background
- Use React.Suspense for lazy components
- Optimize image loading
- Minimize synchronous operations
      `,
    };

    let result =
      optimizations[scenario] ||
      'Performance optimization guidance not available for this scenario.';

    if (platform !== 'both') {
      result += `\n\n### Platform-Specific Notes (${platform.toUpperCase()}):`;
      if (platform === 'ios') {
        result +=
          '\n- Use iOS-specific optimizations like CADisplayLink\n- Consider iOS memory warnings\n- Optimize for different device sizes';
      } else {
        result +=
          '\n- Use Android-specific optimizations like ProGuard\n- Consider Android background limitations\n- Optimize for various Android versions';
      }
    }

    return result;
  }

  /**
   * Get architecture advice based on project type and features
   */
  static getArchitectureAdvice(projectType: string, features: string[]): string {
    const architectures: Record<string, string> = {
      simple_app: `
## Simple App Architecture

### Recommended Structure:
\`\`\`
src/
├── components/       # Reusable components
├── screens/         # Screen components
├── navigation/      # Navigation configuration
├── utils/           # Utility functions
├── constants/       # App constants
└── App.tsx          # Main app component
\`\`\`

### State Management:
- Use React Context for simple global state
- useState/useReducer for local state
- No external state library needed

### Navigation:
- React Navigation with Stack Navigator
- Keep navigation simple and flat
      `,
      complex_app: `
## Complex App Architecture

### Recommended Structure:
\`\`\`
src/
├── features/           # Feature-based organization
│   ├── auth/
│   ├── profile/
│   └── dashboard/
├── shared/
│   ├── components/    # Shared components
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utilities
│   └── types/         # TypeScript types
├── services/          # API services
├── store/             # State management
├── navigation/
└── App.tsx
\`\`\`

### State Management:
- Redux Toolkit or Zustand for global state
- React Query for server state
- Context for theme/auth

### Best Practices:
- Feature-based folder structure
- Separation of concerns
- Dependency injection
- Clean architecture principles
      `,
      enterprise: `
## Enterprise App Architecture

### Recommended Structure:
\`\`\`
src/
├── core/              # Core business logic
│   ├── domain/        # Business entities
│   ├── use-cases/     # Business operations
│   └── repositories/  # Data access interfaces
├── infrastructure/
│   ├── api/           # API clients
│   ├── storage/       # Local storage
│   └── services/      # External services
├── presentation/
│   ├── features/      # Feature modules
│   ├── shared/        # Shared UI
│   └── navigation/
├── config/            # App configuration
└── App.tsx
\`\`\`

### Architecture Patterns:
- Clean Architecture / Hexagonal
- Domain-Driven Design (DDD)
- SOLID principles
- Dependency Inversion

### State Management:
- Redux Toolkit with Redux Saga/Thunk
- Normalized state structure
- Immutable updates
- Strict typing with TypeScript

### Testing Strategy:
- Unit tests for business logic
- Integration tests for features
- E2E tests for critical flows
- Minimum 80% code coverage
      `,
    };

    let advice =
      architectures[projectType] ||
      `
## General Architecture Advice

### Core Principles:
- **Separation of Concerns**: Keep business logic separate from UI
- **Component Composition**: Build complex UIs from simple components
- **Single Responsibility**: Each module should have one clear purpose
- **DRY (Don't Repeat Yourself)**: Extract common logic into utilities
- **Scalability**: Design for growth from the start

### Recommended Patterns:
- Container/Presentational component pattern
- Custom hooks for reusable logic
- HOCs for cross-cutting concerns
- Render props for flexible composition
      `;

    // Add feature-specific recommendations
    if (features.includes('authentication')) {
      advice += `

### Authentication Architecture:
- Use secure token storage (Keychain/Keystore)
- Implement refresh token mechanism
- Add biometric authentication support
- Handle session expiration gracefully
      `;
    }

    if (features.includes('offline_support')) {
      advice += `

### Offline-First Architecture:
- Use AsyncStorage or SQLite for local data
- Implement sync queue for pending operations
- Add conflict resolution strategy
- Cache API responses appropriately
      `;
    }

    if (features.includes('real_time')) {
      advice += `

### Real-Time Features:
- Use WebSockets or Firebase for real-time updates
- Implement reconnection logic
- Handle connection state properly
- Optimize for battery usage
      `;
    }

    if (features.includes('analytics')) {
      advice += `

### Analytics Integration:
- Create analytics abstraction layer
- Track user journeys and funnels
- Implement event batching
- Ensure GDPR/privacy compliance
      `;
    }

    return advice;
  }

  /**
   * Get debugging guidance for specific issue types
   */
  static getDebuggingGuidance(issueType: string, platform: string, errorMessage?: string): string {
    const debuggingGuides: Record<string, string> = {
      crash: `
## Debugging App Crashes

### Initial Steps:
1. **Check Logs:**
   - iOS: Xcode Console or \`react-native log-ios\`
   - Android: \`adb logcat\` or \`react-native log-android\`

2. **Enable Debug Mode:**
   - Shake device/emulator
   - Select "Debug" from menu
   - Check for red screen errors

3. **Common Crash Causes:**
   - Null/undefined access
   - Native module issues
   - Memory leaks
   - Unhandled promise rejections

### Platform-Specific:
${
  platform === 'ios'
    ? `
**iOS:**
- Check Xcode crash reports
- Symbolicate crash logs
- Use Instruments for profiling
- Check memory warnings
`
    : platform === 'android'
      ? `
**Android:**
- Use Android Studio Logcat
- Check for ANR (Application Not Responding)
- Profile with Android Profiler
- Check Gradle build issues
`
      : '**Both platforms:** Check logs and use debugging tools'
}

### Solutions:
\`\`\`jsx
// Add error boundaries
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.log('Error caught:', error, errorInfo);
  }

  render() {
    return this.props.children;
  }
}

// Handle promise rejections
global.Promise = require('promise');
require('promise/lib/rejection-tracking').enable();
\`\`\`
      `,
      performance: `
## Debugging Performance Issues

### Profiling Tools:
1. **React DevTools Profiler**
2. **Flipper Performance Plugin**
3. **Xcode Instruments (iOS)**
4. **Android Profiler (Android)**

### Common Issues:
- **Unnecessary Re-renders:**
  \`\`\`jsx
  // Use React.memo
  const MemoizedComponent = React.memo(MyComponent);

  // Use useMemo for expensive computations
  const expensiveValue = useMemo(() =>
    computeExpensiveValue(a, b), [a, b]
  );
  \`\`\`

- **Heavy List Rendering:**
  \`\`\`jsx
  // Use FlatList instead of map
  <FlatList
    data={items}
    keyExtractor={item => item.id}
    renderItem={({ item }) => <Item {...item} />}
    initialNumToRender={10}
    maxToRenderPerBatch={10}
  />
  \`\`\`

- **Large Bundle Size:**
  \`\`\`bash
  # Analyze bundle
  npx react-native-bundle-visualizer
  \`\`\`

### Monitoring:
- Enable Performance Monitor: Dev menu → "Perf Monitor"
- Monitor FPS and memory usage
- Use console.time() for specific operations
      `,
      networking: `
## Debugging Network Issues

### Common Problems:
1. **CORS Issues** (Web only)
2. **SSL/TLS Certificate Problems**
3. **Timeout Errors**
4. **Network Connectivity**

### Debugging Steps:
\`\`\`jsx
// Add request/response logging
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
});

api.interceptors.request.use(request => {
  console.log('Request:', request);
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('Response:', response);
    return response;
  },
  error => {
    console.log('Error:', error.response || error);
    return Promise.reject(error);
  }
);
\`\`\`

### Platform-Specific:
${
  platform === 'ios'
    ? `
**iOS:**
- Check App Transport Security settings
- Verify Info.plist configuration
- Test with Charles Proxy
`
    : platform === 'android'
      ? `
**Android:**
- Check network security config
- Add \`android:usesCleartextTraffic="true"\` if needed
- Use Android Network Profiler
`
      : '**Both platforms:** Check network configuration'
}

### Tools:
- Flipper Network Plugin
- React Native Debugger
- Postman for API testing
      `,
      build: `
## Debugging Build Issues

### Common Build Errors:
1. **Dependency Conflicts**
2. **Cache Issues**
3. **Native Module Linking**
4. **Version Mismatches**

### Resolution Steps:
\`\`\`bash
# Clean project
cd ios && pod deintegrate && pod install
cd android && ./gradlew clean

# Clear caches
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build
rm -rf android/build
rm -rf android/app/build

# Fresh install
npm install
cd ios && pod install
\`\`\`

### Platform-Specific:
${
  platform === 'ios'
    ? `
**iOS:**
\`\`\`bash
# Clean build folder
rm -rf ~/Library/Developer/Xcode/DerivedData

# Reset CocoaPods
pod cache clean --all
pod deintegrate
pod install

# Check Xcode version
xcode-select -p
\`\`\`
`
    : platform === 'android'
      ? `
**Android:**
\`\`\`bash
# Clean Gradle cache
./gradlew clean
./gradlew cleanBuildCache

# Check Java version
java -version

# Update Gradle
./gradlew wrapper --gradle-version=8.0
\`\`\`
`
      : '**Both platforms:** Clean and rebuild'
}
      `,
      ui: `
## Debugging UI Issues

### Common UI Problems:
1. **Layout Issues** - Check Flexbox
2. **Styling Not Applied** - Check StyleSheet
3. **Component Not Rendering** - Check conditional rendering
4. **Keyboard Covering Input** - Use KeyboardAvoidingView

### Debugging Tools:
\`\`\`jsx
// Enable Inspector
import { Inspector } from 'react-native';

// In dev menu: "Show Inspector"

// Debug layout with borders
<View style={{ borderWidth: 1, borderColor: 'red' }}>
  {/* Your content */}
</View>
\`\`\`

### Platform Differences:
${
  platform === 'ios'
    ? `
**iOS:**
- Check safe area handling
- Verify status bar configuration
- Test on different device sizes
`
    : platform === 'android'
      ? `
**Android:**
- Check status bar and navigation bar
- Test on different screen densities
- Verify hardware back button handling
`
      : '**Both platforms:** Test on multiple devices'
}

### Solutions:
\`\`\`jsx
// Keyboard handling
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  {/* Your form */}
</KeyboardAvoidingView>
\`\`\`
      `,
    };

    let guidance =
      debuggingGuides[issueType] ||
      `
## General Debugging Guidance

### Step-by-Step Approach:
1. **Reproduce the Issue** - Find consistent steps
2. **Check Logs** - Look for error messages
3. **Isolate the Problem** - Remove code until it works
4. **Test Hypothesis** - Make targeted changes
5. **Verify Fix** - Test thoroughly

### Essential Tools:
- React Native Debugger
- Flipper (Facebook's debugging platform)
- React DevTools
- Console logging
- Breakpoint debugging

### Best Practices:
- Enable all warnings in development
- Use TypeScript for type safety
- Implement proper error handling
- Add meaningful error messages
- Use source maps for stack traces
      `;

    if (errorMessage) {
      guidance += `

### Specific Error Analysis:
**Error:** ${errorMessage}

**Troubleshooting Steps:**
1. Search for this error in React Native issues
2. Check if it's a known issue in the version you're using
3. Look for similar patterns in your codebase
4. Try updating dependencies if it's a known bug
      `;
    }

    return guidance;
  }
}
