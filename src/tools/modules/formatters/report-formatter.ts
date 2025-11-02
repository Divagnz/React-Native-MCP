/**
 * Report formatting utilities for analysis results
 */

export class ReportFormatter {
  /**
   * Format basic codebase analysis results
   */
  static formatCodebaseAnalysis(analysis: any, projectPath: string): string {
    let report = '## React Native Codebase Analysis\n\n';
    report += `**Project Path:** ${projectPath}\n`;
    report += `**Total Files Analyzed:** ${analysis.totalFiles}\n`;
    report += `**Components Found:** ${analysis.components.filter((c: any) => c.isComponent).length}\n\n`;

    if (analysis.issues.length > 0) {
      report += `### Issues Found (${analysis.issues.length})\n\n`;
      analysis.issues.forEach((issue: string, index: number) => {
        report += `${index + 1}. ${issue}\n`;
      });
      report += '\n';
    }

    if (analysis.suggestions.length > 0) {
      report += `### Suggestions (${analysis.suggestions.length})\n\n`;
      analysis.suggestions.forEach((suggestion: string, index: number) => {
        report += `${index + 1}. ${suggestion}\n`;
      });
      report += '\n';
    }

    // File breakdown
    report += '### File Breakdown\n\n';
    const components = analysis.components.filter((c: any) => c.isComponent);
    if (components.length > 0) {
      report += `**React Native Components (${components.length}):**\n`;
      components.forEach((comp: any) => {
        report += `- ${comp.fileName} (${comp.linesOfCode} lines)\n`;
      });
    }

    const nonComponents = analysis.components.filter((c: any) => !c.isComponent);
    if (nonComponents.length > 0) {
      report += `\n**Other Files (${nonComponents.length}):**\n`;
      nonComponents.slice(0, 10).forEach((file: any) => {
        report += `- ${file.fileName}\n`;
      });
      if (nonComponents.length > 10) {
        report += `- ... and ${nonComponents.length - 10} more files\n`;
      }
    }

    return report;
  }

  /**
   * Format performance analysis results
   */
  static formatPerformanceAnalysis(issues: any[], projectPath: string): string {
    let report = '## React Native Performance Analysis\n\n';
    report += `**Project Path:** ${projectPath}\n`;
    report += `**Performance Issues Found:** ${issues.length}\n\n`;

    if (issues.length === 0) {
      report += '✅ No major performance issues detected!\n\n';
      report += 'Your React Native codebase follows good performance practices.';
      return report;
    }

    // Group by severity
    const high = issues.filter((i) => i.severity === 'high');
    const medium = issues.filter((i) => i.severity === 'medium');
    const low = issues.filter((i) => i.severity === 'low');

    if (high.length > 0) {
      report += `### 🔴 High Priority Issues (${high.length})\n\n`;
      high.forEach((issue, index) => {
        report += `${index + 1}. **${issue.file}** - ${issue.issue}\n`;
        report += `   💡 ${issue.suggestion}\n\n`;
      });
    }

    if (medium.length > 0) {
      report += `### 🟡 Medium Priority Issues (${medium.length})\n\n`;
      medium.forEach((issue, index) => {
        report += `${index + 1}. **${issue.file}** - ${issue.issue}\n`;
        report += `   💡 ${issue.suggestion}\n\n`;
      });
    }

    if (low.length > 0) {
      report += `### 🟢 Low Priority Optimizations (${low.length})\n\n`;
      low.forEach((issue, index) => {
        report += `${index + 1}. **${issue.file}** - ${issue.issue}\n`;
        report += `   💡 ${issue.suggestion}\n\n`;
      });
    }

    // Summary by category
    const categories = [...new Set(issues.map((i) => i.type))];
    if (categories.length > 1) {
      report += '### Issues by Category\n\n';
      categories.forEach((category) => {
        const count = issues.filter((i) => i.type === category).length;
        report += `- **${category.replace('_', ' ')}**: ${count} issues\n`;
      });
    }

    return report;
  }

  /**
   * Format comprehensive analysis results
   */
  static formatComprehensiveAnalysis(analysis: any, projectPath: string): string {
    let report = '## Comprehensive React Native Codebase Analysis\n\n';
    report += `**Project Path:** ${projectPath}\n`;
    report += `**Total Files Analyzed:** ${analysis.totalFiles}\n\n`;

    // Summary stats
    const totalIssues =
      analysis.performance.length +
      analysis.security.length +
      analysis.codeQuality.length +
      analysis.refactoring.length +
      analysis.deprecated.length +
      analysis.accessibility.length +
      analysis.testing.length;

    report += '### 📊 Analysis Summary\n\n';
    report += `- **Security Issues:** ${analysis.security.length}\n`;
    report += `- **Performance Issues:** ${analysis.performance.length}\n`;
    report += `- **Code Quality Issues:** ${analysis.codeQuality.length}\n`;
    report += `- **Refactoring Opportunities:** ${analysis.refactoring.length}\n`;
    report += `- **Deprecated Features:** ${analysis.deprecated.length}\n`;
    report += `- **Accessibility Issues:** ${analysis.accessibility.length}\n`;
    report += `- **Testing Gaps:** ${analysis.testing.length}\n`;
    report += `- **Upgrade Suggestions:** ${analysis.upgrades.length}\n\n`;

    if (totalIssues === 0 && analysis.upgrades.length === 0) {
      report +=
        '✅ **Excellent!** Your codebase follows React Native best practices with no major issues detected.\n\n';
      return report;
    }

    // If only upgrades exist (no other issues), show them
    if (totalIssues === 0 && analysis.upgrades.length > 0) {
      // Skip straight to upgrades section
    }

    // Critical and High severity issues first
    const criticalIssues = [
      ...analysis.security,
      ...analysis.deprecated,
      ...analysis.performance,
    ].filter((issue) => issue.severity === 'critical' || issue.severity === 'high');

    if (criticalIssues.length > 0) {
      report += `### 🚨 Critical & High Priority Issues (${criticalIssues.length})\n\n`;
      criticalIssues.forEach((issue, index) => {
        const severity = issue.severity === 'critical' ? '🔴' : '🟠';
        report += `${index + 1}. ${severity} **${issue.file}** - ${issue.issue}\n`;
        report += `   💡 *${issue.suggestion}*\n`;
        report += `   📂 Category: ${issue.category}\n\n`;
      });
    }

    // Security Issues
    if (analysis.security.length > 0) {
      report += '### 🛡️ Security Analysis\n\n';
      analysis.security.forEach((issue: any, index: number) => {
        const severity =
          issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟠' : '🟡';
        report += `${index + 1}. ${severity} **${issue.file}** - ${issue.issue}\n`;
        report += `   💡 ${issue.suggestion}\n`;
        report += `   📂 ${issue.category.replace(/_/g, ' ')}\n\n`;
      });
    }

    // Deprecated Features
    if (analysis.deprecated.length > 0) {
      report += '### ⚠️ Deprecated Features\n\n';
      analysis.deprecated.forEach((issue: any, index: number) => {
        report += `${index + 1}. **${issue.file}** - ${issue.issue}\n`;
        report += `   💡 ${issue.suggestion}\n\n`;
      });
    }

    // Code Quality
    if (analysis.codeQuality.length > 0) {
      report += '### 📝 Code Quality\n\n';
      analysis.codeQuality.forEach((issue: any, index: number) => {
        report += `${index + 1}. **${issue.file}** - ${issue.issue}\n`;
        report += `   💡 ${issue.suggestion}\n\n`;
      });
    }

    // Refactoring Opportunities
    if (analysis.refactoring.length > 0) {
      report += '### 🔄 Refactoring Opportunities\n\n';
      analysis.refactoring.forEach((issue: any, index: number) => {
        report += `${index + 1}. **${issue.file}** - ${issue.issue}\n`;
        report += `   💡 ${issue.suggestion}\n\n`;
      });
    }

    // Accessibility
    if (analysis.accessibility.length > 0) {
      report += '### ♿ Accessibility Improvements\n\n';
      analysis.accessibility.forEach((issue: any, index: number) => {
        report += `${index + 1}. **${issue.file}** - ${issue.issue}\n`;
        report += `   💡 ${issue.suggestion}\n\n`;
      });
    }

    // Testing
    if (analysis.testing.length > 0) {
      report += '### 🧪 Testing Recommendations\n\n';
      analysis.testing.forEach((issue: any, index: number) => {
        report += `${index + 1}. **${issue.file}** - ${issue.issue}\n`;
        report += `   💡 ${issue.suggestion}\n\n`;
      });
    }

    // Upgrades
    if (analysis.upgrades.length > 0) {
      report += '### 📦 Package & Version Upgrades\n\n';
      analysis.upgrades.forEach((issue: any, index: number) => {
        report += `${index + 1}. **${issue.file}** - ${issue.issue}\n`;
        report += `   💡 ${issue.suggestion}\n\n`;
      });
    }

    // Recommendations
    report += '### 🎯 Next Steps\n\n';
    report +=
      '1. **Start with security issues** - Address any critical security vulnerabilities first\n';
    report += '2. **Update deprecated features** - Replace deprecated APIs and components\n';
    report += '3. **Improve performance** - Focus on high-impact performance optimizations\n';
    report += '4. **Enhance code quality** - Refactor complex components and improve readability\n';
    report += '5. **Add accessibility** - Make your app usable for all users\n';
    report += '6. **Increase test coverage** - Add tests for critical components\n\n';

    return report;
  }
}
