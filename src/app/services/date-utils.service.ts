import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateUtilsService {
  /**
   * Get current Unix timestamp in seconds
   */
  now() {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Get a Unix timestamp from X days/hours/minutes ago
   * @param value The number of time units
   * @param unit The time unit ('days'|'hours'|'minutes'|'seconds')
   */
  getTimeAgo(value: number, unit: 'days' | 'hours' | 'minutes' | 'seconds'): number {
    const now = this.now();
    
    switch(unit) {
      case 'days':
        return now - (value * 24 * 60 * 60);
      case 'hours':
        return now - (value * 60 * 60);
      case 'minutes':
        return now - (value * 60);
      case 'seconds':
        return now - value;
      default:
        return now;
    }
  }

  /**
   * Format a Unix timestamp as a relative time string
   * @param timestamp Unix timestamp in seconds
   */
  getRelativeTimeString(timestamp: number): string {
    const now = this.now();
    const seconds = now - timestamp;
    
    if (seconds < 60) {
      return `${seconds} seconds ago`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
    
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  }

  /**
   * Format a Unix timestamp to ISO string
   */
  formatToISOString(timestamp: number): string {
    return new Date(timestamp * 1000).toISOString();
  }

  /**
   * Format a Unix timestamp to a local date string
   */
  formatToLocaleDateString(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  /**
   * Format a Unix timestamp to a locale time string
   */
  formatToLocaleTimeString(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleTimeString();
  }

  /**
   * Format a Unix timestamp to a custom format
   */
  formatDate(timestamp: number, options: Intl.DateTimeFormatOptions): string {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, options);
  }
}
