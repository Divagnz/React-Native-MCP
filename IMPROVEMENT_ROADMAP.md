# React Native Expo MCP Server - Improvement Roadmap

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Planning Phase

## Executive Summary

This roadmap outlines prioritized improvements based on real-world usage pain points. Analysis shows **41 minutes of manual work** per workflow and **60% tool failure rate** that must be addressed. **All improvements consolidated into v0.1.0 release** for maximum impact.

**Target:** **>95% success rate** and **<5 minutes manual intervention** in v0.1.0

---

## Quick Stats

### Current State (v0.0.1)
- ✅ 16 Expo CLI tools implemented
- ❌ 60% tool call failure rate
- ❌ 41 minutes manual work per workflow
- ❌ 16+ failed tool calls in typical session
- ❌ No process management
- ❌ No dependency management
- ❌ No environment validation

### Target State (v0.1.0) - ALL FEATURES
- ✅ >95% tool call success rate
- ✅ <5 minutes manual intervention
- ✅ Zero "no such tool available" errors
- ✅ Automated dependency management
- ✅ Automated polyfill setup
- ✅ Pre-build validation
- ✅ Full process lifecycle management
- ✅ Smart logging and diagnostics
- ✅ Interactive help system

---

## v0.1.0 - Comprehensive Improvement Release

**Timeline:** Consolidated single release
**Priority:** P0 - All critical improvements
**Goal:** Transform MCP server from 60% to >95% success rate

### Category 1: Critical Reliability Fixes (P0)

**Goal:** Fix fundamental tool loading and availability issues

### 1.1 Tool Loading & Registration

**Problem:** Tools reported as unavailable despite correct naming

**Tasks:**
- [ ] Add tool registration validation on server startup
- [ ] Log all tool registration success/failure with details
- [ ] Implement health check endpoint: `GET /health`
- [ ] Add MCP server status command: `expo_server_status`
- [ ] Add graceful degradation for failed tool loads
- [ ] Unit tests for tool registration

**Success Criteria:**
- Zero "no such tool available" errors
- Server startup logs show all 16+ tools registered
- `expo_server_status` returns tool availability

**Implementation Example:**
```typescript
// src/tools/expo/registry.ts
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private logger: Logger;

  registerTool(name: string, definition: ToolDefinition): void {
    try {
      this.validateTool(definition);
      this.tools.set(name, definition);
      this.logger.info(`✅ Registered tool: ${name}`);
    } catch (error) {
      this.logger.error(`❌ Failed to register tool: ${name}`, error);
      throw error;
    }
  }

  getStatus(): ToolRegistryStatus {
    return {
      total_tools: this.tools.size,
      loaded_tools: Array.from(this.tools.keys()),
      health: 'healthy'
    };
  }
}
```

---

### 1.2 Process Management Tools

**Problem:** Users must manually kill processes (lsof, netstat)

**New Tools to Implement:**

#### `expo_sessions_list`
Lists all active Expo sessions with states.

```typescript
interface ExpoSession {
  id: string;
  type: 'dev_server' | 'local_build' | 'cloud_build';
  platform?: 'android' | 'ios' | 'all';
  pid?: number;
  port?: number;
  status: 'starting' | 'running' | 'building' | 'stopped' | 'zombie';
  started_at: string;
  last_activity: string;
  uptime: string;
}

// Usage
expo_sessions_list()
{
  "active_sessions": [
    {
      "id": "expo-dev-1762809634019",
      "type": "dev_server",
      "platform": "android",
      "pid": 12345,
      "port": 8081,
      "status": "running",
      "started_at": "2025-11-10T14:23:18Z",
      "last_activity": "2s ago",
      "uptime": "5m 23s"
    }
  ],
  "zombie_sessions": []
}
```

#### `expo_kill_process`
Kill Expo processes by PID, port, or session ID.

```typescript
expo_kill_process(
  pid?: number,
  port?: number,
  session_id?: string,
  force?: boolean
)

// Examples
expo_kill_process(port: 8081)
expo_kill_process(session_id: "expo-dev-1762809634019")
expo_kill_process(pid: 12345, force: true)
```

#### `expo_cleanup`
Kill all Expo processes and clean up resources.

```typescript
expo_cleanup()
{
  "killed_processes": [
    {"pid": 12345, "name": "node metro-bundler"},
    {"pid": 12346, "name": "gradle"}
  ],
  "freed_ports": [8081, 19000],
  "cleaned_sessions": ["expo-dev-123", "expo-build-456"]
}
```

**Success Criteria:**
- Zero manual `lsof` or `kill` commands needed
- Port conflicts auto-detected and resolved
- Zombie processes cleaned up automatically

---

### 1.3 Standardized Response Format

**Problem:** Tools return `undefined` or inconsistent responses

**Implementation:**
```typescript
// src/types/tool-response.ts
export interface ToolResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details: string;
    fix_suggestion: string;
    docs_url?: string;
  };
  metadata?: {
    duration_ms?: number;
    timestamp?: string;
    session_id?: string;
  };
}

// Example success
{
  "success": true,
  "message": "Dev server started successfully",
  "data": {
    "session_id": "expo-dev-123",
    "url": "exp://192.168.0.109:8081",
    "platform": "android"
  },
  "metadata": {
    "duration_ms": 1523,
    "timestamp": "2025-11-10T14:23:18Z"
  }
}

// Example error
{
  "success": false,
  "message": "Failed to start dev server",
  "error": {
    "code": "PORT_IN_USE",
    "details": "Port 8081 is already in use by PID 12345 (node metro-bundler)",
    "fix_suggestion": "Run 'expo_kill_process --port 8081' to free the port",
    "docs_url": "https://docs.expo.dev/troubleshooting/port-conflicts"
  }
}
```

**Tasks:**
- [ ] Define ToolResponse interface
- [ ] Wrap all tool implementations with standardized responses
- [ ] Add error code enum (PORT_IN_USE, JAVA_VERSION_MISMATCH, etc.)
- [ ] Generate fix suggestions for common errors
- [ ] Add telemetry/duration tracking
- [ ] Unit tests for response format

**Success Criteria:**
- Zero `undefined` returns
- All errors include fix suggestions
- Consistent response structure across all tools

---

### Category 2: Dependency & Environment Management (P0)

**Goal:** Automate dependency management and environment validation (saves 15+ minutes per workflow)

### 2.1 Expo Doctor Integration

**Problem:** Users manually run `npx expo-doctor` and fix issues

**New Tool: `expo_doctor`**

```typescript
interface ExpoDoctorResult {
  checks_passed: number;
  checks_failed: number;
  overall_health: 'healthy' | 'warning' | 'error';
  issues: DoctorIssue[];
  fixes_available: boolean;
}

interface DoctorIssue {
  type: 'duplicate_dependencies' | 'version_mismatch' | 'missing_peer_deps';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_packages: string[];
  fix_command: string;
  auto_fixable: boolean;
}

// Usage
expo_doctor(auto_fix: boolean = false)
```

**Tasks:**
- [ ] Implement expo_doctor tool
- [ ] Parse npx expo-doctor output to structured JSON
- [ ] Add auto-fix capability
- [ ] Handle duplicate dependencies
- [ ] Handle version mismatches
- [ ] Handle missing peer dependencies
- [ ] Integration tests with real projects

**Success Criteria:**
- Zero manual `npx expo-doctor` commands
- Structured issue reporting
- One-click auto-fix for all issues

---

### 2.2 Dependency Install & Check

**Problem:** Users manually install packages with version matching

**Improved Tool: `expo_install`**

Current behavior: Returns `undefined`

New behavior:
```typescript
expo_install(
  packages: string[],
  check_compatibility: boolean = true,
  auto_fix_versions: boolean = true
)

// Example
expo_install(
  packages: ["@expo/metro-runtime", "react-native-worklets"],
  check_compatibility: true,
  auto_fix_versions: true
)

// Returns
{
  "success": true,
  "message": "Installed 2 packages with version fixes",
  "data": {
    "installed": [
      {
        "package": "@expo/metro-runtime",
        "requested": "@expo/metro-runtime",
        "installed": "6.1.2"
      },
      {
        "package": "react-native-worklets",
        "requested": "react-native-worklets",
        "installed": "0.5.1",
        "note": "Auto-fixed from 0.6.1 to match SDK 54"
      }
    ]
  }
}
```

**New Tool: `expo_install_check`**

```typescript
expo_install_check(
  auto_fix: boolean = false,
  fix_duplicates: boolean = true,
  fix_versions: boolean = true
)

// Equivalent to: npx expo install --check
```

**Tasks:**
- [ ] Fix expo_install undefined return
- [ ] Add version compatibility checking
- [ ] Add auto-fix for version mismatches
- [ ] Implement expo_install_check
- [ ] Handle peer dependency warnings
- [ ] Add dry-run mode
- [ ] Integration tests

**Success Criteria:**
- Zero manual `npx expo install --check`
- Automatic version matching
- Clear reporting of what was fixed

---

### 2.3 Environment Validation

**Problem:** Builds fail late due to environment issues (Java 24, missing ANDROID_HOME)

**New Tool: `expo_validate_environment`**

```typescript
interface EnvironmentValidation {
  valid: boolean;
  environment: {
    java: JavaValidation;
    android: AndroidValidation;
    expo_cli: ExpoCliValidation;
    ports: PortValidation;
    disk_space: DiskSpaceValidation;
  };
  blockers: ValidationIssue[];
  warnings: ValidationIssue[];
}

interface JavaValidation {
  installed: boolean;
  version?: string;
  compatible: boolean;
  required: string;
  fix?: string;
}

// Usage
expo_validate_environment(platform: 'android' | 'ios' | 'all')

// Example output
{
  "valid": false,
  "environment": {
    "java": {
      "installed": true,
      "version": "24.0.0",
      "compatible": false,
      "required": "17.x - 21.x",
      "fix": "Run 'jenv shell 17' or install Java 17 LTS"
    },
    "android": {
      "android_home": {
        "set": true,
        "path": "/home/user/Android/Sdk",
        "valid": true
      },
      "build_tools": "35.0.0",
      "ndk": "27.1.12297006",
      "emulator": {
        "available": true,
        "devices": [
          {"name": "moto_g55_5G", "status": "online"}
        ]
      }
    },
    "ports": {
      "8081": {
        "available": false,
        "process": "node metro-bundler (PID 12345)",
        "fix": "expo_kill_process --port 8081"
      }
    }
  },
  "blockers": [
    {
      "type": "java_version",
      "message": "Java 24 not compatible with Gradle 8.13",
      "fix": "jenv shell 17"
    }
  ],
  "warnings": []
}
```

**Tasks:**
- [ ] Implement environment validation tool
- [ ] Check Java version and compatibility
- [ ] Check ANDROID_HOME and SDK tools
- [ ] Check port availability (8081, 19000)
- [ ] Check disk space for builds (>5GB)
- [ ] Check Expo CLI version
- [ ] Auto-run before builds (opt-in flag)
- [ ] Unit tests for each validation

**Success Criteria:**
- Builds fail fast with actionable errors
- Zero late failures from environment issues
- Clear fix suggestions for each issue

---

### Category 3: Polyfill & Code Setup Automation (P1)

**Goal:** Auto-detect and setup required polyfills (saves 10+ minutes, improves DX)

### 3.1 Polyfill Detection

**Problem:** Users manually add Buffer and EventTarget polyfills

**New Tool: `expo_detect_polyfills`**

```typescript
interface PolyfillDetection {
  missing_polyfills: MissingPolyfill[];
  auto_fixable: boolean;
}

interface MissingPolyfill {
  name: string;
  reason: string;
  locations: string[];  // File:line references
  solution: string;
  packages_needed?: string[];
  auto_fix: boolean;
}

// Usage
expo_detect_polyfills(scan_path: string = ".")

// Example output
{
  "missing_polyfills": [
    {
      "name": "Buffer",
      "reason": "Used in services/muxService.ts:139",
      "locations": [
        "services/muxService.ts:139: Buffer.from()"
      ],
      "solution": "Install @craftzdog/react-native-buffer or add minimal polyfill",
      "packages_needed": ["@craftzdog/react-native-buffer"],
      "auto_fix": true
    },
    {
      "name": "EventTarget",
      "reason": "Required by @mux/mux-player-react",
      "locations": [
        "components/video/MuxVideoPlayer.tsx:3: import MuxPlayer"
      ],
      "solution": "Add EventTarget polyfill to app/_layout.tsx",
      "auto_fix": true
    }
  ],
  "auto_fixable": true
}
```

**Tasks:**
- [ ] Implement AST scanning for Buffer usage
- [ ] Detect EventTarget dependencies
- [ ] Scan for other common Hermes polyfills (atob, btoa, URL, etc.)
- [ ] Generate fix suggestions
- [ ] Integration with expo_setup_polyfills
- [ ] Unit tests with sample codebases

---

### 3.2 Polyfill Setup Automation

**New Tool: `expo_setup_polyfills`**

```typescript
expo_setup_polyfills(
  polyfills: string[] | "auto",
  install_packages: boolean = true,
  layout_file: string = "app/_layout.tsx"
)

// Example
expo_setup_polyfills(polyfills: "auto", install_packages: true)

// Returns
{
  "success": true,
  "message": "Setup 2 polyfills successfully",
  "data": {
    "polyfills_added": ["Buffer", "EventTarget"],
    "packages_installed": ["@craftzdog/react-native-buffer"],
    "files_modified": ["app/_layout.tsx"],
    "backup_created": "app/_layout.tsx.backup"
  }
}
```

**Polyfill Templates:**

```typescript
// Buffer polyfill (minimal)
const BUFFER_POLYFILL_MINIMAL = `
// Buffer polyfill for Hermes
if (typeof global.Buffer === 'undefined') {
  global.Buffer = {
    from: (data: any) => data,
    isBuffer: () => false,
  } as any;
}
`;

// Buffer polyfill (full package)
const BUFFER_POLYFILL_PACKAGE = `
// Buffer polyfill for Hermes
import { Buffer } from '@craftzdog/react-native-buffer';
global.Buffer = Buffer;
`;

// EventTarget polyfill
const EVENTTARGET_POLYFILL = `
// EventTarget polyfill for Hermes
if (typeof global.EventTarget === 'undefined') {
  global.EventTarget = class EventTarget {
    private listeners: Map<string, Set<Function>> = new Map();

    addEventListener(type: string, listener: Function) {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }
      this.listeners.get(type)?.add(listener);
    }

    removeEventListener(type: string, listener: Function) {
      this.listeners.get(type)?.delete(listener);
    }

    dispatchEvent(event: any) {
      const listeners = this.listeners.get(event.type);
      if (listeners) {
        listeners.forEach(listener => listener(event));
      }
      return true;
    }
  } as any;
}
`;
```

**Tasks:**
- [ ] Implement polyfill setup tool
- [ ] Create polyfill template library
- [ ] Detect app entry point (_layout.tsx, _app.tsx, App.tsx)
- [ ] Inject polyfills at correct location (before other imports)
- [ ] Install required packages
- [ ] Create backup before modifying
- [ ] Add rollback capability
- [ ] Integration tests

**Success Criteria:**
- Zero manual polyfill code writing
- Automatic package installation
- Safe file modification with backups

---

### Category 4: Smart Logging & Diagnostics (P1)

**Goal:** Intelligent log filtering and progress tracking (improves debugging, prevents token overflow)

### 4.1 Log Filtering Modes

**Problem:** Build logs exceed 25K token limit, hard to find errors

**Enhanced Tool: `expo_build_local_read`**

```typescript
expo_build_local_read(
  session_id: string,
  mode: "all" | "errors" | "warnings" | "progress" | "milestones" = "all",
  tail: number = 50,
  grep: string = "",
  context_lines: number = 3
)

// mode: "errors" - Only errors + context
{
  "session_id": "expo-build-123",
  "mode": "errors",
  "errors": [
    {
      "line": 1234,
      "message": "Unsupported class file major version 68",
      "context": [
        "  > Task :app:compileDebugJavaWithJavac",
        "  Compiling 45 source files to build/intermediates",
        "  Error: Unsupported class file major version 68",
        "  at com.android.tools.r8.utils.ThrowingSupplier.get()",
        "  Build failed with exception"
      ],
      "fix_suggestion": "Java 24 not compatible. Run 'jenv shell 17'"
    }
  ],
  "total_errors": 1,
  "total_lines": 5234
}

// mode: "progress" - Only build progress
{
  "session_id": "expo-build-123",
  "mode": "progress",
  "progress": [
    {"phase": "Gradle Configuration", "status": "✅", "duration": "2m 15s"},
    {"phase": "Dependency Resolution", "status": "✅", "duration": "1m 30s"},
    {"phase": "Compile Java", "status": "⏳", "progress": "75%", "current": "Compiling MainActivity"}
  ],
  "current_phase": "Compile Java",
  "overall_progress": "75%",
  "estimated_remaining": "2m 30s"
}

// mode: "milestones" - Compact summary
{
  "session_id": "expo-build-123",
  "mode": "milestones",
  "milestones": [
    "✅ Gradle configured (2m 15s)",
    "✅ Dependencies resolved (1m 30s)",
    "⏳ Compiling Java (3m 45s / ~75%)"
  ],
  "errors": 0,
  "warnings": 3,
  "duration": "7m 30s"
}
```

**Tasks:**
- [ ] Implement log parsing and classification
- [ ] Add regex filtering with grep parameter
- [ ] Implement smart error detection (Java, Gradle, NPM errors)
- [ ] Extract build progress from logs (Gradle tasks, Metro bundling)
- [ ] Add milestone detection
- [ ] Implement context lines (show surrounding lines for errors)
- [ ] Add estimated time remaining
- [ ] Unit tests for log parsing

---

### 4.2 Build Progress Summary

**New Tool: `expo_build_summary`**

```typescript
expo_build_summary(session_id: string)

// Returns compact build status
{
  "session_id": "expo-build-123",
  "status": "building",
  "platform": "android",
  "started_at": "2025-11-10T14:23:18Z",
  "duration": "7m 30s",
  "progress": {
    "phase": "Compile Java",
    "percentage": 75,
    "current_task": "Compiling MainActivity.java"
  },
  "stats": {
    "errors": 0,
    "warnings": 3,
    "tasks_completed": 156,
    "tasks_total": 208
  },
  "recent_milestones": [
    "✅ Gradle configuration complete (2m 15s)",
    "✅ Dependencies resolved (1m 30s)",
    "⏳ Compiling Java sources (3m 45s)"
  ],
  "estimated_completion": "2m 30s"
}
```

**Tasks:**
- [ ] Parse Gradle build progress
- [ ] Extract task counts (X/Y tasks)
- [ ] Calculate progress percentage
- [ ] Estimate completion time
- [ ] Track errors and warnings
- [ ] Milestone detection and formatting

**Success Criteria:**
- Zero token overflow errors
- Quick build status checks (<100 tokens)
- Accurate progress tracking

---

### 4.3 Timeout Diagnostics

**Problem:** Operations timeout without explanation

**Enhanced Tools with Pre-flight Checks:**

```typescript
// expo_dev_start with diagnostics
expo_dev_start(
  platform: "android" | "ios" | "all",
  pre_flight_check: boolean = true,
  port: number = 8081
)

// If pre_flight_check fails:
{
  "success": false,
  "error": {
    "code": "PRE_FLIGHT_FAILED",
    "blockers": [
      {
        "type": "port_conflict",
        "message": "Port 8081 already in use",
        "process": {
          "pid": 12345,
          "command": "node metro-bundler",
          "uptime": "2h 15m"
        },
        "fix": "expo_kill_process --port 8081"
      }
    ]
  }
}

// expo_build_local_start with validation
expo_build_local_start(
  platform: "android",
  validate_env: boolean = true
)

// If validation fails:
{
  "success": false,
  "error": {
    "code": "ENVIRONMENT_INVALID",
    "blockers": [
      {
        "type": "java_version",
        "message": "Java 24 incompatible with Gradle 8.13",
        "current": "24.0.0",
        "required": "17.x - 21.x",
        "fix": "jenv shell 17"
      }
    ]
  }
}
```

**Tasks:**
- [ ] Add pre-flight checks to expo_dev_start
- [ ] Add environment validation to expo_build_local_start
- [ ] Detect port conflicts before operations
- [ ] Check for existing processes
- [ ] Add intermediate progress callbacks
- [ ] Implement timeout diagnostics
- [ ] Unit tests for pre-flight checks

**Success Criteria:**
- Zero unexplained timeouts
- Fail fast with actionable errors
- Clear diagnostic information

---

### Category 5: Documentation & Developer Experience (P2)

**Goal:** Comprehensive documentation and help system (improves onboarding)

### 5.1 Interactive Help System

**New Tool: `expo_help`**

```typescript
expo_help(tool_name?: string)

// Without tool_name - show all tools
expo_help()
{
  "tools": {
    "Development": [
      {"name": "expo_dev_start", "description": "Start Expo dev server"},
      {"name": "expo_dev_read", "description": "Read dev server logs"},
      {"name": "expo_dev_send", "description": "Send commands to dev server"},
      {"name": "expo_dev_stop", "description": "Stop dev server"}
    ],
    "Builds": [
      {"name": "expo_build_local_start", "description": "Start local Android/iOS build"},
      {"name": "expo_build_local_read", "description": "Read build logs"},
      {"name": "expo_build_local_stop", "description": "Cancel build"}
    ],
    "Diagnostics": [
      {"name": "expo_doctor", "description": "Run health checks"},
      {"name": "expo_validate_environment", "description": "Check build environment"},
      {"name": "expo_detect_polyfills", "description": "Detect missing polyfills"}
    ],
    "Process Management": [
      {"name": "expo_sessions_list", "description": "List active sessions"},
      {"name": "expo_kill_process", "description": "Kill process by PID/port/session"}
    ]
  }
}

// With tool_name - show detailed help
expo_help(tool_name: "expo_dev_start")
{
  "tool": "expo_dev_start",
  "description": "Start Expo development server for React Native project",
  "parameters": [
    {
      "name": "platform",
      "type": "\"ios\" | \"android\" | \"all\"",
      "required": false,
      "default": "\"all\"",
      "description": "Target platform(s) to run on"
    },
    {
      "name": "port",
      "type": "number",
      "required": false,
      "default": 8081,
      "description": "Port for Metro bundler"
    },
    {
      "name": "clear_cache",
      "type": "boolean",
      "required": false,
      "default": false,
      "description": "Clear Metro bundler cache before starting"
    },
    {
      "name": "pre_flight_check",
      "type": "boolean",
      "required": false,
      "default": true,
      "description": "Run port and process checks before starting"
    }
  ],
  "examples": [
    {
      "description": "Start dev server for Android",
      "code": "expo_dev_start(platform: \"android\")"
    },
    {
      "description": "Start with cache clear",
      "code": "expo_dev_start(platform: \"all\", clear_cache: true)"
    },
    {
      "description": "Start on custom port",
      "code": "expo_dev_start(platform: \"ios\", port: 19000)"
    }
  ],
  "common_issues": [
    {
      "error": "Command timed out after 60000ms",
      "cause": "Port 8081 already in use",
      "fix": "expo_kill_process(port: 8081)"
    },
    {
      "error": "PRE_FLIGHT_FAILED",
      "cause": "Existing Metro bundler process",
      "fix": "expo_sessions_list() then expo_kill_process()"
    }
  ],
  "related_tools": [
    "expo_dev_read - Monitor dev server logs",
    "expo_dev_send - Send commands (reload, open android, etc.)",
    "expo_sessions_list - Check active sessions"
  ]
}
```

**Tasks:**
- [ ] Implement expo_help tool
- [ ] Generate help content from tool definitions
- [ ] Add usage examples for each tool
- [ ] Document common errors and fixes
- [ ] Add related tools suggestions
- [ ] Generate markdown documentation from help content

---

### 5.2 Troubleshooting Documentation

**Files to Update:**
- `TROUBLESHOOTING.md` (new)
- `EXPO_TOOLS_SPEC.md` (add troubleshooting section)
- `README.md` (add "Known Limitations" section)

**Content Sections:**

```markdown
## Troubleshooting Guide

### Port 8081 Already in Use
**Symptoms:** expo_dev_start times out, "EADDRINUSE" error
**Diagnosis:** `expo_sessions_list --show-ports`
**Fix:** `expo_kill_process --port 8081`
**Prevent:** Run `expo_cleanup` before starting new sessions

### Java Version Incompatible
**Symptoms:** Build fails with "Unsupported class file major version"
**Diagnosis:** `expo_validate_environment`
**Current:** Java 24
**Required:** Java 17-21 (LTS)
**Fix:** `jenv shell 17` or install Java 17
**Docs:** https://docs.expo.dev/guides/local-app-development/#android

### Missing Polyfills (Hermes)
**Symptoms:** "Property 'Buffer' doesn't exist", "Property 'EventTarget' doesn't exist"
**Diagnosis:** `expo_detect_polyfills`
**Fix:** `expo_setup_polyfills --auto`
**Manual:** Add polyfills to `app/_layout.tsx`
**Docs:** https://reactnative.dev/docs/javascript-environment#polyfills

### Dependency Version Conflicts
**Symptoms:** expo-doctor reports version mismatches, duplicate dependencies
**Diagnosis:** `expo_doctor`
**Fix:** `expo_install_check --auto-fix`
**Manual:** `npx expo install --check`

### Tool Not Available
**Symptoms:** "No such tool available: mcp__mcp-react-native-expo__*"
**Diagnosis:** `expo_server_status`
**Fix:** Restart MCP server, check `.mcp.json` configuration
**Verify:** `expo_help` should list all tools
```

---

### 5.3 Error Code Reference

**New Tool: `expo_error_info`**

```typescript
expo_error_info(error_code: string)

// Example
expo_error_info(error_code: "PORT_IN_USE")
{
  "code": "PORT_IN_USE",
  "category": "network",
  "severity": "high",
  "description": "The required port is already in use by another process",
  "common_causes": [
    "Previous dev server not stopped properly",
    "Another Metro bundler instance running",
    "Other application using the same port"
  ],
  "fixes": [
    {
      "title": "Kill process using port",
      "command": "expo_kill_process --port 8081",
      "success_rate": "95%"
    },
    {
      "title": "Use different port",
      "command": "expo_dev_start --port 19000",
      "success_rate": "100%"
    },
    {
      "title": "Cleanup all Expo processes",
      "command": "expo_cleanup",
      "success_rate": "90%"
    }
  ],
  "related_errors": ["PROCESS_ALREADY_RUNNING", "TIMEOUT"],
  "docs_url": "https://docs.expo.dev/troubleshooting/port-conflicts"
}
```

**Error Code List:**
- `PORT_IN_USE` - Port conflict
- `JAVA_VERSION_MISMATCH` - Incompatible Java version
- `ANDROID_HOME_NOT_SET` - Missing ANDROID_HOME env var
- `SDK_TOOLS_MISSING` - Android SDK tools not found
- `MISSING_POLYFILL` - Hermes polyfill required
- `DEPENDENCY_CONFLICT` - Version mismatch or duplicate
- `BUILD_TIMEOUT` - Build exceeded timeout
- `DEVICE_NOT_FOUND` - No Android/iOS device/emulator
- `PRE_FLIGHT_FAILED` - Pre-flight checks failed
- `ENVIRONMENT_INVALID` - Environment validation failed

**Tasks:**
- [ ] Implement expo_error_info tool
- [ ] Create error code database
- [ ] Add fix suggestions for each error
- [ ] Link to relevant documentation
- [ ] Track success rates for fixes
- [ ] Generate error reference docs

---

## Success Metrics & KPIs

### Current Baseline (v0.0.1)
| Metric | Current | Target v0.1.0 | Improvement |
|--------|---------|---------------|-------------|
| Tool success rate | 40% | >95% | +137% |
| Manual work time | 41 min | <5 min | -88% |
| Failed tool calls | 16+ | <1 | -94% |
| Time to diagnose errors | 5 min | <30 sec | -90% |
| Time to fix dependencies | 15 min | <2 min | -87% |
| Time to setup polyfills | 10 min | <1 min | -90% |

### v0.1.0 Success Criteria (ALL FEATURES)
- ✅ Zero "no such tool available" errors
- ✅ >95% tool call success rate
- ✅ <5 minutes total manual intervention
- ✅ Automated dependency management (expo-doctor)
- ✅ Automated polyfill setup
- ✅ Pre-build validation catches all environment issues
- ✅ Full process lifecycle management (no manual kill)
- ✅ Zero token overflow errors
- ✅ Clear error messages with fix suggestions
- ✅ Comprehensive documentation and help system

### Future Enhancements (v0.2.0+)

**Timeline:** Post v0.1.0 releases
**Priority:** P3 - Nice to have

#### Session Persistence & Recovery
- [ ] Save session state to disk
- [ ] Auto-recover sessions after MCP restart
- [ ] Migrate sessions between machines
- [ ] Export/import session history

#### Interactive Debugging
- [ ] Attach debugger to running builds
- [ ] Breakpoint support for tool execution
- [ ] Real-time variable inspection
- [ ] Step-through tool execution

#### Performance Optimization
- [ ] Parallel tool execution
- [ ] Caching for repeated operations
- [ ] Incremental builds support
- [ ] Background task scheduling

#### Cloud Integration
- [ ] EAS Build integration improvements
- [ ] OTA update management
- [ ] Build analytics and insights
- [ ] Team collaboration features

---

## Implementation Notes

### Development Workflow
1. Write unit tests first (TDD)
2. Implement tool with standardized ToolResponse
3. Add integration tests with real projects
4. Update documentation (EXPO_TOOLS_SPEC.md)
5. Generate help content (expo_help)
6. Add to changelog

### Testing Strategy
- **Unit tests:** Each tool function
- **Integration tests:** Real Expo projects
- **E2E tests:** Full workflows (dev → build → deploy)
- **Performance tests:** Log parsing, large responses
- **Reliability tests:** Failure scenarios, edge cases

### Breaking Changes
- v0.1.0: Standardized response format (all tools)
- v0.1.0: expo_install behavior changes (auto-fix versions)
- v0.1.0+: Deprecated tools removed (if any)

### Migration Guide
Will provide migration guides for each breaking change, including:
- Before/after examples
- Automatic migration scripts
- Deprecation warnings in advance

---

## Contributing

To contribute to this roadmap:
1. Review PAIN_POINTS.md for context
2. Propose new items with:
   - Problem description
   - Impact quantification
   - Proposed solution
   - Success criteria
3. Submit PR with roadmap updates

---

## Changelog

- **2025-11-10:** Initial roadmap created based on Phase 5 Week 10 pain points analysis
- **2025-11-11:** Consolidated all improvements into single v0.1.0 release for maximum impact
- Next update: After v0.1.0 completion

Last Updated: 2025-11-11
