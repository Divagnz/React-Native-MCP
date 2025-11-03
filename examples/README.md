# React Native MCP Server - Examples

This directory contains comprehensive examples demonstrating how to use the React Native MCP Server's tools and features.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Code Remediation](#code-remediation)
3. [Testing](#testing)
4. [Package Management](#package-management)
5. [Integration](#integration)

## Quick Start

The React Native MCP Server provides 17 powerful tools for React Native development. These examples show you how to use them effectively.

### Prerequisites

- MCP-compatible client (Claude Desktop, Claude CLI, etc.)
- React Native project
- Node.js v18.0.0 or later

### Installation

```bash
npm install -g @mrnitro360/react-native-mcp-guide
```

### Configuration

Add to your Claude configuration file:

**Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS)**:
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

## Basic Usage

Start here if you're new to the React Native MCP Server.

- [Getting Started](./basic-usage/getting-started.md) - First steps and common workflows
- [Common Workflows](./basic-usage/common-workflows.md) - Typical development scenarios

## Code Remediation

Learn how to automatically fix code issues and improve code quality.

### Security Fixes

- [Hardcoded Secrets](./code-remediation/security-fixes/) - Remove hardcoded API keys and secrets
- [Insecure Storage](./code-remediation/security-fixes/) - Fix insecure data storage patterns
- [Unsafe Navigation](./code-remediation/security-fixes/) - Secure navigation patterns

### Performance Fixes

- [Memory Leaks](./code-remediation/performance-fixes/) - Fix common memory leak patterns
- [List Performance](./code-remediation/performance-fixes/) - Optimize FlatList and ScrollView
- [Bundle Size](./code-remediation/performance-fixes/) - Reduce app bundle size

### Refactoring

- [Legacy Components](./code-remediation/refactoring/) - Modernize class components to hooks
- [Code Organization](./code-remediation/refactoring/) - Improve file structure
- [Type Safety](./code-remediation/refactoring/) - Add TypeScript types

## Testing

Examples of generating and improving tests.

- [Test Generation](./testing/test-generation-example.md) - Generate comprehensive test suites
- [Sample Component](./testing/sample-component.tsx) - Example component for testing
- [Generated Test](./testing/generated-test.test.tsx) - Example generated test

## Package Management

Learn how to manage dependencies and keep packages up-to-date.

- [Upgrade Workflow](./package-management/upgrade-workflow.md) - Safe package upgrades
- [Dependency Resolution](./package-management/dependency-resolution.md) - Fix dependency conflicts
- [Security Audit](./package-management/security-audit.md) - Audit and fix vulnerabilities

## Integration

Examples of integrating with various tools and platforms.

- [Claude Desktop Config](./integration/claude-desktop-config.json) - Configuration examples
- [Claude CLI Setup](./integration/claude-cli-setup.md) - Command-line integration
- [VS Code Setup](./integration/vscode-setup.md) - Editor integration

## Tool Categories

### Analysis Tools

| Tool | Use Case | Example |
|------|----------|---------|
| `analyze_component` | Analyze component for best practices | [View Example](./basic-usage/getting-started.md#analyze-component) |
| `analyze_codebase_comprehensive` | Full codebase analysis | [View Example](./basic-usage/common-workflows.md#codebase-analysis) |
| `analyze_codebase_performance` | Performance-focused analysis | [View Example](./code-remediation/performance-fixes/) |

### Remediation Tools

| Tool | Use Case | Example |
|------|----------|---------|
| `remediate_code` | Automatic code fixing | [View Example](./code-remediation/security-fixes/) |
| `refactor_component` | Component refactoring | [View Example](./code-remediation/refactoring/) |

### Testing Tools

| Tool | Use Case | Example |
|------|----------|---------|
| `generate_component_test` | Generate test suites | [View Example](./testing/test-generation-example.md) |
| `analyze_testing_strategy` | Testing strategy analysis | [View Example](./testing/) |
| `analyze_test_coverage` | Coverage gap analysis | [View Example](./testing/) |

### Package Management Tools

| Tool | Use Case | Example |
|------|----------|---------|
| `upgrade_packages` | Package upgrades | [View Example](./package-management/upgrade-workflow.md) |
| `resolve_dependencies` | Fix conflicts | [View Example](./package-management/dependency-resolution.md) |
| `audit_packages` | Security audit | [View Example](./package-management/security-audit.md) |
| `migrate_packages` | Package migration | [View Example](./package-management/) |

### Guidance Tools

| Tool | Use Case | Example |
|------|----------|---------|
| `optimize_performance` | Performance optimization | [View Example](./basic-usage/common-workflows.md#performance) |
| `architecture_advice` | Architecture guidance | [View Example](./basic-usage/common-workflows.md#architecture) |
| `debug_issue` | Debugging assistance | [View Example](./basic-usage/common-workflows.md#debugging) |

## Real-World Scenarios

### Scenario 1: Onboarding New Developers

**Problem**: New team member needs to understand the codebase architecture and conventions.

**Solution**:
```
1. Use `analyze_codebase_comprehensive` to get project overview
2. Review architecture recommendations with `architecture_advice`
3. Check testing strategy with `analyze_testing_strategy`
```

### Scenario 2: Pre-Release Security Audit

**Problem**: Need to ensure no security vulnerabilities before release.

**Solution**:
```
1. Run `audit_packages` to check for vulnerable dependencies
2. Use `analyze_codebase_comprehensive` with security focus
3. Fix issues with `remediate_code` tool
```

### Scenario 3: Performance Optimization Sprint

**Problem**: App is slow, need to identify and fix performance issues.

**Solution**:
```
1. Run `analyze_codebase_performance` to identify bottlenecks
2. Use `optimize_performance` for specific recommendations
3. Apply fixes with `refactor_component` tool
4. Generate performance tests with `generate_component_test`
```

### Scenario 4: Upgrading React Native Version

**Problem**: Need to upgrade from React Native 0.71 to 0.73.

**Solution**:
```
1. Use `upgrade_packages` to check compatibility
2. Apply `migrate_packages` for deprecated packages
3. Fix breaking changes with `remediate_code`
4. Update tests with `generate_component_test`
```

## Tips and Best Practices

### 1. Start Small
Begin with analyzing a single component before running full codebase analysis.

### 2. Review AI Suggestions
Always review generated code and fixes before committing.

### 3. Use Incremental Approach
Make changes incrementally and test after each change.

### 4. Leverage Multiple Tools
Combine tools for better results (e.g., analyze → remediate → test).

### 5. Keep Documentation Updated
Document any customizations or project-specific patterns.

## Common Issues and Solutions

### Issue: Tool Not Found

**Problem**: MCP client reports tool not found.

**Solution**:
1. Verify installation: `npm list -g @mrnitro360/react-native-mcp-guide`
2. Check MCP client configuration
3. Restart MCP client

### Issue: Analysis Takes Too Long

**Problem**: Full codebase analysis is slow on large projects.

**Solution**:
1. Use targeted analysis on specific directories
2. Exclude `node_modules` and build folders
3. Focus on changed files only

### Issue: Generated Code Needs Adjustments

**Problem**: AI-generated code doesn't match project style.

**Solution**:
1. Provide more context in tool parameters
2. Use project-specific examples
3. Refine with follow-up requests

## Contributing Examples

We welcome contributions of new examples! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Example Template

Each example should include:
- Clear problem statement
- Step-by-step solution
- Before/after code samples
- Expected outcomes
- Common pitfalls

## Support

- **Documentation**: [README.md](../README.md)
- **Issues**: [GitHub Issues](https://github.com/MrNitro360/React-Native-MCP/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MrNitro360/React-Native-MCP/discussions)

## License

MIT © MrNitro360

---

**Last Updated**: 2025-11-03
**Version**: 1.1.0
