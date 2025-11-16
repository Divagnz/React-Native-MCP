# React Native Expo MCP Server - Pain Points Analysis

**Document Version:** 1.0
**Analysis Date:** 2025-11-10
**Based On:** Real user interaction transcripts from production usage

## Executive Summary

This document captures critical pain points discovered during actual usage of the mcp-react-native-expo server. Analysis of user transcripts revealed **41 minutes of manual work** that should be automated, **16+ failed tool calls**, and several critical missing features that force users to drop into manual command-line workflows.

### Severity Breakdown
- **P0 Critical Issues:** 6 (block productivity)
- **P1 High Priority:** 5 (significant UX impact)
- **P2 Medium Priority:** 5 (nice to have improvements)

---

## Category 1: Tool Availability & Discovery (SEVERITY: P0)

### 1.1 Tool Naming Confusion

**Problem:**
Users cannot discover correct tool names, leading to multiple failed attempts with different naming patterns.

**Real Transcript Examples:**
```
● mcp-react-native-expo - expo_dev_read (MCP)
  ⎿  Error: No such tool available: mcp__mcp-react-native-expo__expo_dev_read

● Let me use the correct tool name with mcp__react-native-guide__*
  ⎿  Error: No such tool available: mcp__react-native-guide__expo_dev_start
```

**Impact:**
- 10+ failed attempts to find correct tool name
- ~5 minutes wasted on tool discovery
- User frustration and confusion

**Root Cause:**
- No tool discovery mechanism
- Inconsistent naming between MCP servers
- No autocomplete or suggestions
- Documentation doesn't match actual tool names

**Recommended Solution:**
- Add `expo_tools_list` command with descriptions
- Add `expo_help <tool_name>` for usage examples
- Implement autocomplete hints in Claude Code integration
- Standardize tool naming: `mcp__mcp-react-native-expo__<action>_<resource>`

---

### 1.2 MCP Server Connection Failures

**Problem:**
MCP server fails to connect/reconnect with no diagnostic information.

**Real Transcript Examples:**
```
> /mcp
  ⎿  Failed to reconnect to mcp-react-native-expo.

> /mcp
  ⎿  Failed to reconnect to mcp-react-native-expo.
```

**Impact:**
- Complete workflow interruption
- ~3 minutes wasted on reconnection attempts
- No way to diagnose or fix the issue

**Root Cause:**
- Unknown - no error details provided
- No health check endpoint
- No connection diagnostics

**Recommended Solution:**
- Add `expo_server_health` command
- Provide detailed error messages (port conflicts, process crashes, etc.)
- Add automatic reconnection with exponential backoff
- Add server logs endpoint for debugging

---

### 1.3 Tools Reported as Unavailable Despite Correct Usage

**Problem:**
Even with correct tool names, tools are reported as unavailable.

**Real Transcript Example:**
```
● mcp-react-native-expo - expo_dev_start (MCP)
  ⎿  Error: No such tool available: mcp__mcp-react-native-expo__expo_dev_start
```

**Impact:**
- Workflow completely blocked
- Users forced to use manual bash commands
- Loss of trust in MCP tool reliability

**Root Cause:**
- MCP server not loading tools properly on startup
- Tool registration failures not logged
- No graceful degradation

**Recommended Solution:**
- Add tool loading validation on server startup
- Log tool registration success/failure
- Add `/mcp status` command to show loaded tools
- Implement health checks for critical tool availability

---

## Category 2: Missing Critical Functionality (SEVERITY: P0)

### 2.1 No Process Management Tools

**Problem:**
Users must manually manage Expo/Metro processes using bash commands.

**Real Transcript Examples:**
```
> port 8081 still running an expo dev kill it

# User had to manually run:
$ lsof -ti:8081 | xargs kill -9
```

**Impact:**
- ~3 minutes per manual process kill
- Requires platform-specific knowledge (lsof on Linux/Mac, netstat on Windows)
- Error-prone (killing wrong process, orphaned processes)

**Missing Tools:**
- `expo_sessions_list` - List all active Expo/Metro sessions with states
- `expo_kill_process` - Kill specific process by PID or port
- `expo_ps` - Show all Expo-related processes (dev server, builds, Metro)
- `expo_cleanup` - Kill all Expo processes and clean up resources

**Recommended Implementation:**
```typescript
// expo_sessions_list
{
  "sessions": [
    {
      "id": "expo-dev-1762809634019",
      "type": "dev_server",
      "platform": "android",
      "pid": 12345,
      "port": 8081,
      "status": "running",
      "uptime": "5m 23s"
    },
    {
      "id": "expo-build-android-1762828818107",
      "type": "local_build",
      "platform": "android",
      "pid": 12346,
      "status": "building",
      "progress": "75%"
    }
  ]
}

// expo_kill_process
expo_kill_process(port: 8081)  // Kill by port
expo_kill_process(pid: 12345)  // Kill by PID
expo_kill_process(session_id: "expo-dev-1762809634019")  // Kill by session
```

---

### 2.2 No Dependency Management Tools

**Problem:**
Users must manually run `expo-doctor`, fix dependencies, and install packages.

**Real Transcript Examples:**
```bash
$ npx expo-doctor
15/17 checks passed. 2 checks failed. Possible issues detected.
27 packages out of date.

$ npx expo install --check
# User had to manually approve and install 27 packages

$ yarn add @expo/metro-runtime
$ yarn add react-native-worklets@0.5.1
```

**Impact:**
- ~15 minutes per dependency fix cycle
- Multiple rounds of install/check/fix
- Version conflicts (react-native-worklets 0.6.1 → 0.5.2 → 0.5.1)
- Requires understanding of Expo SDK version compatibility

**Missing Tools:**
- `expo_doctor` - Run diagnostics and return structured results
- `expo_install_check` - Check compatibility and auto-fix
- `expo_install` - Install packages with version matching (currently returns `undefined`)
- `expo_dependencies_list` - Show all dependencies with versions and compatibility status

**Recommended Implementation:**
```typescript
// expo_doctor
{
  "checks_passed": 15,
  "checks_failed": 2,
  "issues": [
    {
      "type": "duplicate_dependencies",
      "severity": "high",
      "packages": ["@expo/vector-icons", "expo-constants", "expo-font"],
      "fix": "expo_install_check --fix-duplicates"
    },
    {
      "type": "version_mismatch",
      "severity": "critical",
      "packages": [
        {"name": "@expo/vector-icons", "current": "14.1.0", "expected": "^15.0.3"},
        {"name": "expo-av", "current": "15.1.7", "expected": "~16.0.7"}
      ],
      "fix": "expo_install_check --fix-versions"
    }
  ]
}

// expo_install_check with auto-fix
expo_install_check(auto_fix: true, packages: ["all"])
```

---

### 2.3 No Polyfill/Environment Setup Tools

**Problem:**
Users must manually detect missing polyfills and add them to code.

**Real Transcript Examples:**
```
 ERROR  ReferenceError: Property 'Buffer' doesn't exist, js engine: hermes
 ERROR  ReferenceError: Property 'EventTarget' doesn't exist, js engine: hermes

# User had to manually add to app/_layout.tsx:
if (typeof global.Buffer === 'undefined') {
  global.Buffer = {
    from: (data: any) => data,
    isBuffer: () => false,
  } as any;
}

if (typeof global.EventTarget === 'undefined') {
  global.EventTarget = class EventTarget {
    // ... 20+ lines of manual implementation
  } as any;
}
```

**Impact:**
- ~10 minutes to research and implement polyfills
- Requires knowledge of Hermes engine limitations
- Error-prone manual implementation
- Hard to discover what polyfills are needed

**Missing Tools:**
- `expo_detect_polyfills` - Scan code for missing polyfills
- `expo_setup_polyfills` - Auto-generate polyfill setup
- `expo_validate_hermes` - Check Hermes compatibility issues

**Recommended Implementation:**
```typescript
// expo_detect_polyfills
{
  "missing_polyfills": [
    {
      "name": "Buffer",
      "reason": "Used in services/muxService.ts:139",
      "solution": "Install react-native-get-random-values and @craftzdog/react-native-buffer",
      "auto_fix": true
    },
    {
      "name": "EventTarget",
      "reason": "Required by @mux/mux-player-react",
      "solution": "Add EventTarget polyfill to app/_layout.tsx",
      "auto_fix": true
    }
  ]
}

// expo_setup_polyfills(auto_install: true)
# Automatically:
# 1. Install required packages
# 2. Add imports to app/_layout.tsx
# 3. Configure global polyfills
```

---

## Category 3: Tool Behavior Issues (SEVERITY: P1)

### 3.1 Undefined Return Values

**Problem:**
Tools return `undefined` instead of proper success/error responses.

**Real Transcript Example:**
```
● mcp-react-native-expo - expo_install (MCP)
  ⎿  Error: undefined
```

**Impact:**
- Unknown if operation succeeded
- Cannot programmatically handle errors
- Confusing user experience

**Root Cause:**
- Missing error handling in tool implementation
- No standardized response format
- Exceptions not caught and serialized

**Recommended Solution:**
```typescript
// Standardized response format
type ToolResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: {
    code: string;
    details: string;
    fix_suggestion: string;
  };
};

// Example success:
{
  "success": true,
  "message": "Installed 2 packages successfully",
  "data": {
    "installed": ["@expo/metro-runtime@6.1.2", "react-native-worklets@0.5.1"]
  }
}

// Example error:
{
  "success": false,
  "message": "Package installation failed",
  "error": {
    "code": "INSTALL_FAILED",
    "details": "Peer dependency conflict: react-native-worklets@0.6.1 requires react-native-reanimated@>=4.0.0",
    "fix_suggestion": "Run 'expo_install_check --fix-versions' to resolve conflicts"
  }
}
```

---

### 3.2 Response Size Overflow

**Problem:**
Tool responses exceed token limits without pagination.

**Real Transcript Example:**
```
● mcp-react-native-expo - expo_build_local_read (MCP)(tail: 300)
  ⎿  Error: MCP tool response (34488 tokens) exceeds maximum allowed tokens (25000).
      Please use pagination, filtering, or limit parameters to reduce the response size.
```

**Impact:**
- Cannot view full build logs
- Must manually guess correct pagination parameters
- Loses important context between paginated reads

**Root Cause:**
- No automatic chunking for large responses
- No smart filtering of verbose output (Gradle logs, npm install logs)
- Fixed buffer size without overflow handling

**Recommended Solution:**
```typescript
// Add smart filtering parameters
expo_build_local_read(
  session_id: string,
  mode: "errors" | "warnings" | "progress" | "all" = "all",
  tail: number = 50,
  grep: string = ""  // Regex filter
)

// Automatic chunking with continuation token
{
  "logs": [...],
  "has_more": true,
  "continuation_token": "chunk_2_offset_1000",
  "total_lines": 5000,
  "filtered_lines": 100
}

// Smart log summarization
expo_build_local_summary(session_id: string)
{
  "status": "building",
  "progress": "75%",
  "current_task": "Compiling Java sources",
  "errors": 0,
  "warnings": 3,
  "duration": "5m 23s",
  "recent_milestones": [
    "✅ Gradle configuration complete (2m 15s)",
    "✅ Dependencies resolved (1m 30s)",
    "⏳ Compiling Java sources (1m 38s)"
  ]
}
```

---

### 3.3 Timeout Without Feedback

**Problem:**
Operations timeout with no intermediate progress or diagnostic info.

**Real Transcript Examples:**
```
● mcp-react-native-expo - expo_dev_start (MCP)
  ⎿  Error: Command timed out after 60000ms

# No indication of:
# - Port 8081 already in use
# - Metro bundler startup progress
# - What step failed
```

**Impact:**
- ~5 minutes wasted on failed starts (3 consecutive timeouts)
- No way to diagnose root cause
- User forced to guess and try alternatives

**Root Cause:**
- No port conflict detection before starting
- No process detection (existing Metro/Expo)
- No intermediate progress callbacks
- Fixed 60s timeout not appropriate for all operations

**Recommended Solution:**
```typescript
// Pre-flight checks before operations
expo_dev_start_preflight()
{
  "can_start": false,
  "blockers": [
    {
      "type": "port_conflict",
      "port": 8081,
      "process": {
        "pid": 12345,
        "command": "node metro-bundler",
        "uptime": "2h 15m"
      },
      "fix": "Run 'expo_kill_process --port 8081' to free the port"
    }
  ]
}

// Progress callbacks for long operations
expo_dev_start(platform: "android", progress_callback: true)
{
  "session_id": "expo-dev-123",
  "status": "starting",
  "progress": [
    {"timestamp": "0s", "message": "Checking port availability..."},
    {"timestamp": "2s", "message": "Starting Metro bundler..."},
    {"timestamp": "15s", "message": "Bundler started, waiting for device connection..."}
  ]
}
```

---

### 3.4 Build Tool Doesn't Detect Environment Issues

**Problem:**
Builds start without validating environment, leading to late failures.

**Real Transcript Examples:**
```
# Build started with Java 24 (incompatible with Gradle 8.13)
● mcp-react-native-expo - expo_build_local_start (MCP)
  ⎿  Build started

# Failed 10 minutes later:
Unsupported class file major version 68

# User had to manually fix:
> if needed jenv shell 17
```

**Impact:**
- ~10 minutes wasted on failed build
- Requires user to suggest fix (`jenv shell 17`)
- Build fails late in process (after Gradle setup)

**Root Cause:**
- No pre-build environment validation
- Java version not checked before starting
- ANDROID_HOME, SDK tools not verified

**Recommended Solution:**
```typescript
// expo_validate_environment
{
  "valid": false,
  "environment": {
    "java": {
      "installed": true,
      "version": "24.0.0",
      "compatible": false,
      "required": "17.x - 21.x",
      "fix": "Run 'jenv shell 17' or install Java 17"
    },
    "android_home": {
      "set": true,
      "path": "/home/user/Android/Sdk",
      "valid": true
    },
    "android_sdk": {
      "platform_tools": true,
      "build_tools": "35.0.0",
      "ndk": "27.1.12297006"
    },
    "emulator": {
      "available": true,
      "devices": [
        {"name": "moto_g55_5G", "status": "online"}
      ]
    }
  }
}

// Auto-run validation before builds
expo_build_local_start(platform: "android", validate_env: true)
# Automatically checks environment and fails fast with actionable errors
```

---

## Category 4: Developer Experience Gaps (SEVERITY: P1)

### 4.1 No Error Context or Suggestions

**Problem:**
Errors shown without context, fix suggestions, or relevant documentation links.

**Real Transcript Examples:**
```
 ERROR  ReferenceError: Property 'Buffer' doesn't exist, js engine: hermes

# No suggestions provided:
# - Add Buffer polyfill
# - Install react-native-get-random-values
# - Link to Hermes polyfill guide
```

**Impact:**
- User must research error independently
- ~5 minutes per error to find solution
- Repetitive errors for common issues

**Recommended Solution:**
```typescript
// Enhanced error responses
{
  "error": {
    "type": "ReferenceError",
    "message": "Property 'Buffer' doesn't exist",
    "engine": "hermes",
    "location": {
      "file": "services/muxService.ts",
      "line": 139,
      "code": "Buffer.from(`${this.tokenId}:${this.tokenSecret}`)"
    },
    "context": "Buffer is not available in Hermes JS engine by default",
    "fixes": [
      {
        "title": "Add Buffer polyfill (recommended)",
        "command": "expo_setup_polyfills --add buffer",
        "manual": "Install: yarn add @craftzdog/react-native-buffer"
      },
      {
        "title": "Use base64 encoding alternative",
        "docs": "https://docs.expo.dev/develop/development-builds/use-development-builds/#polyfills"
      }
    ],
    "related_errors": [
      "EventTarget polyfill also missing"
    ]
  }
}
```

---

### 4.2 No Proactive Health Checks

**Problem:**
Environment issues not detected until build/start failures.

**Missing Validations:**
- Java version compatibility (detected too late: 10min build → failure)
- ANDROID_HOME environment variable
- Android SDK tools installed
- Emulator/device availability
- Port 8081 availability (caused 3 timeout failures)
- Expo CLI version compatibility

**Recommended Implementation:**
```typescript
// expo_health_check (comprehensive pre-flight)
{
  "overall_health": "warning",
  "checks": {
    "java": {
      "status": "error",
      "version": "24.0.0",
      "message": "Java 24 not compatible with Gradle 8.13",
      "fix": "jenv shell 17"
    },
    "android_sdk": {
      "status": "ok",
      "path": "/home/user/Android/Sdk"
    },
    "ports": {
      "status": "warning",
      "8081": {
        "available": false,
        "process": "node metro-bundler (PID 12345)",
        "fix": "expo_kill_process --port 8081"
      }
    },
    "dependencies": {
      "status": "error",
      "outdated": 27,
      "duplicates": 3,
      "fix": "expo_install_check --auto-fix"
    }
  }
}

// Auto-run health check before critical operations
expo_dev_start(platform: "android", health_check: true)
expo_build_local_start(platform: "android", health_check: true)
```

---

### 4.3 Excessive Unfiltered Logs

**Problem:**
Logs flooded with verbose output, hard to identify errors or progress.

**Real Transcript Example:**
```
# 300+ lines of:
> Task :expo-modules-core:compileDebugKotlin UP-TO-DATE
> Task :expo-file-system:compileDebugJavaWithJavac UP-TO-DATE
> Task :react-native-reanimated:configureCMakeDebug[x86]
# ... (200 more lines)

# User has to manually scan for actual errors
```

**Impact:**
- Hard to identify actual errors in noise
- Token overflow issues (34K tokens)
- Poor developer experience

**Recommended Solution:**
```typescript
// Smart filtering modes
expo_build_local_read(
  session_id: string,
  mode: "errors" | "warnings" | "progress" | "milestones" | "all"
)

// mode: "errors" - Only show errors and critical warnings
// mode: "progress" - Only show build progress milestones
// mode: "milestones" - Summary of completed phases

// Example "milestones" output:
{
  "session_id": "expo-build-123",
  "status": "building",
  "milestones": [
    {"phase": "Gradle Configuration", "duration": "2m 15s", "status": "✅"},
    {"phase": "Dependency Resolution", "duration": "1m 30s", "status": "✅"},
    {"phase": "Compile Java", "duration": "3m 45s", "status": "⏳", "progress": "75%"}
  ],
  "errors": 0,
  "warnings": 3
}
```

---

### 4.4 No Session Recovery

**Problem:**
After MCP reconnection, lost track of active sessions.

**Impact:**
- Manual tracking of session IDs
- Cannot resume monitoring builds
- No visibility into orphaned processes

**Recommended Solution:**
```typescript
// Persistent session storage
expo_sessions_list()
{
  "active_sessions": [
    {
      "id": "expo-build-android-1762828818107",
      "type": "local_build",
      "platform": "android",
      "started": "2025-11-10T14:23:18Z",
      "status": "building",
      "pid": 12345,
      "last_activity": "2s ago"
    }
  ],
  "zombie_sessions": [
    {
      "id": "expo-dev-1762809634019",
      "type": "dev_server",
      "pid": null,
      "note": "Process no longer running but session not cleaned up"
    }
  ]
}

// Auto-recovery after reconnect
expo_sessions_recover()
{
  "recovered": 2,
  "cleaned": 1,
  "sessions": [...]
}
```

---

## Category 5: Documentation & Guidance (SEVERITY: P2)

### 5.1 No Troubleshooting Guide

**Missing Documentation:**
- Common error codes and fixes
- Platform-specific issues (Java version, Android SDK)
- Hermes engine limitations and polyfills
- Port conflict resolution
- Dependency management workflows

**Recommended Content:**
```markdown
## Troubleshooting Guide

### Port 8081 Already in Use
**Symptoms:** expo_dev_start times out
**Diagnosis:** `expo_sessions_list --show-ports`
**Fix:** `expo_kill_process --port 8081`

### Java Version Incompatible
**Symptoms:** Build fails with "Unsupported class file major version"
**Diagnosis:** `expo_validate_environment`
**Fix:** `jenv shell 17` or install Java 17

### Missing Polyfills (Hermes)
**Symptoms:** "Property 'Buffer' doesn't exist"
**Diagnosis:** `expo_detect_polyfills`
**Fix:** `expo_setup_polyfills --auto`
```

---

### 5.2 No Tool Discovery Help

**Missing Features:**
- `expo_tools_list` - List all available tools with descriptions
- `expo_help <tool_name>` - Show usage examples for specific tool
- Interactive autocomplete in Claude Code
- Quick reference guide

**Recommended Implementation:**
```bash
$ expo_tools_list
Available Expo MCP Tools:

Development:
  expo_dev_start        Start Expo dev server
  expo_dev_read         Read dev server logs
  expo_dev_send         Send commands (reload, open android, etc.)
  expo_dev_stop         Stop dev server

Builds:
  expo_build_local_*    Local Android/iOS builds
  expo_build_cloud_*    EAS cloud builds

Diagnostics:
  expo_doctor           Run comprehensive health checks
  expo_validate_env     Validate build environment
  expo_detect_polyfills Detect missing polyfills

Process Management:
  expo_sessions_list    List all active sessions
  expo_kill_process     Kill process by PID/port/session

$ expo_help expo_dev_start
Tool: expo_dev_start
Description: Start Expo development server

Parameters:
  - platform: "ios" | "android" | "all" (default: "all")
  - port: number (default: 8081)
  - clear_cache: boolean (default: false)
  - qr_format: "terminal" | "none" (default: "terminal")

Examples:
  expo_dev_start(platform: "android")
  expo_dev_start(platform: "ios", clear_cache: true)
  expo_dev_start(platform: "all", port: 19000)

Common Issues:
  - Port already in use: Run `expo_kill_process --port 8081`
  - Timeout: Check `expo_health_check` for environment issues
```

---

## Quantified Impact Analysis

### Time Wasted on Manual Tasks

| Task | Time per Occurrence | Occurrences | Total Time |
|------|-------------------|-------------|------------|
| Tool naming discovery | 5 min | 1 | 5 min |
| Dependency management (expo-doctor, install) | 15 min | 1 | 15 min |
| Manual polyfill setup | 10 min | 1 | 10 min |
| Process management (kill port 8081) | 3 min | 1 | 3 min |
| Java version fixing | 5 min | 1 | 5 min |
| MCP reconnection attempts | 3 min | 1 | 3 min |
| **TOTAL** | | | **41 min** |

### Failed Tool Calls

| Tool | Failure Type | Count |
|------|-------------|-------|
| expo_dev_start | Timeout (60s) | 3 |
| expo_dev_read | "No such tool available" | 1 |
| expo_install | Undefined return | 1 |
| expo_build_local_read | Token overflow (34K > 25K) | 1 |
| Tool naming attempts | Wrong prefix/name | 10+ |
| **TOTAL** | | **16+** |

### Success Rate
- **Successful tool calls:** ~40%
- **Failed tool calls:** ~60%
- **Target success rate:** >95%

---

## Priority Matrix & Recommendations

### P0 (Critical - v0.1.0)

1. ✅ **Fix tool loading mechanism**
   - Prevent "no such tool available" errors
   - Add tool registration validation
   - Implement `/mcp status` command

2. ✅ **Add expo_sessions_list**
   - Show all active sessions with states
   - Enable session recovery after reconnect
   - Clean up zombie sessions

3. ✅ **Add expo_kill_process**
   - Kill by PID, port, or session ID
   - Prevent port conflict timeouts
   - Platform-independent process management

4. ✅ **Integrate expo_doctor**
   - Return structured diagnostic results
   - Auto-detect common issues
   - Provide actionable fix commands

5. ✅ **Add pre-build environment validation**
   - Check Java version compatibility
   - Verify ANDROID_HOME and SDK tools
   - Detect port conflicts
   - Fail fast with actionable errors

6. ✅ **Fix undefined return values**
   - Standardize response format (success, message, data, error)
   - Add error codes and fix suggestions
   - Ensure all tools return proper responses

### P1 (High Priority - Significant UX Impact)

1. ✅ **Add smart log filtering**
   - `--errors-only` mode for build logs
   - `--progress` mode for milestone tracking
   - `--compact` mode for summarized output
   - Prevent token overflow issues

2. ✅ **Implement automatic pagination**
   - Chunk large responses (>25K tokens)
   - Add continuation tokens
   - Smart truncation with context preservation

3. ✅ **Add timeout diagnostics**
   - Detect port conflicts before operations
   - Check for existing processes
   - Provide intermediate progress callbacks
   - Suggest fixes for common timeout causes

4. ✅ **Add expo_setup_polyfills**
   - Auto-detect missing polyfills (Buffer, EventTarget)
   - Generate polyfill setup code
   - Install required packages
   - Update app entry point (_layout.tsx)

5. ✅ **Implement session persistence**
   - Survive MCP server reconnections
   - Track active/zombie sessions
   - Enable build monitoring across sessions

### P2 (Medium Priority - Nice to Have)

1. ✅ **Add expo_help command**
   - Interactive help for each tool
   - Usage examples and common patterns
   - Troubleshooting tips

2. ✅ **Create troubleshooting documentation**
   - Common error codes and fixes
   - Platform-specific issues
   - Workflow guides

3. ✅ **Add error context and suggestions**
   - Link errors to relevant documentation
   - Provide multiple fix options
   - Show related errors

4. ✅ **Implement tool autocomplete**
   - Suggest correct tool names
   - Show available parameters
   - Validate parameters before execution

5. ✅ **Add progress callbacks**
   - Real-time build progress
   - Milestone notifications
   - Estimated time remaining

---

## Success Metrics

After implementing P0 and P1 improvements:

- ✅ **Zero "no such tool available" errors**
- ✅ **Automated dependency management** (no manual expo-doctor/install)
- ✅ **Automated polyfill setup** (no manual code editing)
- ✅ **Pre-build validation** catches environment issues
- ✅ **Process management via MCP** (no manual kill commands)
- ✅ **Sub-5-second tool discovery**
- ✅ **>95% tool call success rate** (vs. current ~40%)
- ✅ **90%+ reduction in manual intervention** (41min → <5min)
- ✅ **Zero token overflow errors** (smart pagination/filtering)
- ✅ **Zero timeout failures** (pre-flight checks and diagnostics)

---

## Appendix: Raw Transcript Examples

### Example 1: Tool Discovery Failure Loop
```
● mcp-react-native-expo - expo_dev_read (MCP)(session_id: "expo-dev-1762809634019", lines: "50")
  ⎿  Error: No such tool available: mcp__mcp-react-native-expo__expo_dev_read

● Let me use the correct tool name:
  [attempts mcp__react-native-guide__*]
  ⎿  Error: No such tool available

> /mcp
  ⎿  Failed to reconnect to mcp-react-native-expo.

> /mcp
  ⎿  Failed to reconnect to mcp-react-native-expo.
```

### Example 2: Dependency Hell
```bash
$ npx expo-doctor
15/17 checks passed. 2 checks failed.
Found duplicates for @expo/vector-icons
Found duplicates for expo-constants
Found duplicates for expo-font
27 packages out of date.

$ npx expo install --check
✔ Fix dependencies? … yes
[installs 27 packages]

$ yarn add @expo/metro-runtime
$ yarn add react-native-worklets

$ npx expo-doctor
16/17 checks passed. 1 checks failed.
⚠️ Minor version mismatches: react-native-worklets 0.5.1 vs 0.6.1

$ npx expo install --check
[downgrades react-native-worklets@0.5.1]

$ npx expo-doctor
17/17 checks passed. No issues detected!
```

### Example 3: Build Failure from Environment
```
● expo_build_local_start (platform: "android")
  ⎿  Build started: expo-build-android-1762828818107

[10 minutes later]
Build failed: Unsupported class file major version 68
# Java 24 incompatible with Gradle 8.13

> user: if needed jenv shell 17

[User manually fixes Java version, restarts build]
```

### Example 4: Manual Polyfill Implementation
```
 ERROR  ReferenceError: Property 'Buffer' doesn't exist, js engine: hermes
 ERROR  ReferenceError: Property 'EventTarget' doesn't exist, js engine: hermes

# User manually edits app/_layout.tsx:
if (typeof global.Buffer === 'undefined') {
  global.Buffer = {
    from: (data: any) => data,
    isBuffer: () => false,
  } as any;
}

if (typeof global.EventTarget === 'undefined') {
  global.EventTarget = class EventTarget {
    listeners: Map<string, Set<Function>> = new Map();
    addEventListener(type: string, listener: Function) { ... }
    removeEventListener(type: string, listener: Function) { ... }
    dispatchEvent(event: any) { ... }
  } as any;
}
```

---

## Contributing to This Document

This document is based on real user feedback and should be updated as new pain points are discovered. To contribute:

1. Capture transcript examples showing the pain point
2. Quantify impact (time wasted, failures, workarounds)
3. Propose concrete solutions with example implementations
4. Add to appropriate severity category (P0/P1/P2)

Created: 2025-11-10 based on real-world usage analysis
Last Updated: 2025-11-11 (consolidated all improvements into v0.1.0 target)
