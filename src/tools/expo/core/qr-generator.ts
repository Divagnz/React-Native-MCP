/**
 * QR Code Generator
 *
 * Generates QR codes in multiple formats (terminal, SVG, PNG, URL)
 * for Expo dev server URLs to enable easy mobile device connectivity.
 */

import QRCode from 'qrcode';
import { logger } from '../../../utils/logger.js';
import { QRFormat, QRCodeResult } from '../types.js';
import { QR_OPTIONS } from '../constants.js';

/**
 * Generates QR codes in various formats
 */
export class QRGenerator {
  private static instance: QRGenerator;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): QRGenerator {
    if (!QRGenerator.instance) {
      QRGenerator.instance = new QRGenerator();
    }
    return QRGenerator.instance;
  }

  /**
   * Generate QR code in specified format
   */
  public async generate(url: string, format: QRFormat = 'terminal'): Promise<QRCodeResult> {
    logger.debug('Generating QR code', { url, format });

    try {
      let data: string;

      switch (format) {
        case 'terminal':
          data = await this.generateTerminal(url);
          break;
        case 'svg':
          data = await this.generateSVG(url);
          break;
        case 'png':
          data = await this.generatePNG(url);
          break;
        case 'url':
          data = url;
          break;
        default:
          throw new Error(`Unknown QR format: ${format}`);
      }

      return {
        format,
        data,
        url,
      };
    } catch (error) {
      logger.error('Failed to generate QR code', {
        url,
        format,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate QR code as terminal ASCII art
   */
  private async generateTerminal(url: string): Promise<string> {
    try {
      const qrString = await QRCode.toString(url, {
        type: 'terminal',
        errorCorrectionLevel: QR_OPTIONS.ERROR_CORRECTION,
        small: QR_OPTIONS.SMALL,
        margin: QR_OPTIONS.MARGIN,
      });

      return qrString;
    } catch (error) {
      logger.error('Failed to generate terminal QR code', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to generate terminal QR code');
    }
  }

  /**
   * Generate QR code as SVG string
   */
  private async generateSVG(url: string): Promise<string> {
    try {
      const svg = await QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: QR_OPTIONS.ERROR_CORRECTION,
        margin: QR_OPTIONS.MARGIN,
      });

      return svg;
    } catch (error) {
      logger.error('Failed to generate SVG QR code', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to generate SVG QR code');
    }
  }

  /**
   * Generate QR code as PNG data URI (base64)
   */
  private async generatePNG(url: string): Promise<string> {
    try {
      const dataUri = await QRCode.toDataURL(url, {
        errorCorrectionLevel: QR_OPTIONS.ERROR_CORRECTION,
        margin: QR_OPTIONS.MARGIN,
        width: QR_OPTIONS.WIDTH,
      });

      return dataUri;
    } catch (error) {
      logger.error('Failed to generate PNG QR code', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to generate PNG QR code');
    }
  }

  /**
   * Validate URL format
   */
  public isValidURL(url: string): boolean {
    try {
      // Check if it's a valid exp:// or http:// URL
      return url.startsWith('exp://') || url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  /**
   * Extract URL from Expo dev server output
   */
  public extractURL(output: string): string | null {
    // Try to find exp:// URL first (Expo dev URL)
    const expMatch = output.match(/exp:\/\/[\d.]+:\d+/);
    if (expMatch) {
      return expMatch[0];
    }

    // Try to find http:// URL (Metro bundler URL)
    const httpMatch = output.match(/http:\/\/[\d.]+:\d+/);
    if (httpMatch) {
      return httpMatch[0];
    }

    // Try to find localhost URLs
    const localhostMatch = output.match(/http:\/\/localhost:\d+/);
    if (localhostMatch) {
      return localhostMatch[0];
    }

    return null;
  }

  /**
   * Extract multiple URLs from output
   */
  public extractAllURLs(output: string): string[] {
    const urls: string[] = [];

    // Extract exp:// URLs
    const expMatches = output.match(/exp:\/\/[\d.]+:\d+/g);
    if (expMatches) {
      urls.push(...expMatches);
    }

    // Extract http:// URLs
    const httpMatches = output.match(/http:\/\/[\d.]+:\d+/g);
    if (httpMatches) {
      urls.push(...httpMatches);
    }

    // Remove duplicates
    return [...new Set(urls)];
  }

  /**
   * Format QR code output for display
   */
  public formatOutput(qrResult: QRCodeResult): string {
    let output = '';

    switch (qrResult.format) {
      case 'terminal':
        output += '\n=== Expo Dev Server QR Code ===\n\n';
        output += qrResult.data;
        output += `\n\nURL: ${qrResult.url}\n`;
        output += 'Scan with Expo Go app to open on your device\n';
        break;

      case 'svg':
        output += '=== SVG QR Code ===\n\n';
        output += qrResult.data;
        output += `\n\nURL: ${qrResult.url}\n`;
        break;

      case 'png':
        output += '=== PNG QR Code (Base64 Data URI) ===\n\n';
        output += `![QR Code](${qrResult.data})\n\n`;
        output += `URL: ${qrResult.url}\n`;
        output += 'Copy the data URI to display in browser or embed in HTML\n';
        break;

      case 'url':
        output += '=== Expo Dev Server URL ===\n\n';
        output += qrResult.url + '\n';
        break;
    }

    return output;
  }
}

// Export singleton instance
export const qrGenerator = QRGenerator.getInstance();
