# Security Fix: Hardcoded Secrets

## Problem

Hardcoded API keys, tokens, and secrets in source code pose serious security risks:
- Exposed in version control
- Visible in crash reports
- Accessible through app decompilation
- Difficult to rotate without code changes

## Detection

The `analyze_component` and `analyze_codebase_comprehensive` tools automatically detect:
- Hardcoded API keys
- Embedded tokens
- Connection strings
- Passwords in code

## Example 1: API Keys

### ❌ Before (Insecure)

```tsx
// ApiService.ts
import axios from 'axios';

export class ApiService {
  private static readonly API_KEY = 'example_api_key_DO_NOT_USE';
  private static readonly API_SECRET = 'example_secret_DO_NOT_USE';
  private static readonly BASE_URL = 'https://api.example.com';

  static async fetchUserData(userId: string) {
    const response = await axios.get(
      `${this.BASE_URL}/users/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'X-API-Secret': this.API_SECRET,
        },
      }
    );
    return response.data;
  }
}
```

### Issues

1. **Critical**: API credentials hardcoded in source code
2. **Critical**: Secret exposed in version control
3. **High**: No way to use different keys for dev/staging/prod
4. **High**: Rotating keys requires code deployment

### ✅ After (Secure)

```tsx
// ApiService.ts
import axios from 'axios';
import Config from 'react-native-config';

/**
 * API service with secure credential management
 */
export class ApiService {
  private static readonly BASE_URL = Config.API_BASE_URL;

  /**
   * Validates that required environment variables are set
   */
  private static validateConfig(): void {
    if (!Config.API_KEY || !Config.API_SECRET) {
      throw new Error(
        'Missing required API credentials. Check .env configuration.'
      );
    }
  }

  /**
   * Fetches user data from the API
   * @param userId - The ID of the user to fetch
   */
  static async fetchUserData(userId: string) {
    this.validateConfig();

    const response = await axios.get(
      `${this.BASE_URL}/users/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${Config.API_KEY}`,
          'X-API-Secret': Config.API_SECRET,
        },
        timeout: 10000,
      }
    );
    return response.data;
  }
}
```

### Environment Files

**`.env` (gitignored)**
```bash
# Development
API_BASE_URL=https://api-dev.example.com
API_KEY=your_development_api_key_here
API_SECRET=your_development_secret_here

# Production (in separate .env.prod file)
# API_BASE_URL=https://api.example.com
# API_KEY=your_production_api_key_here
# API_SECRET=your_production_secret_here
```

**`.env.example` (committed)**
```bash
# API Configuration
API_BASE_URL=https://api-dev.example.com
API_KEY=your_api_key_here
API_SECRET=your_api_secret_here
```

**`.gitignore`**
```
# Environment variables
.env
.env.local
.env.*.local
```

### Setup Instructions

1. Install react-native-config:
```bash
npm install react-native-config
cd ios && pod install && cd ..
```

2. Create .env file with your credentials

3. Configure for multiple environments:
```bash
# Development
ENVFILE=.env.dev npx react-native run-android

# Production
ENVFILE=.env.prod npx react-native run-android
```

## Example 2: OAuth Tokens

### ❌ Before (Insecure)

```tsx
// AuthService.ts
export const AuthService = {
  OAUTH_CLIENT_ID: 'example_client_id_DO_NOT_USE',
  OAUTH_CLIENT_SECRET: 'example_client_secret_DO_NOT_USE',
  REFRESH_TOKEN: 'example_refresh_token_DO_NOT_USE',

  async authenticate(username: string, password: string) {
    const response = await fetch('https://auth.example.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-ID': this.OAUTH_CLIENT_ID,
        'Client-Secret': this.OAUTH_CLIENT_SECRET,
      },
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },
};
```

### ✅ After (Secure)

```tsx
// AuthService.ts
import Config from 'react-native-config';
import * as Keychain from 'react-native-keychain';

interface AuthCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Secure authentication service
 */
export class AuthService {
  private static readonly AUTH_URL = Config.AUTH_URL;
  private static readonly TOKEN_KEY = 'user_auth_token';

  /**
   * Authenticates user and securely stores tokens
   */
  static async authenticate(
    username: string,
    password: string
  ): Promise<AuthCredentials> {
    const response = await fetch(`${this.AUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-ID': Config.OAUTH_CLIENT_ID,
        'Client-Secret': Config.OAUTH_CLIENT_SECRET,
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    const credentials: AuthCredentials = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    // Store tokens securely in keychain
    await this.storeCredentials(credentials);

    return credentials;
  }

  /**
   * Stores credentials securely in device keychain
   */
  private static async storeCredentials(
    credentials: AuthCredentials
  ): Promise<void> {
    await Keychain.setGenericPassword(
      this.TOKEN_KEY,
      JSON.stringify(credentials),
      {
        service: 'com.example.app.auth',
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }
    );
  }

  /**
   * Retrieves stored credentials from keychain
   */
  static async getCredentials(): Promise<AuthCredentials | null> {
    try {
      const result = await Keychain.getGenericPassword({
        service: 'com.example.app.auth',
      });

      if (result) {
        return JSON.parse(result.password);
      }
      return null;
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      return null;
    }
  }

  /**
   * Clears stored credentials
   */
  static async clearCredentials(): Promise<void> {
    await Keychain.resetGenericPassword({
      service: 'com.example.app.auth',
    });
  }
}
```

## Example 3: Firebase Configuration

### ❌ Before (Insecure)

```tsx
// firebase.config.ts
import firebase from '@react-native-firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  authDomain: 'myapp.firebaseapp.com',
  databaseURL: 'https://myapp.firebaseio.com',
  projectId: 'myapp-12345',
  storageBucket: 'myapp.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456',
  measurementId: 'G-XXXXXXXXXX',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
```

### ✅ After (Secure)

```tsx
// firebase.config.ts
import firebase from '@react-native-firebase/app';
import Config from 'react-native-config';

/**
 * Firebase configuration from environment variables
 */
const firebaseConfig = {
  apiKey: Config.FIREBASE_API_KEY,
  authDomain: Config.FIREBASE_AUTH_DOMAIN,
  databaseURL: Config.FIREBASE_DATABASE_URL,
  projectId: Config.FIREBASE_PROJECT_ID,
  storageBucket: Config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID,
  appId: Config.FIREBASE_APP_ID,
  measurementId: Config.FIREBASE_MEASUREMENT_ID,
};

/**
 * Validates Firebase configuration
 */
function validateConfig(): void {
  const required = [
    'FIREBASE_API_KEY',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_APP_ID',
  ];

  const missing = required.filter((key) => !Config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase configuration: ${missing.join(', ')}`
    );
  }
}

/**
 * Initializes Firebase with validated configuration
 */
export function initializeFirebase(): typeof firebase {
  try {
    validateConfig();

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    return firebase;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

export default initializeFirebase();
```

## Using MCP Tools

### Step 1: Detect Issues

```
Analyze this file for security vulnerabilities:

[paste code with hardcoded secrets]
```

### Step 2: Get Recommendations

The tool will identify:
- Location of hardcoded secrets
- Severity of each issue
- Recommended fixes

### Step 3: Remediate Automatically

```
Remediate this code to remove hardcoded secrets and use secure environment variables:

[paste code]
```

### Step 4: Verify Fix

```
Analyze the remediated code to verify all security issues are resolved
```

## Best Practices

### 1. Never Commit Secrets

**Always**:
- Use environment variables
- Add .env to .gitignore
- Commit .env.example as template

**Never**:
- Hardcode in source code
- Commit .env files
- Store in version control

### 2. Use Secure Storage

**For Runtime Secrets**:
- Use react-native-keychain for tokens
- Use Keychain (iOS) / Keystore (Android)
- Encrypt sensitive data

**For Build-Time Configuration**:
- Use react-native-config
- Separate configs per environment
- Validate on app startup

### 3. Rotate Regularly

- Rotate API keys quarterly
- Invalidate old keys promptly
- Monitor for unauthorized use
- Use different keys per environment

### 4. Monitor Access

- Log API key usage
- Alert on suspicious activity
- Implement rate limiting
- Use API key restrictions

## Additional Tools

### Recommended Packages

```bash
# Environment configuration
npm install react-native-config

# Secure storage
npm install react-native-keychain

# OAuth
npm install react-native-app-auth

# Encrypted storage
npm install react-native-encrypted-storage
```

### CI/CD Integration

Store secrets in your CI/CD platform:

**GitHub Actions**:
```yaml
- name: Create .env file
  run: |
    echo "API_KEY=${{ secrets.API_KEY }}" >> .env
    echo "API_SECRET=${{ secrets.API_SECRET }}" >> .env
```

**Bitrise**:
```yaml
- env-vars-export:
    inputs:
    - envs: |
        API_KEY=$API_KEY
        API_SECRET=$API_SECRET
```

## Security Checklist

Before deployment, verify:

- [ ] No hardcoded secrets in code
- [ ] .env files in .gitignore
- [ ] Separate configs per environment
- [ ] Tokens stored in secure keychain
- [ ] API keys restricted by platform/domain
- [ ] Secrets not in crash reports
- [ ] Environment variables validated on startup
- [ ] Key rotation process documented
- [ ] Security scanning in CI/CD
- [ ] Team trained on secure practices

---

**Related Examples**:
- [Insecure Storage](./insecure-storage.md)
- [Network Security](./network-security.md)
- [Performance Fixes](../performance-fixes/)
