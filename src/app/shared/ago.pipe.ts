import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ago' })
export class AgoPipe implements PipeTransform {
  transform(value?: number): string {
    if (!value) {
      return '';
    }

    const date = new Date(value * 1000); // Convert seconds to milliseconds
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  }
}
