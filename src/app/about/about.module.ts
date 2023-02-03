import { NgModule, isDevMode } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AboutComponent } from './about';
import { LicensesComponent } from './licenses/licenses';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [AboutComponent, LicensesComponent],
  imports: [HttpClientModule, BrowserAnimationsModule, MatExpansionModule, MatSnackBarModule],
  exports: [AboutComponent, LicensesComponent],
  providers: [],
})
export class AboutModule {}
