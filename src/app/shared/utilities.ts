import * as Rx from "rxjs";
// import Dexie, { liveQuery, Observable } from "dexie";

// export function dexieToRx<T>(o: Observable<T>): Rx.Observable<T> {
//   return new Rx.Observable<T>(observer => {
//     const subscription = o.subscribe({
//       next: value => observer.next(value),
//       error: error => observer.error(error)
//     });
//     return () => subscription.unsubscribe();
//   });
// }

export function copyToClipboard(content: string) {
  var textArea = document.createElement('textarea') as any;

  // Place in the top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0;

  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of the white box if rendered for any reason.
  textArea.style.background = 'transparent';
  textArea.value = content;

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
  } catch (err) {
    console.error('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
}
