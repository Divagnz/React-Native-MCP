/**
 * Tests for QRGenerator
 */

import { describe, it, expect, jest } from '@jest/globals';
import { QRGenerator } from '../qr-generator.js';

// Mock qrcode
jest.mock('qrcode');

describe('QRGenerator', () => {
  let generator: QRGenerator;

  beforeEach(() => {
    generator = QRGenerator.getInstance();

    const QRCode = require('qrcode');
    QRCode.toString = (jest.fn() as any).mockResolvedValue('ASCII QR CODE');
    QRCode.toDataURL = (jest.fn() as any).mockResolvedValue('data:image/png;base64,iVBORw0KG');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = QRGenerator.getInstance();
      const instance2 = QRGenerator.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('generate', () => {
    it('should generate terminal QR code by default', async () => {
      const result = await generator.generate('exp://192.168.1.1:19000');

      expect(result.format).toBe('terminal');
      expect(result.data).toBe('ASCII QR CODE');
      expect(result.url).toBe('exp://192.168.1.1:19000');
    });

    it('should generate SVG QR code', async () => {
      const QRCode = require('qrcode');
      (QRCode.toString as any).mockResolvedValue('<svg>QR</svg>');

      const result = await generator.generate('exp://192.168.1.1:19000', 'svg');

      expect(result.format).toBe('svg');
      expect(result.data).toBe('<svg>QR</svg>');
    });

    it('should generate PNG QR code', async () => {
      const result = await generator.generate('exp://192.168.1.1:19000', 'png');

      expect(result.format).toBe('png');
      expect(result.data).toContain('data:image/png;base64');
    });

    it('should return URL for url format', async () => {
      const url = 'exp://192.168.1.1:19000';
      const result = await generator.generate(url, 'url');

      expect(result.format).toBe('url');
      expect(result.data).toBe(url);
    });
  });

  describe('isValidURL', () => {
    it('should validate exp:// URLs', () => {
      expect(generator.isValidURL('exp://192.168.1.1:19000')).toBe(true);
    });

    it('should validate http:// URLs', () => {
      expect(generator.isValidURL('http://localhost:19000')).toBe(true);
    });

    it('should validate https:// URLs', () => {
      expect(generator.isValidURL('https://example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(generator.isValidURL('invalid-url')).toBe(false);
      expect(generator.isValidURL('ftp://example.com')).toBe(false);
    });
  });

  describe('extractURL', () => {
    it('should extract exp:// URL', () => {
      const output = 'Metro waiting on exp://192.168.1.1:19000';
      const url = generator.extractURL(output);

      expect(url).toBe('exp://192.168.1.1:19000');
    });

    it('should extract http:// URL', () => {
      const output = 'Server running at http://192.168.1.1:8081';
      const url = generator.extractURL(output);

      expect(url).toBe('http://192.168.1.1:8081');
    });

    it('should extract localhost URL', () => {
      const output = 'Available at http://localhost:19000';
      const url = generator.extractURL(output);

      expect(url).toBe('http://localhost:19000');
    });

    it('should return null when no URL found', () => {
      const output = 'No URL in this text';
      const url = generator.extractURL(output);

      expect(url).toBeNull();
    });

    it('should prefer exp:// over http://', () => {
      const output = 'http://192.168.1.1:8081 and exp://192.168.1.1:19000';
      const url = generator.extractURL(output);

      expect(url).toBe('exp://192.168.1.1:19000');
    });
  });

  describe('extractAllURLs', () => {
    it('should extract multiple URLs', () => {
      const output = `
        Metro bundler running at http://192.168.1.1:8081
        Expo server at exp://192.168.1.1:19000
        Another URL: http://192.168.1.1:19001
      `;

      const urls = generator.extractAllURLs(output);

      expect(urls).toHaveLength(3);
      expect(urls).toContain('exp://192.168.1.1:19000');
      expect(urls).toContain('http://192.168.1.1:8081');
      expect(urls).toContain('http://192.168.1.1:19001');
    });

    it('should remove duplicate URLs', () => {
      const output = 'exp://192.168.1.1:19000 and exp://192.168.1.1:19000';
      const urls = generator.extractAllURLs(output);

      expect(urls).toHaveLength(1);
    });

    it('should return empty array when no URLs', () => {
      const output = 'No URLs here';
      const urls = generator.extractAllURLs(output);

      expect(urls).toEqual([]);
    });
  });

  describe('formatOutput', () => {
    it('should format terminal QR output', async () => {
      const qrResult = await generator.generate('exp://test', 'terminal');
      const formatted = generator.formatOutput(qrResult);

      expect(formatted).toContain('Expo Dev Server QR Code');
      expect(formatted).toContain('exp://test');
      expect(formatted).toContain('Scan with Expo Go');
    });

    it('should format SVG QR output', async () => {
      const QRCode = require('qrcode');
      QRCode.toString.mockResolvedValue('<svg>test</svg>');

      const qrResult = await generator.generate('exp://test', 'svg');
      const formatted = generator.formatOutput(qrResult);

      expect(formatted).toContain('SVG QR Code');
      expect(formatted).toContain('<svg>test</svg>');
    });

    it('should format PNG QR output', async () => {
      const qrResult = await generator.generate('exp://test', 'png');
      const formatted = generator.formatOutput(qrResult);

      expect(formatted).toContain('PNG QR Code');
      expect(formatted).toContain('![QR Code]');
      expect(formatted).toContain('data:image/png');
    });

    it('should format URL output', async () => {
      const qrResult = await generator.generate('exp://test', 'url');
      const formatted = generator.formatOutput(qrResult);

      expect(formatted).toContain('Expo Dev Server URL');
      expect(formatted).toContain('exp://test');
    });
  });
});
