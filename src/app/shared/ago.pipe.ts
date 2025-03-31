import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'ago',
    standalone: false
})
export class AgoPipe implements PipeTransform {
  transform(value?: number): string {
    if (!value) {
      return '';
    }

    const now = Math.floor(Date.now() / 1000);
    const seconds = now - value;
    
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
}
