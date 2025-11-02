# ADB Tools Specification for React Native MCP Server

**Version:** 2.0
**Created:** 2025-11-02
**Updated:** 2025-11-02 (Enhanced Screenshot Tools)
**Target Release:** v1.2.0
**Priority:** High

---

## Executive Summary

Add comprehensive Android Debug Bridge (ADB) integration to the React Native MCP Server, providing developers with seamless Android device management, debugging, and testing capabilities directly through the MCP interface.

**Business Value:**
- Streamline React Native Android development workflow
- Reduce context switching between terminal and IDE
- Automate common ADB tasks
- Improve developer productivity by 30-40%

**Target Users:**
- React Native Android developers
- QA engineers testing on Android devices
- DevOps engineers managing device farms

---

## Table of Contents

1. [Proposed ADB Tools](#proposed-adb-tools)
2. [Tool Specifications](#tool-specifications)
3. [Implementation Architecture](#implementation-architecture)
4. [Security Considerations](#security-considerations)
5. [Error Handling](#error-handling)
6. [Testing Strategy](#testing-strategy)
7. [Documentation](#documentation)

---

## Proposed ADB Tools

### Overview: 18 New ADB Tools

**Base Tools:** 12 | **Enhanced Screenshot Tools:** 6 | **Total:** 18

| Category | Tools | Priority |
|----------|-------|----------|
| **Device Management** | list_devices, device_info, connect_device | High |
| **App Management** | install_apk, uninstall_app, clear_app_data, launch_app | High |
| **Screenshot & Visual** | screenshot (enhanced), screenshot_compare, screenshot_batch, screenshot_annotate, screenshot_cleanup, visual_regression_test | **Critical** |
| **Debugging** | logcat, logcat_react_native, screen_record | High |
| **Performance** | performance_monitor, memory_stats, cpu_stats | Medium |
| **File Operations** | push_file, pull_file | Low |
| **Network** | reverse_port, forward_port | High |
| **Shell** | execute_shell, batch_commands | Medium |

**🆕 v2.0 Updates:**
- Enhanced screenshot tool with metadata capture and auto-organization
- Screenshot comparison with pixel-level diff generation
- Batch screenshot capture for user flows
- Screenshot annotation for bug reports
- Visual regression testing workflow
- Screenshot cleanup utilities

---

## Tool Specifications

### 1. Device Management Tools

#### 🔧 `adb_list_devices`

**Description:** List all connected Android devices and emulators

**Input Schema:**
```typescript
{
  include_offline: z.boolean().optional().describe("Include offline devices"),
  show_details: z.boolean().optional().describe("Show detailed device information")
}
```

**Output:**
```typescript
{
  devices: [
    {
      id: string,              // Device serial number
      state: "device" | "offline" | "unauthorized",
      model: string,           // Device model (if available)
      android_version: string, // Android OS version
      api_level: number,       // Android API level
      architecture: string     // CPU architecture
    }
  ],
  total: number,
  online: number,
  offline: number
}
```

**Example Usage:**
```bash
claude "List all connected Android devices with adb_list_devices"
```

**Implementation:**
```typescript
async ({ include_offline = false, show_details = true }) => {
  const result = await executeAdbCommand(['devices', '-l']);
  const devices = parseDeviceList(result, include_offline);

  if (show_details) {
    for (const device of devices) {
      device.model = await getDeviceProperty(device.id, 'ro.product.model');
      device.android_version = await getDeviceProperty(device.id, 'ro.build.version.release');
      device.api_level = await getDeviceProperty(device.id, 'ro.build.version.sdk');
    }
  }

  return formatDeviceList(devices);
}
```

---

#### 🔧 `adb_device_info`

**Description:** Get detailed information about a specific Android device

**Input Schema:**
```typescript
{
  device_id: z.string().optional().describe("Device serial number (uses default if not specified)"),
  info_type: z.enum([
    "all",
    "hardware",
    "software",
    "display",
    "battery",
    "storage"
  ]).optional()
}
```

**Output:**
```markdown
# Device Information: [Device Model]

## Hardware
- Model: Samsung Galaxy S21
- Manufacturer: Samsung
- CPU: Qualcomm Snapdragon 888
- Architecture: arm64-v8a
- RAM: 8 GB
- Serial: ABC123XYZ

## Software
- Android Version: 13
- API Level: 33
- Build: SP1A.210812.016
- Security Patch: 2024-01-01

## Display
- Resolution: 1080x2400
- Density: 420 dpi
- Size: 6.2 inches

## Battery
- Level: 85%
- Status: Charging
- Health: Good
- Temperature: 28°C

## Storage
- Internal: 128 GB
- Available: 45 GB (35%)
- SD Card: Not present
```

---

#### 🔧 `adb_connect_device`

**Description:** Connect to a device over WiFi or USB

**Input Schema:**
```typescript
{
  connection_type: z.enum(["wifi", "usb", "network"]),
  device_ip: z.string().optional().describe("IP address for WiFi/network connection"),
  port: z.number().default(5555).describe("Port for WiFi connection"),
  auto_authorize: z.boolean().default(true).describe("Automatically accept authorization prompts")
}
```

**Example Usage:**
```bash
# Connect via WiFi
claude "Connect to Android device at 192.168.1.100 using adb_connect_device"

# Connect to USB device
claude "Connect to USB Android device with adb_connect_device"
```

---

### 2. App Management Tools

#### 🔧 `adb_install_apk`

**Description:** Install APK on device with advanced options

**Input Schema:**
```typescript
{
  apk_path: z.string().describe("Path to APK file"),
  device_id: z.string().optional(),
  options: z.object({
    replace: z.boolean().default(true).describe("Replace existing app"),
    grant_permissions: z.boolean().default(true).describe("Auto-grant permissions"),
    allow_downgrade: z.boolean().default(false),
    allow_test_apk: z.boolean().default(true)
  }).optional()
}
```

**Output:**
```markdown
✅ APK Installation Successful

**App Details:**
- Package: com.example.myapp
- Version: 1.2.3 (Build 42)
- Size: 25.4 MB
- Install Time: 3.2 seconds

**Permissions Granted:**
- Camera
- Location
- Storage

**Installation Command:**
adb install -r -g /path/to/app.apk
```

**Implementation:**
```typescript
async ({ apk_path, device_id, options = {} }) => {
  validateFilePath(apk_path);

  const args = ['install'];
  if (options.replace) args.push('-r');
  if (options.grant_permissions) args.push('-g');
  if (options.allow_downgrade) args.push('-d');
  if (options.allow_test_apk) args.push('-t');

  if (device_id) args.push('-s', device_id);
  args.push(apk_path);

  const startTime = performance.now();
  const result = await executeAdbCommand(args);
  const duration = ((performance.now() - startTime) / 1000).toFixed(1);

  const packageInfo = await getApkInfo(apk_path);

  return formatInstallationResult(result, packageInfo, duration);
}
```

---

#### 🔧 `adb_uninstall_app`

**Description:** Uninstall application from device

**Input Schema:**
```typescript
{
  package_name: z.string().describe("Package name to uninstall"),
  device_id: z.string().optional(),
  keep_data: z.boolean().default(false).describe("Keep app data after uninstall")
}
```

---

#### 🔧 `adb_clear_app_data`

**Description:** Clear app data and cache

**Input Schema:**
```typescript
{
  package_name: z.string().describe("Package name"),
  device_id: z.string().optional(),
  clear_type: z.enum(["all", "cache", "data"]).default("all")
}
```

---

#### 🔧 `adb_launch_app`

**Description:** Launch React Native app on device

**Input Schema:**
```typescript
{
  package_name: z.string().describe("Package name to launch"),
  activity: z.string().optional().describe("Activity name (uses MainActivity if not specified)"),
  device_id: z.string().optional(),
  clear_data_before_launch: z.boolean().default(false),
  wait_for_debugger: z.boolean().default(false)
}
```

---

### 3. Debugging Tools

#### 🔧 `adb_logcat`

**Description:** View and filter Android system logs in real-time

**Input Schema:**
```typescript
{
  device_id: z.string().optional(),
  filter_spec: z.string().optional().describe("Filter specification (e.g., 'ReactNative:V *:S')"),
  priority: z.enum(["V", "D", "I", "W", "E", "F"]).optional().describe("Minimum priority level"),
  tag: z.string().optional().describe("Filter by tag"),
  package: z.string().optional().describe("Filter by package name"),
  duration: z.number().optional().describe("Capture duration in seconds (0 for continuous)"),
  output_format: z.enum(["brief", "process", "tag", "thread", "raw", "time", "threadtime", "long"]).default("threadtime"),
  clear_before_start: z.boolean().default(true),
  max_lines: z.number().default(1000).describe("Maximum lines to capture")
}
```

**Output:**
```markdown
# Android Logcat - ReactNative:* *:S

**Device:** Samsung Galaxy S21 (ABC123)
**Started:** 2025-11-02 14:30:45
**Filter:** ReactNative:V *:S

---

11-02 14:30:45.123  1234  1234 D ReactNative: Running "MyApp" with {"rootTag":1}
11-02 14:30:45.234  1234  1234 I ReactNative: Module JSCJavaScriptExecutor initialized
11-02 14:30:45.345  1234  1234 D ReactNative: CatalystInstanceImpl.runJSBundle()
11-02 14:30:45.456  1234  1234 I ReactNativeJS: App mounted successfully
11-02 14:30:46.123  1234  1234 W ReactNativeJS: Warning: setState on unmounted component
11-02 14:30:46.234  1234  1234 E ReactNativeJS: Error: Network request failed

---

**Summary:**
- Total Lines: 156
- Debug: 42
- Info: 38
- Warning: 12
- Error: 4
- Duration: 30s
```

**Implementation:**
```typescript
async ({ device_id, filter_spec, priority, tag, package, duration, output_format, clear_before_start, max_lines }) => {
  const args = ['logcat'];

  if (device_id) args.unshift('-s', device_id);
  if (clear_before_start) await executeAdbCommand([...args, '-c']);

  args.push('-v', output_format);

  // Build filter specification
  if (filter_spec) {
    args.push(filter_spec);
  } else {
    let filter = '';
    if (tag) filter = `${tag}:${priority || 'V'}`;
    if (package) {
      // Get PID for package and filter by it
      const pid = await getPackagePid(device_id, package);
      args.push('--pid', pid.toString());
    }
    if (filter) args.push(filter, '*:S');
  }

  // Capture logs
  const logs = await captureLogcat(args, duration, max_lines);

  return formatLogcatOutput(logs, {
    device_id,
    filter: filter_spec || tag || package,
    stats: analyzeLogStats(logs)
  });
}
```

---

#### 🔧 `adb_logcat_react_native`

**Description:** Specialized logcat filter for React Native development

**Input Schema:**
```typescript
{
  device_id: z.string().optional(),
  log_type: z.enum([
    "all",           // All React Native logs
    "javascript",    // JavaScript console logs only
    "native",        // Native bridge logs
    "errors",        // Errors and warnings only
    "performance",   // Performance metrics
    "network"        // Network requests
  ]).default("all"),
  include_timestamps: z.boolean().default(true),
  duration: z.number().optional()
}
```

**Output:**
```markdown
# React Native Logs - JavaScript Console

🟢 [14:30:45] INFO  App.js:23 - App initialized
🔵 [14:30:46] DEBUG Navigation.js:45 - Navigating to HomeScreen
🟡 [14:30:47] WARN  API.js:89 - API response slow (2.3s)
🔴 [14:30:48] ERROR Component.js:12 - Cannot read property 'name' of undefined
    at Component.render (Component.js:12)
    at ReactNative.render (ReactNative.js:234)

---

**Performance Metrics:**
- JS Thread FPS: 58.4
- UI Thread FPS: 59.8
- Bridge Calls: 142
- Bundle Size: 2.4 MB
```

---

#### 🔧 `adb_screenshot` (Enhanced)

**Description:** Capture screenshot from device with metadata, auto-organization, and debugging context

**🆕 v2.0 Enhancements:**
- Automatic file naming with timestamps
- Complete metadata capture (device, app, performance)
- Auto-organization by date/app/device
- Quality and compression options
- Wait for idle UI state
- Retry on black screen detection

**Input Schema:**
```typescript
{
  device_id: z.string().optional(),

  // File options
  output_path: z.string().optional().describe("Custom path (auto-generated if not provided)"),
  auto_name: z.boolean().default(true).describe("Auto-generate filename with timestamp"),
  prefix: z.string().optional().describe("Filename prefix (e.g., 'login-screen')"),
  format: z.enum(["png", "jpg", "webp"]).default("png"),

  // Organization
  organize_by_date: z.boolean().default(true).describe("Organize in date-based folders"),
  include_device_name: z.boolean().default(true).describe("Include device name in path"),
  include_app_version: z.boolean().default(true).describe("Include app version in path"),

  // Quality options
  quality: z.number().min(1).max(100).default(90).describe("JPEG/WebP quality (1-100)"),
  scale: z.number().default(1.0).describe("Scale factor (0.5 = half size)"),
  optimize: z.boolean().default(true).describe("Optimize file size"),

  // Capture timing
  wait_before_capture: z.number().default(0).describe("Wait milliseconds before capturing"),
  wait_for_idle: z.boolean().default(true).describe("Wait for UI to be idle"),
  retry_on_black_screen: z.boolean().default(true).describe("Retry if screenshot is mostly black"),
  max_retries: z.number().default(3),

  // Metadata
  include_metadata: z.boolean().default(true).describe("Capture device and app metadata"),
  include_logs: z.boolean().default(false).describe("Include recent logs in metadata"),
  tags: z.array(z.string()).optional().describe("Custom tags for organization"),
  notes: z.string().optional().describe("Custom notes for this screenshot"),

  // Advanced
  display_id: z.number().optional().describe("Display ID for multi-display devices"),
  copy_to_clipboard: z.boolean().default(false).describe("Copy to system clipboard"),
  open_in_viewer: z.boolean().default(false).describe("Open in default viewer")
}
```

**Output:**
```markdown
✅ Screenshot Captured

**File:** screenshots/2025-11-02/MyApp-v1.2.3/GalaxyS21/login-screen-14-30-45.png
**Size:** 245 KB (optimized from 320 KB)
**Resolution:** 1080x2400
**Captured:** 2025-11-02 14:30:45

## Device Context
- Device: Samsung Galaxy S21 (ABC123XYZ)
- Android: 13 (API 33)
- Screen Density: 420 dpi
- Orientation: Portrait

## App Context
- Package: com.myapp
- Version: 1.2.3 (Build 42)
- Activity: MainActivity
- App State: Active/Foreground

## Performance Context
- Memory Usage: 245 MB
- CPU Usage: 42%
- Network: WiFi (192.168.1.100)
- Battery: 85%

## Files Created
- Screenshot: login-screen-14-30-45.png
- Metadata: login-screen-14-30-45.png.json

📸 Thumbnail: [base64 encoded preview]

💡 Tip: Use this screenshot with adb_screenshot_compare for visual regression testing
```

**Metadata File (JSON):**
```json
{
  "timestamp": "2025-11-02T14:30:45.123Z",
  "device": {
    "id": "ABC123XYZ",
    "model": "Samsung Galaxy S21",
    "manufacturer": "Samsung",
    "android_version": "13",
    "api_level": 33,
    "resolution": "1080x2400",
    "density": 420,
    "orientation": "portrait"
  },
  "app": {
    "package": "com.myapp",
    "version": "1.2.3",
    "build": 42,
    "activity": "MainActivity",
    "state": "foreground"
  },
  "screenshot": {
    "filename": "login-screen-14-30-45.png",
    "format": "png",
    "file_size_bytes": 250880,
    "width": 1080,
    "height": 2400,
    "scale": 1.0
  },
  "performance": {
    "memory_mb": 245,
    "cpu_percent": 42,
    "battery_percent": 85,
    "network_type": "wifi"
  },
  "tags": ["login-flow", "ui-validation", "baseline"],
  "notes": "Baseline screenshot for visual regression testing"
}
```

**Example Usage:**
```bash
# Basic screenshot with auto-naming
claude "Take screenshot of current screen"

# Named screenshot with metadata
claude "Take screenshot with prefix 'login-screen' and tag 'baseline'"

# High-quality screenshot for design validation
claude "Take screenshot at quality 100 without optimization"

# Screenshot for bug report
claude "Take screenshot with notes 'Button alignment issue on Galaxy S21'"
```

---

#### 🔧 `adb_screenshot_compare` (New)

**Description:** Compare two screenshots and generate visual diff highlighting changes

**Use Cases:**
- Visual regression testing after code changes
- Cross-device UI consistency validation
- Design implementation verification
- Before/after refactoring comparison

**Input Schema:**
```typescript
{
  baseline_path: z.string().describe("Path to baseline screenshot"),
  current_path: z.string().optional().describe("Path to current screenshot (captures new if not provided)"),
  device_id: z.string().optional(),

  // Output options
  output_diff_path: z.string().optional().describe("Where to save diff image"),
  output_directory: z.string().optional().describe("Directory for all comparison outputs"),

  // Comparison settings
  threshold: z.number().default(0.05).describe("Difference threshold (0.0-1.0, 5% default)"),
  algorithm: z.enum(["pixel", "structural", "perceptual"]).default("perceptual").describe("Comparison algorithm"),

  // Ignore regions
  ignore_regions: z.array(z.object({
    name: z.string().optional(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  })).optional().describe("Regions to ignore (e.g., clock, timestamps, dynamic content)"),

  // Visualization options
  highlight_color: z.string().default("red").describe("Color for highlighting differences"),
  generate_side_by_side: z.boolean().default(true).describe("Create side-by-side comparison"),
  generate_overlay: z.boolean().default(true).describe("Create overlay showing differences"),
  generate_heatmap: z.boolean().default(false).describe("Create heatmap of differences"),

  // Reporting
  generate_html_report: z.boolean().default(true).describe("Generate interactive HTML report"),
  fail_on_difference: z.boolean().default(false).describe("Exit with error if differences found"),

  // Advanced
  anti_aliasing_tolerance: z.number().default(2).describe("Pixel tolerance for anti-aliasing")
}
```

**Output:**
```markdown
# Screenshot Comparison Report

**Baseline:** screenshots/baseline/login-screen.png (1080x2400)
**Current:** screenshots/current/login-screen.png (1080x2400)
**Comparison:** 2025-11-02 14:30:45

## Results

**Similarity:** 94.3%
**Difference:** 5.7% (3,240 pixels changed)
**Verdict:** ⚠️ VISUAL REGRESSION DETECTED (exceeds 5% threshold)

## Changed Regions

1. **Header Area** (0, 0, 1080, 200)
   - Pixels Changed: 648 (12% of region)
   - Type: Background color change
   - Severity: Medium

2. **Button Color** (540, 1800, 200, 80)
   - Pixels Changed: 16,000 (100% of region)
   - Type: Complete color change
   - Severity: High

3. **Text Alignment** (100, 1200, 880, 40)
   - Pixels Changed: 812 (23% of region)
   - Type: Position shift
   - Severity: Medium

## Ignored Regions
- Clock (990, 0, 90, 60) - Timestamp varies
- Battery Icon (1050, 0, 30, 60) - Dynamic content

## Files Generated

**Diff Images:**
- 📊 Side-by-side: comparison/side-by-side.png
- 🔴 Diff overlay: comparison/diff-overlay.png
- 🌡️ Heatmap: comparison/heatmap.png

**Reports:**
- 📄 HTML report: comparison/report.html (open in browser for interactive view)
- 📋 JSON data: comparison/results.json

## Recommendations

⚠️ **Action Required:**
- Review button color change in design system
- Verify text alignment matches specifications
- Update baseline if changes are intentional

**Next Steps:**
```bash
# To update baseline if changes are intentional:
claude "Update visual regression baseline with current screenshot"

# To investigate specific region:
claude "Capture annotated screenshot highlighting button region"
```

💡 **Tip:** Use ignore_regions to exclude dynamic content like clocks and battery icons
```

**Example Usage:**
```bash
# Compare against baseline
claude "Compare current login screen to baseline at screenshots/baseline/login.png"

# Compare with custom threshold
claude "Compare screenshots with 2% difference threshold"

# Compare and ignore clock region
claude "Compare screenshots ignoring region at (990, 0) size 90x60 for clock"

# Generate all visualization types
claude "Compare screenshots and generate side-by-side, overlay, and heatmap"
```

---

#### 🔧 `adb_screenshot_batch` (New)

**Description:** Capture multiple screenshots in sequence for user flows and multi-screen testing

**Use Cases:**
- Capture entire user journey (login → home → checkout)
- Multi-device screenshot collection
- Automated UI documentation
- Visual regression test suite creation

**Input Schema:**
```typescript
{
  device_id: z.string().optional(),

  // Screens to capture
  screens: z.array(z.object({
    name: z.string().describe("Screen identifier (e.g., 'login', 'home')"),
    description: z.string().optional().describe("Screen description"),

    // Navigation (optional)
    setup_commands: z.array(z.string()).optional().describe("ADB commands to navigate to screen"),
    tap_coordinates: z.object({
      x: z.number(),
      y: z.number()
    }).optional().describe("Tap location to navigate"),

    // Capture timing
    wait_before_capture: z.number().default(2000).describe("Wait milliseconds before capture"),
    wait_for_element: z.string().optional().describe("Wait for UI element to appear"),

    // Screenshot options
    tags: z.array(z.string()).optional()
  })).describe("List of screens to capture"),

  // Organization
  output_directory: z.string().describe("Base directory for screenshots"),
  organize_by: z.enum(["screen", "timestamp", "sequence"]).default("sequence"),
  create_subdirectories: z.boolean().default(true),

  // Batch options
  include_metadata: z.boolean().default(true),
  delay_between_screens: z.number().default(1000).describe("Delay between screen captures (ms)"),
  continue_on_error: z.boolean().default(true).describe("Continue if one screen fails"),

  // Output
  generate_index: z.boolean().default(true).describe("Generate index/gallery of screenshots"),
  generate_flow_diagram: z.boolean().default(false).describe("Generate visual flow diagram")
}
```

**Output:**
```markdown
# Batch Screenshot Capture Complete

**Session:** login-flow-2025-11-02-14-30-45
**Screens Captured:** 5/5
**Duration:** 12.3 seconds
**Output:** screenshots/login-flow/

## Captured Screens

1. ✅ **Login Screen** (2.1s)
   - File: 01-login-screen.png (1080x2400, 245 KB)
   - Tags: login-flow, baseline
   - Metadata: 01-login-screen.png.json

2. ✅ **Password Entry** (2.3s)
   - File: 02-password-entry.png (1080x2400, 248 KB)
   - Tags: login-flow
   - Metadata: 02-password-entry.png.json

3. ✅ **Home Screen** (2.5s)
   - File: 03-home-screen.png (1080x2400, 312 KB)
   - Tags: login-flow, home
   - Metadata: 03-home-screen.png.json

4. ✅ **Profile Screen** (2.2s)
   - File: 04-profile-screen.png (1080x2400, 267 KB)
   - Tags: login-flow, profile
   - Metadata: 04-profile-screen.png.json

5. ✅ **Settings Screen** (2.1s)
   - File: 05-settings-screen.png (1080x2400, 234 KB)
   - Tags: login-flow, settings
   - Metadata: 05-settings-screen.png.json

## Directory Structure

```
screenshots/login-flow/
├── 01-login-screen.png
├── 01-login-screen.png.json
├── 02-password-entry.png
├── 02-password-entry.png.json
├── 03-home-screen.png
├── 03-home-screen.png.json
├── 04-profile-screen.png
├── 04-profile-screen.png.json
├── 05-settings-screen.png
├── 05-settings-screen.png.json
├── index.html (visual gallery)
├── flow-diagram.svg (visual flow)
└── session-metadata.json
```

## Gallery

📸 View all screenshots: file://screenshots/login-flow/index.html

## Next Steps

**Visual Regression Testing:**
```bash
# Set this batch as baseline
claude "Create visual regression baseline from screenshots/login-flow/"

# Or compare against existing baseline
claude "Compare current screenshots to baseline for login flow"
```

**Documentation:**
- Gallery HTML includes all screenshots with metadata
- Flow diagram shows user journey visually
- Session metadata includes timing and performance data
```

**Example Usage:**
```bash
# Simple batch capture
claude "Batch capture screenshots: login, home, profile, settings with 2 second wait"

# Capture with navigation
claude "Batch capture user flow: tap login at (540,1200), wait 2s, tap submit at (540,1800)"

# Capture for baseline
claude "Batch capture all app screens for baseline with tags: baseline, v1.2.3"

# Multi-device batch
claude "Batch capture login flow on all connected devices"
```

---

#### 🔧 `adb_screenshot_annotate` (New)

**Description:** Annotate screenshots with shapes, text, and highlights for bug reports and documentation

**Use Cases:**
- Mark UI issues for bug reports
- Highlight important elements for documentation
- Create visual test case documentation
- Generate annotated design feedback

**Input Schema:**
```typescript
{
  screenshot_path: z.string().describe("Screenshot to annotate"),
  output_path: z.string().optional().describe("Where to save annotated screenshot (default: appends '-annotated')"),

  // Annotations
  annotations: z.array(z.object({
    type: z.enum(["arrow", "circle", "box", "text", "blur", "highlight", "number"]),

    // Position
    x: z.number(),
    y: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),

    // Arrow specific
    to_x: z.number().optional().describe("Arrow end point X"),
    to_y: z.number().optional().describe("Arrow end point Y"),

    // Styling
    color: z.string().default("red").describe("Annotation color"),
    thickness: z.number().default(3).describe("Line thickness"),
    opacity: z.number().default(1.0).describe("Opacity (0.0-1.0)"),

    // Text specific
    text: z.string().optional(),
    font_size: z.number().default(24),
    background: z.boolean().default(true).describe("Text background"),

    // Metadata
    label: z.string().optional().describe("Annotation label for reference")
  })),

  // Overall options
  add_title: z.string().optional().describe("Title overlay at top"),
  add_description: z.string().optional().describe("Description overlay at bottom"),
  add_timestamp: z.boolean().default(true),
  add_device_info: z.boolean().default(true),

  // Template
  template: z.enum(["bug-report", "design-feedback", "test-case", "documentation", "custom"]).optional(),

  // Output format
  output_format: z.enum(["png", "jpg", "pdf"]).default("png")
}
```

**Output:**
```markdown
✅ Screenshot Annotated

**Original:** screenshots/login-screen.png
**Annotated:** screenshots/login-screen-annotated.png
**Annotations:** 4 added

## Annotations Applied

1. **Red Circle** at (540, 1200)
   - Label: "Button alignment issue"
   - Color: Red, Thickness: 3

2. **Arrow** from (100, 1000) to (540, 1200)
   - Label: "Points to misaligned button"
   - Color: Red, Thickness: 2

3. **Text Box** at (200, 800)
   - Text: "Expected: centered\nActual: offset 10px right"
   - Font: 24px, Background: White

4. **Blur** region (0, 0, 200, 100)
   - Label: "Hide sensitive user data"

## Overlay Information

- Title: "Login Screen - UI Issue #123"
- Description: "Button alignment issue on Galaxy S21"
- Device: Samsung Galaxy S21 (Android 13)
- Timestamp: 2025-11-02 14:30:45

## Files Created

- 🖼️ Annotated Screenshot: screenshots/login-screen-annotated.png
- 📋 Annotation Data: screenshots/login-screen-annotations.json

💡 **Tip:** Use template='bug-report' for standardized bug report format

**Example attachment for issue tracker:**
![annotated screenshot](screenshots/login-screen-annotated.png)
```

**Annotation Templates:**

**Bug Report Template:**
- Red circles for issues
- Arrows pointing to problems
- Text describing expected vs actual
- Device and timestamp overlay

**Design Feedback Template:**
- Colored highlights for different feedback types
- Numbered annotations
- Legend at bottom

**Test Case Template:**
- Green checkmarks for passed elements
- Red X for failed elements
- Step numbers
- Expected behavior notes

**Example Usage:**
```bash
# Simple annotation
claude "Annotate screenshot with red circle at (540,1200) and text 'Button misaligned'"

# Bug report annotation
claude "Annotate screenshot using bug-report template with title 'Login Issue #123'"

# Multiple annotations
claude "Annotate screenshot with:
- Red box at (100,100) size 200x50 for header issue
- Arrow from (50,50) to (100,100)
- Text at (50,200) saying 'Header should be centered'"

# Privacy protection
claude "Annotate screenshot blurring region (0,0) size 400x100 to hide user email"
```

---

#### 🔧 `adb_screenshot_cleanup` (New)

**Description:** Manage and cleanup screenshot collections with retention policies

**Use Cases:**
- Remove old screenshots to free disk space
- Archive screenshots by date or project
- Compress old screenshots
- Maintain only baseline and recent screenshots

**Input Schema:**
```typescript
{
  directory: z.string().describe("Screenshot directory to clean"),

  // Retention policy
  older_than_days: z.number().optional().describe("Delete screenshots older than N days"),
  keep_baseline: z.boolean().default(true).describe("Never delete baseline screenshots"),
  keep_tagged: z.array(z.string()).optional().describe("Keep screenshots with these tags"),
  keep_latest_n: z.number().optional().describe("Keep N most recent screenshots per screen"),

  // Actions
  action: z.enum(["delete", "compress", "archive", "report-only"]).default("report-only"),
  compress_format: z.enum(["zip", "tar.gz"]).default("zip").describe("Compression format for archive"),
  archive_directory: z.string().optional().describe("Where to move archived screenshots"),

  // Safety
  dry_run: z.boolean().default(true).describe("Preview without actual changes"),
  confirm_before_delete: z.boolean().default(true),
  backup_before_delete: z.boolean().default(false),

  // Filtering
  include_patterns: z.array(z.string()).optional().describe("File patterns to include (glob)"),
  exclude_patterns: z.array(z.string()).optional().describe("File patterns to exclude (glob)")
}
```

**Output:**
```markdown
# Screenshot Cleanup Report

**Directory:** screenshots/
**Mode:** Dry Run (no changes made)
**Scanned:** 247 screenshots
**Total Size:** 89.3 MB

## Cleanup Analysis

### Screenshots to Delete (older than 30 days)
**Count:** 156
**Size:** 52.1 MB

1. screenshots/2025-10-01/login-screen-*.png (42 files, 12.3 MB)
2. screenshots/2025-10-02/home-screen-*.png (38 files, 10.8 MB)
3. screenshots/2025-10-03/profile-screen-*.png (35 files, 9.5 MB)
... (153 more files)

### Screenshots to Keep
**Count:** 91
**Size:** 37.2 MB

**Baseline Screenshots:** 12 files (4.2 MB)
- screenshots/baseline/*.png (tagged: baseline)

**Tagged 'important':** 8 files (2.8 MB)
- screenshots/critical-bugs/*.png

**Recent (last 30 days):** 71 files (30.2 MB)
- Various screens from past month

## Storage Impact

**Current:** 89.3 MB
**After Cleanup:** 37.2 MB
**Space Saved:** 52.1 MB (58.3%)

## Actions to Take

**To execute cleanup:**
```bash
# Review and confirm
claude "Cleanup screenshots older than 30 days, keeping baseline"

# Archive instead of delete
claude "Archive screenshots older than 30 days to screenshots/archive/"

# Compress old screenshots
claude "Compress screenshots older than 60 days to screenshots-archive.zip"
```

**Safety Measures:**
- ✅ Dry run mode (preview only)
- ✅ Baseline screenshots protected
- ✅ Tagged screenshots protected
- ✅ Recent screenshots protected
- ⚠️ Run with dry_run=false to execute

💡 **Tip:** Always run in dry-run mode first to preview changes
```

**Example Usage:**
```bash
# Preview cleanup
claude "Show what screenshots would be deleted if older than 30 days"

# Execute cleanup
claude "Delete screenshots older than 30 days, keep baseline and tagged 'important'"

# Archive old screenshots
claude "Archive screenshots older than 60 days to archive folder"

# Compress for backup
claude "Compress all screenshots older than 90 days to backup.zip"

# Smart cleanup
claude "Keep only latest 5 screenshots per screen, archive the rest"
```

---

#### 🔧 `adb_visual_regression_test` (New)

**Description:** Automated visual regression testing workflow for detecting unintended UI changes

**Use Cases:**
- Automated UI regression testing in CI/CD
- Pre-release visual validation
- Cross-version UI consistency checks
- Refactoring validation

**Input Schema:**
```typescript
{
  device_id: z.string().optional(),

  // Baseline
  baseline_directory: z.string().describe("Directory with baseline screenshots"),
  baseline_tag: z.string().optional().describe("Use specific baseline tag (e.g., 'v1.2.3')"),
  create_baseline: z.boolean().default(false).describe("Create new baseline from current screens"),

  // Screens to test
  screens_to_test: z.array(z.string()).optional().describe("Screen identifiers (tests all if not provided)"),
  test_config_file: z.string().optional().describe("Path to test configuration JSON"),

  // Comparison settings
  threshold: z.number().default(0.05).describe("Acceptable difference threshold (5% default)"),
  per_screen_thresholds: z.record(z.number()).optional().describe("Custom thresholds per screen"),

  // Ignore dynamic content
  ignore_regions_config: z.string().optional().describe("Path to ignore regions configuration"),
  auto_ignore_timestamps: z.boolean().default(true).describe("Auto-ignore common timestamp locations"),
  auto_ignore_dynamic_content: z.boolean().default(true).describe("Auto-detect and ignore dynamic content"),

  // Test execution
  parallel_execution: z.boolean().default(true).describe("Run tests in parallel"),
  max_parallel: z.number().default(3).describe("Maximum parallel comparisons"),
  retry_failed: z.boolean().default(true).describe("Retry failed comparisons once"),

  // Reporting
  generate_report: z.boolean().default(true),
  report_format: z.enum(["html", "json", "markdown", "junit"]).default("html"),
  fail_on_regression: z.boolean().default(true).describe("Exit with error code if regressions found"),

  // Baseline management
  update_baseline: z.boolean().default(false).describe("Update baseline with current screenshots"),
  update_baseline_for: z.array(z.string()).optional().describe("Update baseline for specific screens only"),

  // CI/CD integration
  ci_mode: z.boolean().default(false).describe("CI/CD mode (stricter settings, no interactive prompts)"),
  artifact_directory: z.string().optional().describe("Directory for CI artifacts (reports, diffs)")
}
```

**Output:**
```markdown
# Visual Regression Test Results

**Session:** visual-regression-2025-11-02-14-30-45
**Baseline:** screenshots/baseline/ (v1.2.3)
**Duration:** 45.6 seconds
**Status:** ⚠️ REGRESSIONS DETECTED (2/5 screens)

## Test Summary

**Total Screens:** 5
**Passed:** 3 (60%)
**Failed:** 2 (40%)
**Threshold:** 5% difference

## Detailed Results

### ✅ PASSED (3 screens)

1. **Login Screen**
   - Similarity: 99.2%
   - Difference: 0.8% (432 pixels)
   - Status: ✅ PASS
   - Changes: Minor anti-aliasing differences
   - Diff: comparisons/login-screen-diff.png

2. **Home Screen**
   - Similarity: 98.7%
   - Difference: 1.3% (702 pixels)
   - Status: ✅ PASS
   - Changes: Updated icon colors (expected)
   - Diff: comparisons/home-screen-diff.png

3. **Checkout Screen**
   - Similarity: 99.5%
   - Difference: 0.5% (270 pixels)
   - Status: ✅ PASS
   - Changes: Text rendering improvements
   - Diff: comparisons/checkout-screen-diff.png

### ❌ FAILED (2 screens)

4. **Profile Screen**
   - Similarity: 94.3%
   - Difference: 5.7% (3,078 pixels) ⚠️ EXCEEDS THRESHOLD
   - Status: ❌ FAIL
   - Changes: Layout shift detected in avatar section
   - Critical Regions:
     * Avatar area (100, 200, 200, 200) - 23% different
     * Button alignment (540, 1800, 200, 80) - 12% different
   - Diff: comparisons/profile-screen-diff.png
   - Action Required: Review layout changes

5. **Settings Screen**
   - Similarity: 78.5%
   - Difference: 21.5% (11,610 pixels) ❌ MAJOR REGRESSION
   - Status: ❌ FAIL
   - Changes: Complete UI redesign detected
   - Critical Regions:
     * Header (0, 0, 1080, 200) - 89% different
     * Menu items (0, 200, 1080, 1500) - 45% different
   - Diff: comparisons/settings-screen-diff.png
   - Action Required: Verify if redesign is intentional

## Files Generated

**Comparison Images:**
- comparisons/login-screen-diff.png (side-by-side + overlay)
- comparisons/home-screen-diff.png
- comparisons/profile-screen-diff.png
- comparisons/checkout-screen-diff.png
- comparisons/settings-screen-diff.png

**Reports:**
- 📊 HTML Report: reports/visual-regression-report.html
- 📋 JSON Data: reports/visual-regression-results.json
- 📝 Markdown: reports/visual-regression-report.md
- 🧪 JUnit XML: reports/visual-regression-junit.xml (for CI)

## Ignored Regions

Auto-ignored dynamic content:
- Clock (990, 0, 90, 60) on all screens
- Battery indicator (1050, 0, 30, 60) on all screens
- Network signal (1020, 0, 30, 60) on all screens

## CI/CD Integration

**Exit Code:** 1 (regressions found)

**GitHub Actions Example:**
```yaml
- name: Visual Regression Test
  run: |
    claude "Run visual regression test in CI mode"

- name: Upload Artifacts
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: visual-regression-results
    path: reports/
```

## Recommendations

### Profile Screen (5.7% difference):
⚠️ **Review Required**
- Check avatar rendering logic changes
- Verify button alignment matches design specs
- Consider updating baseline if changes are intentional

**To investigate:**
```bash
claude "Show detailed comparison for profile screen with heatmap"
```

**To update baseline:**
```bash
claude "Update visual regression baseline for profile screen"
```

### Settings Screen (21.5% difference):
❌ **Major Changes Detected**
- Complete UI redesign detected
- Verify if this is intentional redesign
- Update baseline if new design is approved

**To review:**
```bash
claude "Open visual regression HTML report for detailed review"
```

**To update all baselines:**
```bash
claude "Update visual regression baseline for all screens after design approval"
```

## Next Steps

1. **Review Failed Screens:**
   - Open HTML report for interactive comparison
   - Investigate layout shifts and color changes
   - Verify changes against design specifications

2. **Update Baseline (if changes approved):**
   ```bash
   # Update specific screens
   claude "Update baseline for profile and settings screens"

   # Or update all
   claude "Create new baseline from current screenshots"
   ```

3. **Re-run Tests:**
   ```bash
   claude "Run visual regression test again after fixes"
   ```

💡 **Tip:** View the HTML report for interactive before/after slider and detailed analysis

**Report:** file://reports/visual-regression-report.html
```

**Test Configuration File (visual-regression-config.json):**
```json
{
  "screens": [
    {
      "name": "login",
      "threshold": 0.05,
      "ignore_regions": [
        {"name": "clock", "x": 990, "y": 0, "width": 90, "height": 60}
      ],
      "setup_commands": ["am start -n com.myapp/.LoginActivity"]
    },
    {
      "name": "home",
      "threshold": 0.03,
      "critical": true,
      "tags": ["core-flow"]
    }
  ],
  "global_ignore_regions": [
    {"name": "status-bar", "x": 0, "y": 0, "width": 1080, "height": 60}
  ],
  "baseline_tag": "v1.2.3",
  "auto_ignore_patterns": ["clock", "battery", "network-signal"]
}
```

**Example Usage:**
```bash
# Initial baseline creation
claude "Create visual regression baseline for all app screens tagged v1.2.3"

# Run regression test
claude "Run visual regression test comparing current UI to baseline v1.2.3"

# CI/CD mode
claude "Run visual regression test in CI mode with JUnit output"

# Update baseline after approved changes
claude "Update visual regression baseline for profile and settings screens"

# Test specific screens only
claude "Run visual regression test for login and checkout screens only"

# Custom threshold
claude "Run visual regression test with 2% threshold"
```

---

#### 🔧 `adb_screen_record`

**Description:** Record device screen

**Input Schema:**
```typescript
{
  device_id: z.string().optional(),
  output_path: z.string().describe("Path to save video"),
  duration: z.number().default(180).describe("Recording duration in seconds (max 180)"),
  size: z.string().optional().describe("Video size (e.g., '1280x720')"),
  bit_rate: z.number().default(4000000).describe("Bit rate in bits per second")
}
```

---

### 4. Performance Tools

#### 🔧 `adb_performance_monitor`

**Description:** Monitor real-time device performance metrics

**Input Schema:**
```typescript
{
  device_id: z.string().optional(),
  package_name: z.string().optional().describe("Monitor specific app"),
  metrics: z.array(z.enum([
    "cpu",
    "memory",
    "battery",
    "network",
    "fps",
    "gpu"
  ])).default(["cpu", "memory", "fps"]),
  duration: z.number().default(60).describe("Monitoring duration in seconds"),
  interval: z.number().default(1).describe("Sample interval in seconds")
}
```

**Output:**
```markdown
# Performance Monitor - com.example.myapp

**Device:** Samsung Galaxy S21
**Duration:** 60s
**Samples:** 60

## CPU Usage
- Average: 42%
- Peak: 78% (at 14:31:23)
- Min: 12%

📊 Graph:
[14:30] ████████████░░░░░░░░ 42%
[14:31] ██████████████████░░ 78%
[14:32] ████░░░░░░░░░░░░░░░░ 18%

## Memory Usage
- Current: 245 MB
- Peak: 312 MB
- Average: 268 MB
- Available: 3.2 GB

## Frame Rate (FPS)
- Average: 58.4 fps
- Jank Count: 12
- Dropped Frames: 234 (3.9%)

## Network Activity
- Upload: 2.4 MB
- Download: 8.7 MB
- Requests: 45

## Recommendations
⚠️ CPU spikes detected during image loading
💡 Consider implementing image caching
⚠️ Memory usage increased by 27% during session
💡 Check for memory leaks in component lifecycle
```

---

#### 🔧 `adb_memory_stats`

**Description:** Detailed memory statistics for an app

**Input Schema:**
```typescript
{
  device_id: z.string().optional(),
  package_name: z.string().describe("Package name to analyze"),
  detailed: z.boolean().default(true)
}
```

---

#### 🔧 `adb_cpu_stats`

**Description:** CPU usage statistics

**Input Schema:**
```typescript
{
  device_id: z.string().optional(),
  package_name: z.string().optional(),
  top_processes: z.number().default(10)
}
```

---

### 5. File Operations

#### 🔧 `adb_push_file`

**Description:** Push file to device

**Input Schema:**
```typescript
{
  local_path: z.string().describe("Local file path"),
  remote_path: z.string().describe("Device path"),
  device_id: z.string().optional(),
  create_directories: z.boolean().default(true),
  show_progress: z.boolean().default(true)
}
```

---

#### 🔧 `adb_pull_file`

**Description:** Pull file from device

**Input Schema:**
```typescript
{
  remote_path: z.string().describe("Device file path"),
  local_path: z.string().describe("Local destination path"),
  device_id: z.string().optional(),
  preserve_timestamp: z.boolean().default(true)
}
```

---

### 6. Network Tools

#### 🔧 `adb_reverse_port`

**Description:** Reverse port forwarding (essential for Metro bundler)

**Input Schema:**
```typescript
{
  device_id: z.string().optional(),
  device_port: z.number().describe("Port on device"),
  local_port: z.number().describe("Port on local machine"),
  protocol: z.enum(["tcp", "udp"]).default("tcp")
}
```

**Example Usage:**
```bash
# Enable Metro bundler access from device
claude "Setup reverse port forwarding for Metro bundler (device:8081 -> local:8081)"
```

**Implementation:**
```typescript
async ({ device_id, device_port, local_port, protocol }) => {
  const args = ['reverse', `${protocol}:${device_port}`, `${protocol}:${local_port}`];
  if (device_id) args.unshift('-s', device_id);

  await executeAdbCommand(args);

  return `
✅ Reverse Port Forwarding Established

**Configuration:**
- Device Port: ${device_port}
- Local Port: ${local_port}
- Protocol: ${protocol}

Device can now access localhost:${local_port} via :${device_port}

**Common Use Cases:**
- Metro Bundler: adb reverse tcp:8081 tcp:8081
- Debug Server: adb reverse tcp:9090 tcp:9090
- API Proxy: adb reverse tcp:3000 tcp:3000
  `;
}
```

---

#### 🔧 `adb_forward_port`

**Description:** Forward port from device to local machine

**Input Schema:**
```typescript
{
  device_id: z.string().optional(),
  local_port: z.number(),
  device_port: z.number(),
  protocol: z.enum(["tcp", "udp"]).default("tcp")
}
```

---

### 7. Shell & Batch Operations

#### 🔧 `adb_shell`

**Description:** Execute shell command on device

**Input Schema:**
```typescript
{
  command: z.string().describe("Shell command to execute"),
  device_id: z.string().optional(),
  as_root: z.boolean().default(false).describe("Execute as root (requires rooted device)"),
  timeout: z.number().default(30).describe("Command timeout in seconds")
}
```

**Security Note:** Should sanitize commands to prevent injection attacks

---

#### 🔧 `adb_batch_commands`

**Description:** Execute multiple ADB commands in sequence

**Input Schema:**
```typescript
{
  commands: z.array(z.object({
    type: z.enum(["shell", "install", "uninstall", "push", "pull"]),
    args: z.record(z.any())
  })),
  device_id: z.string().optional(),
  stop_on_error: z.boolean().default(true),
  parallel: z.boolean().default(false)
}
```

**Example:**
```typescript
// Deploy and launch React Native app
[
  { type: "uninstall", args: { package_name: "com.myapp" } },
  { type: "install", args: { apk_path: "./app.apk", grant_permissions: true } },
  { type: "shell", args: { command: "pm clear com.myapp" } },
  { type: "shell", args: { command: "am start -n com.myapp/.MainActivity" } }
]
```

---

## Implementation Architecture

### Module Structure

```
src/tools/adb/
├── index.ts                    # ADB tools registration
├── types.ts                    # TypeScript types
├── core/
│   ├── adb-client.ts          # Core ADB command executor
│   ├── device-manager.ts      # Device connection management
│   └── command-builder.ts     # Command string builder
├── device/
│   ├── list-devices.ts
│   ├── device-info.ts
│   └── connect-device.ts
├── app/
│   ├── install-apk.ts
│   ├── uninstall-app.ts
│   ├── clear-data.ts
│   └── launch-app.ts
├── debug/
│   ├── logcat.ts
│   ├── logcat-filter.ts
│   ├── screenshot.ts
│   └── screen-record.ts
├── performance/
│   ├── performance-monitor.ts
│   ├── memory-stats.ts
│   └── cpu-stats.ts
├── files/
│   ├── push-file.ts
│   └── pull-file.ts
├── network/
│   ├── reverse-port.ts
│   └── forward-port.ts
├── shell/
│   ├── execute-shell.ts
│   └── batch-commands.ts
├── utils/
│   ├── output-parser.ts       # Parse ADB output
│   ├── validators.ts          # Input validation
│   └── formatters.ts          # Output formatting
└── __tests__/
    ├── device.test.ts
    ├── app.test.ts
    ├── debug.test.ts
    └── performance.test.ts
```

### Core ADB Client

```typescript
// src/tools/adb/core/adb-client.ts

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { ADBError, DeviceNotFoundError } from '../../../errors.js';
import { logger } from '../../../utils/logger.js';

const execAsync = promisify(exec);

export interface ADBCommandOptions {
  device_id?: string;
  timeout?: number;
  capture_output?: boolean;
  stream?: boolean;
}

export interface ADBCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export class ADBClient {
  private adbPath: string;

  constructor() {
    this.adbPath = this.findAdbPath();
  }

  /**
   * Find ADB executable path
   */
  private findAdbPath(): string {
    // Check common locations
    const commonPaths = [
      'adb',                                    // In PATH
      '/usr/local/bin/adb',                    // macOS/Linux
      process.env.ANDROID_HOME ? `${process.env.ANDROID_HOME}/platform-tools/adb` : null,
      process.env.ANDROID_SDK_ROOT ? `${process.env.ANDROID_SDK_ROOT}/platform-tools/adb` : null,
    ].filter(Boolean);

    for (const path of commonPaths) {
      try {
        execSync(`${path} version`, { stdio: 'ignore' });
        return path;
      } catch {
        continue;
      }
    }

    throw new ADBError(
      'ADB not found. Please install Android SDK Platform Tools',
      'ADB_NOT_FOUND'
    );
  }

  /**
   * Execute ADB command
   */
  async execute(
    args: string[],
    options: ADBCommandOptions = {}
  ): Promise<ADBCommandResult> {
    const {
      device_id,
      timeout = 30000,
      capture_output = true,
      stream = false
    } = options;

    // Build command
    const cmdArgs = [...args];
    if (device_id) {
      cmdArgs.unshift('-s', device_id);
    }

    const command = `${this.adbPath} ${cmdArgs.join(' ')}`;

    logger.debug('Executing ADB command', { command, device_id });

    const startTime = performance.now();

    try {
      if (stream) {
        return await this.executeStreaming(cmdArgs, timeout);
      } else {
        const { stdout, stderr } = await execAsync(command, {
          timeout,
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });

        const duration = performance.now() - startTime;

        logger.debug('ADB command completed', {
          command,
          duration,
          stdout_length: stdout.length
        });

        return {
          stdout,
          stderr,
          exitCode: 0,
          duration
        };
      }
    } catch (error: any) {
      const duration = performance.now() - startTime;

      logger.error('ADB command failed', {
        command,
        error: error.message,
        duration
      });

      // Parse common errors
      if (error.message.includes('device not found')) {
        throw new DeviceNotFoundError(device_id || 'default');
      }

      if (error.message.includes('device offline')) {
        throw new ADBError('Device is offline', 'DEVICE_OFFLINE', {
          device_id
        });
      }

      if (error.killed) {
        throw new ADBError(
          `Command timed out after ${timeout}ms`,
          'COMMAND_TIMEOUT',
          { command }
        );
      }

      throw new ADBError(
        `ADB command failed: ${error.message}`,
        'COMMAND_FAILED',
        { command, error }
      );
    }
  }

  /**
   * Execute command with streaming output (for logcat, etc.)
   */
  private async executeStreaming(
    args: string[],
    timeout: number
  ): Promise<ADBCommandResult> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.adbPath, args);

      let stdout = '';
      let stderr = '';
      const startTime = performance.now();

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (exitCode) => {
        resolve({
          stdout,
          stderr,
          exitCode: exitCode || 0,
          duration: performance.now() - startTime
        });
      });

      process.on('error', (error) => {
        reject(new ADBError(
          `Process error: ${error.message}`,
          'PROCESS_ERROR'
        ));
      });

      // Timeout handling
      setTimeout(() => {
        process.kill();
        reject(new ADBError(
          `Command timed out after ${timeout}ms`,
          'COMMAND_TIMEOUT'
        ));
      }, timeout);
    });
  }

  /**
   * Check if device exists
   */
  async deviceExists(deviceId: string): Promise<boolean> {
    const result = await this.execute(['devices']);
    return result.stdout.includes(deviceId);
  }

  /**
   * Get default device (if only one connected)
   */
  async getDefaultDevice(): Promise<string | null> {
    const result = await this.execute(['devices']);
    const devices = this.parseDeviceList(result.stdout);

    return devices.length === 1 ? devices[0].id : null;
  }

  /**
   * Parse device list from 'adb devices' output
   */
  private parseDeviceList(output: string): Array<{ id: string; state: string }> {
    const lines = output.split('\n').slice(1); // Skip header

    return lines
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const [id, state] = line.split(/\s+/);
        return { id, state };
      })
      .filter(device => device.state === 'device');
  }
}

// Singleton instance
export const adbClient = new ADBClient();
```

### Device Property Helper

```typescript
// src/tools/adb/utils/device-properties.ts

import { adbClient } from '../core/adb-client.js';

export async function getDeviceProperty(
  deviceId: string,
  property: string
): Promise<string> {
  const result = await adbClient.execute(
    ['shell', 'getprop', property],
    { device_id: deviceId }
  );

  return result.stdout.trim();
}

export async function getAllDeviceProperties(
  deviceId: string
): Promise<Record<string, string>> {
  const result = await adbClient.execute(
    ['shell', 'getprop'],
    { device_id: deviceId }
  );

  const properties: Record<string, string> = {};
  const lines = result.stdout.split('\n');

  for (const line of lines) {
    const match = line.match(/\[([^\]]+)\]: \[([^\]]*)\]/);
    if (match) {
      properties[match[1]] = match[2];
    }
  }

  return properties;
}
```

---

## Security Considerations

### 1. Command Injection Prevention

```typescript
// src/tools/adb/utils/validators.ts

export function sanitizeShellCommand(command: string): string {
  // Disallow dangerous characters
  const dangerous = /[;&|`$()<>]/;

  if (dangerous.test(command)) {
    throw new ValidationError(
      'Command contains potentially dangerous characters',
      { command }
    );
  }

  return command;
}

export function validatePackageName(packageName: string): void {
  const packagePattern = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i;

  if (!packagePattern.test(packageName)) {
    throw new ValidationError(
      'Invalid package name format',
      { packageName }
    );
  }
}
```

### 2. Access Control

```typescript
// Only allow ADB commands, not arbitrary system commands
const ALLOWED_ADB_COMMANDS = [
  'devices',
  'install',
  'uninstall',
  'shell',
  'logcat',
  'push',
  'pull',
  'forward',
  'reverse',
  'screencap',
  'screenrecord'
];

export function validateAdbCommand(command: string): void {
  const baseCommand = command.split(' ')[0];

  if (!ALLOWED_ADB_COMMANDS.includes(baseCommand)) {
    throw new ValidationError(
      `Command '${baseCommand}' is not allowed`,
      { command, allowed: ALLOWED_ADB_COMMANDS }
    );
  }
}
```

### 3. File Path Validation

```typescript
export function validateDeviceFilePath(path: string): void {
  // Prevent accessing sensitive system files
  const blockedPaths = [
    '/data/data',  // App private data (unless targeting specific app)
    '/system',
    '/root'
  ];

  for (const blocked of blockedPaths) {
    if (path.startsWith(blocked)) {
      throw new ValidationError(
        `Access to ${blocked} is restricted`,
        { path }
      );
    }
  }
}
```

---

## Error Handling

### Custom Error Types

```typescript
// src/errors.ts (additions)

export class DeviceNotFoundError extends MCPError {
  constructor(deviceId: string) {
    super(
      `Device not found: ${deviceId}. Please check 'adb devices'`,
      'DEVICE_NOT_FOUND',
      { deviceId }
    );
  }
}

export class DeviceOfflineError extends MCPError {
  constructor(deviceId: string) {
    super(
      `Device is offline: ${deviceId}. Please reconnect the device`,
      'DEVICE_OFFLINE',
      { deviceId }
    );
  }
}

export class PackageNotFoundError extends MCPError {
  constructor(packageName: string) {
    super(
      `Package not found: ${packageName}`,
      'PACKAGE_NOT_FOUND',
      { packageName }
    );
  }
}

export class ADBError extends MCPError {
  constructor(message: string, code: string, details?: unknown) {
    super(message, code, details);
    this.name = 'ADBError';
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// src/tools/adb/__tests__/adb-client.test.ts

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ADBClient } from '../core/adb-client';
import { exec } from 'child_process';

jest.mock('child_process');

describe('ADBClient', () => {
  let client: ADBClient;

  beforeEach(() => {
    client = new ADBClient();
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should execute adb command successfully', async () => {
      const mockExec = exec as jest.MockedFunction<typeof exec>;
      mockExec.mockImplementation((cmd, opts, callback) => {
        callback(null, { stdout: 'Success', stderr: '' });
        return {} as any;
      });

      const result = await client.execute(['devices']);

      expect(result.stdout).toBe('Success');
      expect(result.exitCode).toBe(0);
    });

    it('should handle device not found error', async () => {
      const mockExec = exec as jest.MockedFunction<typeof exec>;
      mockExec.mockImplementation((cmd, opts, callback) => {
        callback(new Error('error: device not found'), null);
        return {} as any;
      });

      await expect(
        client.execute(['shell'], { device_id: 'invalid' })
      ).rejects.toThrow(DeviceNotFoundError);
    });

    it('should include device_id in command', async () => {
      const mockExec = exec as jest.MockedFunction<typeof exec>;
      let capturedCommand = '';

      mockExec.mockImplementation((cmd, opts, callback) => {
        capturedCommand = cmd as string;
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      await client.execute(['shell', 'echo test'], {
        device_id: 'ABC123'
      });

      expect(capturedCommand).toContain('-s ABC123');
    });
  });
});
```

### Integration Tests

```typescript
// src/tools/adb/__tests__/integration/device.test.ts

describe('ADB Device Integration', () => {
  it('should list connected devices', async () => {
    // This test requires actual ADB and device
    // Skip in CI if no device available
    if (!process.env.HAS_DEVICE) {
      test.skip('No device available');
      return;
    }

    const result = await listDevices();
    expect(result.devices).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
  });
});
```

---

## Documentation

### User Documentation

```markdown
# ADB Tools Usage Guide

## Prerequisites

1. **Android SDK Platform Tools** must be installed
2. **USB Debugging** enabled on device
3. **Device connected** via USB or WiFi

## Common Workflows

### Setup React Native Development

```bash
# 1. List available devices
claude "List all Android devices"

# 2. Setup Metro bundler reverse proxy
claude "Setup reverse port forwarding tcp:8081 to tcp:8081"

# 3. Install debug APK
claude "Install APK at ./android/app/build/outputs/apk/debug/app-debug.apk"

# 4. Launch app
claude "Launch com.myapp with MainActivity"

# 5. Monitor logs
claude "Show React Native logs filtered by errors"
```

### Debug Performance Issues

```bash
# Monitor app performance
claude "Monitor performance of com.myapp for 60 seconds including CPU, memory, and FPS"

# Check memory leaks
claude "Show detailed memory stats for com.myapp"

# Analyze CPU usage
claude "Show CPU stats for com.myapp"
```

### Capture Bug Reports

```bash
# Capture screenshot
claude "Take screenshot and save to ./bug-screenshots/issue-123.png"

# Record screen
claude "Record screen for 30 seconds and save to ./recordings/bug-demo.mp4"

# Capture logs
claude "Capture logcat for com.myapp showing errors for 60 seconds"
```
```

---

## Implementation Timeline

**Total Duration:** 8 weeks (updated from 6 weeks to include enhanced screenshot tools)

### Phase 1: Core Infrastructure (Week 1)
- [ ] Implement ADBClient core with command execution
- [ ] Add error types (DeviceNotFoundError, ADBError, etc.)
- [ ] Create validation utilities for input sanitization
- [ ] Implement security validators (command injection prevention)
- [ ] Write unit tests for core functionality
- **Deliverable:** Working ADB command executor with 85%+ test coverage

### Phase 2: Device Management (Week 2)
- [ ] Implement list_devices with detailed device info
- [ ] Implement device_info with hardware/software details
- [ ] Implement connect_device for WiFi/USB connections
- [ ] Add device property queries (parallel execution)
- [ ] Write comprehensive tests
- **Deliverable:** Complete device management tools

### Phase 3: App Management (Week 3)
- [ ] Implement install_apk with advanced options
- [ ] Implement uninstall_app with data retention options
- [ ] Implement clear_app_data (cache, data, all)
- [ ] Implement launch_app with debugging support
- [ ] Add APK info parsing
- [ ] Write tests
- **Deliverable:** Full app lifecycle management

### Phase 4: Enhanced Screenshot Tools (Weeks 4-5) 🆕

#### Week 4: Screenshot Foundation
- [ ] Implement enhanced adb_screenshot with:
  - Auto-naming and timestamping
  - Metadata capture (device, app, performance)
  - Auto-organization by date/app/device
  - Quality and compression options
  - Wait for idle UI detection
- [ ] Implement adb_screenshot_compare with:
  - Pixel-level comparison algorithms
  - Diff image generation (side-by-side, overlay, heatmap)
  - Ignore regions configuration
  - HTML report generation
- [ ] Write comprehensive tests
- **Deliverable:** Screenshot capture and comparison tools

#### Week 5: Visual Testing & Workflow
- [ ] Implement adb_screenshot_batch for:
  - Multi-screen flow capture
  - Navigation automation
  - Gallery generation
- [ ] Implement adb_screenshot_annotate for:
  - Bug report annotations
  - Design feedback markup
  - Privacy blurring
- [ ] Implement adb_screenshot_cleanup for:
  - Retention policies
  - Archive and compression
  - Smart cleanup strategies
- [ ] Implement adb_visual_regression_test for:
  - Automated baseline comparison
  - CI/CD integration
  - JUnit report generation
- [ ] Write tests for all tools
- **Deliverable:** Complete visual testing workflow

### Phase 6: Debugging Tools (Week 6)
- [ ] Implement logcat with advanced filtering
- [ ] Implement logcat_react_native with specialized React Native filters
- [ ] Implement screen_record with quality options
- [ ] Add log analysis and statistics
- [ ] Write tests
- **Deliverable:** Essential debugging tools

### Phase 7: Performance Tools (Week 7)
- [ ] Implement performance_monitor with:
  - CPU, memory, battery, FPS tracking
  - Real-time graphing
  - Recommendation engine
- [ ] Implement memory_stats with leak detection
- [ ] Implement cpu_stats with profiling
- [ ] Implement network tools (reverse_port, forward_port)
- [ ] Write tests
- **Deliverable:** Complete performance monitoring suite

### Phase 8: Documentation & Polish (Week 8)
- [ ] Complete user documentation for all tools
- [ ] Add comprehensive examples for each tool
- [ ] Create workflow guides:
  - UI validation workflow
  - Visual regression testing guide
  - Bug report creation guide
  - CI/CD integration examples
- [ ] Integration testing across all tools
- [ ] Performance optimization
- [ ] Security audit
- [ ] Beta testing with users
- **Deliverable:** Production-ready v1.2.0 release

### Milestone Summary

| Week | Focus | Tools Delivered | Tests | Docs |
|------|-------|----------------|-------|------|
| 1 | Core | ADB Client | ✅ | ✅ |
| 2 | Devices | 3 tools | ✅ | ✅ |
| 3 | Apps | 4 tools | ✅ | ✅ |
| 4 | Screenshots 1 | 2 tools (screenshot, compare) | ✅ | ✅ |
| 5 | Screenshots 2 | 4 tools (batch, annotate, cleanup, regression) | ✅ | ✅ |
| 6 | Debugging | 3 tools | ✅ | ✅ |
| 7 | Performance | 5 tools | ✅ | ✅ |
| 8 | Polish | Documentation, examples, integration | ✅ | ✅ |

**Total Tools:** 18 (12 base + 6 enhanced screenshot tools)

---

## Success Metrics

### Overall Metrics

| Metric | Target | Priority |
|--------|--------|----------|
| Test Coverage | 85%+ | Critical |
| Command Response Time | <500ms for simple commands | High |
| Error Handling | 100% of known error cases | Critical |
| Documentation | Complete API docs + examples | High |
| User Adoption | 50%+ of Android developers using tools | Medium |

### Screenshot-Specific Metrics 🆕

| Metric | Target | Rationale |
|--------|--------|-----------|
| Screenshot Capture Time | <2 seconds | Must not slow down workflow |
| Comparison Accuracy | 99%+ pixel matching | Critical for regression detection |
| Comparison Speed | <5 seconds for 1080p images | Fast feedback loop |
| Metadata Completeness | 100% fields populated | Essential for debugging context |
| File Size (PNG) | <500 KB average | Balance quality and storage |
| Auto-Organization | 100% of screenshots | Zero manual file management |
| Visual Regression Detection | 95%+ true positive rate | Minimize false alarms |
| Annotation Rendering | Pixel-perfect | Professional bug reports |
| User Satisfaction | 90%+ find screenshot tools useful | Validates investment |

### Performance Benchmarks

**Target Device:** Samsung Galaxy S21 (Android 13)
**Test App:** Demo React Native app with 20 screens

| Operation | Target Time | Notes |
|-----------|-------------|-------|
| Single screenshot capture | 1.5s | Including metadata |
| Batch capture (5 screens) | 12s | With navigation delays |
| Screenshot comparison | 3s | 1080p images |
| Visual regression test (10 screens) | 45s | Parallel execution |
| Annotation rendering | 0.5s | Per annotation |
| Gallery generation (20 screenshots) | 5s | HTML with thumbnails |

### Quality Gates

**Before v1.2.0 Release:**
- [ ] All 18 tools implemented and tested
- [ ] 85%+ test coverage across all modules
- [ ] Security audit passed (no command injection vulnerabilities)
- [ ] Performance benchmarks met
- [ ] Documentation complete with examples for each tool
- [ ] Beta testing with 10+ users completed
- [ ] Visual regression testing validated on 3+ apps
- [ ] CI/CD integration examples tested

**User Acceptance Criteria:**
- [ ] Screenshot tools reduce bug reporting time by 50%+
- [ ] Visual regression testing catches UI regressions before release
- [ ] 90%+ of Android developers prefer integrated ADB tools over manual commands
- [ ] Zero critical security issues reported
- [ ] Screenshot workflow integrates seamlessly with existing tools

---

## Future Enhancements (v1.3.0+)

1. **Multiple Device Support**
   - Execute commands on multiple devices simultaneously
   - Device groups/profiles

2. **Automation Workflows**
   - Saved workflow templates
   - Scheduled tasks

3. **Advanced Debugging**
   - Network traffic inspection
   - Method tracing
   - Heap dumps

4. **CI/CD Integration**
   - Automated testing workflows
   - Build and deploy scripts

5. **Wireless Debugging**
   - WiFi pairing and connection
   - QR code pairing

---

## Questions & Feedback

For questions or suggestions about ADB tools:
- Create an issue with label `adb-tools`
- Join discussions in GitHub Discussions

---

**Document Status:** Draft v1.0
**Next Review:** After Phase 1 completion
**Owner:** Development Team
