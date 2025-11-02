/**
 * Security analysis utilities for React Native code
 */

export interface SecurityIssue {
  file: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  suggestion: string;
}

export class SecurityAnalyzer {
  /**
   * Analyze file content for security vulnerabilities
   */
  static analyzeFileSecurity(content: string, fileName: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Enhanced secrets detection
    const secretPatterns = [
      { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][^"']{10,}["']/gi, type: 'API Key' },
      { pattern: /(?:secret|password|pwd)\s*[:=]\s*["'][^"']{6,}["']/gi, type: 'Secret/Password' },
      { pattern: /(?:token|auth[_-]?token)\s*[:=]\s*["'][^"']{10,}["']/gi, type: 'Auth Token' },
      {
        pattern: /(?:private[_-]?key|privatekey)\s*[:=]\s*["'][^"']{20,}["']/gi,
        type: 'Private Key',
      },
      { pattern: /(?:access[_-]?key|accesskey)\s*[:=]\s*["'][^"']{10,}["']/gi, type: 'Access Key' },
      { pattern: /["'][A-Za-z0-9+/]{40,}={0,2}["']/g, type: 'Base64 encoded secret' },
    ];

    secretPatterns.forEach(({ pattern, type }) => {
      const matches = content.match(pattern);
      if (matches) {
        // Exclude common false positives
        const validMatches = matches.filter(
          (match) =>
            !match.includes('example') &&
            !match.includes('placeholder') &&
            !match.includes('your_') &&
            !match.includes('YOUR_') &&
            !match.includes('###')
        );

        if (validMatches.length > 0) {
          issues.push({
            file: fileName,
            type: 'security',
            severity: 'critical',
            category: 'secrets',
            issue: `Potential hardcoded ${type} detected (${validMatches.length} occurrence(s))`,
            suggestion: `Move ${type.toLowerCase()} to environment variables or React Native Config/Keychain`,
          });
        }
      }
    });

    // Enhanced logging detection
    const sensitiveLogPatterns = [
      /console\.log.*(?:password|pwd|secret|token|key|auth|credential)/gi,
      /console\.(?:warn|error|info).*(?:password|pwd|secret|token|key|auth|credential)/gi,
      /console\.log.*\$\{.*(?:password|pwd|secret|token|key|auth|credential)/gi,
    ];

    sensitiveLogPatterns.forEach((pattern) => {
      if (pattern.test(content)) {
        issues.push({
          file: fileName,
          type: 'security',
          severity: 'high',
          category: 'data_exposure',
          issue: 'Console logging may expose sensitive data',
          suggestion: 'Remove console statements with sensitive data or use sanitized logging',
        });
      }
    });

    // Code injection vulnerabilities
    const injectionPatterns = [
      { pattern: /eval\s*\(/g, risk: 'critical' as const, desc: 'eval() usage' },
      { pattern: /Function\s*\(/g, risk: 'high' as const, desc: 'Function constructor usage' },
      {
        pattern: /setTimeout\s*\(\s*["'][^"']*["']/g,
        risk: 'medium' as const,
        desc: 'setTimeout with string',
      },
      {
        pattern: /setInterval\s*\(\s*["'][^"']*["']/g,
        risk: 'medium' as const,
        desc: 'setInterval with string',
      },
    ];

    injectionPatterns.forEach(({ pattern, risk, desc }) => {
      if (pattern.test(content)) {
        issues.push({
          file: fileName,
          type: 'security',
          severity: risk,
          category: 'code_injection',
          issue: `${desc} detected - potential code injection risk`,
          suggestion: `Replace ${desc} with safer alternatives`,
        });
      }
    });

    // Network security issues
    const httpMatches = content.match(
      /(?:fetch|axios\.(?:get|post|put|delete))\s*\(\s*["']http:\/\/[^"']+["']/gi
    );
    if (httpMatches) {
      issues.push({
        file: fileName,
        type: 'security',
        severity: 'medium',
        category: 'insecure_transport',
        issue: `${httpMatches.length} HTTP request(s) detected (should use HTTPS)`,
        suggestion: 'Use HTTPS for all network requests to ensure data encryption',
      });
    }

    // XSS vulnerabilities
    if (/dangerouslySetInnerHTML\s*=\s*\{\{/.test(content)) {
      const hasUserInput = /props\.|state\.|user|input|query|param/i.test(content);
      const severity = hasUserInput ? 'critical' : 'high';
      issues.push({
        file: fileName,
        type: 'security',
        severity,
        category: 'xss',
        issue: 'dangerouslySetInnerHTML usage detected',
        suggestion: 'Sanitize HTML content or use safer alternatives',
      });
    }

    return issues;
  }
}
