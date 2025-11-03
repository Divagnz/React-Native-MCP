# Getting Started with React Native MCP Server

This guide will help you get started with the React Native MCP Server and understand its core features.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [First Steps](#first-steps)
4. [Understanding Tools](#understanding-tools)
5. [Using Prompts](#using-prompts)
6. [Accessing Resources](#accessing-resources)

## Installation

### Prerequisites

- Node.js v18.0.0 or later
- An MCP-compatible client (Claude Desktop, Claude CLI, etc.)
- A React Native project (for testing)

### Install Globally

```bash
npm install -g @mrnitro360/react-native-mcp-guide
```

### Verify Installation

```bash
npx @mrnitro360/react-native-mcp-guide --version
```

## Configuration

### Claude Desktop

1. Open Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add the MCP server:

```json
{
  "mcpServers": {
    "react-native": {
      "command": "npx",
      "args": ["-y", "@mrnitro360/react-native-mcp-guide"]
    }
  }
}
```

3. Restart Claude Desktop

4. Verify the server appears in the MCP servers list

### Claude CLI

```bash
# Install Claude CLI if not already installed
npm install -g @anthropic-ai/claude-cli

# Configure the MCP server
claude-cli mcp add react-native \
  --command "npx" \
  --args "-y @mrnitro360/react-native-mcp-guide"
```

## First Steps

### 1. Check Server Version

First, verify the server is working:

**Prompt**:
```
Get version information for the React Native MCP server
```

**What happens**:
- The `get_version_info` tool returns server version, capabilities, and available tools

### 2. Analyze Your First Component

Let's analyze a simple React Native component:

**Create a sample component** (`UserCard.tsx`):
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const UserCard = ({ name, email }) => {
  return (
    <View style={styles.container}>
      <Text>{name}</Text>
      <Text>{email}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
});
```

**Prompt**:
```
Analyze this React Native component for best practices and potential issues:

[paste component code]
```

**What happens**:
- The `analyze_component` tool examines the code
- Returns analysis of:
  - Type safety issues (missing prop types)
  - Performance considerations
  - Accessibility concerns
  - Best practice recommendations

**Expected Output**:
```markdown
## Component Analysis: UserCard

### Issues Found

1. **Type Safety** (Critical)
   - Missing TypeScript/PropTypes definitions
   - Props are not typed

2. **Accessibility** (High)
   - Text elements lack accessibility labels
   - No semantic role definitions

3. **Performance** (Medium)
   - StyleSheet is recreated on every render (actually not, but could be optimized)

### Recommendations

1. Add TypeScript interface for props
2. Add accessibility labels
3. Consider memoization for performance
```

### 3. Fix the Issues Automatically

Now let's use the remediation tool:

**Prompt**:
```
Remediate the code issues in UserCard component with expert-level fixes
```

**What happens**:
- The `remediate_code` tool automatically fixes issues
- Returns improved code with explanations

**Expected Output**:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * User card component props
 */
export interface UserCardProps {
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
}

/**
 * Displays user information in a card format
 */
export const UserCard: React.FC<UserCardProps> = ({ name, email }) => {
  return (
    <View
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={`User card for ${name}`}
    >
      <Text
        style={styles.name}
        accessibilityLabel={`Name: ${name}`}
      >
        {name}
      </Text>
      <Text
        style={styles.email}
        accessibilityLabel={`Email: ${email}`}
      >
        {email}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginVertical: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666666',
  },
});
```

## Understanding Tools

The React Native MCP Server provides 17 tools organized into categories:

### Analysis Tools (5 tools)

#### `analyze_component`
Analyzes a React Native component for best practices, anti-patterns, and potential issues.

**Use when**:
- Reviewing code quality
- Checking for common mistakes
- Getting improvement suggestions

**Parameters**:
- `code`: Component code to analyze
- `focus_areas`: Optional array of specific areas (e.g., ["performance", "accessibility"])

**Example**:
```
Analyze this component focusing on performance and type safety
```

#### `analyze_codebase_comprehensive`
Performs comprehensive analysis of entire codebase.

**Use when**:
- Starting a new project
- Preparing for code review
- Security audit

**Parameters**:
- `codebase_path`: Path to project root

#### `analyze_codebase_performance`
Focuses specifically on performance issues.

**Use when**:
- App is slow or laggy
- Optimizing for production
- Investigating memory issues

### Remediation Tools (2 tools)

#### `remediate_code`
Automatically fixes code issues with expert-level solutions.

**Use when**:
- Fixing security vulnerabilities
- Improving code quality
- Modernizing legacy code

**Parameters**:
- `code`: Code to fix
- `issues`: Array of issues to address
- `remediation_level`: "basic" | "intermediate" | "expert"

#### `refactor_component`
Advanced component refactoring and modernization.

**Use when**:
- Converting class to hooks
- Improving component structure
- Adding TypeScript

### Testing Tools (3 tools)

#### `generate_component_test`
Generates comprehensive test suites.

**Use when**:
- Creating tests for new components
- Improving test coverage
- Setting up testing infrastructure

**Parameters**:
- `component_code`: Component to test
- `test_type`: "unit" | "integration" | "e2e"

### Package Management Tools (4 tools)

#### `upgrade_packages`
Provides safe package upgrade recommendations.

**Parameters**:
- `project_path`: Path to package.json
- `package_name`: Optional specific package

#### `audit_packages`
Security vulnerability audit.

**Parameters**:
- `project_path`: Path to project
- `fix`: Whether to auto-fix issues

#### `resolve_dependencies`
Fixes dependency conflicts.

#### `migrate_packages`
Migrates deprecated packages to alternatives.

### Guidance Tools (3 tools)

#### `optimize_performance`
Performance optimization guidance.

#### `architecture_advice`
Architecture and project structure recommendations.

#### `debug_issue`
Debugging assistance with platform-specific guidance.

## Using Prompts

The server provides 6 curated prompts for common workflows:

### 1. `react-native-code-review`

**Use for**: Comprehensive code review

**Example**:
```
Use the react-native-code-review prompt to review my HomeScreen component
```

### 2. `react-native-architecture`

**Use for**: Architecture design decisions

**Example**:
```
Help me design the architecture for a food delivery app using the react-native-architecture prompt
```

### 3. `react-native-performance`

**Use for**: Performance optimization strategies

**Example**:
```
My app's list scrolling is janky. Use the react-native-performance prompt to help optimize it
```

### 4. `react-native-debug`

**Use for**: Debugging assistance

**Example**:
```
Use react-native-debug to help me figure out why my Android app crashes on startup
```

### 5. `react-native-migration`

**Use for**: Version migration guidance

**Example**:
```
Help me migrate from React Native 0.71 to 0.73 using the react-native-migration prompt
```

### 6. `react-native-testing`

**Use for**: Testing strategy development

**Example**:
```
Use react-native-testing to help me set up a testing strategy for my project
```

## Accessing Resources

The server provides 5 resource libraries with up-to-date React Native documentation and best practices:

### 1. `react-native-docs`
Official React Native documentation references

### 2. `best-practices-guide`
Comprehensive React Native best practices

### 3. `performance-guide`
Performance optimization techniques and patterns

### 4. `common-patterns`
Common development patterns and solutions

### 5. `platform-guide`
iOS and Android specific guidance (dynamically generated based on your request)

### How to Access Resources

**Example prompts**:
```
Show me the best practices for React Native navigation

Get performance optimization tips from the performance-guide

What are common patterns for state management in React Native?
```

## Next Steps

Now that you understand the basics:

1. **Explore Common Workflows**: See [common-workflows.md](./common-workflows.md) for typical development scenarios

2. **Try Code Remediation**: Check out [code-remediation examples](../code-remediation/) to see automatic fixes in action

3. **Generate Tests**: Learn how to [generate test suites](../testing/test-generation-example.md)

4. **Manage Packages**: Explore [package management workflows](../package-management/)

## Tips for Effective Use

### 1. Be Specific
Instead of: "Check my code"
Try: "Analyze this component for memory leaks and performance issues"

### 2. Provide Context
Include relevant information about:
- React Native version
- Platform (iOS/Android/both)
- Specific issues you're experiencing

### 3. Iterate
- Start with analysis
- Apply fixes
- Generate tests
- Verify improvements

### 4. Review AI Output
Always review generated code before:
- Committing to repository
- Deploying to production
- Sharing with team

### 5. Combine Tools
Use multiple tools in sequence:
1. Analyze → Remediate → Test
2. Audit → Upgrade → Verify
3. Debug → Optimize → Verify

## Troubleshooting

### Tool Not Working

**Problem**: Tool returns an error

**Check**:
1. Server is properly configured in MCP client
2. Provide all required parameters
3. File paths are correct and accessible
4. React Native project structure is valid

### Unexpected Results

**Problem**: Tool output doesn't match expectations

**Try**:
1. Provide more context in your prompt
2. Use focus_areas parameter to narrow scope
3. Try a different remediation_level
4. Break large requests into smaller ones

### Performance Issues

**Problem**: Analysis is slow

**Solution**:
1. Analyze specific files instead of entire codebase
2. Use focused analysis (e.g., performance-only)
3. Exclude node_modules and build directories

## Getting Help

- **Documentation**: [Main README](../../README.md)
- **Examples**: Check other examples in this directory
- **Issues**: [GitHub Issues](https://github.com/MrNitro360/React-Native-MCP/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MrNitro360/React-Native-MCP/discussions)

---

**Next**: [Common Workflows](./common-workflows.md) →
