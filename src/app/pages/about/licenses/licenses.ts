import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectorRef } from '@angular/core';
import { tap } from 'rxjs';
import { ApplicationState } from 'src/app/services/applicationstate';

@Component({
  selector: 'app-licenses',
  templateUrl: './licenses.html',
  styleUrls: ['./licenses.css'],
})
export class LicensesComponent {
  licenses?: string;

  constructor(private cd: ChangeDetectorRef, private appState: ApplicationState, private readonly http: HttpClient) {}

  ngOnInit() {
    this.appState.showBackButton = true;
    this.appState.updateTitle('Licenses');
    this.appState.actions = [];

    const dataFormatter = (data: string) => `<pre>${data.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
    this.showContent('3rdpartylicenses.txt', dataFormatter);
  }

  private showContent(contentUrl: string, dataFormatter: (data: string) => string = (data) => data) {
    this.http
      .get(contentUrl, { responseType: 'text' })
      .pipe(
        tap(
          (data) => {
            this.licenses = data;
            // const formattedData = dataFormatter(data);
            // this.licenses = this.sanitizer.bypassSecurityTrustHtml(formattedData);
            this.cd.markForCheck();
          },
          (error) => {
            this.licenses = `Unable to get content (${error.statusText})`;
            this.cd.markForCheck();
          }
        )
      )
      .subscribe();
  }
}
