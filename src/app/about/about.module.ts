import { NgModule, isDevMode } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AboutComponent } from './about';
import { LicensesComponent } from './licenses/licenses';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from '../services/auth-guard';
import { LoadingResolverService } from '../services/loading-resolver';

const routes: Routes = [
  {
    path: 'about',
    component: AboutComponent,
    canActivate: [AuthGuardService],
    resolve: {
      data: LoadingResolverService,
    },
  },
  {
    path: 'about/licenses',
    component: LicensesComponent,
    canActivate: [AuthGuardService],
    resolve: {
      data: LoadingResolverService,
    },
  },
];

@NgModule({
  declarations: [AboutComponent, LicensesComponent],
  imports: [RouterModule.forChild(routes), HttpClientModule, BrowserAnimationsModule, MatExpansionModule, MatSnackBarModule],
  exports: [RouterModule, AboutComponent, LicensesComponent],
  providers: [],
})
export class AboutModule {}
