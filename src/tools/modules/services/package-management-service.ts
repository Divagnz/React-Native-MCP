/**
 * Package management service for React Native projects
 * Handles package upgrades, dependency resolution, auditing, and migrations
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { VersionUtils } from '../utils/version-utils.js';

export class PackageManagementService {
  static async upgradePackages(
    projectPath: string,
    packageManager: string,
    updateLevel: string,
    autoApply: boolean,
    checkVulnerabilities: boolean
  ): Promise<string> {
    const execAsync = promisify(exec);

    try {
      let report = '# 📦 Package Upgrade Analysis\n\n';

      // Read package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      let packageJson: any = {};

      try {
        const packageContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(packageContent);
      } catch {
        return '❌ No package.json found in the specified project path.';
      }

      report += `**Project:** ${packageJson.name || 'Unknown'}\n`;
      report += `**Current Version:** ${packageJson.version || 'Unknown'}\n`;
      report += `**Package Manager:** ${packageManager}\n`;
      report += `**Update Level:** ${updateLevel}\n\n`;

      // Check for outdated packages
      report += '## 🔍 Checking for Outdated Packages\n\n';

      const outdatedCommand =
        packageManager === 'yarn'
          ? 'yarn outdated --json'
          : packageManager === 'pnpm'
            ? 'pnpm outdated --format json'
            : 'npm outdated --json';

      try {
        const { stdout } = await execAsync(outdatedCommand, { cwd: projectPath });
        const outdatedData = JSON.parse(stdout);

        if (Object.keys(outdatedData).length === 0) {
          report += '✅ All packages are up to date!\n\n';
        } else {
          report += '| Package | Current | Wanted | Latest | Type |\n';
          report += '|---------|---------|--------|--------|---------|\n';

          const upgrades: Array<{
            package: string;
            current: string;
            wanted: string;
            latest: string;
            type: string;
          }> = [];

          for (const [pkg, info] of Object.entries(outdatedData as any)) {
            const packageInfo = info as any;
            const current = packageInfo.current;
            const wanted = packageInfo.wanted;
            const latest = packageInfo.latest;
            const type = packageInfo.type || 'production';

            report += `| ${pkg} | ${current} | ${wanted} | ${latest} | ${type} |\n`;

            // Determine if this package should be upgraded based on update level
            let shouldUpgrade = false;
            if (updateLevel === 'all') {
              shouldUpgrade = true;
            } else if (updateLevel === 'major') {
              shouldUpgrade = true;
            } else if (
              updateLevel === 'minor' &&
              VersionUtils.isMinorOrPatchUpdate(current, latest)
            ) {
              shouldUpgrade = true;
            } else if (updateLevel === 'patch' && VersionUtils.isPatchUpdate(current, latest)) {
              shouldUpgrade = true;
            }

            if (shouldUpgrade) {
              upgrades.push({ package: pkg, current, wanted, latest, type });
            }
          }

          report += '\n';

          if (upgrades.length > 0) {
            report += '## 🚀 Recommended Upgrades\n\n';

            if (autoApply) {
              report += '### Applying Automatic Upgrades\n\n';

              for (const upgrade of upgrades) {
                const upgradeCommand =
                  packageManager === 'yarn'
                    ? `yarn upgrade ${upgrade.package}@${upgrade.latest}`
                    : packageManager === 'pnpm'
                      ? `pnpm update ${upgrade.package}@${upgrade.latest}`
                      : `npm install ${upgrade.package}@${upgrade.latest}`;

                try {
                  report += `Upgrading ${upgrade.package} from ${upgrade.current} to ${upgrade.latest}...\n`;
                  await execAsync(upgradeCommand, { cwd: projectPath });
                  report += `✅ Successfully upgraded ${upgrade.package}\n\n`;
                } catch (error) {
                  report += `❌ Failed to upgrade ${upgrade.package}: ${error}\n\n`;
                }
              }
            } else {
              report += '### Manual Upgrade Commands\n\n';
              report += '```bash\n';

              for (const upgrade of upgrades) {
                const upgradeCommand =
                  packageManager === 'yarn'
                    ? `yarn upgrade ${upgrade.package}@${upgrade.latest}`
                    : packageManager === 'pnpm'
                      ? `pnpm update ${upgrade.package}@${upgrade.latest}`
                      : `npm install ${upgrade.package}@${upgrade.latest}`;

                report += `${upgradeCommand}\n`;
              }

              report += '```\n\n';
            }
          }
        }
      } catch (error) {
        report += `⚠️ Could not check for outdated packages: ${error}\n\n`;
      }

      // Security vulnerabilities check
      if (checkVulnerabilities) {
        report += '## 🛡️ Security Vulnerability Check\n\n';

        const auditCommand =
          packageManager === 'yarn'
            ? 'yarn audit --json'
            : packageManager === 'pnpm'
              ? 'pnpm audit --json'
              : 'npm audit --json';

        try {
          const { stdout } = await execAsync(auditCommand, { cwd: projectPath });
          const auditData = JSON.parse(stdout);

          if (auditData.vulnerabilities && Object.keys(auditData.vulnerabilities).length > 0) {
            report += `Found ${Object.keys(auditData.vulnerabilities).length} vulnerabilities.\n\n`;

            const fixCommand =
              packageManager === 'yarn'
                ? 'yarn audit fix'
                : packageManager === 'pnpm'
                  ? 'pnpm audit fix'
                  : 'npm audit fix';

            report += `**Fix command:** \`${fixCommand}\`\n\n`;
          } else {
            report += '✅ No security vulnerabilities found!\n\n';
          }
        } catch (error) {
          report += `⚠️ Could not check for vulnerabilities: ${error}\n\n`;
        }
      }

      // React Native specific recommendations
      report += await PackageManagementService.getReactNativeUpgradeRecommendations(packageJson);

      return report;
    } catch (error) {
      return `❌ Error during package upgrade analysis: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  static async resolveDependencies(
    projectPath: string,
    packageManager: string,
    fixConflicts: boolean,
    generateResolutions: boolean
  ): Promise<string> {
    const execAsync = promisify(exec);

    try {
      let report = '# 🔧 Dependency Resolution Analysis\n\n';

      // Read package.json and lock files
      const packageJsonPath = path.join(projectPath, 'package.json');
      let packageJson: any = {};

      try {
        const packageContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(packageContent);
      } catch {
        return '❌ No package.json found in the specified project path.';
      }

      report += `**Project:** ${packageJson.name || 'Unknown'}\n`;
      report += `**Package Manager:** ${packageManager}\n\n`;

      // Check for dependency conflicts
      report += '## 🔍 Analyzing Dependency Tree\n\n';

      const listCommand =
        packageManager === 'yarn'
          ? 'yarn list --json'
          : packageManager === 'pnpm'
            ? 'pnpm list --json'
            : 'npm list --json';

      try {
        const { stdout, stderr } = await execAsync(listCommand, { cwd: projectPath });

        if (stderr && stderr.includes('UNMET')) {
          report += '⚠️ Found unmet dependencies:\n\n';
          const unmetDeps = stderr.match(/UNMET DEPENDENCY ([^\n]+)/g);
          if (unmetDeps) {
            unmetDeps.forEach((dep) => {
              report += `- ${dep.replace('UNMET DEPENDENCY ', '')}\n`;
            });
          }
          report += '\n';
        }

        // Parse dependency tree for conflicts
        try {
          const depTree = JSON.parse(stdout);
          const conflicts = PackageManagementService.findDependencyConflicts(depTree);

          if (conflicts.length > 0) {
            report += '🚨 **Dependency Conflicts Found:**\n\n';

            conflicts.forEach((conflict) => {
              report += `**${conflict.package}**\n`;
              report += `- Required versions: ${conflict.versions.join(', ')}\n`;
              report += `- Conflict reason: ${conflict.reason}\n\n`;
            });
          } else {
            report += '✅ No dependency conflicts detected!\n\n';
          }
        } catch {
          report += '⚠️ Could not parse dependency tree for conflict analysis\n\n';
        }
      } catch (error) {
        report += `⚠️ Could not analyze dependency tree: ${error}\n\n`;
      }

      // Generate resolutions
      if (generateResolutions) {
        report += '## 🛠️ Resolution Suggestions\n\n';

        const resolutions = await PackageManagementService.generateDependencyResolutions(
          packageJson,
          packageManager
        );

        if (resolutions.length > 0) {
          report += '### Recommended Resolutions\n\n';

          resolutions.forEach((resolution) => {
            report += `**${resolution.package}**\n`;
            report += `- Issue: ${resolution.issue}\n`;
            report += `- Solution: ${resolution.solution}\n`;
            if (resolution.command) {
              report += `- Command: \`${resolution.command}\`\n`;
            }
            report += '\n';
          });
        } else {
          report += '✅ No additional resolutions needed!\n\n';
        }
      }

      // Auto-fix conflicts
      if (fixConflicts) {
        report += '## 🔧 Attempting Automatic Fixes\n\n';

        try {
          const installCommand =
            packageManager === 'yarn'
              ? 'yarn install'
              : packageManager === 'pnpm'
                ? 'pnpm install'
                : 'npm install';

          report += `Running: \`${installCommand}\`\n\n`;
          const { stdout, stderr } = await execAsync(installCommand, { cwd: projectPath });

          if (stderr && !stderr.includes('warn')) {
            report += `⚠️ Warnings/Errors during installation:\n\`\`\`\n${stderr}\n\`\`\`\n\n`;
          } else {
            report += '✅ Dependencies resolved successfully!\n\n';
          }
        } catch (error) {
          report += `❌ Failed to resolve dependencies automatically: ${error}\n\n`;
        }
      }

      return report;
    } catch (error) {
      return `❌ Error during dependency resolution: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  static async auditPackages(
    projectPath: string,
    packageManager: string,
    autoFix: boolean,
    severityThreshold: string
  ): Promise<string> {
    const execAsync = promisify(exec);

    try {
      let report = '# 🛡️ Security Audit Report\n\n';

      const packageJsonPath = path.join(projectPath, 'package.json');
      let packageJson: any = {};

      try {
        const packageContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(packageContent);
      } catch {
        return '❌ No package.json found in the specified project path.';
      }

      report += `**Project:** ${packageJson.name || 'Unknown'}\n`;
      report += `**Package Manager:** ${packageManager}\n`;
      report += `**Severity Threshold:** ${severityThreshold}\n\n`;

      // Run security audit
      report += '## 🔍 Running Security Audit\n\n';

      const auditCommand =
        packageManager === 'yarn'
          ? 'yarn audit --json'
          : packageManager === 'pnpm'
            ? 'pnpm audit --json'
            : 'npm audit --json';

      try {
        const { stdout } = await execAsync(auditCommand, { cwd: projectPath });
        const auditData = JSON.parse(stdout);

        if (auditData.vulnerabilities) {
          const vulnerabilities = Object.entries(auditData.vulnerabilities);
          const filteredVulns = vulnerabilities.filter(([_, vuln]: [string, any]) =>
            PackageManagementService.meetsSeverityThreshold(vuln.severity, severityThreshold)
          );

          if (filteredVulns.length > 0) {
            report += `Found ${filteredVulns.length} vulnerabilities meeting severity threshold.\n\n`;

            report += '| Package | Severity | Title | Patched Versions |\n';
            report += '|---------|----------|-------|------------------|\n';

            filteredVulns.forEach(([pkg, vuln]: [string, any]) => {
              report += `| ${pkg} | ${vuln.severity} | ${vuln.title || 'N/A'} | ${vuln.patched_versions || 'None'} |\n`;
            });

            report += '\n';

            // Auto-fix vulnerabilities
            if (autoFix) {
              report += '## 🔧 Attempting Automatic Fixes\n\n';

              const fixCommand =
                packageManager === 'yarn'
                  ? 'yarn audit fix'
                  : packageManager === 'pnpm'
                    ? 'pnpm audit fix'
                    : 'npm audit fix';

              try {
                report += `Running: \`${fixCommand}\`\n\n`;
                const { stdout: fixOutput } = await execAsync(fixCommand, { cwd: projectPath });
                report += `✅ Fix completed:\n\`\`\`\n${fixOutput}\n\`\`\`\n\n`;
              } catch (error) {
                report += `❌ Failed to auto-fix vulnerabilities: ${error}\n\n`;
              }
            } else {
              report += '## 🛠️ Manual Fix Recommendations\n\n';

              const fixCommand =
                packageManager === 'yarn'
                  ? 'yarn audit fix'
                  : packageManager === 'pnpm'
                    ? 'pnpm audit fix'
                    : 'npm audit fix';

              report += 'Run the following command to attempt automatic fixes:\n';
              report += `\`\`\`bash\n${fixCommand}\n\`\`\`\n\n`;
            }
          } else {
            report += `✅ No vulnerabilities found meeting the ${severityThreshold} severity threshold!\n\n`;
          }
        } else {
          report += '✅ No security vulnerabilities found!\n\n';
        }
      } catch (error) {
        report += `⚠️ Could not complete security audit: ${error}\n\n`;
      }

      return report;
    } catch (error) {
      return `❌ Error during security audit: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  static async migratePackages(
    projectPath: string,
    packageManager: string,
    autoMigrate: boolean,
    targetPackages?: string[]
  ): Promise<string> {
    const execAsync = promisify(exec);

    try {
      let report = '# 📦 Package Migration Analysis\n\n';

      const packageJsonPath = path.join(projectPath, 'package.json');
      let packageJson: any = {};

      try {
        const packageContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(packageContent);
      } catch {
        return '❌ No package.json found in the specified project path.';
      }

      report += `**Project:** ${packageJson.name || 'Unknown'}\n`;
      report += `**Package Manager:** ${packageManager}\n\n`;

      const dependencies = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {}),
      };

      // Define migration mappings
      const packageMigrations = PackageManagementService.getPackageMigrations();

      const migrationsNeeded: Array<{
        oldPackage: string;
        newPackage: string;
        reason: string;
        commands: string[];
      }> = [];

      // Check which packages need migration
      for (const [oldPkg, migration] of Object.entries(packageMigrations)) {
        if (dependencies[oldPkg] && (!targetPackages || targetPackages.includes(oldPkg))) {
          migrationsNeeded.push({
            oldPackage: oldPkg,
            newPackage: migration.newPackage,
            reason: migration.reason,
            commands: migration.commands.map((cmd) =>
              cmd.replace('{packageManager}', packageManager)
            ),
          });
        }
      }

      if (migrationsNeeded.length === 0) {
        report += '✅ No package migrations needed!\n\n';
        return report;
      }

      report += '## 🔄 Packages Requiring Migration\n\n';

      migrationsNeeded.forEach((migration) => {
        report += `**${migration.oldPackage}** → **${migration.newPackage}**\n`;
        report += `- Reason: ${migration.reason}\n`;
        report += '- Commands:\n';
        migration.commands.forEach((cmd) => {
          report += `  - \`${cmd}\`\n`;
        });
        report += '\n';
      });

      // Auto-migrate if requested
      if (autoMigrate) {
        report += '## 🚀 Performing Automatic Migration\n\n';

        for (const migration of migrationsNeeded) {
          report += `### Migrating ${migration.oldPackage}\n\n`;

          for (const command of migration.commands) {
            try {
              report += `Running: \`${command}\`\n`;
              const { stdout } = await execAsync(command, { cwd: projectPath });
              report += '✅ Success\n\n';
            } catch (error) {
              report += `❌ Failed: ${error}\n\n`;
            }
          }
        }

        // Update package.json to remove old dependencies
        try {
          const updatedPackageJson = { ...packageJson };

          migrationsNeeded.forEach((migration) => {
            if (updatedPackageJson.dependencies?.[migration.oldPackage]) {
              delete updatedPackageJson.dependencies[migration.oldPackage];
            }
            if (updatedPackageJson.devDependencies?.[migration.oldPackage]) {
              delete updatedPackageJson.devDependencies[migration.oldPackage];
            }
          });

          await fs.promises.writeFile(packageJsonPath, JSON.stringify(updatedPackageJson, null, 2));

          report += '✅ Updated package.json to remove old dependencies\n\n';
        } catch (error) {
          report += `⚠️ Could not update package.json: ${error}\n\n`;
        }
      } else {
        report += '## 📋 Manual Migration Instructions\n\n';
        report += 'Run the following commands to perform the migrations:\n\n';
        report += '```bash\n';

        migrationsNeeded.forEach((migration) => {
          migration.commands.forEach((cmd) => {
            report += `${cmd}\n`;
          });
        });

        report += '```\n\n';
      }

      return report;
    } catch (error) {
      return `❌ Error during package migration: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Helper methods
  static isMinorOrPatchUpdate(current: string, latest: string): boolean {
    const currentParts = current
      .replace(/[^0-9.]/g, '')
      .split('.')
      .map(Number);
    const latestParts = latest
      .replace(/[^0-9.]/g, '')
      .split('.')
      .map(Number);

    return latestParts[0] === currentParts[0]; // Same major version
  }

  static isPatchUpdate(current: string, latest: string): boolean {
    const currentParts = current
      .replace(/[^0-9.]/g, '')
      .split('.')
      .map(Number);
    const latestParts = latest
      .replace(/[^0-9.]/g, '')
      .split('.')
      .map(Number);

    return latestParts[0] === currentParts[0] && latestParts[1] === currentParts[1]; // Same major and minor
  }

  static findDependencyConflicts(
    depTree: any
  ): Array<{ package: string; versions: string[]; reason: string }> {
    const conflicts: Array<{ package: string; versions: string[]; reason: string }> = [];
    const packageVersions: Record<string, Set<string>> = {};

    const traverseTree = (node: any) => {
      if (node.dependencies) {
        for (const [pkg, info] of Object.entries(node.dependencies as any)) {
          const packageInfo = info as any;
          if (!packageVersions[pkg]) {
            packageVersions[pkg] = new Set();
          }
          packageVersions[pkg].add(packageInfo.version);

          traverseTree(packageInfo);
        }
      }
    };

    traverseTree(depTree);

    for (const [pkg, versions] of Object.entries(packageVersions)) {
      if (versions.size > 1) {
        conflicts.push({
          package: pkg,
          versions: Array.from(versions),
          reason: 'Multiple versions detected in dependency tree',
        });
      }
    }

    return conflicts;
  }

  static async generateDependencyResolutions(
    packageJson: any,
    packageManager: string
  ): Promise<Array<{ package: string; issue: string; solution: string; command?: string }>> {
    const resolutions: Array<{
      package: string;
      issue: string;
      solution: string;
      command?: string;
    }> = [];

    // Check for peer dependency warnings
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // React Native specific checks
    if (dependencies['react-native']) {
      const rnVersion = dependencies['react-native'];

      // Check React version compatibility
      if (dependencies['react']) {
        const reactVersion = dependencies['react'];
        resolutions.push({
          package: 'react',
          issue: 'React version may not be compatible with React Native version',
          solution: 'Ensure React version matches React Native requirements',
          command: `${packageManager} install react@18.2.0`, // Example
        });
      }
    }

    return resolutions;
  }

  static meetsSeverityThreshold(severity: string, threshold: string): boolean {
    const severityLevels = ['low', 'moderate', 'high', 'critical'];
    const severityIndex = severityLevels.indexOf(severity);
    const thresholdIndex = severityLevels.indexOf(threshold);

    return severityIndex >= thresholdIndex;
  }

  static getPackageMigrations(): Record<
    string,
    { newPackage: string; reason: string; commands: string[] }
  > {
    return {
      'react-native-vector-icons': {
        newPackage: '@expo/vector-icons',
        reason: 'Better maintained and more feature-rich',
        commands: [
          '{packageManager} uninstall react-native-vector-icons',
          '{packageManager} install @expo/vector-icons',
        ],
      },
      'react-native-asyncstorage': {
        newPackage: '@react-native-async-storage/async-storage',
        reason: 'Official community package with better support',
        commands: [
          '{packageManager} uninstall react-native-asyncstorage',
          '{packageManager} install @react-native-async-storage/async-storage',
        ],
      },
      '@react-native-community/async-storage': {
        newPackage: '@react-native-async-storage/async-storage',
        reason: 'Package moved to new organization',
        commands: [
          '{packageManager} uninstall @react-native-community/async-storage',
          '{packageManager} install @react-native-async-storage/async-storage',
        ],
      },
      'react-native-camera': {
        newPackage: 'react-native-vision-camera',
        reason: 'Better performance and actively maintained',
        commands: [
          '{packageManager} uninstall react-native-camera',
          '{packageManager} install react-native-vision-camera',
        ],
      },
      'react-navigation': {
        newPackage: '@react-navigation/native',
        reason: 'Updated to version 6 with better architecture',
        commands: [
          '{packageManager} uninstall react-navigation',
          '{packageManager} install @react-navigation/native @react-navigation/native-stack',
        ],
      },
    };
  }

  static async getReactNativeUpgradeRecommendations(packageJson: any): Promise<string> {
    let report = '## 🎯 React Native Specific Recommendations\n\n';

    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Check React Native version
    if (dependencies['react-native']) {
      const rnVersion = dependencies['react-native'].replace(/[^0-9.]/g, '');
      const majorVersion = parseInt(rnVersion.split('.')[0]);

      if (majorVersion < 70) {
        report += '🚨 **Critical: React Native version is outdated**\n';
        report += `- Current: ${rnVersion}\n`;
        report += '- Recommended: 0.72+\n';
        report += '- Benefits: New Architecture, better performance, latest features\n';
        report += '- Upgrade guide: https://react-native-community.github.io/upgrade-helper/\n\n';
      } else if (majorVersion < 72) {
        report += '⚠️ **React Native could be updated**\n';
        report += `- Current: ${rnVersion}\n`;
        report += '- Latest stable: 0.72+\n';
        report += '- Consider upgrading for latest features and bug fixes\n\n';
      } else {
        report += '✅ React Native version is current\n\n';
      }
    }

    // Check for New Architecture readiness
    if (dependencies['react-native']) {
      report += '### 🏗️ New Architecture Readiness\n\n';
      report +=
        'Check if your dependencies support the New Architecture (Fabric + TurboModules):\n\n';

      const incompatiblePackages = [
        'react-native-reanimated',
        'react-native-gesture-handler',
        'react-native-screens',
      ].filter((pkg) => dependencies[pkg]);

      if (incompatiblePackages.length > 0) {
        report += 'Ensure these packages support New Architecture:\n';
        incompatiblePackages.forEach((pkg) => {
          report += `- ${pkg}\n`;
        });
        report += '\n';
      }
    }

    return report;
  }
}
