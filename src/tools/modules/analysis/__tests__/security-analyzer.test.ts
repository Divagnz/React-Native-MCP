import { describe, it, expect } from '@jest/globals';
import { SecurityAnalyzer } from '../security-analyzer.js';

describe('SecurityAnalyzer', () => {
  describe('analyzeFileSecurity', () => {
    describe('secret detection', () => {
      it('should detect hardcoded API keys', () => {
        const content = `
          const config = {
            api_key: "sk_live_51H123456789abcdef",
            apiKey: "AIzaSyD123456789abcdef"
          };
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'config.ts');

        expect(issues).toHaveLength(1);
        expect(issues[0].severity).toBe('critical');
        expect(issues[0].category).toBe('secrets');
        expect(issues[0].issue).toContain('API Key');
      });

      it('should detect hardcoded passwords', () => {
        const content = `
          const credentials = {
            password: "MySecretPass123",
            secret: "SuperSecret456"
          };
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'auth.ts');

        expect(issues.length).toBeGreaterThan(0);
        const passwordIssue = issues.find((i) => i.issue.includes('Secret/Password'));
        expect(passwordIssue).toBeDefined();
        expect(passwordIssue?.severity).toBe('critical');
      });

      it('should detect hardcoded tokens', () => {
        const content = `
          const auth = {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
            auth_token: "ghp_1234567890abcdef"
          };
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'token.ts');

        expect(issues.length).toBeGreaterThan(0);
        const tokenIssue = issues.find((i) => i.issue.includes('Auth Token'));
        expect(tokenIssue).toBeDefined();
      });

      it('should detect private keys', () => {
        const content = `
          const keys = {
            private_key: "-----BEGIN PRIVATE KEY-----MIIEvQIBADANBg"
          };
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'keys.ts');

        expect(issues.length).toBeGreaterThan(0);
        const keyIssue = issues.find((i) => i.issue.includes('Private Key'));
        expect(keyIssue).toBeDefined();
      });

      it('should detect access keys', () => {
        const content = `
          const aws = {
            access_key: "AKIAIOSFODNN7EXAMPLE"
          };
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'aws.ts');

        expect(issues.length).toBeGreaterThan(0);
        const accessKeyIssue = issues.find((i) => i.issue.includes('Access Key'));
        expect(accessKeyIssue).toBeDefined();
      });

      it('should detect base64 encoded secrets', () => {
        const content = `
          const secret = "dGhpc2lzYXZlcnlsb25nYmFzZTY0ZW5jb2RlZHNlY3JldGtleXRoYXRzaG91bGRub3RiZWhhcmRjb2RlZA==";
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'encoded.ts');

        expect(issues.length).toBeGreaterThan(0);
        const base64Issue = issues.find((i) => i.issue.includes('Base64 encoded secret'));
        expect(base64Issue).toBeDefined();
      });

      it('should filter out false positives with "example"', () => {
        const content = `
          const config = {
            api_key: "example_api_key_12345"
          };
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'example.ts');

        expect(issues).toHaveLength(0);
      });

      it('should filter out false positives with "placeholder"', () => {
        const content = `
          const config = {
            password: "placeholder_password"
          };
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'placeholder.ts');

        expect(issues).toHaveLength(0);
      });

      it('should filter out false positives with "your_"', () => {
        const content = `
          const config = {
            api_key: "your_api_key_here"
          };
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'template.ts');

        expect(issues).toHaveLength(0);
      });

      it('should filter out false positives with "YOUR_"', () => {
        const content = `
          const config = {
            token: "YOUR_TOKEN_HERE"
          };
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'template.ts');

        expect(issues).toHaveLength(0);
      });

      it('should filter out false positives with "###"', () => {
        const content = `
          const config = {
            secret: "###SECRET###"
          };
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'template.ts');

        expect(issues).toHaveLength(0);
      });

      it('should count multiple occurrences of the same secret type', () => {
        const content = `
          const config1 = { api_key: "sk_live_12345678901234567890" };
          const config2 = { apiKey: "AIzaSyD12345678901234567890" };
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'multi.ts');

        expect(issues).toHaveLength(1);
        expect(issues[0].issue).toContain('(2 occurrence(s))');
      });
    });

    describe('sensitive data logging', () => {
      it('should detect console.log with password', () => {
        const content = `
          console.log('User password:', password);
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'logging.ts');

        expect(issues.length).toBeGreaterThan(0);
        const logIssue = issues.find((i) => i.category === 'data_exposure');
        expect(logIssue).toBeDefined();
        expect(logIssue?.severity).toBe('high');
        expect(logIssue?.issue).toContain('Console logging may expose sensitive data');
      });

      it('should detect console.log with token', () => {
        const content = `
          console.log(\`Auth token: \${token}\`);
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'logging.ts');

        const logIssue = issues.find((i) => i.category === 'data_exposure');
        expect(logIssue).toBeDefined();
      });

      it('should detect console.warn with secret', () => {
        const content = `
          console.warn('Secret exposed:', secret);
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'logging.ts');

        const logIssue = issues.find((i) => i.category === 'data_exposure');
        expect(logIssue).toBeDefined();
      });

      it('should detect console.error with credential', () => {
        const content = `
          console.error('Credential error:', credential);
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'logging.ts');

        const logIssue = issues.find((i) => i.category === 'data_exposure');
        expect(logIssue).toBeDefined();
      });

      it('should detect console.info with key', () => {
        const content = `
          console.info('API key:', key);
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'logging.ts');

        const logIssue = issues.find((i) => i.category === 'data_exposure');
        expect(logIssue).toBeDefined();
      });

      it('should not flag safe console.log without sensitive data', () => {
        const content = `
          console.log('User logged in successfully');
          console.log('Total items:', count);
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'safe.ts');

        const logIssue = issues.find((i) => i.category === 'data_exposure');
        expect(logIssue).toBeUndefined();
      });
    });

    describe('code injection detection', () => {
      it('should detect eval() usage', () => {
        const content = `
          const result = eval(userInput);
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'injection.ts');

        expect(issues.length).toBeGreaterThan(0);
        const evalIssue = issues.find(
          (i) => i.category === 'code_injection' && i.issue.includes('eval()')
        );
        expect(evalIssue).toBeDefined();
        expect(evalIssue?.severity).toBe('critical');
      });

      it('should detect Function constructor usage', () => {
        const content = `
          const fn = new Function('a', 'b', 'return a + b');
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'injection.ts');

        const fnIssue = issues.find(
          (i) => i.category === 'code_injection' && i.issue.includes('Function constructor')
        );
        expect(fnIssue).toBeDefined();
        expect(fnIssue?.severity).toBe('high');
      });

      it('should detect setTimeout with string', () => {
        const content = `
          setTimeout("alert('XSS')", 1000);
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'timer.ts');

        const timeoutIssue = issues.find((i) => i.issue.includes('setTimeout with string'));
        expect(timeoutIssue).toBeDefined();
        expect(timeoutIssue?.severity).toBe('medium');
      });

      it('should detect setInterval with string', () => {
        const content = `
          setInterval("console.log('test')", 1000);
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'timer.ts');

        const intervalIssue = issues.find((i) => i.issue.includes('setInterval with string'));
        expect(intervalIssue).toBeDefined();
        expect(intervalIssue?.severity).toBe('medium');
      });

      it('should not flag safe setTimeout with function', () => {
        const content = `
          setTimeout(() => console.log('safe'), 1000);
          setTimeout(handleTimeout, 2000);
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'safe-timer.ts');

        const timeoutIssue = issues.find((i) => i.issue.includes('setTimeout'));
        expect(timeoutIssue).toBeUndefined();
      });
    });

    describe('network security', () => {
      it('should detect HTTP fetch requests', () => {
        const content = `
          fetch("http://api.example.com/data");
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'network.ts');

        expect(issues.length).toBeGreaterThan(0);
        const httpIssue = issues.find((i) => i.category === 'insecure_transport');
        expect(httpIssue).toBeDefined();
        expect(httpIssue?.severity).toBe('medium');
        expect(httpIssue?.issue).toContain('HTTP request(s) detected');
      });

      it('should detect HTTP axios.get requests', () => {
        const content = `
          axios.get("http://api.example.com/users");
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'network.ts');

        const httpIssue = issues.find((i) => i.category === 'insecure_transport');
        expect(httpIssue).toBeDefined();
      });

      it('should detect HTTP axios.post requests', () => {
        const content = `
          axios.post("http://api.example.com/users", data);
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'network.ts');

        const httpIssue = issues.find((i) => i.category === 'insecure_transport');
        expect(httpIssue).toBeDefined();
      });

      it('should count multiple HTTP requests', () => {
        const content = `
          fetch("http://api1.example.com/data");
          axios.get("http://api2.example.com/users");
          axios.post("http://api3.example.com/posts", data);
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'network.ts');

        const httpIssue = issues.find((i) => i.category === 'insecure_transport');
        expect(httpIssue).toBeDefined();
        expect(httpIssue?.issue).toContain('3 HTTP request(s)');
      });

      it('should not flag HTTPS requests', () => {
        const content = `
          fetch("https://api.example.com/data");
          axios.get("https://api.example.com/users");
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'secure-network.ts');

        const httpIssue = issues.find((i) => i.category === 'insecure_transport');
        expect(httpIssue).toBeUndefined();
      });
    });

    describe('XSS detection', () => {
      it('should detect dangerouslySetInnerHTML without user input', () => {
        const content = `
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'component.tsx');

        expect(issues.length).toBeGreaterThan(0);
        const xssIssue = issues.find((i) => i.category === 'xss');
        expect(xssIssue).toBeDefined();
        expect(xssIssue?.severity).toBe('high');
        expect(xssIssue?.issue).toContain('dangerouslySetInnerHTML');
      });

      it('should detect critical XSS with user input from props', () => {
        const content = `
          const MyComponent = (props) => (
            <div dangerouslySetInnerHTML={{ __html: props.content }} />
          );
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'user-component.tsx');

        const xssIssue = issues.find((i) => i.category === 'xss');
        expect(xssIssue).toBeDefined();
        expect(xssIssue?.severity).toBe('critical');
      });

      it('should detect critical XSS with user input from state', () => {
        const content = `
          const MyComponent = () => {
            const [html, setHtml] = useState('');
            return <div dangerouslySetInnerHTML={{ __html: state.content }} />
          };
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'state-component.tsx');

        const xssIssue = issues.find((i) => i.category === 'xss');
        expect(xssIssue).toBeDefined();
        expect(xssIssue?.severity).toBe('critical');
      });

      it('should detect critical XSS with user input', () => {
        const content = `
          <div dangerouslySetInnerHTML={{ __html: userInput }} />
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'unsafe.tsx');

        const xssIssue = issues.find((i) => i.category === 'xss');
        expect(xssIssue).toBeDefined();
        expect(xssIssue?.severity).toBe('critical');
      });

      it('should detect critical XSS with query params', () => {
        const content = `
          <div dangerouslySetInnerHTML={{ __html: query.content }} />
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'query.tsx');

        const xssIssue = issues.find((i) => i.category === 'xss');
        expect(xssIssue).toBeDefined();
        expect(xssIssue?.severity).toBe('critical');
      });
    });

    describe('edge cases', () => {
      it('should return empty array for safe code', () => {
        const content = `
          import React from 'react';
          import { View, Text } from 'react-native';

          export const SafeComponent = () => (
            <View>
              <Text>Hello World</Text>
            </View>
          );
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'safe.tsx');

        expect(issues).toEqual([]);
      });

      it('should handle empty content', () => {
        const issues = SecurityAnalyzer.analyzeFileSecurity('', 'empty.ts');

        expect(issues).toEqual([]);
      });

      it('should handle file with only comments', () => {
        const content = `
          // This is a comment
          /* Multi-line
             comment */
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'comments.ts');

        expect(issues).toEqual([]);
      });

      it('should detect multiple different issue types in same file', () => {
        const content = `
          const config = {
            api_key: "sk_live_12345678901234567890"
          };

          console.log('Token:', token);

          const result = eval(code);

          fetch("http://api.example.com/data");

          <div dangerouslySetInnerHTML={{ __html: props.html }} />
        `;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'multiple.tsx');

        expect(issues.length).toBeGreaterThanOrEqual(5);

        // Should have issues from all categories
        const categories = issues.map((i) => i.category);
        expect(categories).toContain('secrets');
        expect(categories).toContain('data_exposure');
        expect(categories).toContain('code_injection');
        expect(categories).toContain('insecure_transport');
        expect(categories).toContain('xss');
      });
    });

    describe('suggestion messages', () => {
      it('should provide helpful suggestion for API keys', () => {
        const content = `const key = { api_key: "sk_live_12345678901234567890" };`;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'config.ts');

        const apiKeyIssue = issues.find((i) => i.issue.includes('API Key'));
        expect(apiKeyIssue?.suggestion).toContain('environment variables');
      });

      it('should provide helpful suggestion for logging', () => {
        const content = `console.log('Password:', password);`;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'log.ts');

        const logIssue = issues.find((i) => i.category === 'data_exposure');
        expect(logIssue?.suggestion).toContain('sanitized logging');
      });

      it('should provide helpful suggestion for eval', () => {
        const content = `eval(code);`;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'eval.ts');

        const evalIssue = issues.find((i) => i.issue.includes('eval()'));
        expect(evalIssue?.suggestion).toContain('safer alternatives');
      });

      it('should provide helpful suggestion for HTTP', () => {
        const content = `fetch("http://api.com");`;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'fetch.ts');

        const httpIssue = issues.find((i) => i.category === 'insecure_transport');
        expect(httpIssue?.suggestion).toContain('HTTPS');
      });

      it('should provide helpful suggestion for XSS', () => {
        const content = `<div dangerouslySetInnerHTML={{ __html: html }} />`;
        const issues = SecurityAnalyzer.analyzeFileSecurity(content, 'xss.tsx');

        const xssIssue = issues.find((i) => i.category === 'xss');
        expect(xssIssue?.suggestion).toContain('Sanitize');
      });
    });
  });
});
