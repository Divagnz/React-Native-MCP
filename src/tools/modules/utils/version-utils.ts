/**
 * Version comparison and management utilities
 */

export class VersionUtils {
  /**
   * Compare two semantic version strings
   * @returns -1 if current < latest, 0 if equal, 1 if current > latest
   */
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

  /**
   * Check if an update is a minor or patch update
   */
  static isMinorOrPatchUpdate(current: string, latest: string): boolean {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    // Major version changed
    if (currentParts[0] !== latestParts[0]) {
      return false;
    }

    return true;
  }

  /**
   * Check if an update is only a patch update
   */
  static isPatchUpdate(current: string, latest: string): boolean {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    // Major or minor version changed
    if (currentParts[0] !== latestParts[0] || currentParts[1] !== latestParts[1]) {
      return false;
    }

    return true;
  }
}
