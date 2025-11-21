# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.2] - 2025-01-16

### Added
- **ADB Tools Integration** - 18 comprehensive Android debugging tools
  - Device Management (3 tools): `adb_list_devices`, `adb_device_info`, `adb_connect_device`
  - App Management (4 tools): `adb_install_apk`, `adb_uninstall_app`, `adb_clear_app_data`, `adb_launch_app`
  - Enhanced Screenshots (6 tools): `adb_screenshot`, `adb_screenshot_compare`, `adb_screenshot_batch`, `adb_screenshot_annotate`, `adb_screenshot_cleanup`, `adb_visual_regression_test`
  - Debugging (3 tools): `adb_logcat`, `adb_logcat_react_native`, `adb_screen_record`
  - Network (2 tools): `adb_reverse_port`, `adb_forward_port`

### Enhanced
- Visual regression testing workflow with baseline management
- Screenshot metadata capture with device, app, and performance context
- Automatic screenshot organization by date/app/device
- Pixel-level screenshot comparison with diff generation
- Screenshot annotation for bug reports and documentation
- CI/CD integration for visual regression testing

### Fixed
- GitHub Actions npm-publish workflow: removed unused version input logic
- npm-publish verification step: improved NPM propagation checking with retry logic

## [0.0.1] - 2025-01-15

### Changed
- Reset version to 0.0.1 as initial stable release
- Updated roadmap to accurately reflect v0.0.1 features
- Moved Expo CLI integration to upcoming features (planned for v0.1.0)
- Fixed repository URL for npm provenance compliance

### Documentation
- Added comprehensive "What's New in This Fork" section to README
- Detailed comparison with original @mrnitro360/react-native-mcp-guide fork
- Enhanced roadmap with clear version milestones
- Impact metrics and feature comparison tables
- Seven major enhancement categories documented

### Repository
- Corrected repository URL from React-Native-MCP to mcp-react-native-expo
- Fixed npm provenance bundle validation issues

## [1.1.0] - 2024-11-02

### Added
- Expert-level code remediation tool (`remediate_code`)
  - Automatic security vulnerability fixes
  - Performance optimization automation
  - Memory leak detection and fixing
  - TypeScript interface generation
  - StyleSheet extraction
  - WCAG compliance fixes
- Advanced component refactoring tool (`refactor_component`)
  - Class to hooks conversion
  - Component modernization
  - Code structure improvements
- Error handling infrastructure:
  - Custom error types (MCPError, ValidationError, CodeAnalysisError, etc.)
  - Error handling wrappers
  - Structured error reporting
- Logging infrastructure:
  - Winston-based logging
  - Performance metrics tracking
  - Tool invocation logging
  - Error logging to file
- Input validation utilities:
  - File path validation
  - Code input validation
  - Project structure validation
  - React Native version validation

### Changed
- Enhanced component detection accuracy
- Improved analysis algorithms
- Better error messages and debugging info
- Modularized codebase structure

### Security
- Added security-focused error handling
- Improved input sanitization
- Enhanced validation for file operations

## [1.0.5] - 2024-XX-XX

### Added
- Comprehensive codebase analysis (`analyze_codebase_comprehensive`)
- Testing suite generation (`generate_component_test`)
- Dependency management tools:
  - `upgrade_packages` - Package upgrade recommendations
  - `resolve_dependencies` - Dependency conflict resolution
  - `audit_packages` - Security vulnerability auditing
  - `migrate_packages` - Deprecated package migration
- Performance optimization guidance (`optimize_performance`)

### Changed
- Simplified pipeline authentication
- Added retry logic for network operations

### Fixed
- Package resolution edge cases
- Test generation template issues

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of React Native MCP Server
- Core analysis tools:
  - `analyze_component` - Component best practices analysis
  - `analyze_codebase_performance` - Performance-focused analysis
- Development guidance tools:
  - `architecture_advice` - Architecture recommendations
  - `debug_issue` - Debugging assistance
- Utility tools:
  - `check_for_updates` - Update checking
  - `get_version_info` - Version information
- 6 curated prompts:
  - `react-native-code-review` - Detailed code review
  - `react-native-architecture` - Architecture design
  - `react-native-performance` - Performance optimization
  - `react-native-debug` - Debugging assistance
  - `react-native-migration` - Version migration
  - `react-native-testing` - Testing strategy
- 5 resource libraries:
  - `react-native-docs` - Official documentation
  - `best-practices-guide` - Comprehensive best practices
  - `performance-guide` - Performance optimization
  - `common-patterns` - Common development patterns
  - `platform-guide` - iOS and Android specific guides
- Model Context Protocol (MCP) integration
- TypeScript support
- Automated CI/CD pipeline with npm publishing

### Technical
- Built with TypeScript 5.x
- MCP SDK v1.1.0
- Comprehensive error handling
- Extensible tool architecture

---

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **Major version** (X.0.0): Breaking changes
- **Minor version** (0.X.0): New features, backward compatible
- **Patch version** (0.0.X): Bug fixes, backward compatible

### Release Checklist

Before releasing a new version:

1. **Code Quality**
   - [ ] All tests pass
   - [ ] Linting passes
   - [ ] TypeScript compilation succeeds
   - [ ] Code coverage ≥80%

2. **Documentation**
   - [ ] CHANGELOG.md updated
   - [ ] README.md updated (if applicable)
   - [ ] API documentation updated
   - [ ] Examples updated

3. **Testing**
   - [ ] Manual testing completed
   - [ ] Integration tests pass
   - [ ] Tested with Claude Desktop
   - [ ] Tested with Claude CLI

4. **Versioning**
   - [ ] Version number updated in package.json
   - [ ] Git tag created
   - [ ] Release notes prepared

5. **Deployment**
   - [ ] CI/CD pipeline passes
   - [ ] npm package published
   - [ ] GitHub release created

### Breaking Changes Policy

Breaking changes are introduced with major version bumps (e.g., 1.x.x → 2.0.0):

1. **Announcement**: Breaking changes announced 1 minor version in advance
2. **Deprecation**: Old API deprecated with warnings
3. **Migration Guide**: Comprehensive migration guide provided
4. **Timeline**: Minimum 2 weeks notice before removal

### Support Policy

- **Latest Major Version**: Full support and updates
- **Previous Major Version**: Critical security fixes only for 6 months
- **Older Versions**: No support (upgrade recommended)

---

## Future Roadmap

### Phase 4: Documentation & Developer Experience (Weeks 7-8)
- ✅ Comprehensive examples directory
- ✅ Enhanced issue and PR templates
- ✅ CHANGELOG.md
- 🔄 Enhanced SECURITY.md
- 🔄 Improved CONTRIBUTING.md
- 🔄 Architecture documentation

### Phase 5: Performance & Polish (Weeks 9-10)
- 📅 Caching layer implementation
- 📅 Performance optimizations
- 📅 Additional README badges
- 📅 Optional telemetry

### Phase 6: ADB Tools Integration (Weeks 11-13) - v1.2.0
- 📅 18 new Android Debug Bridge tools
- 📅 Device management
- 📅 App lifecycle management
- 📅 Performance monitoring
- 📅 Visual regression testing

### Phase 7: Expo CLI Integration (Weeks 14-15) - v1.3.0
- 📅 12 new Expo development tools
- 📅 Development server management
- 📅 EAS build integration
- 📅 Over-the-air updates

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## Support

- **Documentation**: [README.md](./README.md)
- **Issues**: [GitHub Issues](https://github.com/MrNitro360/React-Native-MCP/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MrNitro360/React-Native-MCP/discussions)

---

**Legend**:
- ✅ Completed
- 🔄 In Progress
- 📅 Planned
- ❌ Deprecated

**Last Updated**: 2025-11-03
