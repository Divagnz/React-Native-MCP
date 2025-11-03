# Security Policy

## About This Project

The React Native MCP Server is a local development tool that provides React Native best practices and guidance through the Model Context Protocol. It runs locally and does not process or store sensitive user data.

## Supported Versions

| Version | Supported          | End of Support |
| ------- | ------------------ | -------------- |
| 1.1.x   | :white_check_mark: | TBD            |
| 1.0.x   | :white_check_mark: | 2025-06-01     |
| < 1.0   | :x:                | Ended          |

## Security Considerations

### What This Server Does

✅ **Safe Operations:**
- Runs locally on your development machine
- Provides read-only guidance and documentation
- Uses stdio transport for local communication only
- Analyzes code patterns for best practices
- Generates test suites and documentation

⚠️ **File System Access:**
- Reads project files for analysis
- Can write generated files (tests, refactored code)
- Operates within project directory only
- No external network requests
- No data transmission to remote servers

### Data Privacy

This MCP server:
- Does NOT send code to external servers
- Does NOT collect telemetry or analytics
- Does NOT store analyzed code
- Processes everything locally
- Logs are stored locally only

### Dependencies

We actively monitor our dependencies for security vulnerabilities:

[![Known Vulnerabilities](https://snyk.io/test/github/MrNitro360/React-Native-MCP/badge.svg)](https://snyk.io/test/github/MrNitro360/React-Native-MCP)

Dependencies are automatically checked on:
- Every pull request
- Weekly security scans
- Before each release

## Reporting Security Issues

### Where to Report

**Do NOT create a public GitHub issue for security vulnerabilities.**

Instead, please report security issues through:

1. **GitHub Security Advisories** (Preferred)
   - Go to the [Security tab](https://github.com/MrNitro360/React-Native-MCP/security/advisories)
   - Click "Report a vulnerability"

2. **Private Email**
   - Contact: security@[project-domain].com
   - Use subject line: "Security: React Native MCP Server"

### What to Include

Please include the following in your report:

- **Description**: Clear description of the vulnerability
- **Impact**: Your assessment of the severity and impact
- **Reproduction**: Detailed steps to reproduce the issue
- **Version**: Which version(s) are affected
- **Proof of Concept**: Code or commands demonstrating the issue (if applicable)
- **Suggested Fix**: If you have ideas for fixing it
- **Disclosure Timeline**: Your preferred disclosure timeline

### What to Expect

| Timeline | Action |
|----------|--------|
| 24 hours | Initial acknowledgment |
| 72 hours | Initial assessment and triage |
| 7 days | Detailed response with next steps |
| 30 days | Target resolution for high-severity issues |
| 90 days | Public disclosure (coordinated) |

## Security Best Practices

### For Users

To use this MCP server securely:

1. **Install from Official Sources**
   - Use npm: `npm install -g @mrnitro360/react-native-mcp-guide`
   - Verify package integrity before installation
   - Check package signatures

2. **Keep Dependencies Updated**
   ```bash
   # Check for updates
   npm outdated -g @mrnitro360/react-native-mcp-guide

   # Update to latest
   npm update -g @mrnitro360/react-native-mcp-guide
   ```

3. **Use in Isolated Environments**
   - Run in development environments only
   - Use separate environments for sensitive projects
   - Review generated code before committing
   - Never run on production servers

4. **Review Source Code**
   - Project is open source for transparency
   - Review code at: https://github.com/MrNitro360/React-Native-MCP
   - Audit before use in sensitive projects

5. **Validate Generated Code**
   - Always review AI-generated code
   - Test thoroughly before committing
   - Verify security fixes manually
   - Use in conjunction with other security tools

### For Contributors

When contributing:

1. **Never commit secrets**
   - Use environment variables
   - Add sensitive files to `.gitignore`
   - Review commits before pushing
   - Use git-secrets or similar tools

2. **Validate all inputs**
   - Sanitize user-provided code
   - Validate file paths
   - Check for malicious patterns
   - Prevent path traversal attacks

3. **Follow secure coding practices**
   - No use of `eval()` or `Function()`
   - Escape shell commands properly
   - Use parameterized queries/commands
   - Implement proper error handling

4. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update dependencies promptly
   - Review dependency changes
   - Use `npm audit fix` for vulnerabilities

5. **Code Review**
   - All code changes reviewed
   - Security implications assessed
   - Tests include security scenarios
   - Documentation updated

## Security Updates

Security patches are released as soon as possible:

- **Critical**: Within 24-48 hours
- **High**: Within 1 week
- **Medium**: Within 2 weeks
- **Low**: Next regular release

Updates are announced via:
- GitHub Security Advisories
- npm package updates
- GitHub Releases
- CHANGELOG.md

## Vulnerability Disclosure Policy

We follow a coordinated disclosure policy:

1. **Private Disclosure**: Report received privately
2. **Acknowledgment**: Reporter acknowledged within 24 hours
3. **Investigation**: Issue investigated and validated
4. **Fix Development**: Patch developed and tested
5. **Release**: Security update released
6. **Public Disclosure**: After 90 days or when fix is deployed

## Known Security Considerations

### File System Access

The server requires read access to analyze code and write access to generate files. This is:
- **Expected behavior** for code analysis
- **Sandboxed** to project directories
- **User-controlled** through MCP configuration
- **Transparent** through open source code

### Code Execution

When generating code or tests, the server:
- Does NOT execute generated code
- Does NOT modify existing code without user consent
- Only writes files when explicitly requested
- Provides preview before making changes

### AI-Generated Content

Code and suggestions are AI-generated and should be:
- Reviewed by developers
- Tested thoroughly
- Validated for security
- Treated as suggestions, not gospel

## Security Hall of Fame

We recognize security researchers who help us maintain security:

<!-- Add researchers who report valid security issues -->

*No entries yet - be the first to help secure the project!*

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [npm Security Documentation](https://docs.npmjs.com/packages-and-modules/securing-your-code)
- [Model Context Protocol Security](https://modelcontextprotocol.io/docs/security)

## Security Audits

| Date | Auditor | Scope | Status | Report |
|------|---------|-------|--------|--------|
| TBD  | TBD     | Full  | Planned | N/A    |

## Compliance

This project follows security best practices for:
- Node.js applications
- TypeScript projects
- Open source software
- Developer tools

---

**Last Updated**: 2025-11-03
**Policy Version**: 2.0
**Next Review**: 2025-12-01
