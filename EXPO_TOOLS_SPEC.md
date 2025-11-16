# Expo CLI Integration Tools - Technical Specification

**Version:** 1.0
**Created:** 2025-11-02
**Status:** Proposed
**Target Release:** v1.3.0
**Priority:** High

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tool Categories](#tool-categories)
3. [Architecture](#architecture)
4. [Tool Specifications](#tool-specifications)
5. [Integration Workflows](#integration-workflows)
6. [Security Considerations](#security-considerations)
7. [Implementation Timeline](#implementation-timeline)
8. [Success Metrics](#success-metrics)
9. [Dependencies](#dependencies)
10. [Testing Strategy](#testing-strategy)
11. [Troubleshooting Guide](#-troubleshooting-guide)

---

## 🎯 Overview

### Purpose

This specification defines a comprehensive set of Expo CLI integration tools for the React Native MCP Server. These tools enable developers to manage Expo development servers, build processes, updates, and deployment workflows directly through the MCP interface.

### Motivation

**Why Expo Integration is Critical:**

1. **Unified Development Workflow** - Expo is the most popular React Native development framework
2. **Cloud Build Management** - EAS (Expo Application Services) provides cloud builds without local setup
3. **Rapid Iteration** - Expo development server enables hot reload and rapid testing
4. **QR Code Access** - Easy mobile device testing via QR code scanning
5. **Over-the-Air Updates** - EAS Update enables instant app updates without app store approval
6. **Build Monitoring** - Real-time build status and logs for CI/CD integration

### Goals

- **Seamless Integration** - Work alongside ADB tools for complete React Native workflow
- **Developer Experience** - Simplify complex Expo CLI commands with intelligent defaults
- **Build Automation** - Automate EAS build and deployment workflows
- **Real-time Feedback** - Provide immediate access to logs, QR codes, and build status
- **CI/CD Ready** - Support automated workflows for continuous integration

### Design Principles

1. **Progressive Enhancement** - Tools work independently but integrate seamlessly
2. **Graceful Degradation** - Clear error messages when Expo/EAS not configured
3. **Security First** - No credential exposure, secure token handling
4. **Performance** - Efficient polling, caching, and parallel execution
5. **Comprehensive Logging** - Detailed logs for debugging and monitoring

---

## 🔧 Environment Setup

### Required Environment Variables

#### Android Development
```bash
# Android SDK location (required for Android builds)
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk

# Add Android tools to PATH
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

#### Java Version Management
**Recommended: Use jenv for managing Java versions**

```bash
# Install jenv (macOS)
brew install jenv

# Configure shell (~/.zshrc or ~/.bashrc)
export PATH="$HOME/.jenv/bin:$PATH"
eval "$(jenv init -)"

# Add Java 17 (minimum required)
jenv add /Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home

# Set as default
jenv global 17

# Verify
java -version  # Should show 17.x.x or higher
```

**Java Version Requirements:**
- **Minimum:** Java 17 (LTS) - Required for Android Gradle Plugin 8.0+
- **Recommended:** Java 17 or 21 (LTS versions)
- **Why?** Modern React Native and Expo projects require Java 17+ for Android builds

#### EAS Authentication (Optional)
```bash
# For EAS cloud builds and OTA updates
export EXPO_TOKEN=your_expo_token_here
export EAS_TOKEN=your_eas_token_here
```

**Getting EAS Tokens:**
```bash
# Login to Expo
npx expo login

# Generate personal access token at:
# https://expo.dev/accounts/[your-account]/settings/access-tokens
```

### Platform-Specific Setup

#### macOS (iOS Development)
```bash
# Xcode Command Line Tools
xcode-select --install

# CocoaPods (required for iOS)
sudo gem install cocoapods
```

#### Linux
```bash
# Install OpenJDK 17
sudo apt-get install openjdk-17-jdk

# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

#### Windows
```powershell
# Set environment variables in PowerShell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"

# Add to PATH
$env:PATH += ";$env:ANDROID_HOME\platform-tools"
$env:PATH += ";$env:ANDROID_HOME\emulator"
```

### Verification

```bash
# Verify environment setup
echo $ANDROID_HOME
echo $JAVA_HOME
java -version
adb version

# Check Expo CLI
npx expo --version

# Check EAS CLI
npx eas --version
```

---

## 🗂️ Tool Categories

### Category 1: Development Server Management (4 tools)

**Purpose:** Manage Expo development server lifecycle and access

| Tool | Description | Priority |
|------|-------------|----------|
| `expo_start` | Start Expo development server with configuration options | Critical |
| `expo_get_qr` | Get QR code and connection URLs for testing | Critical |
| `expo_logs` | Stream and filter Expo development logs | High |
| `expo_controls` | Control server (reload, clear cache, toggle features) | Medium |

**Use Cases:**
- Start development server with custom configuration
- Get QR codes for mobile device testing
- Monitor logs for debugging
- Reload app or clear Metro cache without restarting

### Category 2: Build Management (3 tools)

**Purpose:** Manage EAS builds and submissions

| Tool | Description | Priority |
|------|-------------|----------|
| `eas_build` | Trigger EAS cloud builds with platform and profile options | Critical |
| `eas_build_status` | Check build status, logs, and artifacts | Critical |
| `eas_submit` | Submit builds to App Store or Play Store | High |

**Use Cases:**
- Trigger production builds from CI/CD
- Monitor build progress and download artifacts
- Automate app store submissions

### Category 3: Project Management (3 tools)

**Purpose:** Manage Expo project configuration and dependencies

| Tool | Description | Priority |
|------|-------------|----------|
| `expo_doctor` | Diagnose project issues and validate configuration | High |
| `expo_install` | Install compatible packages with version resolution | Medium |
| `expo_upgrade` | Upgrade Expo SDK with dependency migration | Medium |

**Use Cases:**
- Validate project configuration before builds
- Install packages with correct versions for Expo SDK
- Upgrade Expo SDK versions safely

### Category 4: Updates & Publishing (2 tools)

**Purpose:** Manage over-the-air updates via EAS Update

| Tool | Description | Priority |
|------|-------------|----------|
| `eas_update` | Create and publish OTA updates | High |
| `eas_update_status` | View update deployment status and rollout | Medium |

**Use Cases:**
- Deploy hotfixes without app store review
- Monitor update adoption rates
- Roll back problematic updates

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Client (Claude Desktop)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ MCP Protocol (stdio)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              React Native MCP Server                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             Expo Tools Layer                         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │  Dev Tools │  │Build Tools │  │Update Tools│    │  │
│  │  └──────┬─────┘  └─────┬──────┘  └──────┬─────┘    │  │
│  └─────────┼──────────────┼─────────────────┼──────────┘  │
│  ┌─────────▼──────────────▼─────────────────▼──────────┐  │
│  │           Expo Core Services Layer                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │  │
│  │  │ CLI Executor │  │Process Manager│  │Log Parser │ │  │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │  │
│  │  ┌──────────────┐  ┌──────────────┐                │  │
│  │  │ QR Generator │  │ Build Monitor │                │  │
│  │  └──────────────┘  └──────────────┘                │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│  Expo CLI    │ │  EAS CLI │ │ Metro      │
│  (npx expo)  │ │(npx eas) │ │ Bundler    │
└──────────────┘ └──────────┘ └────────────┘
```

### Module Structure

```
src/tools/expo/
├── index.ts                    # Tool registration and exports
├── types.ts                    # TypeScript types and interfaces
├── constants.ts                # Configuration constants
│
├── core/
│   ├── expo-executor.ts        # Core Expo CLI command execution
│   ├── eas-executor.ts         # EAS CLI command execution
│   ├── process-manager.ts      # Background process management
│   ├── log-parser.ts           # Expo/Metro log parsing
│   ├── qr-generator.ts         # QR code generation
│   └── config-validator.ts     # Expo config validation
│
├── dev/
│   ├── start.ts                # expo_start
│   ├── get-qr.ts               # expo_get_qr
│   ├── logs.ts                 # expo_logs
│   └── controls.ts             # expo_controls
│
├── build/
│   ├── build.ts                # eas_build
│   ├── status.ts               # eas_build_status
│   └── submit.ts               # eas_submit
│
├── project/
│   ├── doctor.ts               # expo_doctor
│   ├── install.ts              # expo_install
│   └── upgrade.ts              # expo_upgrade
│
└── update/
    ├── publish.ts              # eas_update
    └── status.ts               # eas_update_status
```

### Core Services

#### 1. Expo Executor Service

**Purpose:** Execute Expo CLI commands safely with proper error handling

```typescript
// src/tools/expo/core/expo-executor.ts

import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ExpoExecutorOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
  maxBuffer?: number;
}

export interface ExpoCommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export class ExpoExecutor {
  private static instance: ExpoExecutor;

  private constructor() {}

  static getInstance(): ExpoExecutor {
    if (!ExpoExecutor.instance) {
      ExpoExecutor.instance = new ExpoExecutor();
    }
    return ExpoExecutor.instance;
  }

  async executeCommand(
    command: string,
    args: string[],
    options: ExpoExecutorOptions = {}
  ): Promise<ExpoCommandResult> {
    const startTime = Date.now();
    const fullCommand = this.buildCommand(command, args);

    try {
      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || 300000, // 5 minutes default
        maxBuffer: options.maxBuffer || 10 * 1024 * 1024, // 10MB
        env: { ...process.env, ...options.env }
      });

      return {
        success: true,
        stdout,
        stderr,
        exitCode: 0,
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
        duration: Date.now() - startTime
      };
    }
  }

  private buildCommand(command: string, args: string[]): string {
    // Sanitize arguments to prevent command injection
    const sanitizedArgs = args.map(arg => this.sanitizeArg(arg));
    return `npx ${command} ${sanitizedArgs.join(' ')}`;
  }

  private sanitizeArg(arg: string): string {
    // Remove dangerous characters
    const dangerous = /[;&|`$()<>]/;
    if (dangerous.test(arg)) {
      throw new Error(`Argument contains dangerous characters: ${arg}`);
    }

    // Quote arguments with spaces
    if (arg.includes(' ')) {
      return `"${arg}"`;
    }

    return arg;
  }
}
```

#### 2. Process Manager Service

**Purpose:** Manage long-running Expo development server processes

```typescript
// src/tools/expo/core/process-manager.ts

import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface ManagedProcess {
  id: string;
  process: ChildProcess;
  command: string;
  startTime: number;
  logs: string[];
  status: 'running' | 'stopped' | 'error';
}

export class ProcessManager extends EventEmitter {
  private static instance: ProcessManager;
  private processes: Map<string, ManagedProcess> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager();
    }
    return ProcessManager.instance;
  }

  startProcess(
    id: string,
    command: string,
    args: string[],
    options: { cwd?: string; env?: Record<string, string> } = {}
  ): ManagedProcess {
    // Kill existing process with same ID
    this.stopProcess(id);

    const proc = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const managedProcess: ManagedProcess = {
      id,
      process: proc,
      command: `${command} ${args.join(' ')}`,
      startTime: Date.now(),
      logs: [],
      status: 'running'
    };

    // Capture stdout
    proc.stdout?.on('data', (data) => {
      const log = data.toString();
      managedProcess.logs.push(log);
      this.emit('log', { id, type: 'stdout', data: log });

      // Keep only last 1000 log lines
      if (managedProcess.logs.length > 1000) {
        managedProcess.logs = managedProcess.logs.slice(-1000);
      }
    });

    // Capture stderr
    proc.stderr?.on('data', (data) => {
      const log = data.toString();
      managedProcess.logs.push(log);
      this.emit('log', { id, type: 'stderr', data: log });
    });

    // Handle process exit
    proc.on('exit', (code, signal) => {
      managedProcess.status = code === 0 ? 'stopped' : 'error';
      this.emit('exit', { id, code, signal });
    });

    this.processes.set(id, managedProcess);
    return managedProcess;
  }

  stopProcess(id: string): boolean {
    const proc = this.processes.get(id);
    if (!proc) return false;

    proc.process.kill('SIGTERM');
    proc.status = 'stopped';
    this.processes.delete(id);
    return true;
  }

  getProcess(id: string): ManagedProcess | undefined {
    return this.processes.get(id);
  }

  getAllProcesses(): ManagedProcess[] {
    return Array.from(this.processes.values());
  }

  getLogs(id: string, tail?: number): string[] {
    const proc = this.processes.get(id);
    if (!proc) return [];

    if (tail) {
      return proc.logs.slice(-tail);
    }
    return proc.logs;
  }
}
```

#### 3. QR Code Generator Service

```typescript
// src/tools/expo/core/qr-generator.ts

import QRCode from 'qrcode';

export interface QRCodeOptions {
  size?: number;
  format?: 'terminal' | 'svg' | 'png' | 'base64';
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export class QRGenerator {
  static async generate(
    url: string,
    options: QRCodeOptions = {}
  ): Promise<string> {
    const {
      size = 256,
      format = 'terminal',
      errorCorrectionLevel = 'M'
    } = options;

    switch (format) {
      case 'terminal':
        return QRCode.toString(url, {
          type: 'terminal',
          errorCorrectionLevel
        });

      case 'svg':
        return QRCode.toString(url, {
          type: 'svg',
          errorCorrectionLevel,
          width: size
        });

      case 'base64':
        return QRCode.toDataURL(url, {
          errorCorrectionLevel,
          width: size
        });

      case 'png':
        const buffer = await QRCode.toBuffer(url, {
          errorCorrectionLevel,
          width: size
        });
        return buffer.toString('base64');

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}
```

---

## 🔧 Tool Specifications

### Category 1: Development Server Management

---

#### Tool 1.1: `expo_start`

**Purpose:** Start Expo development server with configuration options

**Input Schema:**

```typescript
import { z } from 'zod';

export const ExpoStartInputSchema = z.object({
  // Platform options
  platform: z.enum(['ios', 'android', 'web', 'all']).default('all').describe(
    'Platform to start for (ios, android, web, or all)'
  ),

  // Tunnel options
  tunnel: z.boolean().default(false).describe(
    'Use Expo tunnel for remote testing (slower but works behind firewalls)'
  ),

  lan: z.boolean().default(false).describe(
    'Use LAN connection instead of localhost'
  ),

  localhost: z.boolean().default(true).describe(
    'Use localhost connection (default)'
  ),

  // Server options
  port: z.number().int().min(1024).max(65535).optional().describe(
    'Port for development server (default: 8081)'
  ),

  clear: z.boolean().default(false).describe(
    'Clear Metro bundler cache before starting'
  ),

  dev_client: z.boolean().default(false).describe(
    'Start in development client mode'
  ),

  // Build options
  offline: z.boolean().default(false).describe(
    'Work offline (skip update checks)'
  ),

  https: z.boolean().default(false).describe(
    'Start server with HTTPS'
  ),

  // Process options
  background: z.boolean().default(true).describe(
    'Run server in background (recommended for MCP)'
  ),

  auto_open: z.boolean().default(false).describe(
    'Automatically open in browser/emulator'
  ),

  // Advanced options
  max_workers: z.number().int().min(1).optional().describe(
    'Maximum number of Metro worker threads'
  ),

  reset_cache: z.boolean().default(false).describe(
    'Reset Metro bundler cache (alias for --clear)'
  ),

  // Working directory
  project_dir: z.string().optional().describe(
    'Project directory (defaults to current directory)'
  )
});

export type ExpoStartInput = z.infer<typeof ExpoStartInputSchema>;
```

**Output Schema:**

```typescript
export interface ExpoStartOutput {
  success: boolean;
  process_id: string;
  server_url: string;
  qr_code?: string;
  platform: string;
  connection_type: 'localhost' | 'lan' | 'tunnel';
  metro_config: {
    port: number;
    cache_cleared: boolean;
    workers: number;
  };
  started_at: string;
  logs_preview: string[];
  error?: string;
}
```

**Implementation:**

```typescript
// src/tools/expo/dev/start.ts

import { ExpoExecutor } from '../core/expo-executor';
import { ProcessManager } from '../core/process-manager';
import { QRGenerator } from '../core/qr-generator';
import type { ExpoStartInput, ExpoStartOutput } from '../types';

export async function expoStart(input: ExpoStartInput): Promise<ExpoStartOutput> {
  const executor = ExpoExecutor.getInstance();
  const processManager = ProcessManager.getInstance();

  // Build command arguments
  const args: string[] = ['start'];

  // Platform
  if (input.platform !== 'all') {
    args.push(`--${input.platform}`);
  }

  // Connection type
  if (input.tunnel) args.push('--tunnel');
  else if (input.lan) args.push('--lan');
  else if (input.localhost) args.push('--localhost');

  // Server options
  if (input.port) args.push('--port', input.port.toString());
  if (input.clear || input.reset_cache) args.push('--clear');
  if (input.dev_client) args.push('--dev-client');
  if (input.offline) args.push('--offline');
  if (input.https) args.push('--https');
  if (input.max_workers) args.push('--max-workers', input.max_workers.toString());

  // Don't auto-open (we're in MCP context)
  args.push('--no-dev-client');

  const projectDir = input.project_dir || process.cwd();

  // Start process in background
  const processId = `expo-dev-${Date.now()}`;
  const managedProcess = processManager.startProcess(
    processId,
    'npx',
    ['expo', ...args],
    { cwd: projectDir }
  );

  // Wait for server to start (look for "Metro waiting on..." message)
  const serverUrl = await waitForServerStart(managedProcess, 30000);

  if (!serverUrl) {
    processManager.stopProcess(processId);
    return {
      success: false,
      process_id: processId,
      server_url: '',
      platform: input.platform,
      connection_type: input.tunnel ? 'tunnel' : input.lan ? 'lan' : 'localhost',
      metro_config: {
        port: input.port || 8081,
        cache_cleared: input.clear || input.reset_cache,
        workers: input.max_workers || 0
      },
      started_at: new Date().toISOString(),
      logs_preview: processManager.getLogs(processId, 20),
      error: 'Failed to start Expo development server within timeout'
    };
  }

  // Generate QR code
  let qrCode: string | undefined;
  try {
    qrCode = await QRGenerator.generate(serverUrl, { format: 'terminal' });
  } catch (error) {
    // QR generation is optional
  }

  return {
    success: true,
    process_id: processId,
    server_url: serverUrl,
    qr_code: qrCode,
    platform: input.platform,
    connection_type: input.tunnel ? 'tunnel' : input.lan ? 'lan' : 'localhost',
    metro_config: {
      port: input.port || 8081,
      cache_cleared: input.clear || input.reset_cache,
      workers: input.max_workers || 0
    },
    started_at: new Date().toISOString(),
    logs_preview: processManager.getLogs(processId, 20)
  };
}

async function waitForServerStart(
  process: ManagedProcess,
  timeout: number
): Promise<string | null> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const checkLogs = setInterval(() => {
      const logs = process.logs.join('\n');

      // Look for Metro bundler URL patterns
      const urlMatch = logs.match(/exp:\/\/[\d\.]+:\d+/);
      if (urlMatch) {
        clearInterval(checkLogs);
        resolve(urlMatch[0]);
        return;
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        clearInterval(checkLogs);
        resolve(null);
      }
    }, 500);
  });
}
```

**Example Usage:**

```typescript
// Start Expo server with tunnel for remote testing
const result = await expoStart({
  platform: 'all',
  tunnel: true,
  clear: true,
  background: true
});

console.log(result.server_url); // "exp://tunnel-url:8081"
console.log(result.qr_code); // ASCII QR code for scanning
```

---

#### Tool 1.2: `expo_get_qr`

**Purpose:** Get QR code and connection URLs for active Expo server

**Input Schema:**

```typescript
export const ExpoGetQRInputSchema = z.object({
  process_id: z.string().optional().describe(
    'Process ID from expo_start (uses active server if not provided)'
  ),

  format: z.enum(['terminal', 'svg', 'png', 'base64']).default('terminal').describe(
    'QR code output format'
  ),

  size: z.number().int().min(128).max(1024).default(256).describe(
    'QR code size in pixels (for image formats)'
  ),

  include_urls: z.boolean().default(true).describe(
    'Include all connection URLs in output'
  )
});

export type ExpoGetQRInput = z.infer<typeof ExpoGetQRInputSchema>;
```

**Output Schema:**

```typescript
export interface ExpoGetQROutput {
  success: boolean;
  qr_code: string;
  format: string;
  urls: {
    exp: string;
    lan?: string;
    tunnel?: string;
    localhost?: string;
  };
  platform_specific: {
    ios?: string;
    android?: string;
    web?: string;
  };
  instructions: string;
  error?: string;
}
```

**Implementation:**

```typescript
// src/tools/expo/dev/get-qr.ts

export async function expoGetQR(input: ExpoGetQRInput): Promise<ExpoGetQROutput> {
  const processManager = ProcessManager.getInstance();

  // Find active Expo process
  let process: ManagedProcess | undefined;
  if (input.process_id) {
    process = processManager.getProcess(input.process_id);
  } else {
    // Find first running expo process
    const allProcesses = processManager.getAllProcesses();
    process = allProcesses.find(p => p.command.includes('expo start') && p.status === 'running');
  }

  if (!process) {
    return {
      success: false,
      qr_code: '',
      format: input.format,
      urls: { exp: '' },
      platform_specific: {},
      instructions: '',
      error: 'No active Expo development server found. Run expo_start first.'
    };
  }

  // Extract URLs from logs
  const logs = process.logs.join('\n');
  const urls = extractURLsFromLogs(logs);

  if (!urls.exp) {
    return {
      success: false,
      qr_code: '',
      format: input.format,
      urls: { exp: '' },
      platform_specific: {},
      instructions: '',
      error: 'Could not find Expo URL in server logs'
    };
  }

  // Generate QR code
  const qrCode = await QRGenerator.generate(urls.exp, {
    format: input.format,
    size: input.size
  });

  return {
    success: true,
    qr_code: qrCode,
    format: input.format,
    urls,
    platform_specific: {
      ios: urls.exp,
      android: urls.exp,
      web: urls.localhost ? urls.localhost.replace('exp://', 'http://') : undefined
    },
    instructions: `
Scan this QR code with:
  • iOS: Expo Go app (camera not supported)
  • Android: Expo Go app or camera

Alternative: Open Expo Go and enter URL manually:
  ${urls.exp}
    `.trim()
  };
}

function extractURLsFromLogs(logs: string): { exp: string; lan?: string; tunnel?: string; localhost?: string } {
  const urls: any = {};

  const expMatch = logs.match(/exp:\/\/[\d\.a-z\-]+:\d+/i);
  if (expMatch) urls.exp = expMatch[0];

  const lanMatch = logs.match(/exp:\/\/[\d\.]+:\d+/);
  if (lanMatch) urls.lan = lanMatch[0];

  const tunnelMatch = logs.match(/exp:\/\/[a-z0-9\-]+\.exp\.direct:\d+/i);
  if (tunnelMatch) urls.tunnel = tunnelMatch[0];

  const localhostMatch = logs.match(/exp:\/\/localhost:\d+/);
  if (localhostMatch) urls.localhost = localhostMatch[0];

  return urls;
}
```

---

#### Tool 1.3: `expo_logs`

**Purpose:** Stream and filter Expo development server logs

**Input Schema:**

```typescript
export const ExpoLogsInputSchema = z.object({
  process_id: z.string().optional().describe(
    'Process ID from expo_start (uses active server if not provided)'
  ),

  tail: z.number().int().min(1).max(10000).default(100).describe(
    'Number of recent log lines to return'
  ),

  filter: z.enum(['all', 'errors', 'warnings', 'metro', 'bundle', 'network']).default('all').describe(
    'Filter logs by type'
  ),

  search: z.string().optional().describe(
    'Search for specific text in logs (case-insensitive)'
  ),

  follow: z.boolean().default(false).describe(
    'Keep streaming new logs (not recommended for MCP - use tail instead)'
  ),

  since: z.string().optional().describe(
    'Show logs since timestamp (ISO 8601 format)'
  )
});
```

**Output Schema:**

```typescript
export interface ExpoLogsOutput {
  success: boolean;
  logs: Array<{
    timestamp: string;
    type: 'stdout' | 'stderr';
    level: 'info' | 'warn' | 'error';
    message: string;
    category?: 'metro' | 'bundle' | 'network' | 'general';
  }>;
  total_lines: number;
  filtered_lines: number;
  process_status: 'running' | 'stopped' | 'error';
  error?: string;
}
```

**Implementation:**

```typescript
// src/tools/expo/dev/logs.ts

export async function expoLogs(input: ExpoLogsInput): Promise<ExpoLogsOutput> {
  const processManager = ProcessManager.getInstance();

  // Find process
  let process: ManagedProcess | undefined;
  if (input.process_id) {
    process = processManager.getProcess(input.process_id);
  } else {
    const allProcesses = processManager.getAllProcesses();
    process = allProcesses.find(p => p.command.includes('expo start'));
  }

  if (!process) {
    return {
      success: false,
      logs: [],
      total_lines: 0,
      filtered_lines: 0,
      process_status: 'stopped',
      error: 'No Expo process found'
    };
  }

  // Get logs
  const rawLogs = processManager.getLogs(process.id, input.tail);

  // Parse and filter logs
  const parsedLogs = rawLogs.map(log => parseLogLine(log));
  let filteredLogs = parsedLogs;

  // Apply filters
  if (input.filter !== 'all') {
    filteredLogs = filteredLogs.filter(log => {
      switch (input.filter) {
        case 'errors':
          return log.level === 'error';
        case 'warnings':
          return log.level === 'warn';
        case 'metro':
          return log.category === 'metro';
        case 'bundle':
          return log.category === 'bundle';
        case 'network':
          return log.category === 'network';
        default:
          return true;
      }
    });
  }

  // Apply search filter
  if (input.search) {
    const searchLower = input.search.toLowerCase();
    filteredLogs = filteredLogs.filter(log =>
      log.message.toLowerCase().includes(searchLower)
    );
  }

  // Apply time filter
  if (input.since) {
    const sinceTime = new Date(input.since).getTime();
    filteredLogs = filteredLogs.filter(log =>
      new Date(log.timestamp).getTime() >= sinceTime
    );
  }

  return {
    success: true,
    logs: filteredLogs,
    total_lines: rawLogs.length,
    filtered_lines: filteredLogs.length,
    process_status: process.status
  };
}

function parseLogLine(logLine: string): any {
  // Parse Expo/Metro log format
  const timestamp = new Date().toISOString();
  let level: 'info' | 'warn' | 'error' = 'info';
  let category: 'metro' | 'bundle' | 'network' | 'general' = 'general';

  // Detect log level
  if (logLine.includes('ERROR') || logLine.includes('Error:')) {
    level = 'error';
  } else if (logLine.includes('WARN') || logLine.includes('Warning:')) {
    level = 'warn';
  }

  // Detect category
  if (logLine.includes('Metro') || logLine.includes('Bundler')) {
    category = 'metro';
  } else if (logLine.includes('bundle') || logLine.includes('Bundling')) {
    category = 'bundle';
  } else if (logLine.includes('HTTP') || logLine.includes('GET') || logLine.includes('POST')) {
    category = 'network';
  }

  return {
    timestamp,
    type: level === 'error' ? 'stderr' : 'stdout',
    level,
    message: logLine,
    category
  };
}
```

---

#### Tool 1.4: `expo_controls`

**Purpose:** Control running Expo development server (reload, clear cache, etc.)

**Input Schema:**

```typescript
export const ExpoControlsInputSchema = z.object({
  process_id: z.string().optional().describe(
    'Process ID from expo_start (uses active server if not provided)'
  ),

  action: z.enum([
    'reload',
    'clear_cache',
    'toggle_inspector',
    'toggle_performance',
    'stop'
  ]).describe('Control action to perform'),

  platform: z.enum(['ios', 'android', 'all']).optional().describe(
    'Platform to apply action to (for reload)'
  )
});
```

**Output Schema:**

```typescript
export interface ExpoControlsOutput {
  success: boolean;
  action: string;
  result: string;
  process_status: 'running' | 'stopped' | 'error';
  error?: string;
}
```

**Implementation:**

```typescript
// src/tools/expo/dev/controls.ts

export async function expoControls(input: ExpoControlsInput): Promise<ExpoControlsOutput> {
  const processManager = ProcessManager.getInstance();

  // Find process
  let process: ManagedProcess | undefined;
  if (input.process_id) {
    process = processManager.getProcess(input.process_id);
  } else {
    const allProcesses = processManager.getAllProcesses();
    process = allProcesses.find(p => p.command.includes('expo start') && p.status === 'running');
  }

  if (!process) {
    return {
      success: false,
      action: input.action,
      result: '',
      process_status: 'stopped',
      error: 'No active Expo process found'
    };
  }

  let result = '';

  switch (input.action) {
    case 'reload':
      // Send 'r' to stdin to reload
      process.process.stdin?.write('r\n');
      result = `Reload triggered for ${input.platform || 'all'} platform(s)`;
      break;

    case 'clear_cache':
      // Restart with --clear flag
      process.process.stdin?.write('shift+r\n'); // Metro clear cache shortcut
      result = 'Metro bundler cache cleared';
      break;

    case 'toggle_inspector':
      process.process.stdin?.write('i\n');
      result = 'Element inspector toggled';
      break;

    case 'toggle_performance':
      process.process.stdin?.write('p\n');
      result = 'Performance monitor toggled';
      break;

    case 'stop':
      processManager.stopProcess(process.id);
      result = 'Expo development server stopped';
      break;
  }

  return {
    success: true,
    action: input.action,
    result,
    process_status: process.status
  };
}
```

---

### Category 2: Build Management

---

#### Tool 2.1: `eas_build`

**Purpose:** Trigger EAS cloud builds with platform and profile options

**Input Schema:**

```typescript
export const EASBuildInputSchema = z.object({
  // Platform selection
  platform: z.enum(['ios', 'android', 'all']).describe(
    'Platform to build for'
  ),

  // Build profile
  profile: z.string().default('production').describe(
    'Build profile from eas.json (e.g., development, preview, production)'
  ),

  // Build options
  auto_submit: z.boolean().default(false).describe(
    'Automatically submit to app store after successful build'
  ),

  wait: z.boolean().default(false).describe(
    'Wait for build to complete before returning (can take 10-30+ minutes)'
  ),

  clear_cache: z.boolean().default(false).describe(
    'Clear build cache'
  ),

  // Message/metadata
  message: z.string().optional().describe(
    'Build message/note for tracking'
  ),

  // Advanced
  non_interactive: z.boolean().default(true).describe(
    'Run in non-interactive mode (required for MCP)'
  ),

  json: z.boolean().default(true).describe(
    'Output in JSON format for parsing'
  ),

  project_dir: z.string().optional().describe(
    'Project directory (defaults to current directory)'
  )
});
```

**Output Schema:**

```typescript
export interface EASBuildOutput {
  success: boolean;
  build_id: string;
  build_url: string;
  platform: string;
  profile: string;
  status: 'queued' | 'in-progress' | 'finished' | 'errored' | 'canceled';
  created_at: string;
  estimated_wait_time?: string;
  priority: 'normal' | 'high';
  message?: string;
  artifacts?: {
    application_archive_url?: string;
    build_artifacts_url?: string;
  };
  error?: string;
}
```

**Implementation:**

```typescript
// src/tools/expo/build/build.ts

import { EASExecutor } from '../core/eas-executor';
import type { EASBuildInput, EASBuildOutput } from '../types';

export async function easBuild(input: EASBuildInput): Promise<EASBuildOutput> {
  const executor = EASExecutor.getInstance();

  // Build command arguments
  const args: string[] = ['build'];

  // Platform
  args.push('--platform', input.platform);

  // Profile
  args.push('--profile', input.profile);

  // Options
  if (input.auto_submit) args.push('--auto-submit');
  if (input.wait) args.push('--wait');
  if (input.clear_cache) args.push('--clear-cache');
  if (input.message) args.push('--message', input.message);
  if (input.non_interactive) args.push('--non-interactive');
  if (input.json) args.push('--json');

  // Execute build command
  const result = await executor.executeCommand('eas', args, {
    cwd: input.project_dir,
    timeout: input.wait ? 3600000 : 300000 // 1 hour if waiting, 5 minutes otherwise
  });

  if (!result.success) {
    return {
      success: false,
      build_id: '',
      build_url: '',
      platform: input.platform,
      profile: input.profile,
      status: 'errored',
      created_at: new Date().toISOString(),
      error: result.stderr || 'Build trigger failed'
    };
  }

  // Parse JSON output
  let buildInfo: any;
  try {
    buildInfo = JSON.parse(result.stdout);
  } catch (error) {
    // Fallback: parse text output
    buildInfo = parseTextOutput(result.stdout);
  }

  return {
    success: true,
    build_id: buildInfo.id || buildInfo.buildId,
    build_url: buildInfo.url || `https://expo.dev/accounts/${buildInfo.accountName}/projects/${buildInfo.projectName}/builds/${buildInfo.id}`,
    platform: input.platform,
    profile: input.profile,
    status: buildInfo.status || 'queued',
    created_at: buildInfo.createdAt || new Date().toISOString(),
    estimated_wait_time: buildInfo.estimatedWaitTime,
    priority: buildInfo.priority || 'normal',
    message: input.message,
    artifacts: buildInfo.artifacts
  };
}

function parseTextOutput(output: string): any {
  // Parse non-JSON output (fallback)
  const buildIdMatch = output.match(/Build ID: ([a-f0-9-]+)/i);
  const urlMatch = output.match(/(https:\/\/expo\.dev\/[^\s]+)/);

  return {
    id: buildIdMatch?.[1] || 'unknown',
    url: urlMatch?.[1] || '',
    status: 'queued'
  };
}
```

---

#### Tool 2.2: `eas_build_status`

**Purpose:** Check build status, logs, and download artifacts

**Input Schema:**

```typescript
export const EASBuildStatusInputSchema = z.object({
  build_id: z.string().optional().describe(
    'Specific build ID to check (uses latest if not provided)'
  ),

  platform: z.enum(['ios', 'android', 'all']).optional().describe(
    'Filter by platform when using latest build'
  ),

  profile: z.string().optional().describe(
    'Filter by profile when using latest build'
  ),

  include_logs: z.boolean().default(false).describe(
    'Include full build logs in response'
  ),

  download_artifact: z.boolean().default(false).describe(
    'Download build artifact (IPA/APK) to local directory'
  ),

  output_dir: z.string().optional().describe(
    'Directory to download artifacts to'
  ),

  json: z.boolean().default(true).describe(
    'Output in JSON format'
  )
});
```

**Output Schema:**

```typescript
export interface EASBuildStatusOutput {
  success: boolean;
  build: {
    id: string;
    status: 'queued' | 'in-progress' | 'finished' | 'errored' | 'canceled';
    platform: string;
    profile: string;
    created_at: string;
    updated_at: string;
    completed_at?: string;
    duration?: number;
    priority: string;
    message?: string;
  };
  artifacts?: {
    application_archive_url?: string;
    build_artifacts_url?: string;
    local_path?: string;
  };
  logs?: string;
  error?: string;
}
```

**Implementation:**

```typescript
// src/tools/expo/build/status.ts

export async function easBuildStatus(input: EASBuildStatusInput): Promise<EASBuildStatusOutput> {
  const executor = EASExecutor.getInstance();

  // Build command
  const args: string[] = ['build:list'];

  if (input.build_id) {
    args.push('--build-id', input.build_id);
  } else {
    args.push('--limit', '1'); // Get latest build
    if (input.platform) args.push('--platform', input.platform);
    if (input.profile) args.push('--profile', input.profile);
  }

  if (input.json) args.push('--json');

  // Get build info
  const result = await executor.executeCommand('eas', args);

  if (!result.success) {
    return {
      success: false,
      build: {
        id: '',
        status: 'errored',
        platform: '',
        profile: '',
        created_at: '',
        updated_at: '',
        priority: ''
      },
      error: result.stderr || 'Failed to fetch build status'
    };
  }

  const buildInfo = JSON.parse(result.stdout)[0];

  // Get logs if requested
  let logs: string | undefined;
  if (input.include_logs && buildInfo.id) {
    const logsResult = await executor.executeCommand('eas', [
      'build:view',
      buildInfo.id,
      '--logs'
    ]);
    logs = logsResult.stdout;
  }

  // Download artifact if requested
  let localPath: string | undefined;
  if (input.download_artifact && buildInfo.artifacts?.applicationArchiveUrl) {
    // Implementation would download the file
    localPath = `/path/to/downloaded/artifact.${buildInfo.platform === 'ios' ? 'ipa' : 'apk'}`;
  }

  return {
    success: true,
    build: {
      id: buildInfo.id,
      status: buildInfo.status,
      platform: buildInfo.platform,
      profile: buildInfo.profile,
      created_at: buildInfo.createdAt,
      updated_at: buildInfo.updatedAt,
      completed_at: buildInfo.completedAt,
      duration: buildInfo.duration,
      priority: buildInfo.priority,
      message: buildInfo.message
    },
    artifacts: {
      application_archive_url: buildInfo.artifacts?.applicationArchiveUrl,
      build_artifacts_url: buildInfo.artifacts?.buildArtifactsUrl,
      local_path: localPath
    },
    logs
  };
}
```

---

#### Tool 2.3: `eas_submit`

**Purpose:** Submit builds to App Store or Play Store

**Input Schema:**

```typescript
export const EASSubmitInputSchema = z.object({
  // Build selection
  build_id: z.string().optional().describe(
    'Specific build ID to submit (uses latest successful build if not provided)'
  ),

  platform: z.enum(['ios', 'android']).describe(
    'Platform to submit to'
  ),

  profile: z.string().optional().describe(
    'Submit profile from eas.json'
  ),

  // iOS-specific options
  apple_id: z.string().optional().describe(
    'Apple ID for App Store submission (iOS only)'
  ),

  apple_app_specific_password: z.string().optional().describe(
    'App-specific password for Apple ID (iOS only)'
  ),

  asc_app_id: z.string().optional().describe(
    'App Store Connect app ID (iOS only)'
  ),

  // Android-specific options
  android_service_account_key_path: z.string().optional().describe(
    'Path to Google service account key JSON (Android only)'
  ),

  android_track: z.enum(['internal', 'alpha', 'beta', 'production']).optional().describe(
    'Google Play track (Android only)'
  ),

  android_release_status: z.enum(['completed', 'draft', 'halted', 'inProgress']).optional().describe(
    'Release status (Android only)'
  ),

  // Common options
  wait: z.boolean().default(false).describe(
    'Wait for submission to complete'
  ),

  verbose: z.boolean().default(false).describe(
    'Verbose output'
  )
});
```

**Output Schema:**

```typescript
export interface EASSubmitOutput {
  success: boolean;
  submission_id: string;
  build_id: string;
  platform: string;
  status: 'queued' | 'in-progress' | 'finished' | 'errored' | 'canceled';
  store_url?: string;
  created_at: string;
  completed_at?: string;
  error?: string;
}
```

---

### Category 3: Project Management

---

#### Tool 3.1: `expo_doctor`

**Purpose:** Diagnose project issues and validate configuration

**Input Schema:**

```typescript
export const ExpoDoctorInputSchema = z.object({
  fix_issues: z.boolean().default(false).describe(
    'Automatically fix issues when possible'
  ),

  checks: z.array(z.enum([
    'dependencies',
    'config',
    'packages',
    'expo-version',
    'react-native-version',
    'node-modules',
    'git'
  ])).optional().describe(
    'Specific checks to run (runs all if not provided)'
  ),

  verbose: z.boolean().default(false).describe(
    'Verbose output'
  ),

  project_dir: z.string().optional().describe(
    'Project directory to check'
  )
});
```

**Output Schema:**

```typescript
export interface ExpoDoctorOutput {
  success: boolean;
  checks_passed: number;
  checks_failed: number;
  checks_warning: number;
  issues: Array<{
    category: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    fix_available: boolean;
    fixed: boolean;
  }>;
  recommendations: string[];
  summary: string;
  error?: string;
}
```

---

#### Tool 3.2: `expo_install`

**Purpose:** Install compatible packages with automatic version resolution

**Input Schema:**

```typescript
export const ExpoInstallInputSchema = z.object({
  packages: z.array(z.string()).min(1).describe(
    'Package names to install (e.g., ["react-native-maps", "@react-navigation/native"])'
  ),

  check_compatibility: z.boolean().default(true).describe(
    'Check compatibility with current Expo SDK version'
  ),

  fix_dependencies: z.boolean().default(true).describe(
    'Automatically fix dependency version conflicts'
  ),

  npm_client: z.enum(['npm', 'yarn', 'pnpm']).optional().describe(
    'Package manager to use (auto-detected if not provided)'
  ),

  project_dir: z.string().optional()
});
```

**Output Schema:**

```typescript
export interface ExpoInstallOutput {
  success: boolean;
  installed_packages: Array<{
    name: string;
    version: string;
    compatible: boolean;
  }>;
  warnings: string[];
  duration: number;
  error?: string;
}
```

---

#### Tool 3.3: `expo_upgrade`

**Purpose:** Upgrade Expo SDK version with dependency migration

**Input Schema:**

```typescript
export const ExpoUpgradeInputSchema = z.object({
  target_version: z.string().optional().describe(
    'Target Expo SDK version (e.g., "49.0.0"). Uses latest if not provided.'
  ),

  auto_fix_dependencies: z.boolean().default(true).describe(
    'Automatically upgrade all dependencies to compatible versions'
  ),

  check_breaking_changes: z.boolean().default(true).describe(
    'Check for breaking changes in upgrade'
  ),

  install_dependencies: z.boolean().default(true).describe(
    'Install dependencies after upgrade'
  ),

  npm_client: z.enum(['npm', 'yarn', 'pnpm']).optional(),

  project_dir: z.string().optional()
});
```

**Output Schema:**

```typescript
export interface ExpoUpgradeOutput {
  success: boolean;
  from_version: string;
  to_version: string;
  upgraded_packages: Array<{
    name: string;
    from_version: string;
    to_version: string;
  }>;
  breaking_changes: Array<{
    package: string;
    change: string;
    migration_guide_url?: string;
  }>;
  warnings: string[];
  next_steps: string[];
  error?: string;
}
```

---

### Category 4: Updates & Publishing

---

#### Tool 4.1: `eas_update`

**Purpose:** Create and publish over-the-air (OTA) updates

**Input Schema:**

```typescript
export const EASUpdateInputSchema = z.object({
  // Branch/channel selection
  branch: z.string().default('production').describe(
    'Update branch (e.g., production, staging, development)'
  ),

  channel: z.string().optional().describe(
    'Update channel for targeting specific build profiles'
  ),

  // Message/metadata
  message: z.string().describe(
    'Update message describing changes'
  ),

  // Platform
  platform: z.enum(['ios', 'android', 'all']).default('all').describe(
    'Platform to publish update for'
  ),

  // Build options
  clear_cache: z.boolean().default(false).describe(
    'Clear bundler cache before building'
  ),

  // Rollout options
  rollout_percentage: z.number().min(0).max(100).default(100).describe(
    'Percentage of users to receive update (0-100, allows gradual rollout)'
  ),

  // Advanced
  auto_publish: z.boolean().default(true).describe(
    'Automatically publish after build (false = create draft)'
  ),

  json: z.boolean().default(true).describe(
    'Output in JSON format'
  ),

  project_dir: z.string().optional()
});
```

**Output Schema:**

```typescript
export interface EASUpdateOutput {
  success: boolean;
  update_id: string;
  update_group_id: string;
  branch: string;
  channel?: string;
  platform: string[];
  message: string;
  published_at: string;
  rollout_percentage: number;
  runtime_version: string;
  assets: {
    total: number;
    size_bytes: number;
  };
  manifest_url: string;
  status: 'published' | 'draft';
  error?: string;
}
```

**Implementation:**

```typescript
// src/tools/expo/update/publish.ts

export async function easUpdate(input: EASUpdateInput): Promise<EASUpdateOutput> {
  const executor = EASExecutor.getInstance();

  // Build command
  const args: string[] = ['update'];

  // Branch/channel
  args.push('--branch', input.branch);
  if (input.channel) args.push('--channel', input.channel);

  // Message
  args.push('--message', input.message);

  // Platform
  if (input.platform !== 'all') {
    args.push('--platform', input.platform);
  }

  // Options
  if (input.clear_cache) args.push('--clear');
  if (!input.auto_publish) args.push('--draft');
  if (input.json) args.push('--json');

  // Execute update
  const result = await executor.executeCommand('eas', args, {
    cwd: input.project_dir,
    timeout: 600000 // 10 minutes
  });

  if (!result.success) {
    return {
      success: false,
      update_id: '',
      update_group_id: '',
      branch: input.branch,
      channel: input.channel,
      platform: [],
      message: input.message,
      published_at: '',
      rollout_percentage: input.rollout_percentage,
      runtime_version: '',
      assets: { total: 0, size_bytes: 0 },
      manifest_url: '',
      status: 'draft',
      error: result.stderr || 'Update publish failed'
    };
  }

  const updateInfo = JSON.parse(result.stdout);

  // Apply rollout percentage if not 100%
  if (input.rollout_percentage < 100) {
    await setRolloutPercentage(updateInfo.id, input.rollout_percentage);
  }

  return {
    success: true,
    update_id: updateInfo.id,
    update_group_id: updateInfo.groupId,
    branch: input.branch,
    channel: input.channel,
    platform: updateInfo.platforms || [input.platform],
    message: input.message,
    published_at: updateInfo.createdAt,
    rollout_percentage: input.rollout_percentage,
    runtime_version: updateInfo.runtimeVersion,
    assets: {
      total: updateInfo.assets?.length || 0,
      size_bytes: updateInfo.totalSize || 0
    },
    manifest_url: updateInfo.manifestUrl,
    status: input.auto_publish ? 'published' : 'draft'
  };
}

async function setRolloutPercentage(updateId: string, percentage: number): Promise<void> {
  // Implementation would call EAS API to set rollout percentage
  // This enables gradual rollout for safer deployments
}
```

---

#### Tool 4.2: `eas_update_status`

**Purpose:** View update deployment status and adoption metrics

**Input Schema:**

```typescript
export const EASUpdateStatusInputSchema = z.object({
  update_id: z.string().optional().describe(
    'Specific update ID to check (uses latest if not provided)'
  ),

  branch: z.string().optional().describe(
    'Branch to check latest update from'
  ),

  include_metrics: z.boolean().default(true).describe(
    'Include adoption metrics (download count, active users)'
  ),

  time_range: z.enum(['1h', '24h', '7d', '30d', 'all']).default('24h').describe(
    'Time range for metrics'
  )
});
```

**Output Schema:**

```typescript
export interface EASUpdateStatusOutput {
  success: boolean;
  update: {
    id: string;
    group_id: string;
    branch: string;
    message: string;
    published_at: string;
    runtime_version: string;
    rollout_percentage: number;
  };
  metrics?: {
    total_downloads: number;
    active_users: number;
    adoption_rate: number;
    platform_breakdown: {
      ios: number;
      android: number;
    };
    error_rate: number;
  };
  previous_updates: Array<{
    id: string;
    message: string;
    published_at: string;
  }>;
  error?: string;
}
```

---

## 🔄 Integration Workflows

### Workflow 1: Complete Development Setup

**Scenario:** Start development with Expo and ADB device connection

```typescript
// 1. Start Expo development server
const expoServer = await expoStart({
  platform: 'all',
  clear: true,
  tunnel: false,
  background: true
});

// 2. Connect ADB device
const adbDevice = await adbConnectDevice({
  connection_type: 'usb'
});

// 3. Get QR code for iOS testing
const qr = await expoGetQR({
  process_id: expoServer.process_id,
  format: 'terminal'
});

// 4. Install build on Android device
await adbInstallApp({
  device_id: adbDevice.device_id,
  apk_path: './android/app/build/outputs/apk/debug/app-debug.apk'
});

// 5. Monitor logs from both sources
const expoLogs = await expoLogs({
  process_id: expoServer.process_id,
  tail: 50,
  filter: 'errors'
});

const adbLogs = await adbLogcat({
  device_id: adbDevice.device_id,
  filter: 'error',
  tail: 50
});
```

### Workflow 2: Automated Build & Deploy

**Scenario:** Trigger EAS build, wait for completion, and publish OTA update

```typescript
// 1. Validate project configuration
const doctor = await expoDoctor({
  fix_issues: true
});

if (doctor.checks_failed > 0) {
  throw new Error('Project validation failed');
}

// 2. Trigger production build
const build = await easBuild({
  platform: 'all',
  profile: 'production',
  wait: true, // Wait for completion
  message: 'Release v1.2.0 - Bug fixes and performance improvements'
});

// 3. Take screenshot of device for verification
const screenshot = await adbScreenshot({
  device_id: 'emulator-5554',
  auto_name: true,
  include_metadata: true
});

// 4. If build successful, publish OTA update for hotfixes
if (build.status === 'finished') {
  const update = await easUpdate({
    branch: 'production',
    message: 'Hotfix: Fix crash on startup',
    rollout_percentage: 10, // Start with 10% rollout
    platform: 'all'
  });

  // 5. Monitor update adoption
  setTimeout(async () => {
    const status = await easUpdateStatus({
      update_id: update.update_id,
      include_metrics: true,
      time_range: '1h'
    });

    // If no errors, increase rollout
    if (status.metrics && status.metrics.error_rate < 0.01) {
      // Increase rollout to 100%
    }
  }, 3600000); // Check after 1 hour
}
```

### Workflow 3: Visual Regression Testing

**Scenario:** Combine Expo server with ADB screenshot comparison

```typescript
// 1. Start Expo server
const server = await expoStart({
  platform: 'android',
  clear: true
});

// 2. Wait for server to be ready
await new Promise(resolve => setTimeout(resolve, 5000));

// 3. Reload app on device
await expoControls({
  process_id: server.process_id,
  action: 'reload',
  platform: 'android'
});

// 4. Wait for app to load
await new Promise(resolve => setTimeout(resolve, 3000));

// 5. Run visual regression tests
const regressionResults = await adbVisualRegressionTest({
  baseline_directory: './screenshots/baseline',
  baseline_tag: 'v1.1.0',
  threshold: 0.05,
  generate_report: true,
  ci_mode: true
});

// 6. If differences found, capture annotated screenshots
if (regressionResults.failed_tests > 0) {
  for (const failure of regressionResults.failures) {
    await adbScreenshotAnnotate({
      screenshot_path: failure.actual_path,
      annotations: [{
        type: 'rectangle',
        x: failure.diff_region.x,
        y: failure.diff_region.y,
        width: failure.diff_region.width,
        height: failure.diff_region.height,
        color: 'red',
        thickness: 3,
        label: 'Visual Difference Detected'
      }],
      output_path: `./failures/${failure.screen_name}-annotated.png`
    });
  }
}
```

### Workflow 4: CI/CD Pipeline Integration

**Scenario:** Automated testing and deployment pipeline

```typescript
// CI/CD Script Example
async function cicdPipeline() {
  try {
    // 1. Validate project
    const validation = await expoDoctor({ fix_issues: true });
    if (validation.checks_failed > 0) {
      throw new Error('Project validation failed');
    }

    // 2. Install dependencies
    await expoInstall({
      packages: ['expo-updates', '@react-navigation/native'],
      check_compatibility: true
    });

    // 3. Start emulator and Expo server
    const device = await adbConnectDevice({
      connection_type: 'emulator',
      emulator_name: 'Pixel_5_API_31'
    });

    const server = await expoStart({
      platform: 'android',
      clear: true,
      background: true
    });

    // 4. Run automated tests with screenshots
    const testResults = await runAutomatedTests(); // Custom function

    // 5. Visual regression testing
    const visualTests = await adbVisualRegressionTest({
      baseline_directory: './screenshots/baseline',
      create_baseline: process.env.CREATE_BASELINE === 'true',
      ci_mode: true
    });

    // 6. If tests pass, trigger production build
    if (testResults.passed && visualTests.passed_tests === visualTests.total_tests) {
      const build = await easBuild({
        platform: 'all',
        profile: 'production',
        wait: false, // Don't wait in CI
        message: `CI Build - ${process.env.GIT_COMMIT_SHA}`
      });

      console.log(`Build triggered: ${build.build_url}`);

      // 7. Publish OTA update for immediate hotfix
      const update = await easUpdate({
        branch: 'production',
        message: `Auto-deploy: ${process.env.GIT_COMMIT_MESSAGE}`,
        platform: 'all'
      });

      console.log(`Update published: ${update.update_id}`);
    }

    // 8. Cleanup
    await expoControls({
      process_id: server.process_id,
      action: 'stop'
    });

  } catch (error) {
    console.error('CI/CD pipeline failed:', error);
    process.exit(1);
  }
}
```

---

## 🔒 Security Considerations

### 1. Credential Management

**EAS Authentication:**
- Never store credentials in tool input
- Use environment variables for sensitive data
- Support `EXPO_TOKEN` environment variable for CI/CD
- Validate token format before execution

```typescript
// Secure credential handling
if (!process.env.EXPO_TOKEN && !process.env.EAS_TOKEN) {
  throw new Error('Expo authentication required. Set EXPO_TOKEN environment variable.');
}

// Never log tokens
const sanitizedEnv = { ...process.env };
delete sanitizedEnv.EXPO_TOKEN;
delete sanitizedEnv.EAS_TOKEN;
```

### 2. Command Injection Prevention

**Input Sanitization:**
- Validate all user inputs with Zod schemas
- Sanitize shell command arguments
- Use whitelisted commands only
- Escape special characters

```typescript
function sanitizeArg(arg: string): string {
  // Remove dangerous characters
  const dangerous = /[;&|`$()<>]/;
  if (dangerous.test(arg)) {
    throw new ValidationError(`Argument contains dangerous characters: ${arg}`);
  }

  // Quote arguments with spaces
  if (arg.includes(' ')) {
    return `"${arg.replace(/"/g, '\\"')}"`;
  }

  return arg;
}
```

### 3. File System Security

**Path Validation:**
- Validate project directories exist
- Prevent path traversal attacks
- Use absolute paths internally
- Validate file extensions for artifacts

```typescript
function validateProjectPath(path: string): string {
  const resolved = resolve(path);

  // Prevent path traversal
  if (resolved.includes('..')) {
    throw new SecurityError('Path traversal detected');
  }

  // Ensure path exists
  if (!existsSync(resolved)) {
    throw new ValidationError(`Path does not exist: ${path}`);
  }

  return resolved;
}
```

### 4. Process Management Security

**Resource Limits:**
- Limit concurrent background processes
- Set timeout limits for all commands
- Implement process cleanup on errors
- Prevent process spawning bombs

```typescript
const MAX_CONCURRENT_PROCESSES = 5;
const MAX_COMMAND_TIMEOUT = 3600000; // 1 hour

class ProcessManager {
  private processCount = 0;

  startProcess(...args): ManagedProcess {
    if (this.processCount >= MAX_CONCURRENT_PROCESSES) {
      throw new ResourceError('Maximum concurrent processes reached');
    }

    this.processCount++;
    // ... start process with timeout
  }
}
```

### 5. API Token Security

**Token Handling:**
- Never include tokens in tool output
- Use secure token storage (OS keychain when possible)
- Rotate tokens regularly
- Implement token validation

### 6. Network Security

**External Connections:**
- Validate Expo/EAS API endpoints
- Use HTTPS for all external requests
- Implement request timeout limits
- Validate SSL certificates

---

## 📅 Implementation Timeline

### Total Duration: 2 weeks (Weeks 9-10 of overall project)

---

### Week 9: Development Server & Build Tools

#### Day 1-2: Core Infrastructure
- [ ] Create Expo tools directory structure
- [ ] Implement `ExpoExecutor` service
- [ ] Implement `EASExecutor` service
- [ ] Implement `ProcessManager` service
- [ ] Add QR code generation library (`qrcode` package)
- [ ] Write unit tests for core services (80%+ coverage)

#### Day 3-4: Development Server Tools
- [ ] Implement `expo_start` with:
  - Platform selection (iOS, Android, web, all)
  - Connection types (localhost, LAN, tunnel)
  - Background process management
  - Log capture
  - QR code generation
- [ ] Implement `expo_get_qr`:
  - Multi-format QR codes (terminal, SVG, PNG, base64)
  - URL extraction from logs
  - Platform-specific instructions
- [ ] Implement `expo_logs`:
  - Log streaming and filtering
  - Search functionality
  - Category-based filtering
- [ ] Implement `expo_controls`:
  - Reload functionality
  - Cache clearing
  - Inspector/performance monitor toggles
  - Server stop
- [ ] Write integration tests for dev tools

#### Day 5: Build Management Tools (Part 1)
- [ ] Implement `eas_build`:
  - Platform and profile selection
  - Build triggering with options
  - JSON output parsing
  - Build URL generation
- [ ] Implement `eas_build_status`:
  - Build status checking
  - Log retrieval
  - Artifact download (placeholder)
- [ ] Write tests for build tools

---

### Week 10: Project Management, Updates & Integration

#### Day 1-2: Build Management & Project Tools
- [ ] Complete `eas_submit`:
  - iOS App Store submission
  - Android Play Store submission
  - Platform-specific options
- [ ] Implement `expo_doctor`:
  - Project validation checks
  - Auto-fix capabilities
  - Comprehensive reporting
- [ ] Implement `expo_install`:
  - Package compatibility checking
  - Version resolution
  - Auto-fix dependencies
- [ ] Implement `expo_upgrade`:
  - SDK version upgrade
  - Dependency migration
  - Breaking change detection
- [ ] Write tests for project management tools

#### Day 3: Update & Publishing Tools
- [ ] Implement `eas_update`:
  - OTA update publishing
  - Branch/channel management
  - Rollout percentage support
  - Draft mode
- [ ] Implement `eas_update_status`:
  - Update status checking
  - Metrics retrieval
  - Adoption tracking
- [ ] Write tests for update tools

#### Day 4: Integration & Workflows
- [ ] Create integration workflows:
  - Development setup workflow
  - Build & deploy workflow
  - Visual regression workflow
  - CI/CD pipeline workflow
- [ ] Write integration tests for workflows
- [ ] Test Expo + ADB tool combinations
- [ ] Performance testing and optimization

#### Day 5: Documentation & Polish
- [ ] Update `README.md` with Expo tools documentation
- [ ] Create example usage docs
- [ ] Add tool descriptions to MCP server
- [ ] Update `IMPROVEMENTS_PLAN.md` with final stats
- [ ] Create `EXPO_INTEGRATION_GUIDE.md`
- [ ] Final code review and cleanup
- [ ] Prepare for release

---

## 📊 Success Metrics

### 1. Code Quality Metrics

- **Test Coverage:** ≥85% for all Expo tools
- **Code Maintainability:** All modules <500 lines
- **Type Safety:** 100% TypeScript with strict mode
- **Documentation:** JSDoc comments for all public APIs

### 2. Performance Metrics

- **Command Execution:** <5 seconds for non-build commands
- **Build Trigger:** <30 seconds to trigger EAS build
- **Log Streaming:** <100ms latency for log capture
- **QR Generation:** <1 second for QR code generation

### 3. Reliability Metrics

- **Error Handling:** All errors properly caught and reported
- **Process Management:** Zero orphaned processes
- **Timeout Handling:** All commands have configurable timeouts
- **Graceful Degradation:** Clear error messages when Expo/EAS not configured

### 4. User Experience Metrics

- **Tool Discovery:** All tools registered in MCP server
- **Input Validation:** Zod schemas for all inputs
- **Output Consistency:** Standardized output format
- **Error Messages:** Actionable error messages with fix suggestions

### 5. Integration Metrics

- **Workflow Compatibility:** All workflows tested with ADB tools
- **CI/CD Ready:** Non-interactive mode for all tools
- **Cross-platform:** Works on macOS, Linux, Windows

---

## 📦 Dependencies

### Required Dependencies

```json
{
  "dependencies": {
    "qrcode": "^1.5.3",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0"
  }
}
```

### Peer Dependencies (User Environment)

- **Expo CLI:** `expo@^49.0.0` or later
- **EAS CLI:** `eas-cli@latest`
- **Node.js:** v18.0.0 or later
- **npm/yarn/pnpm:** Latest stable versions

### Optional Dependencies

- **Android SDK:** For `adb` integration workflows
- **Xcode:** For iOS development (macOS only)
- **Git:** For version control integration

---

## 🧪 Testing Strategy

### Unit Tests

**Coverage Target:** 85%+

```typescript
// Example test for expo_start
describe('expoStart', () => {
  it('should start Expo development server with default options', async () => {
    const result = await expoStart({
      platform: 'all',
      background: true
    });

    expect(result.success).toBe(true);
    expect(result.process_id).toBeDefined();
    expect(result.server_url).toMatch(/^exp:\/\//);
  });

  it('should handle server start timeout', async () => {
    const result = await expoStart({
      platform: 'all',
      background: true
    });

    // Mock timeout scenario
    expect(result.success).toBe(false);
    expect(result.error).toContain('timeout');
  });
});
```

### Integration Tests

```typescript
// Example integration test
describe('Expo + ADB Integration', () => {
  it('should start Expo server and connect ADB device', async () => {
    // Start Expo server
    const server = await expoStart({
      platform: 'android',
      background: true
    });

    // Connect ADB device
    const device = await adbConnectDevice({
      connection_type: 'emulator'
    });

    // Verify both are running
    expect(server.success).toBe(true);
    expect(device.success).toBe(true);

    // Cleanup
    await expoControls({
      process_id: server.process_id,
      action: 'stop'
    });
  });
});
```

### End-to-End Tests

```typescript
// Example E2E test
describe('Complete Development Workflow', () => {
  it('should execute full development setup', async () => {
    // 1. Validate project
    const doctor = await expoDoctor({ fix_issues: true });
    expect(doctor.checks_failed).toBe(0);

    // 2. Start server
    const server = await expoStart({ platform: 'all' });
    expect(server.success).toBe(true);

    // 3. Get QR code
    const qr = await expoGetQR({ process_id: server.process_id });
    expect(qr.success).toBe(true);
    expect(qr.qr_code).toBeDefined();

    // 4. Monitor logs
    const logs = await expoLogs({ process_id: server.process_id, tail: 10 });
    expect(logs.logs.length).toBeGreaterThan(0);

    // Cleanup
    await expoControls({ process_id: server.process_id, action: 'stop' });
  });
});
```

### Performance Tests

```typescript
// Example performance test
describe('Performance', () => {
  it('should start Expo server within 10 seconds', async () => {
    const start = Date.now();
    const result = await expoStart({ platform: 'all' });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
    expect(result.success).toBe(true);
  });

  it('should generate QR code within 1 second', async () => {
    const start = Date.now();
    const qr = await QRGenerator.generate('exp://test-url:8081');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
    expect(qr).toBeDefined();
  });
});
```

---

## 📝 Additional Notes

### Expo vs EAS Commands

**Expo CLI (`expo`):**
- Local development server
- Project management
- Local builds (deprecated, use EAS)

**EAS CLI (`eas`):**
- Cloud builds
- App store submissions
- OTA updates
- Project configuration

### Metro Bundler Integration

**Metro** is React Native's JavaScript bundler (similar to Webpack). Expo uses Metro under the hood:

- Handles code bundling and transformation
- Provides hot module replacement (HMR)
- Caches transformed modules
- Our tools interact with Metro through Expo CLI

### QR Code Format Considerations

**Terminal Format:**
- Best for CLI display in MCP responses
- Works in all terminal emulators
- Readable in Claude Desktop interface

**Image Formats (SVG/PNG/Base64):**
- Better for documentation
- Can be saved to files
- Shareable via links

### Rollout Percentage Strategy

**Gradual Rollout Best Practices:**

1. **Start Small:** 10% rollout for first hour
2. **Monitor Metrics:** Check error rate and adoption
3. **Increase Gradually:** 25% → 50% → 75% → 100%
4. **Rollback Plan:** Keep previous update ready
5. **Communication:** Notify users of updates

### CI/CD Integration Tips

**GitHub Actions Example:**

```yaml
name: Expo Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install MCP Server
        run: npm install -g @mrnitro360/react-native-mcp-guide

      - name: Trigger EAS Build
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
        run: |
          # Use MCP server tools via CLI
          node -e "
            const { easBuild } = require('@mrnitro360/react-native-mcp-guide');
            easBuild({
              platform: 'all',
              profile: 'production',
              message: 'CI Build - ${{ github.sha }}'
            });
          "
```

---

## 🔍 Troubleshooting Guide

### Common Issues and Solutions

This section provides solutions to common problems encountered when using Expo MCP tools, based on real-world usage feedback.

#### Port 8081 Already in Use

**Symptoms:**
- `expo_dev_start` times out after 60 seconds
- Error: "EADDRINUSE: address already in use"
- Dev server fails to start

**Diagnosis:**
```bash
# Check what's using port 8081
lsof -ti:8081

# Or use MCP tool (when available)
expo_sessions_list(show_ports: true)
```

**Solutions:**

1. **Kill the process using the port:**
```bash
# Manual method
lsof -ti:8081 | xargs kill -9

# MCP tool method (recommended, when available)
expo_kill_process(port: 8081)
```

2. **Use a different port:**
```typescript
expo_dev_start(platform: "android", port: 19000)
```

3. **Clean up all Expo processes:**
```typescript
expo_cleanup()  // When available
```

**Prevention:**
- Always stop dev servers when done: `expo_dev_stop(session_id: "...")`
- Run cleanup before starting new sessions: `expo_cleanup()`

---

#### Java Version Incompatible

**Symptoms:**
- Build fails with "Unsupported class file major version 68"
- Gradle error about unsupported Java version
- Build fails after 10+ minutes

**Diagnosis:**
```bash
# Check current Java version
java -version

# Should show 17.x.x or higher (but not 24+)
```

**Root Cause:**
- Java 24 is not compatible with Gradle 8.13
- Android Gradle Plugin 8.0+ requires Java 17 minimum
- Gradle 8.13 supports Java 17-23 (not 24+)

**Solutions:**

1. **Use jenv to switch Java version (recommended):**
```bash
# Check available Java versions
jenv versions

# Switch to Java 17
jenv shell 17

# Verify
java -version  # Should show 17.x.x
```

2. **Install Java 17 if not present:**
```bash
# macOS
brew install openjdk@17

# Linux (Ubuntu/Debian)
sudo apt install openjdk-17-jdk

# Add to jenv
jenv add /path/to/java-17
```

3. **Set JAVA_HOME explicitly:**
```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
```

**Prevention:**
- Use jenv to manage Java versions
- Always validate environment before builds: `expo_validate_environment(platform: "android")`  (when available)
- Stick to Java 17 or 21 (LTS versions)

**Related Links:**
- [jenv documentation](https://github.com/jenv/jenv)
- [Android Gradle Plugin compatibility](https://developer.android.com/build/releases/gradle-plugin#updating-gradle)

---

#### Missing Polyfills (Hermes)

**Symptoms:**
- Error: "ReferenceError: Property 'Buffer' doesn't exist"
- Error: "ReferenceError: Property 'EventTarget' doesn't exist"
- App crashes on startup with polyfill errors

**Root Cause:**
- Hermes JavaScript engine (default in React Native) doesn't include all web APIs
- Common missing: Buffer, EventTarget, atob, btoa, URL, URLSearchParams

**Diagnosis:**
```typescript
// Check which polyfills are missing (when available)
expo_detect_polyfills()
```

**Solutions:**

1. **Auto-setup polyfills (recommended, when available):**
```typescript
expo_setup_polyfills(polyfills: "auto", install_packages: true)
```

2. **Manual Buffer polyfill (minimal):**
```typescript
// Add to app/_layout.tsx (before other imports)
if (typeof global.Buffer === 'undefined') {
  global.Buffer = {
    from: (data: any, encoding?: string) => {
      if (encoding === 'base64') {
        return btoa(String(data));
      }
      return String(data);
    },
    isBuffer: () => false,
  } as any;
}
```

3. **Manual EventTarget polyfill:**
```typescript
// Add to app/_layout.tsx (before other imports)
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
```

4. **Use full polyfill packages:**
```bash
# For Buffer
yarn add @craftzdog/react-native-buffer

# Then in app/_layout.tsx:
import { Buffer } from '@craftzdog/react-native-buffer';
global.Buffer = Buffer;
```

**Prevention:**
- Run polyfill detection before deploying: `expo_detect_polyfills()`
- Test on physical devices (Hermes behavior differs from web)
- Use minimal polyfills for better performance

**Related Links:**
- [React Native JavaScript Environment](https://reactnative.dev/docs/javascript-environment#polyfills)
- [Hermes documentation](https://hermesengine.dev/)

---

#### Dependency Version Conflicts

**Symptoms:**
- `expo-doctor` reports "X packages out of date"
- Duplicate dependencies warnings
- Peer dependency warnings
- App crashes with "Invariant Violation" errors

**Diagnosis:**
```bash
# Check for issues
npx expo-doctor

# Or use MCP tool (when available)
expo_doctor()
```

**Common Issues:**
1. **Major version mismatches:** Packages don't match Expo SDK version
2. **Duplicate dependencies:** Same package with multiple versions
3. **Missing peer dependencies:** Required packages not installed

**Solutions:**

1. **Auto-fix all issues (recommended, when available):**
```typescript
expo_install_check(auto_fix: true)
```

2. **Manual fix:**
```bash
# Check compatibility
npx expo install --check

# Auto-fix
npx expo install --check --fix

# Or install specific packages
npx expo install expo-av expo-constants react-native
```

3. **Fix specific package:**
```bash
# Example: Fix react-native-worklets version mismatch
yarn add react-native-worklets@0.5.1
```

**Real Example from User Transcript:**
```bash
# User had to run these commands manually:
npx expo-doctor                    # Found 27 packages out of date
npx expo install --check           # Prompted to fix
# Installed 27 packages
yarn add @expo/metro-runtime       # Missing peer dependency
yarn add react-native-worklets@0.5.1  # Version downgrade needed
npx expo-doctor                    # Verify fixed: 17/17 checks passed
```

**Prevention:**
- Run `expo_doctor()` before major builds
- Keep Expo SDK up to date
- Use `expo install` instead of `yarn add` or `npm install` for Expo packages
- Add to CI/CD pipeline: `expo_install_check(auto_fix: true)`

---

#### Tool Not Available / MCP Connection Failures

**Symptoms:**
- Error: "No such tool available: mcp__mcp-react-native-expo__*"
- "Failed to reconnect to mcp-react-native-expo"
- Tools work intermittently

**Diagnosis:**
```bash
# Check MCP configuration
cat .mcp.json

# Check if MCP server is running
ps aux | grep mcp
```

**Solutions:**

1. **Verify MCP configuration:**
```json
// .mcp.json should contain:
{
  "mcpServers": {
    "mcp-react-native-expo": {
      "command": "node",
      "args": ["path/to/mcp-react-native-expo/build/index.js"]
    }
  }
}
```

2. **Restart MCP server:**
```bash
# In Claude Desktop, use /mcp command
# Or restart Claude Desktop application
```

3. **Check tool availability:**
```typescript
// When available
expo_server_status()
expo_help()  // List all available tools
```

4. **Verify installation:**
```bash
# Check if MCP server is installed
npm list -g | grep mcp-react-native-expo

# Or check local installation
npm list | grep mcp-react-native-expo
```

**Prevention:**
- Use latest version of MCP server
- Check GitHub issues for known problems
- Ensure Node.js version compatibility (>=18.0.0)

---

#### Build Timeout / Long Build Times

**Symptoms:**
- `expo_build_local_start` times out
- Builds take 10+ minutes
- Gradle configuration takes forever

**Common Causes:**
1. First build (downloading dependencies)
2. Gradle daemon starting
3. Large dependency tree
4. Slow internet connection
5. Insufficient system resources

**Solutions:**

1. **Increase timeout:**
```typescript
expo_build_local_start(
  platform: "android",
  timeout_ms: 1800000  // 30 minutes for first build
)
```

2. **Monitor build progress:**
```typescript
// Check build logs
expo_build_local_read(
  session_id: "expo-build-xxx",
  mode: "progress"  // When available
)

// Or use summary
expo_build_summary(session_id: "expo-build-xxx")  // When available
```

3. **Optimize Gradle:**
```bash
# Add to android/gradle.properties
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

4. **Clear Gradle cache:**
```bash
cd android && ./gradlew clean
rm -rf ~/.gradle/caches/
```

**Expected Build Times:**
- **First build:** 10-20 minutes (downloading dependencies)
- **Incremental build:** 1-3 minutes
- **No-change build:** 20-30 seconds

---

#### QR Code Not Scanning / Dev Server Connection Issues

**Symptoms:**
- QR code displayed but won't scan
- "Unable to connect to dev server"
- App stuck on loading screen

**Solutions:**

1. **Check network connectivity:**
```bash
# Ensure phone and computer on same network
# Check firewall settings allow port 8081 and 19000
```

2. **Use direct URL instead of QR:**
```typescript
// Get dev server URL from logs
expo_dev_read(session_id: "expo-dev-xxx", tail: 20)

// Look for: exp://192.168.x.x:8081
// Manually enter in Expo Go app
```

3. **Check dev server is running:**
```typescript
expo_sessions_list(type_filter: "dev_server")
```

4. **Restart dev server:**
```typescript
expo_dev_stop(session_id: "expo-dev-xxx")
expo_dev_start(platform: "android", clear_cache: true)
```

5. **Use tunnel mode (if on different network):**
```bash
# Requires ngrok or similar
npx expo start --tunnel
```

**Prevention:**
- Use same WiFi network for computer and phone
- Configure firewall to allow Metro bundler ports
- Use Expo Dev Client instead of Expo Go for production apps

---

### Error Code Reference

#### PORT_IN_USE
**Code:** `PORT_IN_USE`
**Severity:** High
**Fix:** `expo_kill_process(port: 8081)` or use different port

#### JAVA_VERSION_MISMATCH
**Code:** `JAVA_VERSION_MISMATCH`
**Severity:** Critical
**Fix:** `jenv shell 17` or install Java 17

#### MISSING_POLYFILL
**Code:** `MISSING_POLYFILL`
**Severity:** Critical
**Fix:** `expo_setup_polyfills(polyfills: "auto")`

#### DEPENDENCY_CONFLICT
**Code:** `DEPENDENCY_CONFLICT`
**Severity:** High
**Fix:** `expo_install_check(auto_fix: true)`

#### BUILD_TIMEOUT
**Code:** `BUILD_TIMEOUT`
**Severity:** Medium
**Fix:** Increase timeout or optimize Gradle

#### ANDROID_HOME_NOT_SET
**Code:** `ANDROID_HOME_NOT_SET`
**Severity:** Critical
**Fix:** Set `ANDROID_HOME` environment variable

---

### Getting Help

If issues persist:

1. **Check documentation:**
   - [Expo documentation](https://docs.expo.dev/)
   - [React Native MCP repository](https://github.com/Divagnz/React-Native-MCP)

2. **Enable verbose logging:**
```typescript
expo_build_local_read(session_id: "xxx", verbose: true)
```

3. **Report issues:**
   - [GitHub Issues](https://github.com/Divagnz/React-Native-MCP/issues)
   - Include: OS, Node version, Expo SDK version, full error logs

4. **Use diagnostic tools:**
```typescript
expo_doctor()           // When available
expo_validate_environment(platform: "android")  // When available
expo_detect_polyfills() // When available
```

---

## 🎯 Summary

This specification defines **12 comprehensive Expo CLI integration tools** that enable complete React Native development workflows through the MCP interface. Combined with the 18 ADB tools, this brings the total tool count to **30 tools**.

**Key Features:**
- ✅ Complete development server lifecycle management
- ✅ Cloud build triggering and monitoring via EAS
- ✅ Over-the-air update publishing with rollout control
- ✅ Project validation and dependency management
- ✅ QR code generation for mobile testing
- ✅ Real-time log streaming and filtering
- ✅ Seamless integration with ADB tools
- ✅ CI/CD pipeline ready
- ✅ Security-first design
- ✅ Comprehensive error handling

**Timeline:** 2 weeks (Weeks 9-10)

**Next Steps:**
1. Review and approve this specification
2. Begin implementation in Week 9
3. Integration testing with ADB tools
4. Documentation and release preparation

---

**Version History:**
- v1.0 (2025-11-02): Initial specification created
