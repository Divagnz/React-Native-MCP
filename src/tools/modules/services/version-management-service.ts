/**
 * Version management service for React Native MCP Server
 * Handles version checking and updates
 */

import * as fs from 'fs';
import * as path from 'path';

export class VersionManagementService {
  static async checkForUpdates(includeChangelog: boolean = false): Promise<string> {
    try {
      const currentVersion = await VersionManagementService.getCurrentVersion();
      const latestInfo = await VersionManagementService.getLatestVersionInfo();

      if (!latestInfo) {
        return '❌ Unable to check for updates. Please ensure you have internet connectivity.';
      }

      const isUpdateAvailable =
        VersionManagementService.compareVersions(currentVersion, latestInfo.version) < 0;

      let report = '## 🔄 React Native MCP Server Update Status\n\n';
      report += `**Current Version:** ${currentVersion}\n`;
      report += `**Latest Version:** ${latestInfo.version}\n`;
      report += `**Last Checked:** ${new Date().toLocaleString()}\n\n`;

      if (isUpdateAvailable) {
        report += '### 🎉 Update Available!\n\n';
        report += `A new version (${latestInfo.version}) is available with new features and improvements.\n\n`;

        report += '### 📥 How to Update:\n\n';
        report += '**Option 1: Automatic Update**\n';
        report += '```bash\n';
        report += 'cd "C:\\Users\\david\\Desktop\\React-Native MCP"\n';
        report += 'npm run auto-update\n';
        report += '```\n\n';

        report += '**Option 2: Manual Update**\n';
        report += '```bash\n';
        report += 'cd "C:\\Users\\david\\Desktop\\React-Native MCP"\n';
        report += 'git pull origin master\n';
        report += 'npm run deploy\n';
        report += '```\n\n';

        if (includeChangelog && latestInfo.changelog) {
          report += "### 📋 What's New:\n\n";
          report += latestInfo.changelog + '\n\n';
        }

        report += '### ⚡ Benefits of Updating:\n';
        report += '- Latest React Native best practices\n';
        report += '- New analysis capabilities\n';
        report += '- Bug fixes and performance improvements\n';
        report += '- Enhanced security recommendations\n\n';
      } else {
        report += "### ✅ You're Up to Date!\n\n";
        report +=
          'Your React Native MCP server is running the latest version with all the newest features and improvements.\n\n';

        report += '### 🔄 Auto-Update Options:\n';
        report += 'To stay automatically updated, you can:\n';
        report += '- Set up daily auto-updates: `npm run setup-auto-update`\n';
        report += '- Enable continuous monitoring: `npm run watch-updates`\n\n';
      }

      return report;
    } catch (error) {
      return `❌ Error checking for updates: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  static async getCurrentVersion(): Promise<string> {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  static async getLatestVersionInfo(): Promise<{ version: string; changelog?: string } | null> {
    try {
      // Check GitHub releases API
      const response = await fetch(
        'https://api.github.com/repos/MrNitro360/React-Native-MCP/releases/latest'
      );
      if (response.ok) {
        const data = await response.json();
        return {
          version: data.tag_name.replace(/^v/, ''),
          changelog: data.body,
        };
      }

      // Fallback: Check GitHub commits for version in package.json
      const commitsResponse = await fetch(
        'https://api.github.com/repos/MrNitro360/React-Native-MCP/commits?path=package.json&per_page=1'
      );
      if (commitsResponse.ok) {
        const commits = await commitsResponse.json();
        if (commits.length > 0) {
          // For now, use a simple versioning based on commit date
          const commitDate = new Date(commits[0].commit.author.date);
          const version = `1.${commitDate.getFullYear()}.${commitDate.getMonth() + 1}${commitDate.getDate()}`;
          return {
            version,
            changelog: commits[0].commit.message,
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  static compareVersions(current: string, latest: string): number {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (currentPart < latestPart) {
        return -1;
      }
      if (currentPart > latestPart) {
        return 1;
      }
    }

    return 0;
  }

  static async shouldCheckForUpdates(): Promise<boolean> {
    try {
      const lastCheckFile = path.join(process.cwd(), '.last-update-check');
      let lastCheck = 0;

      try {
        const lastCheckData = await fs.promises.readFile(lastCheckFile, 'utf-8');
        lastCheck = parseInt(lastCheckData);
      } catch {
        // File doesn't exist, first check
      }

      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (now - lastCheck > twentyFourHours) {
        await fs.promises.writeFile(lastCheckFile, now.toString());
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }
}
